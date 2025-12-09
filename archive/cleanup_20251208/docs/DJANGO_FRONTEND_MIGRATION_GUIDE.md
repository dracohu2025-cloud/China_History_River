# 历史数据Django迁移 - 前端修改指南

## 项目概述

本文档提供了将历史长河项目从静态数据迁移到Django API的详细指南。迁移后，历史数据将统一由Django管理，前端通过API接口获取数据。

## API接口信息

### 基础配置
- **API基础URL**: `http://localhost:8000/api/timeline`
- **响应格式**: JSON
- **CORS**: 已配置，支持跨域请求

### 可用接口

#### 1. 健康检查
- **URL**: `GET /api/timeline/api/health/`
- **用途**: 检查API服务状态
- **响应示例**:
```json
{
    "success": true,
    "status": "healthy",
    "data": {
        "dynasty_count": 53,
        "event_count": 264,
        "version": "1.0.0"
    }
}
```

#### 2. 获取时间线数据
- **URL**: `GET /api/timeline/api/timeline/`
- **用途**: 获取完整的朝代和事件数据（用于时间线图表）
- **查询参数**: 无
- **响应示例**:
```json
{
    "success": true,
    "data": {
        "dynasties": [...],
        "events": [...],
        "stats": {...}
    }
}
```

#### 3. 获取朝代列表
- **URL**: `GET /api/timeline/api/dynasties/`
- **用途**: 获取所有朝代信息
- **查询参数**:
  - `page`: 页码（默认1）
  - `per_page`: 每页数量（默认50）
- **响应示例**:
```json
{
    "success": true,
    "data": [
        {
            "id": "xia",
            "name": "Xia",
            "chineseName": "夏",
            "startYear": -2070,
            "endYear": -1600,
            "color": "#57534e",
            "description": "中国史书中记载的第一个世袭制朝代。",
            "duration": 470,
            "eventCount": 3
        }
    ],
    "pagination": {...}
}
```

#### 4. 获取历史事件
- **URL**: `GET /api/timeline/api/events/`
- **用途**: 获取历史事件列表
- **查询参数**:
  - `year_from`: 开始年份（可选）
  - `year_to`: 结束年份（可选）
  - `type`: 事件类型（war/culture/politics/science）
  - `importance`: 重要性等级（1-5）
  - `dynasty_id`: 朝代ID（可选）
  - `search`: 搜索关键词（可选）
  - `page`: 页码（默认1）
  - `per_page`: 每页数量（默认100）
- **响应示例**:
```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "year": -2070,
            "title": "夏朝建立",
            "type": "politics",
            "typeDisplay": "政治",
            "importance": 1,
            "importanceDisplay": "极其重要",
            "description": "",
            "dynasty": {
                "id": "xia",
                "chineseName": "夏",
                "name": "Xia"
            },
            "sourceReference": ""
        }
    ],
    "pagination": {...}
}
```

#### 5. 获取事件详情
- **URL**: `GET /api/timeline/api/events/{event_id}/`
- **用途**: 获取单个历史事件的详细信息
- **响应示例**:
```json
{
    "success": true,
    "data": {
        "id": 1,
        "year": -2070,
        "title": "夏朝建立",
        "type": "politics",
        "typeDisplay": "政治",
        "importance": 1,
        "importanceDisplay": "极其重要",
        "description": "详细描述...",
        "dynasty": {...},
        "sourceReference": "史料来源",
        "createdAt": "2025-11-26T03:05:33.000Z",
        "updatedAt": "2025-11-26T03:05:33.000Z"
    }
}
```

## 前端修改方案

### 1. 创建API服务文件

创建 `src/services/historyApi.ts`:

