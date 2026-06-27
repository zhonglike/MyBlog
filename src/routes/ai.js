const https = require('https');
const http = require('http');
const db = require('../db');

const SYSTEM_PROMPTS = {
  chat: '你是一个友好的AI助手，回答要简洁准确。',
  news: '你是一个新闻编辑，请根据用户的问题整理和汇总最新新闻资讯。回答要条理清晰，按要点列出。',
  guide: '你是一个资深游戏攻略作者，精通各类热门游戏。回答要详细实用，包含具体技巧和步骤。',
  delta: '你是一个三角洲行动（Delta Force）游戏专家，精通游戏攻略、武器配置、地图战术和最新兑换码。回答要专业、具体。'
};

function getAIConfig() {
  const rows = db.prepare("SELECT * FROM settings WHERE key LIKE 'ai_%'").all();
  const cfg = {};
  for (const r of rows) cfg[r.key] = r.value;
  return {
    provider: cfg.ai_provider || 'openai',
    endpoint: cfg.ai_endpoint || 'https://api.openai.com/v1',
    apiKey: cfg.ai_api_key || '',
    model: cfg.ai_model || 'gpt-3.5-turbo'
  };
}

// OpenAI 兼容接口
function chatWithOpenAI(messages, endpoint, apiKey, model) {
  return new Promise((resolve, reject) => {
    const base = endpoint.replace(/\/+$/, '');
    const url = new URL(base.endsWith('/chat/completions') ? base : base + '/chat/completions');
    const body = JSON.stringify({ model, messages, temperature: 0.7, max_tokens: 2048 });
    const isHttps = url.protocol === 'https:';
    const lib = isHttps ? https : http;
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey,
        'Content-Length': Buffer.byteLength(body)
      },
      timeout: 60000
    };
    const req = lib.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) reject(new Error(parsed.error.message || 'API 错误'));
          else resolve(parsed.choices?.[0]?.message?.content || '');
        } catch { reject(new Error('API 返回格式异常')); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('请求超时')); });
    req.write(body);
    req.end();
  });
}

// Google Gemini 原生接口
function chatWithGemini(messages, apiKey, model) {
  return new Promise((resolve, reject) => {
    const modelName = model || 'gemini-2.0-flash';
    // 拆分为 system 和 contents
    let systemInstruction = null;
    const contents = [];
    for (const m of messages) {
      if (m.role === 'system') {
        systemInstruction = { parts: [{ text: m.content }] };
      } else {
        const role = m.role === 'assistant' ? 'model' : 'user';
        contents.push({ role, parts: [{ text: m.content }] });
      }
    }
    const reqBody = { contents };
    if (systemInstruction) reqBody.systemInstruction = systemInstruction;
    const body = JSON.stringify(reqBody);
    const url = new URL('https://generativelanguage.googleapis.com/v1beta/models/' + modelName + ':generateContent?key=' + encodeURIComponent(apiKey));
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      },
      timeout: 60000
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) reject(new Error(parsed.error.message || 'API 错误'));
          else resolve(parsed.candidates?.[0]?.content?.parts?.[0]?.text || '');
        } catch { reject(new Error('Gemini API 返回格式异常')); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('请求超时')); });
    req.write(body);
    req.end();
  });
}

function register(app) {
  app.post('/api/ai/chat', async (req, res) => {
    try {
      const { message, mode = 'chat', history = [] } = req.body;
      if (!message || !message.trim()) return res.status(400).json({ error: '消息不能为空' });
      const cfg = getAIConfig();
      if (!cfg.apiKey) return res.status(400).json({ error: 'AI 未配置，请在设置中填写 API Key' });
      const systemPrompt = SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.chat;
      const messages = [
        { role: 'system', content: systemPrompt },
        ...history.slice(-10),
        { role: 'user', content: message }
      ];
      let reply;
      if (cfg.provider === 'gemini') {
        reply = await chatWithGemini(messages, cfg.apiKey, cfg.model);
      } else {
        reply = await chatWithOpenAI(messages, cfg.endpoint, cfg.apiKey, cfg.model);
      }
      res.json({ reply });
    } catch (e) {
      console.error('[AI Error]', e.message);
      res.status(500).json({ error: e.message || 'AI 请求失败' });
    }
  });
}

module.exports = register;
