const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');

function getApiKey() {
    if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim().startsWith('gsk_')) {
        return process.env.GROQ_API_KEY.trim();
    }
    const keyFile = path.join(os.homedir(), '.groq_key');
    if (fs.existsSync(keyFile)) {
        try {
            const key = fs.readFileSync(keyFile, 'utf8').trim();
            if (key.startsWith('gsk_')) return key;
        } catch (e) {}
    }
    return "";
}

function convertAnthropicToOpenAI(parsed) {
    const messages = [];
    
    // 1. Efficient Lean System Prompt (Cuts ~15,000 boilerplate tokens down to ~100 tokens!)
    const leanSystemPrompt = "You are an expert autonomous Linux, OpenGL, and Python systems developer running on Android Termux. Use the provided tools (Bash, etc.) to inspect, write files, debug, and complete tasks step by step.";
    messages.push({ role: 'system', content: leanSystemPrompt });

    // 2. Messages & Tool Interactions
    if (parsed.messages && Array.isArray(parsed.messages)) {
        for (const m of parsed.messages) {
            if (Array.isArray(m.content)) {
                let textParts = [];
                let toolResults = [];
                let toolUses = [];

                for (const part of m.content) {
                    if (part.type === 'text') {
                        textParts.push(part.text);
                    } else if (part.type === 'tool_result') {
                        let resultText = typeof part.content === 'string' ? part.content : JSON.stringify(part.content || "");
                        // Prevent output blowing up token limits
                        if (resultText.length > 4000) {
                            resultText = resultText.substring(0, 4000) + "\n...[output truncated for brevity]...";
                        }
                        toolResults.push({
                            role: 'tool',
                            tool_call_id: part.tool_use_id,
                            content: resultText
                        });
                    } else if (part.type === 'tool_use') {
                        toolUses.push({
                            id: part.id,
                            type: 'function',
                            function: {
                                name: part.name,
                                arguments: typeof part.input === 'string' ? part.input : JSON.stringify(part.input || {})
                            }
                        });
                    }
                }

                if (m.role === 'assistant') {
                    const msg = { role: 'assistant', content: textParts.join('\n') || null };
                    if (toolUses.length > 0) msg.tool_calls = toolUses;
                    messages.push(msg);
                } else if (m.role === 'user') {
                    if (textParts.length > 0) {
                        messages.push({ role: 'user', content: textParts.join('\n') });
                    }
                    for (const tr of toolResults) {
                        messages.push(tr);
                    }
                }
            } else {
                messages.push({ role: m.role || 'user', content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content || "") });
            }
        }
    }

    if (messages.length === 1) { // only system present
        messages.push({ role: 'user', content: 'hi' });
    }

    // 3. Compact Tools definitions
    let tools = undefined;
    if (parsed.tools && Array.isArray(parsed.tools) && parsed.tools.length > 0) {
        tools = parsed.tools.map(t => ({
            type: 'function',
            function: {
                name: t.name,
                description: t.description || "",
                parameters: t.input_schema || { type: 'object', properties: {} }
            }
        }));
    }

    return { messages, tools };
}

const server = http.createServer((req, res) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
        const apiKey = getApiKey();
        if (!apiKey) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({
                error: {
                    message: "Groq API key missing! Run 'set-key' in Termux to set your free Groq API key.",
                    type: "authentication_error"
                }
            }));
        }

        let parsed = {};
        try { parsed = JSON.parse(body); } catch(e){}
        
        let targetModel = parsed.model || "openai/gpt-oss-120b";
        if (targetModel.includes("opus") || targetModel.includes("120b")) {
            targetModel = "openai/gpt-oss-120b";
        } else if (targetModel.includes("sonnet") || targetModel.includes("qwen")) {
            targetModel = "qwen/qwen3.8-27b";
        } else if (targetModel.includes("haiku") || targetModel.includes("20b")) {
            targetModel = "openai/gpt-oss-20b";
        }

        const { messages, tools } = convertAnthropicToOpenAI(parsed);
        const groqPayloadObj = {
            model: targetModel,
            messages: messages
        };
        if (tools && tools.length > 0) {
            groqPayloadObj.tools = tools;
        }

        const groqPayload = JSON.stringify(groqPayloadObj);

        const gReq = https.request({
            hostname: 'api.groq.com',
            path: '/openai/v1/chat/completions',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'User-Agent': 'Groq-Claude-Bridge/1.0',
                'Content-Length': Buffer.byteLength(groqPayload)
            }
        }, (gRes) => {
            let gData = '';
            gRes.on('data', c => { gData += c; });
            gRes.on('end', () => {
                let gParsed = {};
                try { gParsed = JSON.parse(gData); } catch(e){}
                
                const choice = gParsed.choices?.[0];
                const content = [];
                let stop_reason = "end_turn";

                if (choice) {
                    if (choice.message?.content) {
                        content.push({ type: "text", text: choice.message.content });
                    }
                    if (choice.message?.tool_calls && Array.isArray(choice.message.tool_calls)) {
                        stop_reason = "tool_use";
                        for (const tc of choice.message.tool_calls) {
                            let inputObj = {};
                            try { inputObj = JSON.parse(tc.function.arguments); } catch(e){ inputObj = { raw: tc.function.arguments }; }
                            content.push({
                                type: "tool_use",
                                id: tc.id,
                                name: tc.function.name,
                                input: inputObj
                            });
                        }
                    }
                } else if (gParsed.error) {
                    content.push({ type: "text", text: "Groq Error: " + gParsed.error.message });
                }

                if (content.length === 0) {
                    content.push({ type: "text", text: "No response received" });
                }

                const anthropicResp = JSON.stringify({
                    id: "msg_" + Date.now(),
                    type: "message",
                    role: "assistant",
                    content: content,
                    model: targetModel,
                    stop_reason: stop_reason,
                    usage: {
                        input_tokens: gParsed.usage?.prompt_tokens || 10,
                        output_tokens: gParsed.usage?.completion_tokens || 20
                    }
                });

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(anthropicResp);
            });
        });

        gReq.on('error', (err) => {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
        });

        gReq.write(groqPayload);
        gReq.end();
    });
});

const PORT = 3000;
server.listen(PORT, '127.0.0.1', () => {
    console.log(`⚡ Groq Claude Bridge listening on http://127.0.0.1:${PORT}`);
});
