import type { PrototypeInfo, RPCRequest, RPCResponse } from './types.js';

export class Follower {
  constructor(
    private readonly port: number,
    private readonly leaderUrl = `http://127.0.0.1:${port}`,
  ) {}

  async send(tool: string, params?: Record<string, unknown>): Promise<unknown> {
    const body: RPCRequest = { tool, params };

    const res = await fetch(`${this.leaderUrl}/__rpc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`RPC HTTP ${res.status}: ${await res.text()}`);
    }

    const rpc = (await res.json()) as RPCResponse;
    if (!rpc.ok) {
      throw new Error(rpc.error ?? 'RPC failed');
    }

    return rpc.data;
  }

  async listPrototypes(): Promise<PrototypeInfo[]> {
    try {
      const res = await fetch(`${this.leaderUrl}/__prototypes`);
      if (!res.ok) return [];
      const data = (await res.json()) as { ok?: boolean; prototypes?: PrototypeInfo[] };
      return data.ok === true && Array.isArray(data.prototypes) ? data.prototypes : [];
    } catch {
      return [];
    }
  }

  async pingLeader(): Promise<boolean> {
    try {
      const res = await fetch(`${this.leaderUrl}/__health`);
      if (!res.ok) return false;
      const data = (await res.json()) as { ok?: boolean; service?: string; role?: string };
      return data.ok === true && data.role === 'leader';
    } catch {
      return false;
    }
  }

  async broadcastReload(slug?: string): Promise<void> {
    const target = new URL('/__reload', this.leaderUrl);
    if (slug) target.searchParams.set('slug', slug);
    await fetch(target, { method: 'POST' }).catch(() => undefined);
  }
}
