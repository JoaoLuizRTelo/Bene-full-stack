/**
 * Os tipos do contrato da API, como descrito em docs/ESPECIFICACAO.md, secao 4.
 *
 * Esta e a forma que o frontend ESPERA receber. Quando ela divergir da resposta
 * real, o contrato mudou de um lado so - e e esse o erro que estes tipos
 * existem para expor cedo, no editor, e nao em producao.
 */

export type Role = 'user' | 'admin';

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
}

export interface AuthResponse {
  user: UserResponse;
  accessToken: string;
}

export interface TranscriptionResponse {
  id: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  durationSeconds: number | null;
  language: string;
  model: string;
  text: string;
  createdAt: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface HealthResponse {
  status: 'ok' | 'degraded';
  database: 'up' | 'down';
  uptimeSeconds: number;
}

/** O corpo de erro padrao do NestJS. */
export interface ApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
}
