import { createServer } from 'node:http';
import { WebSocketServer } from 'ws';
import { attachWsHandler } from '../lib/ws-handler';

const PORT = Number(process.env.WS_PORT ?? 3001);

const server = createServer((_req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Tether demo WebSocket server');
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  attachWsHandler(ws);
});

server.listen(PORT, () => {
  console.log(`[tether] standalone WebSocket server listening on ws://localhost:${PORT}`);
});
