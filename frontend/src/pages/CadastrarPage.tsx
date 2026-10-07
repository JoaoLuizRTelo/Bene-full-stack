import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Aviso, Botao, Campo, Rotulo } from '../components/ui';
import { api, mensagemDeErro } from '../services/api';
import { useAuthStore } from '../store/authStore';
import type { AuthResponse } from '../types/api';

/*
 * A validacao aqui e conveniencia para quem usa a tela: ela avisa antes de
 * gastar uma ida ao servidor. Ela NAO substitui o DTO do backend, porque
 * qualquer pessoa pode chamar a API sem passar por este formulario.
 *
 * Note tambem o que este formulario nao tem: campo de papel. Toda conta nasce
 * como usuario comum, e o backend recusa um cadastro que tente definir isso.
 */
const esquema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'O nome precisa ter ao menos 2 caracteres')
      .max(120, 'O nome passa de 120 caracteres'),
    email: z.string().min(1, 'Informe um e-mail').email('Esse e-mail nao parece valido'),
    password: z
      .string()
      .min(8, 'A senha precisa ter ao menos 8 caracteres')
      .max(72, 'A senha passa de 72 caracteres'),
    confirmacao: z.string().min(1, 'Repita a senha'),
  })
  .refine((dados) => dados.password === dados.confirmacao, {
    path: ['confirmacao'],
    message: 'As senhas nao sao iguais',
  });

type Formulario = z.infer<typeof esquema>;

export function CadastrarPage() {
  const entrar = useAuthStore((estado) => estado.entrar);
  const navegar = useNavigate();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Formulario>({ resolver: zodResolver(esquema) });

  const cadastro = useMutation({
    mutationFn: async ({ name, email, password }: Formulario) => {
      const { data } = await api.post<AuthResponse>('/auth/register', {
        name,
        email,
        password,
      });
      return data;
    },
    onSuccess: (data) => {
      entrar(data.user, data.accessToken);
      navegar('/app', { replace: true });
    },
    onError: (erro: unknown) => {
      // 409 e sobre o e-mail: o erro pertence aquele campo, nao ao formulario.
      const mensagem = mensagemDeErro(erro);
      if (mensagem.includes('e-mail ja esta cadastrado')) {
        setError('email', { message: 'Esse e-mail ja esta cadastrado' });
      }
    },
  });

  const erroGeral =
    cadastro.isError && !errors.email ? mensagemDeErro(cadastro.error) : null;

  return (
    <div className="mx-auto w-full max-w-md px-4 py-14 sm:px-6">
      <Rotulo>Nova conta</Rotulo>
      <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink">
        Criar a sua conta
      </h1>
      <p className="mt-2 text-ink-soft">
        Leva um minuto.{' '}
        <Link to="/entrar" className="font-medium text-bic underline-offset-2 hover:underline">
          Ja tem conta?
        </Link>
      </p>

      <form
        noValidate
        onSubmit={handleSubmit((dados) => cadastro.mutate(dados))}
        className="mt-8 space-y-5"
      >
        <Campo
          rotulo="Nome"
          autoComplete="name"
          placeholder="Como voce quer ser chamado"
          erro={errors.name?.message}
          {...register('name')}
        />

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
          autoComplete="new-password"
          placeholder="••••••••"
          dica="De 8 a 72 caracteres."
          erro={errors.password?.message}
          {...register('password')}
        />

        <Campo
          rotulo="Repita a senha"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          erro={errors.confirmacao?.message}
          {...register('confirmacao')}
        />

        {erroGeral && <Aviso>{erroGeral}</Aviso>}

        <Botao type="submit" carregando={cadastro.isPending} className="w-full">
          {cadastro.isPending ? 'Criando a conta' : 'Criar conta'}
        </Botao>
      </form>
    </div>
  );
}
