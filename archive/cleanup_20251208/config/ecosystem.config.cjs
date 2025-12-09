module.exports = {
  apps: [
    {
      name: "history-river-frontend",
      script: "npm",
      args: "run dev",
      cwd: "/Users/dracohu/REPO/history_river_November_2025/history_river",
      env: {
        NODE_ENV: "development"
      },
      // PM2 配置
      instances: 1,
      exec_mode: "fork",
      watch: false,  // Vite 自己有热重载
      max_memory_restart: "1G",
      error_file: "/Users/dracohu/REPO/history_river_November_2025/logs/frontend-error.log",
      out_file: "/Users/dracohu/REPO/history_river_November_2025/logs/frontend-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true
    },
    {
      name: "history-river-server",
      script: "npm",
      args: "run server",
      cwd: "/Users/dracohu/REPO/history_river_November_2025/history_river",
      env: {
        NODE_ENV: "development"
      },
      instances: 1,
      exec_mode: "fork",
      watch: false,
      max_memory_restart: "512M",
      error_file: "/Users/dracohu/REPO/history_river_November_2025/logs/server-error.log",
      out_file: "/Users/dracohu/REPO/history_river_November_2025/logs/server-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true
    }
  ]
}
