# ⚠️ Supabase数据库连接问题 (IPv6)

## 问题诊断

在UCloud生产服务器连接Supabase PostgreSQL时遇到网络不可达问题。

### 错误信息
```
psycopg2.OperationalError: connection to server at "db.zhvczrrcwpxgrifshhmh.supabase.co" 
(2406:da14:271:9902:911e:573e:e23b:bf5b), port 5432 failed: Network is unreachable
```

### 诊断结果
1. ✅ **DNS解析成功** - Supabase返回IPv6地址
2. ❌ **IPv6连接失败** - Network unreachable (错误码101)
3. ❌ **IPv4地址不可用** - Supabase只提供IPv6
4. ❌ **psql连接失败** - 同样的问题

## 根本原因

**UCloud服务器IPv6网络限制**
- Supabase仅提供IPv6地址的数据库访问
- UCloud服务器无法正常访问外部IPv6网络
- 防火墙/安全组可能阻止了出站IPv6流量

## 解决方案选项

### 选项1: 启用UCloud IPv6公网（推荐）

在UCloud控制台：
1. 为服务器开通IPv6公网带宽
2. 配置IPv6安全组规则：
   - 出站：允许所有IPv6流量
   - 端口：允许5432端口
3. 确保服务器系统启用IPv6转发

### 选项2: IPv6到IPv4代理（暂时方案）

设置Nginx反向代理TCP连接：

```nginx
# 在支持IPv6的中间服务器上配置
stream {
    upstream supabase_pg {
        server db.zhvczrrcwpxgrifshhmh.supabase.co:5432;
    }
    
    server {
        listen 5432;
        proxy_pass supabase_pg;
    }
}
```

然后在Django配置中连接到代理服务器的IPv4地址。

### 选项3: 使用Cloudflare WARP

```bash
# 安装Cloudflare WARP
curl https://pkg.cloudflareclient.com/install.sh | bash

# 连接WARP
warp-cli register
warp-cli connect

# 这将提供IPv6连接到IPv4的转换
```

### 选项4: 联系Supabase申请IPv4访问

虽然Supabase标准配置只提供IPv6，但可以联系支持团队询问IPv4访问选项。

## Django配置调整

在连接问题解决前，可以进行本地测试：

```bash
# 在本地开发环境中测试Django
cd dj_backend
source venv/bin/activate
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

## 当前状态

### ✅ 已完成
- Django项目结构和代码
- RiverPin模型和Admin配置
- API接口
- 生产部署脚本
- 依赖包安装

### ⚠️ 阻塞中
- 数据库迁移（需要Supabase连接）
- Django Admin访问
- 生产环境启动

### 下一步
1. 解决IPv6网络连接问题（联系UCloud/Supabase支持）
2. 运行数据库迁移
3. 启动Gunicorn生产服务器
4. 配置Nginx反向代理

## 文件位置

- Django项目：`/home/ubuntu/history_river/history_river/dj_backend/`
- 网络测试脚本：`dj_backend/test_network.sh`
- Django设置：`dj_backend/dj_backend/settings.py`
- 环境变量：`dj_backend/.env`

## 测试命令

```bash
# 测试网络连通性
cd dj_backend
./test_network.sh

# 测试Django配置
source venv/bin/activate
python manage.py check
```

## 支持联系方式

- **UCloud技术支持**: 检查IPv6出站连接配置
- **Supabase支持**: 询问IPv4访问选项
- **网络管理员**: 配置防火墙/安全组规则

## 更新时间
2025-11-25
