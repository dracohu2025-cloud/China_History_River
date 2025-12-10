/**
 * PM2 配置文件 - History River 项目
 * 管理所有前后端服务
 * 
 * 使用方法：
 *   启动所有服务: pm2 start ecosystem.config.js
 *   停止所有服务: pm2 stop ecosystem.config.js
 *   重启所有服务: pm2 restart ecosystem.config.js
 *   查看状态: pm2 status
 *   查看日志: pm2 logs
 */

module.exports = {
  apps: [
    // ============================================
    // 前端服务 - 生产构建 (通过 npx serve)
    // ============================================
    {
      name: 'history-river-frontend',
      cwd: '.',
      script: './serve-static-with-proxy.js',
      interpreter: 'node',
      env: {
        NODE_ENV: 'production',
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },

    // ============================================
    // 注意: Django 和 Express 服务已移除
    // 项目已迁移到纯 Serverless 架构 (Supabase + Vercel)
    // ============================================

  ],

  // ============================================
  // 部署配置（可选）
  // ============================================
  deploy: {
    production: {
      user: 'root',
      host: 'your-server-ip',
      ref: 'origin/main',
      repo: 'https://github.com/Draco3000/history_river_November_2025.git',
      path: '/var/www/history-river',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
    },
  },
};

