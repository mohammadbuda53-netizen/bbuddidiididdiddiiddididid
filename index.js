const http = require('http');
const { BotService } = require('./src/bot');

const bot = new BotService();
const port = Number(process.env.PORT || 3000);

function sendJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (_err) {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'GET' && req.url === '/health') {
      return sendJson(res, 200, { ok: true });
    }

    if (req.method === 'POST' && req.url === '/contacts') {
      const body = await readJson(req);
      const contact = bot.registerContact(body);
      return sendJson(res, 201, { contact });
    }

    if (req.method === 'POST' && req.url === '/contacts/revoke-consent') {
      const body = await readJson(req);
      bot.revokeConsent(body.contactId);
      return sendJson(res, 200, { ok: true });
    }

    if (req.method === 'POST' && req.url === '/webhooks/whatsapp/inbound') {
      const body = await readJson(req);
      const result = bot.receiveInbound(body);
      return sendJson(res, 200, result);
    }

    if (req.method === 'POST' && req.url === '/messages/send') {
      const body = await readJson(req);
      const message = bot.sendMessage(body);
      return sendJson(res, 200, { message });
    }

    if (req.method === 'POST' && req.url === '/scheduler/run') {
      const sent = bot.runScheduler(new Date());
      return sendJson(res, 200, { sent });
    }

    sendJson(res, 404, { error: 'Not found' });
  } catch (error) {
    sendJson(res, 400, { error: error.message });
  }
});

server.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