```typescript
// src/services/historyApi.ts

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  pagination?: {
    current_page: number;
    total_pages: number;
    total_items: number;
    items_per_page: number;
    has_next: boolean;
    has_previous: boolean;
  };
}

interface Dynasty {
  id: string;
  name: string;
  chineseName: string;
  startYear: number;
  endYear: number;
  color: string;
  description: string;
  duration: number;
  eventCount: number;
}

interface HistoricalEvent {
  id: number;
  year: number;
  title: string;
  type: 'war' | 'culture' | 'politics' | 'science';
  typeDisplay: string;
  importance: 1 | 2 | 3 | 4 | 5;
  importanceDisplay: string;
  description: string;
  dynasty?: {
    id: string;
    chineseName: string;
    name: string;
  };
  sourceReference: string;
}

const API_BASE_URL = 'http://localhost:8000/api/timeline';

class HistoryApiService {
  private async fetchApi<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: ApiResponse<T> = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'API request failed');
    }
    
    return data.data;
  }

  // 健康检查
  async healthCheck() {
    return this.fetchApi('/api/health/');
  }

  // 获取时间线数据
  async getTimelineData() {
    return this.fetchApi('/api/timeline/');
  }

  // 获取朝代列表
  async getDynasties(page = 1, perPage = 50) {
    return this.fetchApi(`/api/dynasties/?page=${page}&per_page=${perPage}`);
  }

  // 获取历史事件
  async getEvents(params: {
    yearFrom?: number;
    yearTo?: number;
    type?: string;
    importance?: number;
    dynastyId?: string;
    search?: string;
    page?: number;
    perPage?: number;
  } = {}) {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });
    
    const queryString = queryParams.toString();
    const endpoint = `/api/events/${queryString ? '?' + queryString : ''}`;
    
    return this.fetchApi(endpoint);
  }

  // 获取事件详情
  async getEventDetail(eventId: number) {
    return this.fetchApi(`/api/events/${eventId}/`);
  }

  // 格式化年份显示
  formatYear(year: number): string {
    return year < 0 ? `公元前${Math.abs(year)}年` : `公元${year}年`;
  }

  // 获取重要性等级颜色
  getImportanceColor(importance: number): string {
    const colors = {
      1: '#dc2626', // 红色 - 极其重要
      2: '#f97316', // 橙色 - 非常重要
      3: '#eab308', // 黄色 - 重要
      4: '#22c55e', // 绿色 - 一般
      5: '#6b7280', // 灰色 - 次要
    };
    return colors[importance as keyof typeof colors] || '#6b7280';
  }

  // 获取事件类型颜色
  getEventTypeColor(type: string): string {
    const colors = {
      war: '#ef4444',
      culture: '#8b5cf6',
      politics: '#3b82f6',
      science: '#10b981',
    };
    return colors[type as keyof typeof colors] || '#6b7280';
  }
}

export const historyApi = new HistoryApiService();
export type { Dynasty, HistoricalEvent };
```

### 2. 修改数据获取逻辑

#### 修改 `src/data/historyData.ts` 的使用

**原代码** (使用静态数据):
```typescript
import { DYNASTIES, KEY_EVENTS } from '../data/historyData';

// 使用静态数据
const dynasties = DYNASTIES;
const events = KEY_EVENTS;
```

**新代码** (使用API数据):
```typescript
import { historyApi, type Dynasty, type HistoricalEvent } from '../services/historyApi';

// 从API获取数据
export const loadHistoryData = async (): Promise<{
  dynasties: Dynasty[];
  events: HistoricalEvent[];
}> => {
  try {
    const timelineData = await historyApi.getTimelineData();
    return {
      dynasties: timelineData.dynasties,
      events: timelineData.events,
    };
  } catch (error) {
    console.error('Failed to load history data:', error);
    // 可以提供fallback到静态数据
    const { DYNASTIES, KEY_EVENTS } = await import('../data/historyData');
    return {
      dynasties: DYNASTIES,
      events: KEY_EVENTS,
    };
  }
};

// 异步加载数据
const loadData = async () => {
  const { dynasties, events } = await loadHistoryData();
  // 使用数据...
};
```

#### 修改 `src/components/RiverCanvas.tsx`

**关键修改点**:

```typescript
// 替换静态导入
// import { DYNASTIES, KEY_EVENTS } from '../data/historyData';
import { historyApi, type Dynasty, type HistoricalEvent } from '../services/historyApi';

interface RiverCanvasProps {
  // ... 其他props
}

const RiverCanvas: React.FC<RiverCanvasProps> = (props) => {
  const [dynasties, setDynasties] = useState<Dynasty[]>([]);
  const [events, setEvents] = useState<HistoricalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 加载数据
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const timelineData = await historyApi.getTimelineData();
        setDynasties(timelineData.dynasties);
        setEvents(timelineData.events);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        console.error('Failed to load timeline data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // 渲染逻辑保持不变，但使用state中的数据
  if (loading) {
    return <div>加载历史数据中...</div>;
  }

  if (error) {
    return <div>加载失败: {error}</div>;
  }

  // 使用 dynasties 和 events state
  return (
    <svg width={width} height={height}>
      {/* 渲染朝代 */}
      {dynasties.map((dynasty) => (
        // ... 渲染逻辑
      ))}
      
      {/* 渲染事件 */}
      {events.map((event) => (
        // ... 渲染逻辑
      ))}
    </svg>
  );
};
```

