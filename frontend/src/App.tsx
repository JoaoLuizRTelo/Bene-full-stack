import { Navigate, Route, Routes } from 'react-router-dom';
import { LayoutApp } from './components/layout/LayoutApp';
import { LayoutPublico } from './components/layout/LayoutPublico';
import { CadastrarPage } from './pages/CadastrarPage';
import { ContasPage } from './pages/ContasPage';
import { EntrarPage } from './pages/EntrarPage';
import { LandingPage } from './pages/LandingPage';
import { NaoEncontradaPage } from './pages/NaoEncontradaPage';
import { TranscreverPage } from './pages/TranscreverPage';
import { TranscricaoPage } from './pages/TranscricaoPage';
import { RotaAdmin } from './routes/RotaAdmin';
import { RotaProtegida } from './routes/RotaProtegida';
import { useAuthStore } from './store/authStore';

/** O mapa de rotas da aplicacao (docs/ESPECIFICACAO.md, secao 8). */
export function App() {
  const temSessao = Boolean(useAuthStore((estado) => estado.accessToken));

  return (
    <Routes>
      {/* Telas abertas a visitantes */}
      <Route element={<LayoutPublico />}>
        <Route index element={temSessao ? <Navigate to="/app" replace /> : <LandingPage />} />
        <Route
          path="entrar"
          element={temSessao ? <Navigate to="/app" replace /> : <EntrarPage />}
        />
        <Route
          path="cadastrar"
          element={temSessao ? <Navigate to="/app" replace /> : <CadastrarPage />}
        />
        <Route path="*" element={<NaoEncontradaPage />} />
      </Route>

      {/* Area interna */}
      <Route path="app" element={<RotaProtegida />}>
        <Route element={<LayoutApp />}>
          <Route index element={<TranscreverPage />} />
          <Route path="transcricoes/:id" element={<TranscricaoPage />} />

          <Route element={<RotaAdmin />}>
            <Route path="contas" element={<ContasPage />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}
