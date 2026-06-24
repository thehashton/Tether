<p align="center">
  <img src="../../docs/logo.png" alt="Tether" width="320" />
</p>

<p align="center">
  <strong>Tether</strong> — framework-agnostic WebSocket client with production-grade resilience.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/tether-ws">npm</a>
  ·
  <a href="../../README.md">Monorepo</a>
</p>

---

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

## API reference

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `url` | `string` | — | WebSocket URL (required) |
| `protocols` | `string \| string[]` | `[]` | Subprotocols passed to the WebSocket constructor |
| `WebSocketImpl` | `typeof WebSocket` | `WebSocket` | Inject `ws` in Node tests |
| `reconnect.enabled` | `boolean` | `true` | Auto-reconnect on unexpected close |
| `reconnect.baseDelayMs` | `number` | `300` | Base delay for full-jitter backoff |
| `reconnect.maxDelayMs` | `number` | `30000` | Maximum backoff cap |
| `reconnect.maxAttempts` | `number` | `Infinity` | Max reconnect attempts before `closed` |
| `heartbeat.enabled` | `boolean` | `true` | Send `tether:ping` / expect `tether:pong` |
| `heartbeat.intervalMs` | `number` | `15000` | Ping interval while open |
| `heartbeat.timeoutMs` | `number` | `5000` | Close with code `4000` if pong missing |
| `queue.enabled` | `boolean` | `true` | Queue sends while not `open` |
| `queue.maxSize` | `number` | `1000` | Max queued outbound messages |
| `queue.overflow` | `'drop-oldest' \| 'drop-newest' \| 'reject'` | `'drop-oldest'` | Behavior when queue is full |
| `backpressure.bufferedAmountHighWaterMark` | `number` | `1000000` | Pause queue flush above this `bufferedAmount` (bytes) |
| `backpressure.inboundBufferSize` | `number` | `100` | Max inbound messages awaiting async handlers |
| `backpressure.inboundOverflow` | `'drop-oldest' \| 'sample-oldest'` | `'drop-oldest'` | Inbound overflow strategy |
| `auth.getToken` | `() => Promise<string>` | — | Fetch auth token |
| `auth.refreshBeforeExpiryMs` | `number` | `60000` | Refresh this many ms before expiry |
| `auth.tokenTtlMs` | `number` | `300000` | Fallback TTL if token has no embedded `exp` |

### Methods

| Method | Description |
|--------|-------------|
| `connect()` | Open (or re-open) the connection |
| `disconnect()` | Close permanently; no reconnect |
| `send(payload, { channel? })` | Send data envelope; queues if not open |
| `subscribe(channel, handler)` | Subscribe to channel; returns unsubscribe fn |
| `refreshAuth()` | Force immediate token refresh over open socket |
| `on(event, handler)` | Subscribe to events; returns unsubscribe fn |

### Events

| Event | Payload |
|-------|---------|
| `open` | — |
| `close` | `{ code, reason, wasClean }` |
| `message` | `unknown` |
| `reconnecting` | `{ attempt, delayMs }` |
| `queued` | `QueuedMessage` |
| `flushed` | `QueuedMessage` |
| `backpressure` | `{ depth, direction: 'inbound' \| 'outbound' }` |
| `statechange` | `{ from, to }` |
| `auth-refreshed` | `{ token }` |
| `error` | `Error` |

### State

`client.state`: `'idle' | 'connecting' | 'open' | 'reconnecting' | 'closed'`

## Reconnection

On unexpected close, delay is computed as:

```
delay = random(0, min(maxDelayMs, baseDelayMs * 2^attempt))
```

Attempt resets to `0` on successful `open`. Emits `reconnecting` before each retry.

## Outbound backpressure

On reconnect, queued messages flush in FIFO order. Before each `send`, if `socket.bufferedAmount > bufferedAmountHighWaterMark`, flushing pauses and polls until the buffer drains. This uses the **native WebSocket backpressure signal** from the spec.

## Inbound backpressure (approximation)

The WebSocket spec provides **no native inbound flow control**. Tether approximates it with a bounded processing buffer: incoming messages are queued for async `message` handlers, and when depth exceeds `inboundBufferSize`, `backpressure` is emitted and oldest messages are dropped (or sampled) per `inboundOverflow`.

This is an approximation necessitated by the spec — not true end-to-end flow control — but it prevents unbounded memory growth when consumers fall behind.

## Multiplexing

All application messages use an envelope:

```ts
{ channel: string, type: 'data' | 'subscribe' | 'unsubscribe', payload?: unknown, id?: string }
```

`subscribe()` sends a subscribe envelope and registers a local handler. Multiple channels share one socket.

## Auth

On connect, `getToken()` is called and `{ type: 'tether:auth', token }` is sent as the first message. Before expiry (parsed from base64 JSON `exp` field or `tokenTtlMs`), a fresh token is sent over the **existing** socket — no reconnect.

## Heartbeat

While `open`, sends `{ type: 'tether:ping', ts }` every `intervalMs`. Expects `{ type: 'tether:pong', ts }` within `timeoutMs`. Missing pong closes the socket with code `4000` and triggers reconnect logic.

## License

MIT