### 3. 修改详情模态框

#### 修改 `src/components/DetailModal.tsx`

```typescript
import { historyApi, type HistoricalEvent } from '../services/historyApi';

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: number | null;
}

const DetailModal: React.FC<DetailModalProps> = ({ isOpen, onClose, eventId }) => {
  const [event, setEvent] = useState<HistoricalEvent | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && eventId) {
      const loadEventDetail = async () => {
        try {
          setLoading(true);
          const eventData = await historyApi.getEventDetail(eventId);
          setEvent(eventData);
        } catch (error) {
          console.error('Failed to load event detail:', error);
        } finally {
          setLoading(false);
        }
      };

      loadEventDetail();
    }
  }, [isOpen, eventId]);

  // ... 模态框渲染逻辑
};
```

### 4. 添加错误处理和缓存

#### 创建缓存服务 `src/services/cache.ts`:

```typescript
// src/services/cache.ts

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

class CacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5分钟

  set<T>(key: string, data: T, ttl = this.DEFAULT_TTL): void {
    const now = Date.now();
    this.cache.set(key, {
      data,
      timestamp: now,
      expiry: now + ttl,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear(): void {
    this.cache.clear();
  }

  remove(key: string): void {
    this.cache.delete(key);
  }
}

export const cache = new CacheService();
```

#### 修改API服务添加缓存:

```typescript
// 在 HistoryApiService 中添加缓存支持

import { cache } from './cache';

// ... 在方法中添加缓存

async getTimelineData() {
  const cacheKey = 'timeline-data';
  const cached = cache.get(cacheKey);
  
  if (cached) {
    return cached;
  }

  const data = await this.fetchApi('/api/timeline/');
  cache.set(cacheKey, data);
  return data;
}
```

### 5. 环境配置

创建环境配置文件 `src/config/api.ts`:

```typescript
// src/config/api.ts

export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api/timeline',
  TIMEOUT: 10000, // 10秒
  CACHE_TTL: 5 * 60 * 1000, // 5分钟
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1秒
};

// 开发环境和生产环境的API地址
export const getApiUrl = () => {
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:8000/api/timeline';
  }
  
  // 生产环境替换为实际的API地址
  return process.env.REACT_APP_API_URL || '/api/timeline';
};
```

### 6. 渐进式迁移策略

#### 阶段1: 双数据源模式
- 保持静态数据作为fallback
- 优先使用API数据
- 添加错误处理和重试机制

#### 阶段2: 缓存优化
- 实现本地缓存机制
- 减少API请求频率
- 提升用户体验

#### 阶段3: 完全迁移
- 移除静态数据依赖
- 只使用API数据
- 添加实时数据更新

## 部署注意事项

### 1. CORS配置
确保Django项目正确配置了CORS，支持前端域名访问。

### 2. 性能优化
- 启用API响应缓存
- 使用分页减少单次数据传输
- 考虑使用CDN加速静态资源

### 3. 错误处理
- 实现优雅的错误降级
- 提供用户友好的错误提示
- 添加重试机制

### 4. 监控和日志
- 监控API响应时间
- 记录错误日志
- 跟踪用户使用情况

## 测试建议

### 1. 单元测试
- 测试API服务类
- 测试数据格式化函数
- 测试缓存机制

### 2. 集成测试
- 测试完整的数据流
- 测试错误处理
- 测试性能表现

### 3. 用户测试
- 测试加载性能
- 测试错误场景
- 测试用户体验

## 总结

通过以上修改，历史长河项目将从静态数据模式迁移到动态API模式，实现以下优势：

1. **数据统一管理**: 所有历史数据集中在Django数据库中管理
2. **实时更新**: 可以实时更新历史数据，无需重新部署前端
3. **更好的扩展性**: 易于添加新功能，如用户评论、数据分析等
4. **数据一致性**: 确保前端显示的数据与后端管理的数据一致
5. **更好的性能**: 通过缓存和分页优化性能

迁移过程中请按照渐进式策略进行，确保系统的稳定性和用户体验。