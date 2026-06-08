module.exports = {
  apps: [
    {
      name: "spmb-backend",
      script: "./backend/server.js",
      cwd: "./backend",
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: 5000
      }
    },
    {
      name: "spmb-frontend",
      script: "serve",
      env: {
        PM2_SERVE_PATH: './frontend/dist',
        PM2_SERVE_PORT: 5173,
        PM2_SERVE_SPA: 'true',
        PM2_SERVE_HOMEPAGE: './index.html'
      }
    }
  ]
};
