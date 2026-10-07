import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

/**
 * Barra a area interna sem sessao. Guarda o caminho pedido para devolver a
 * pessoa ao lugar certo depois do login.
 *
 * Isto e conveniencia de navegacao, nao seguranca: quem protege os dados e a
 * guarda no backend. Esconder um botao nao protege uma rota.
 */
export function RotaProtegida() {
  const accessToken = useAuthStore((estado) => estado.accessToken);
  const local = useLocation();

  if (!accessToken) {
    return <Navigate to="/entrar" replace state={{ de: local.pathname }} />;
  }

  return <Outlet />;
}
