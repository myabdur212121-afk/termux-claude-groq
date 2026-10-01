const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Helper to get Groq API key from env or ~/.groq_key
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
        
        // Dynamic Model Router based on Claude Code selection
        if (targetModel.includes("opus") || targetModel.includes("120b")) {
            targetModel = "openai/gpt-oss-120b";
        } else if (targetModel.includes("sonnet") || targetModel.includes("qwen")) {
            targetModel = "qwen/qwen3.8-27b";
        } else if (targetModel.includes("haiku") || targetModel.includes("20b")) {
            targetModel = "openai/gpt-oss-20b";
        }

        const openAiMessages = [];
        
        // Handle System Message (Array or String)
        if (parsed.system) {
            let sysText = "";
            if (Array.isArray(parsed.system)) {
                sysText = parsed.system.map(s => (typeof s === 'string' ? s : (s.text || JSON.stringify(s)))).join('\n');
            } else if (typeof parsed.system === 'string') {
                sysText = parsed.system;
            } else {
                sysText = JSON.stringify(parsed.system);
            }
            openAiMessages.push({ role: 'system', content: sysText });
        }
        
        // Handle User / Assistant Messages
        if (parsed.messages && Array.isArray(parsed.messages)) {
            for (const m of parsed.messages) {
                let contentText = "";
                if (Array.isArray(m.content)) {
                    contentText = m.content.map(c => (typeof c === 'string' ? c : (c.text || JSON.stringify(c)))).join('\n');
                } else if (typeof m.content === 'string') {
                    contentText = m.content;
                } else {
                    contentText = JSON.stringify(m.content || "");
                }
                openAiMessages.push({ role: m.role || 'user', content: contentText });
            }
        }

        if (openAiMessages.length === 0) {
            openAiMessages.push({ role: 'user', content: 'hi' });
        }

        const groqPayload = JSON.stringify({
            model: targetModel,
            messages: openAiMessages
        });

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
                
                const replyText = gParsed.choices?.[0]?.message?.content || gParsed.error?.message || "No response received";
                
                const anthropicResp = JSON.stringify({
                    id: "msg_" + Date.now(),
                    type: "message",
                    role: "assistant",
                    content: [{ type: "text", text: replyText }],
                    model: targetModel,
                    stop_reason: "end_turn",
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
