import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { Aviso, Botao, Campo, Rotulo } from '../components/ui';
import { api, mensagemDeErro } from '../services/api';
import { useAuthStore } from '../store/authStore';
import type { AuthResponse } from '../types/api';

const esquema = z.object({
  email: z.string().min(1, 'Informe o seu e-mail').email('Esse e-mail nao parece valido'),
  password: z.string().min(1, 'Informe a sua senha'),
});

type Formulario = z.infer<typeof esquema>;

export function EntrarPage() {
  const entrar = useAuthStore((estado) => estado.entrar);
  const navegar = useNavigate();
  const local = useLocation();
  const [parametros] = useSearchParams();

  const destino = (local.state as { de?: string } | null)?.de ?? '/app';
  const sessaoExpirou = parametros.get('expirou') === '1';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Formulario>({ resolver: zodResolver(esquema) });

  const login = useMutation({
    mutationFn: async (dados: Formulario) => {
      const { data } = await api.post<AuthResponse>('/auth/login', dados);
      return data;
    },
    onSuccess: (data) => {
      entrar(data.user, data.accessToken);
      navegar(destino, { replace: true });
    },
  });

  return (
    <div className="mx-auto w-full max-w-md px-4 py-14 sm:px-6">
      <Rotulo>Acesso</Rotulo>
      <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink">
        Entrar na sua conta
      </h1>
      <p className="mt-2 text-ink-soft">
        Use o e-mail e a senha que voce cadastrou.{' '}
        <Link to="/cadastrar" className="font-medium text-bic underline-offset-2 hover:underline">
          Nao tem conta?
        </Link>
      </p>

      {sessaoExpirou && (
        <Aviso tom="tinta" className="mt-6">
          A sua sessao expirou. Entre de novo para continuar.
        </Aviso>
      )}

      <form
        noValidate
        onSubmit={handleSubmit((dados) => login.mutate(dados))}
        className="mt-8 space-y-5"
      >
        <Campo
          rotulo="E-mail"
          type="email"
          autoComplete="email"
          placeholder="voce@exemplo.com"
          erro={errors.email?.message}
          {...register('email')}
        />

        <Campo
          rotulo="Senha"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          erro={errors.password?.message}
          {...register('password')}
        />

        {login.isError && <Aviso>{mensagemDeErro(login.error)}</Aviso>}

        <Botao type="submit" carregando={login.isPending} className="w-full">
          {login.isPending ? 'Entrando' : 'Entrar'}
        </Botao>
      </form>
    </div>
  );
}
