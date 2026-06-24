import { connection } from 'next/server';
import { experimental_upgradeWebSocket } from '@vercel/functions';
import { attachWsHandler } from '@/lib/ws-handler';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function GET() {
  await connection();

  return experimental_upgradeWebSocket((ws) => {
    attachWsHandler(ws);
  });
}
