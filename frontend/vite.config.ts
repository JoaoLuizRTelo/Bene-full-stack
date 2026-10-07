import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rolldownOptions: {
      output: {
        // As dependencias mudam muito menos que o nosso codigo: separa-las
        // deixa o cache do navegador valido entre deploys.
        advancedChunks: {
          groups: [{ name: 'vendor', test: /node_modules/ }],
        },
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      // O navegador so conhece a porta 5173. Toda chamada a API sai como
      // caminho relativo /api e o Vite a repassa ao backend - e por isso que
      // nenhum arquivo deste projeto contem endereco absoluto do backend.
      // Em producao, quem faz esse repasse e o proxy reverso.
      '/api': {
        // 127.0.0.1, e nao localhost: no Windows o Node resolve "localhost"
        // para ::1 (IPv6) primeiro, e o backend escuta em 127.0.0.1 (IPv4).
        // Com "localhost" aqui o proxy falha com ECONNREFUSED ::1:3000.
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
    },
  },
});
