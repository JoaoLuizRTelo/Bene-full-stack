import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

/**
 * Barra a gestao de contas para quem nao e administrador. A API responde 403
 * de qualquer forma - esta checagem so evita mostrar uma tela que nao vai
 * carregar.
 */
export function RotaAdmin() {
  const user = useAuthStore((estado) => estado.user);

  if (user?.role !== 'admin') {
    return <Navigate to="/app" replace />;
  }

  return <Outlet />;
}
