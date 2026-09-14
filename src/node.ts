import { preview, type PreviewRuntime } from './preview.js';
import { Follower } from './follower.js';
import { Role, type PrototypeInfo } from './types.js';

export class Node {
  private role: Role | null = null;
  private follower: Follower | null = null;

  constructor(private readonly port: number) {}

  getRole(): Role | null {
    return this.role;
  }

  getPreview(): PreviewRuntime {
    return preview;
  }

  async becomeLeader(): Promise<void> {
    if (this.role === Role.Leader) return;

    await this.stopCurrent();

    const bound = await preview.tryBindAsLeader();
    if (!bound) {
      throw new Error(`Could not bind to port ${this.port} as Leader`);
    }

    this.role = Role.Leader;
    console.error('[node] became leader');
  }

  async becomeFollower(): Promise<void> {
    if (this.role === Role.Follower) return;

    await this.stopCurrent();

    this.follower = new Follower(this.port);
    this.role = Role.Follower;
    console.error('[node] became follower');
  }

  async send(tool: string, params?: Record<string, unknown>): Promise<unknown> {
    if (this.role === Role.Leader) {
      throw new Error('Leader should call tools directly, not via send()');
    }

    if (this.role === Role.Follower && this.follower) {
      return this.follower.send(tool, params);
    }

    throw new Error('Node has no active role');
  }

  async listPrototypes(): Promise<PrototypeInfo[]> {
    if (this.role === Role.Follower && this.follower) {
      return this.follower.listPrototypes();
    }
    return [];
  }

  async broadcastReload(slug?: string): Promise<void> {
    if (this.role === Role.Leader) {
      preview.broadcastReload(slug);
    } else if (this.role === Role.Follower && this.follower) {
      await this.follower.broadcastReload(slug);
    }
  }

  async stop(): Promise<void> {
    await this.stopCurrent();
    this.role = null;
  }

  private async stopCurrent(): Promise<void> {
    if (this.role === Role.Leader) {
      await preview.stop();
    }
    this.follower = null;
  }
}
