export interface MockTokenPayload {
  sub: string;
  exp: number;
}

const TOKEN_TTL_MS = 5 * 60 * 1000;

export function createDemoToken(sub = 'demo-user'): string {
  const payload: MockTokenPayload = {
    sub,
    exp: Date.now() + TOKEN_TTL_MS,
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

export function parseDemoToken(token: string): MockTokenPayload | null {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString('utf-8')) as MockTokenPayload;
    if (typeof payload.exp !== 'number' || typeof payload.sub !== 'string') {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function isDemoTokenValid(token: string): boolean {
  if (!token) return false;
  const payload = parseDemoToken(token);
  if (!payload) return false;
  return payload.exp > Date.now();
}

export async function getDemoToken(): Promise<string> {
  return createDemoToken();
}

export function getDemoTokenSync(): string {
  return createDemoToken();
}
