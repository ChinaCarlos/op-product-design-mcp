export enum Role {
  Leader = 'leader',
  Follower = 'follower',
}

export interface RPCRequest {
  tool: string;
  params?: Record<string, unknown>;
}

export interface RPCResponse {
  ok: boolean;
  data?: unknown;
  error?: string;
}

export interface PrototypeInfo {
  slug: string;
  title: string;
  file: string;
  previewUrl: string;
}
