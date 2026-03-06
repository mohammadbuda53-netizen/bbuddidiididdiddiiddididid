const http = require('http');
const { BotService } = require('./src/bot');
const { HandwerkerService } = require('./src/handwerker');

const bot = new BotService();
const handwerker = new HandwerkerService();
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

function parseUrl(req) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const parts = url.pathname.split('/').filter(Boolean);
  return { url, parts };
}

const server = http.createServer(async (req, res) => {
  try {
    const { url, parts } = parseUrl(req);

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

    if (req.method === 'POST' && req.url === '/handwerker/projects') {
      const body = await readJson(req);
      const project = handwerker.createProject(body);
      return sendJson(res, 201, { project });
    }

    if (req.method === 'GET' && req.url === '/handwerker/projects') {
      return sendJson(res, 200, { projects: handwerker.listProjects() });
    }

    if (req.method === 'GET' && parts[0] === 'handwerker' && parts[1] === 'projects' && parts[2]) {
      const projectId = parts[2];
      if (parts.length === 3) {
        return sendJson(res, 200, { project: handwerker.getProject(projectId) });
      }
      if (parts[3] === 'summary') {
        return sendJson(res, 200, { summary: handwerker.projectSummary(projectId) });
      }
      if (parts[3] === 'activity') {
        return sendJson(res, 200, { activity: handwerker.projectActivity(projectId) });
      }
      sendJson(res, 404, { error: 'Not found' });
      return;
    }

    if (req.method === 'POST' && parts[0] === 'handwerker' && parts[1] === 'projects' && parts[2]) {
      const projectId = parts[2];
      const body = await readJson(req);
      if (parts[3] === 'time-entries') {
        const entry = handwerker.addTimeEntry({ projectId, ...body });
        return sendJson(res, 201, { entry });
      }
      if (parts[3] === 'notes') {
        const note = handwerker.addProjectNote({ projectId, ...body });
        return sendJson(res, 201, { note });
      }
      if (parts[3] === 'archive') {
        const project = handwerker.archiveProject(projectId);
        return sendJson(res, 200, { project });
      }
      sendJson(res, 404, { error: 'Not found' });
      return;
    }

    if (req.method === 'POST' && req.url === '/handwerker/warehouse/items') {
      const body = await readJson(req);
      const item = handwerker.createWarehouseItem(body);
      return sendJson(res, 201, { item });
    }

    if (req.method === 'GET' && req.url === '/handwerker/warehouse/items') {
      return sendJson(res, 200, { items: handwerker.listWarehouseItems() });
    }

    if (req.method === 'POST' && req.url === '/handwerker/warehouse/allocate') {
      const body = await readJson(req);
      const allocation = handwerker.allocateInventory(body);
      return sendJson(res, 201, { allocation });
    }

    sendJson(res, 404, { error: 'Not found' });
  } catch (error) {
    sendJson(res, 400, { error: error.message });
  }
});

server.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
