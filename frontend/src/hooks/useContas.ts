import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import type { Paginated, Role, UserResponse } from '../types/api';

/** Estado do servidor: as contas, na area de administracao. */

const CHAVE = ['contas'] as const;

export function useContas(pagina: number, busca: string, limite = 10) {
  return useQuery({
    queryKey: [...CHAVE, { pagina, busca, limite }],
    queryFn: async () => {
      const { data } = await api.get<Paginated<UserResponse>>('/users', {
        params: { page: pagina, limit: limite, ...(busca ? { search: busca } : {}) },
      });
      return data;
    },
  });
}

export interface AlteracaoDeConta {
  role?: Role;
  isActive?: boolean;
  name?: string;
  email?: string;
}

export function useAlterarConta() {
  const cliente = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, dados }: { id: string; dados: AlteracaoDeConta }) => {
      const { data } = await api.patch<UserResponse>(`/users/${id}`, dados);
      return data;
    },
    onSuccess: () => cliente.invalidateQueries({ queryKey: CHAVE }),
  });
}

export function useExcluirConta() {
  const cliente = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/users/${id}`);
    },
    onSuccess: () => cliente.invalidateQueries({ queryKey: CHAVE }),
  });
}
