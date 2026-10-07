import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import type { Paginated, TranscriptionResponse } from '../types/api';

/**
 * Estado do SERVIDOR: as transcricoes pertencem a API, e e o TanStack Query
 * que guarda a copia, sabe quando ela ficou velha e a busca de novo.
 *
 * Depois de criar ou excluir, a chave e invalidada - e por isso que o
 * historico se atualiza sozinho, sem recarregar a pagina.
 */

const CHAVE = ['transcricoes'] as const;

export function useTranscricoes(pagina: number, limite = 10) {
  return useQuery({
    queryKey: [...CHAVE, { pagina, limite }],
    queryFn: async () => {
      const { data } = await api.get<Paginated<TranscriptionResponse>>('/transcriptions', {
        params: { page: pagina, limit: limite },
      });
      return data;
    },
  });
}

export function useTranscricao(id: string | undefined) {
  return useQuery({
    queryKey: [...CHAVE, id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<TranscriptionResponse>(`/transcriptions/${id}`);
      return data;
    },
  });
}

export function useEnviarAudio() {
  const cliente = useQueryClient();

  return useMutation({
    mutationFn: async ({ arquivo, idioma }: { arquivo: File; idioma: string }) => {
      // Um arquivo binario nao cabe em JSON: o corpo vai como multipart.
      // O Content-Type (com o boundary) e montado pelo navegador.
      const corpo = new FormData();
      corpo.append('file', arquivo);
      corpo.append('language', idioma);

      const { data } = await api.post<TranscriptionResponse>('/transcriptions', corpo);
      return data;
    },
    onSuccess: () => cliente.invalidateQueries({ queryKey: CHAVE }),
  });
}

export function useExcluirTranscricao() {
  const cliente = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/transcriptions/${id}`);
    },
    onSuccess: () => cliente.invalidateQueries({ queryKey: CHAVE }),
  });
}
