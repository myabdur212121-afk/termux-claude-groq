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

function cleanSchema(schema) {
    if (!schema || typeof schema !== 'object') return { type: 'object', properties: {} };
    const cleanProps = {};
    if (schema.properties) {
        for (const [k, v] of Object.entries(schema.properties)) {
            cleanProps[k] = {
                type: v.type || 'string',
                description: (v.description || "").split('\n')[0].split('.')[0] || k
            };
            if (v.enum) cleanProps[k].enum = v.enum;
        }
    }
    return {
        type: 'object',
        properties: cleanProps,
        required: schema.required || []
    };
}

function simplifyTools(tools) {
    if (!tools || !Array.isArray(tools)) return undefined;
    return tools.map(t => ({
        type: 'function',
        function: {
            name: t.name,
            description: (t.description || "").split('\n')[0].split('.')[0] || t.name,
            parameters: cleanSchema(t.input_schema)
        }
    }));
}

function convertAnthropicToOpenAI(parsed) {
    const messages = [];
    
    // 1. Efficient Lean System Prompt
    const leanSystemPrompt = "You are an expert autonomous Linux & Python developer on Android Termux. Use tools (Bash, etc.) to complete tasks step by step.";
    messages.push({ role: 'system', content: leanSystemPrompt });

    // 2. Messages & Tool Interactions (Keeps only recent history to prevent token bloat)
    if (parsed.messages && Array.isArray(parsed.messages)) {
        // Keep only last 10 messages if history gets huge
        const recentMessages = parsed.messages.slice(-10);

        for (const m of recentMessages) {
            if (Array.isArray(m.content)) {
                let textParts = [];
                let toolResults = [];
                let toolUses = [];

                for (const part of m.content) {
                    if (part.type === 'text') {
                        textParts.push(part.text);
                    } else if (part.type === 'tool_result') {
                        let resultText = typeof part.content === 'string' ? part.content : JSON.stringify(part.content || "");
                        if (resultText.length > 1500) {
                            resultText = resultText.substring(0, 1500) + "\n...[truncated]...";
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

    if (messages.length === 1) {
        messages.push({ role: 'user', content: 'hi' });
    }

    const tools = simplifyTools(parsed.tools);
    return { messages, tools };
}

function sendGroqRequest(apiKey, targetModel, messages, tools, retryCount, res) {
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
            
            // Auto Retry on Rate Limit (HTTP 429)
            if (gRes.statusCode === 429 && retryCount < 4) {
                const errMsg = gParsed.error?.message || "";
                let waitSec = 5;
                const match = errMsg.match(/try again in ([0-9.]+)s/);
                if (match) {
                    waitSec = Math.ceil(parseFloat(match[1])) + 1;
                }
                console.log(`⏳ Groq 429 limit hit. Auto-retrying in ${waitSec}s (Attempt ${retryCount + 1}/4)...`);
                return setTimeout(() => {
                    sendGroqRequest(apiKey, targetModel, messages, tools, retryCount + 1, res);
                }, waitSec * 1000);
            }

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
        sendGroqRequest(apiKey, targetModel, messages, tools, 0, res);
    });
});

const PORT = 3000;
server.listen(PORT, '127.0.0.1', () => {
    console.log(`⚡ Groq Claude Bridge listening on http://127.0.0.1:${PORT}`);
});
