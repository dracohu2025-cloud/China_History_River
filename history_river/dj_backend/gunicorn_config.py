import multiprocessing

bind = "127.0.0.1:8000"
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "sync"
worker_connections = 1000
timeout = 30
keepalive = 2

loglevel = "info"
accesslog = "-"
errorlog = "-"

# 生产环境优化
daemon = False
pidfile = "/tmp/django_gunicorn.pid"
user = None
group = None
tmp_upload_dir = None

# 性能调优
preload_app = True
reload = False

# 命名
proc_name = "dj_backend"
