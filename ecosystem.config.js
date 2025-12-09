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
    // Express API 服务器 - AI 内容生成
    // ============================================
    {
      name: 'history-river-api',
      cwd: './history_river',
      script: './server/index.js',
      interpreter: 'node',
      env: {
        NODE_ENV: 'development',
        PORT: 4000,
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },

    // ============================================
    // Django 后端 - Timeline API
    // ============================================
    {
      name: 'history-river-django',
      cwd: './history_river/dj_backend',
      script: './venv/bin/python',
      args: 'manage.py runserver 8001',
      interpreter: 'none',
      env: {
        DJANGO_SETTINGS_MODULE: 'dj_backend.settings',
        PYTHONUNBUFFERED: '1',
        DJANGO_ALLOWED_HOSTS: 'localhost,127.0.0.1,history-timeline.aigc24.com,.aigc24.com',
        OPENROUTER_API_KEY: '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',
        Default_LLM_Model: 'deepseek/deepseek-v3.2-exp',
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '400M',
      error_file: './logs/django-error.log',
      out_file: './logs/django-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },


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

