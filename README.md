<p align="center">
  <img src="docs/logo.png" alt="Tether" width="480" />
</p>

<p align="center">
  <strong>A resilient WebSocket client that holds on when the connection stretches.</strong>
</p>

<p align="center">
  By <a href="https://github.com/thehashton">Harry Ashton</a>
</p>

<p align="center">
  <a href="https://github.com/thehashton/Tether">GitHub</a>
  ·
  <a href="https://www.npmjs.com/package/tether-ws">npm</a>
  ·
  <a href="https://tether-demo-wheat.vercel.app/">Live demo</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/node-%3E%3D22-339933?logo=node.js&logoColor=white" alt="Node 22+" />
  <img src="https://img.shields.io/badge/typescript-strict-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/runtime%20deps-0-success" alt="Zero runtime dependencies" />
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License" />
</p>

---

Tether is a zero-dependency TypeScript WebSocket client built for production failure modes: dropped connections, slow networks, forced disconnects, and auth expiry — without falling over.

Like a tether, it stays linked. Messages queue while offline, replay in order on reconnect, and back off with full jitter until the socket is open again.

## Live demo

A control-panel UI exercises every resilience feature in real time — reconnection, backoff, queue drain, `bufferedAmount` backpressure, multiplexing, and auth refresh.

**[tether-demo-wheat.vercel.app](https://tether-demo-wheat.vercel.app/)** — or [run locally](#run-the-demo). Deployed on Vercel with WebSocket Functions ([public beta](https://vercel.com/changelog/websocket-support-is-now-in-public-beta)).

## What it proves

| | |
|---|---|
| **Reconnection** | Full-jitter exponential backoff with live attempt + delay telemetry |
| **Backpressure** | Queue flush pauses on real `socket.bufferedAmount` — not a synthetic rate limiter |
| **Multiplexing** | Multiple logical channels over one physical WebSocket |
| **Auth refresh** | Token rotation over the existing open socket — no disconnect |

## Getting started

Clone the monorepo and install:

```bash
git clone git@github.com:thehashton/Tether.git
cd Tether
pnpm install
pnpm build
pnpm test
```

### Project layout

```
packages/tether-ws   →  client library (npm: tether-ws)
apps/demo            →  Next.js demo + WebSocket server
```

### Use the library

```bash
npm install tether-ws
```

```ts
import { TetherClient } from 'tether-ws';

const client = new TetherClient({
  url: 'wss://example.com/ws',
  auth: { getToken: () => fetch('/api/token').then((r) => r.text()) },
});

client.on('reconnecting', ({ attempt, delayMs }) => {
  console.log(`retry #${attempt} in ${delayMs}ms`);
});

client.connect();
client.send({ hello: 'world' }, { channel: 'chat' });
client.subscribe('chat', (msg) => console.log(msg));
```

Full API reference → [`packages/tether-ws/README.md`](packages/tether-ws/README.md)

## Run the demo

```bash
cd apps/demo
cp .env.local.example .env.local
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

| Command | What it does |
|---|---|
| `pnpm dev` | Standalone WebSocket server on `:3001` + Next.js UI |
| `pnpm dev:vercel` | Vercel runtime with native WebSocket upgrade |

Try **Kill connection** → watch backoff + queue replay. **Flood 500 messages** → inbound backpressure counter climbs. **Force token refresh** → auth rotates without a close event.

## Deploy on Vercel

1. Import the repo and set **Root Directory** to `apps/demo`
2. Ensure [Fluid Compute](https://vercel.com/docs/fluid-compute) is enabled (default on new projects)
3. Deploy — the WebSocket route lives at `app/api/ws/route.ts` via `experimental_upgradeWebSocket()`

## License

MIT © [Harry Ashton](https://github.com/thehashton)
