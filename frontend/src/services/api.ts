import axios, { AxiosError, AxiosHeaders } from 'axios';
import { encerrarSessao, lerToken } from '../store/authStore';
import type { ApiError } from '../types/api';

/**
 * A instancia unica do axios.
 *
 * baseURL e o caminho RELATIVO /api. Nunca um endereco absoluto: o mesmo
 * codigo precisa funcionar atras do proxy do Vite, no desenvolvimento, e
 * atras do proxy reverso, em producao. Um `http://localhost:3000` aqui
 * funcionaria na maquina de quem escreveu e falharia na de todo mundo.
 */
export const api = axios.create({
  baseURL: '/api',
  timeout: 120_000, // transcrever um audio longo leva tempo
});

/**
 * Interceptador de REQUISICAO: acrescenta o token a cada chamada.
 * Concentrado aqui para que nenhuma tela precise lembrar de enviar o token.
 */
api.interceptors.request.use((config) => {
  const token = lerToken();

  if (token) {
    const headers = AxiosHeaders.from(config.headers);
    headers.set('Authorization', `Bearer ${token}`);
    config.headers = headers;
  }

  return config;
});

/**
 * Interceptador de RESPOSTA: ao receber 401, limpa a sessao e leva a tela de
 * login. Um token expirado nao deixa a aplicacao num estado meio-logado.
 *
 * A tela de login e a de cadastro ficam de fora: la um 401 significa
 * "credencial errada", e quem trata e o formulario.
 */
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    const url = error.config?.url ?? '';
    const rotaDeEntrada = url.startsWith('/auth/login') || url.startsWith('/auth/register');

    if (error.response?.status === 401 && !rotaDeEntrada) {
      encerrarSessao();

      if (window.location.pathname !== '/entrar') {
        window.location.assign('/entrar?expirou=1');
      }
    }

    return Promise.reject(error);
  },
);

/**
 * Traduz o erro da API numa frase que faz sentido na tela.
 *
 * Os status vem do contrato (docs/ESPECIFICACAO.md, secao 4.4). A mensagem
 * explica o que aconteceu e o que fazer - nao pede desculpas e nao e vaga.
 */
export function mensagemDeErro(erro: unknown, padrao = 'Não foi possível concluir.'): string {
  if (!axios.isAxiosError(erro)) {
    return padrao;
  }

  const resposta = (erro as AxiosError<ApiError>).response;

  if (!resposta) {
    return 'A API não respondeu. Confirme que o backend está rodando na porta 3000.';
  }

  switch (resposta.status) {
    case 401:
      return 'E-mail ou senha incorretos.';
    case 403:
      return 'Esta área é restrita a administradores.';
    case 404:
      return 'Não encontramos esse item.';
    case 409:
      return 'Esse e-mail já está cadastrado.';
    case 413:
      return 'O arquivo passa de 25 MB. Tente um áudio mais curto.';
    case 502:
      return 'O serviço de transcrição não respondeu. Tente de novo em instantes.';
    default:
      break;
  }

  const { message } = resposta.data ?? {};

  if (Array.isArray(message) && message.length > 0) {
    return message[0];
  }
  if (typeof message === 'string' && message) {
    return message;
  }

  return padrao;
}
