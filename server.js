'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const https = require('https');
const express = require('express');
const selfsigned = require('selfsigned');
const QRCode = require('qrcode');
const { WebSocketServer } = require('ws');

const PORT = Number(process.env.PORT) || 8443;
const CERT_DIR = path.join(__dirname, '.certs');
const MAX_PLAYERS = 4;

function getLanAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

function ensureCertificate() {
  const keyPath = path.join(CERT_DIR, 'key.pem');
  const certPath = path.join(CERT_DIR, 'cert.pem');

  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    return {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    };
  }

  const attrs = [{ name: 'commonName', value: 'wiiphone.local' }];
  const pems = selfsigned.generate(attrs, {
    days: 3650,
    keySize: 2048,
    extensions: [{ name: 'basicConstraints', cA: true }],
  });

  fs.mkdirSync(CERT_DIR, { recursive: true });
  fs.writeFileSync(keyPath, pems.private);
  fs.writeFileSync(certPath, pems.cert);

  return { key: pems.private, cert: pems.cert };
}

function createApp() {
  const app = express();
  app.use(express.static(path.join(__dirname, 'public')));
  app.use('/games', express.static(path.join(__dirname, 'games')));
  app.use('/core', express.static(path.join(__dirname, 'core')));
  app.use('/vendor/three', express.static(path.join(__dirname, 'node_modules/three/build')));
  app.use('/vendor/three-examples', express.static(path.join(__dirname, 'node_modules/three/examples/jsm')));

  app.get('/api/session', async (req, res) => {
    const lanAddress = getLanAddress();
    const controllerUrl = `https://${lanAddress}:${PORT}/controller.html`;
    const qrDataUrl = await QRCode.toDataURL(controllerUrl, { margin: 1, width: 280 });
    res.json({ controllerUrl, qrDataUrl, lanAddress, port: PORT, maxPlayers: MAX_PLAYERS });
  });

  return app;
}

function attachRelay(server) {
  const wss = new WebSocketServer({ server, path: '/ws' });
  const controllers = new Map(); // slot -> ws
  const displays = new Set();

  function nextFreeSlot() {
    for (let slot = 1; slot <= MAX_PLAYERS; slot += 1) {
      if (!controllers.has(slot)) return slot;
    }
    return null;
  }

  function broadcastToDisplays(message) {
    const payload = JSON.stringify(message);
    for (const display of displays) {
      if (display.readyState === display.OPEN) display.send(payload);
    }
  }

  function broadcastPresence() {
    broadcastToDisplays({ type: 'presence', players: [...controllers.keys()] });
  }

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url, 'https://placeholder');
    const role = url.searchParams.get('role');

    if (role === 'display') {
      displays.add(ws);
      ws.send(JSON.stringify({ type: 'presence', players: [...controllers.keys()] }));
      ws.on('message', (raw) => {
        let message;
        try { message = JSON.parse(raw); } catch { return; }
        if (message.type !== 'feedback') return;
        const target = controllers.get((message.slot ?? 0) + 1);
        if (target && target.readyState === target.OPEN) target.send(JSON.stringify(message));
      });
      ws.on('close', () => displays.delete(ws));
      return;
    }

    if (role !== 'controller') { ws.close(); return; }

    // role === 'controller'
    const slot = nextFreeSlot();
    if (slot === null) {
      ws.send(JSON.stringify({ type: 'full' }));
      ws.close();
      return;
    }

    controllers.set(slot, ws);
    ws.send(JSON.stringify({ type: 'welcome', player: slot }));
    broadcastToDisplays({ type: 'player-joined', player: slot });
    broadcastPresence();

    ws.on('message', (raw) => {
      let message;
      try {
        message = JSON.parse(raw);
      } catch {
        return;
      }
      if (message.type === 'input' || message.type === 'command') {
        broadcastToDisplays({ ...message, player: slot });
      }
    });

    ws.on('close', () => {
      controllers.delete(slot);
      broadcastToDisplays({ type: 'player-left', player: slot });
      broadcastPresence();
    });
  });
}

function main() {
  const app = createApp();
  const credentials = ensureCertificate();
  const server = https.createServer(credentials, app);
  attachRelay(server);

  server.listen(PORT, () => {
    const lanAddress = getLanAddress();
    console.log('\n  WiiPhone is running\n');
    console.log(`  Computer:  https://localhost:${PORT}/`);
    console.log(`  Phone:     https://${lanAddress}:${PORT}/controller.html\n`);
    console.log('  Scan the QR code on the computer screen with your phone.');
    console.log('  Both devices must be on the same Wi-Fi network.\n');

    if (!process.env.NO_OPEN && process.platform === 'darwin') {
      import('open').then(({ default: open }) => {
        open(`https://localhost:${PORT}/`, { app: { name: 'google chrome' } }).catch(() => {});
      });
    }
  });
}

main();
