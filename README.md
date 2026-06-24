<p align="center">
  <img src="docs/logo.png" alt="tether-ws logo" width="420" />
</p>

# tether-ws

**tether-ws** is a zero-dependency TypeScript WebSocket client that stays connected through drops, slow networks, and forced disconnects — with exponential backoff, real `bufferedAmount` backpressure, multiplexed channels, and auth refresh without reconnecting.

> **Live demo:** run `pnpm dev` in `apps/demo` and open [http://localhost:3000](http://localhost:3000). Deploy to Vercel for production WebSocket Functions support.

## Why this exists

This project demonstrates four things interviewers and reviewers care about:

1. **Reconnection strategy** — full-jitter exponential backoff with live attempt/delay telemetry
2. **Real `bufferedAmount` backpressure** — queue flush pauses when the native socket buffer is full (not a synthetic rate limiter)
3. **Multiplexing** — multiple logical channels over one physical WebSocket
4. **Auth refresh without disconnect** — token rotation over the existing open socket

## Monorepo

```
packages/tether-ws   — framework-agnostic client library (npm: tether-ws)
apps/demo            — Next.js control-panel demo + WebSocket server
```

### Quickstart

```bash
pnpm install
pnpm build
pnpm test
```

### Run the demo locally

```bash
cd apps/demo
cp .env.local.example .env.local   # ws://localhost:3001
pnpm dev                           # standalone ws server + Next.js UI
```

- **`pnpm dev`** — standalone `ws` server on port 3001 + Next.js (no Vercel CLI required)
- **`pnpm dev:vercel`** — Vercel runtime with native WebSocket upgrade ([public beta, June 2026](https://vercel.com/changelog/websocket-support-is-now-in-public-beta))

Production deploy uses `app/api/ws/route.ts` with `experimental_upgradeWebSocket()` from `@vercel/functions`. Fluid compute must be enabled (default for new Vercel projects since April 2025).

## Acceptance checklist

- Kill connection → client reconnects with jittered delay, replays queued messages in order
- Flood 500 messages → inbound backpressure events fire without crashing
- Force token refresh → `auth-refreshed` with no close/reconnect
- Library has zero runtime dependencies; ships ESM + CJS

## License

MIT
