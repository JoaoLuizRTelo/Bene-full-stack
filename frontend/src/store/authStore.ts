import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserResponse } from '../types/api';

/**
 * Estado do CLIENTE: o que pertence ao navegador, e nao ao servidor.
 *
 * Aqui vive apenas a sessao - usuario e token -, persistida no localStorage,
 * que e o que mantem alguem logado ao recarregar a pagina. Dados que pertencem
 * ao servidor (transcricoes, contas) ficam no TanStack Query, que sabe quando
 * eles ficaram velhos. Misturar os dois papeis e a causa mais comum de tela
 * desatualizada.
 */
interface AuthState {
  user: UserResponse | null;
  accessToken: string | null;
  entrar: (user: UserResponse, accessToken: string) => void;
  atualizarUsuario: (user: UserResponse) => void;
  sair: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      entrar: (user, accessToken) => set({ user, accessToken }),
      atualizarUsuario: (user) => set({ user }),
      sair: () => set({ user: null, accessToken: null }),
    }),
    { name: 'ditado.sessao' },
  ),
);

/** Leitura fora de componente, para o interceptador do axios. */
export const lerToken = (): string | null => useAuthStore.getState().accessToken;
export const encerrarSessao = (): void => useAuthStore.getState().sair();
