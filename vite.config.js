import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // This setting tells Vite to proxy requests starting with '/api'
    proxy: {
      '/api': {
        // Target should be the local address where the serverless functions run.
        // If using 'vercel dev', it usually runs on port 3000.
        // If running a custom Node/Express backend, adjust the port as needed.
        target: 'http://localhost:3000',
        
        // This is crucial: it rewrites the path from '/api/convert' to just '/convert'
        // if serverless function is named 'convert.js' inside the 'api' folder.
        // If serverless framework handles the full path, might not need this.
        // Since Vercel routes `/api/convert` to the `api/convert.js` file, 
        // set rewrite to keep the path structure.
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api'), 
      },
    },
  },
});
