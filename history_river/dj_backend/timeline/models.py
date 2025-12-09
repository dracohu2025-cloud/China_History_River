from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from uuid import uuid4


class Dynasty(models.Model):
    """朝代模型"""
    EVENT_TYPES = [
        ('war', '战争'),
        ('culture', '文化'),
        ('politics', '政治'),
        ('science', '科技'),
    ]
    
    IMPORTANCE_LEVELS = [
        (1, '极其重要'),
        (2, '非常重要'),
        (3, '重要'),
        (4, '一般'),
        (5, '次要'),
    ]
    
    id = models.CharField(primary_key=True, max_length=50, verbose_name='朝代ID')
    name = models.CharField(max_length=100, verbose_name='英文名称')
    chinese_name = models.CharField(max_length=50, verbose_name='中文名称')
    start_year = models.IntegerField(verbose_name='开始年份')
    end_year = models.IntegerField(verbose_name='结束年份')
    color = models.CharField(max_length=7, verbose_name='颜色代码', help_text='如: #ff0000')
    description = models.TextField(verbose_name='朝代描述')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')
    
    class Meta:
        db_table = 'dynasties'
        verbose_name = '朝代'
        verbose_name_plural = '朝代管理'
        ordering = ['start_year']
        indexes = [
            models.Index(fields=['start_year', 'end_year']),
            models.Index(fields=['name']),
        ]
    
    def __str__(self):
        return f"{self.chinese_name} ({self.name})"
    
    @property
    def duration(self):
        """获取朝代持续时间"""
        return self.end_year - self.start_year
    
    def contains_year(self, year):
        """检查指定年份是否在此朝代范围内"""
        return self.start_year <= year <= self.end_year


class HistoricalEvent(models.Model):
    """历史事件模型"""
    EVENT_TYPES = [
        ('war', '战争'),
        ('culture', '文化'),
        ('politics', '政治'),
        ('science', '科技'),
    ]
    
    IMPORTANCE_LEVELS = [
        (1, '极其重要'),
        (2, '非常重要'),
        (3, '重要'),
        (4, '一般'),
        (5, '次要'),
    ]
    
    year = models.IntegerField(verbose_name='年份', help_text='负数表示公元前')
    title = models.CharField(max_length=200, verbose_name='事件标题')
    event_type = models.CharField(
        max_length=20, 
        choices=EVENT_TYPES, 
        verbose_name='事件类型',
        default='politics'
    )
    description = models.TextField(verbose_name='事件描述', blank=True, null=True)
    importance = models.IntegerField(
        verbose_name='重要性等级',
        choices=IMPORTANCE_LEVELS,
        default=3,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text='1=极其重要, 5=次要'
    )
    dynasty = models.ForeignKey(
        Dynasty, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='events',
        verbose_name='所属朝代'
    )
    source_reference = models.CharField(
        max_length=200, 
        verbose_name='史料来源', 
        blank=True,
        help_text='记录史料出处或参考来源'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')
    
    class Meta:
        db_table = 'historical_events'
        verbose_name = '历史事件'
        verbose_name_plural = '历史事件管理'
        ordering = ['year', 'importance', 'title']
        indexes = [
            models.Index(fields=['year']),
            models.Index(fields=['event_type']),
            models.Index(fields=['importance']),
            models.Index(fields=['year', 'importance']),
            models.Index(fields=['dynasty']),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(importance__gte=1) & models.Q(importance__lte=5),
                name='importance_between_1_and_5'
            )
        ]
    
    def __str__(self):
        dynasty_info = f" - {self.dynasty.chinese_name}" if self.dynasty else ""
        return f"{self.year}年: {self.title}{dynasty_info}"
    
    @property
    def is_bce(self):
        """判断是否为公元前"""
        return self.year < 0
    
    def get_importance_display_name(self):
        """获取重要性等级的中文显示（带序号格式）"""
        # 带圈圈的数字字符映射
        circled_numbers = {
            1: '①',  # 极其重要
            2: '②',  # 非常重要
            3: '③',  # 重要
            4: '④',  # 一般
            5: '⑤',  # 次要
        }
        importance_name = dict(self.IMPORTANCE_LEVELS)[self.importance]
        circled_num = circled_numbers.get(self.importance, str(self.importance))
        return f"{circled_num}{importance_name}"
    
    def get_event_type_display_name(self):
        """获取事件类型的中文显示"""
        return dict(self.EVENT_TYPES)[self.event_type]


# 保留原有的RiverPin模型以向后兼容，但标记为已弃用
class RiverPin(models.Model):
    """播客轨道模型"""
    id = models.CharField(primary_key=True, max_length=36, default=uuid4, editable=False)
    job_id = models.CharField(max_length=36, verbose_name='任务ID')
    title = models.CharField(max_length=200, verbose_name='书籍名称')
    year = models.IntegerField(verbose_name='年份')
    douban_rating = models.DecimalField(
        max_digits=3, 
        decimal_places=1, 
        verbose_name='豆瓣评分',
        blank=True, 
        null=True,
        help_text='例如: 8.5（0-10分）'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    
    class Meta:
        db_table = 'river_pins'
        verbose_name = '播客轨道'
        verbose_name_plural = '播客轨道管理'
        ordering = ['year']
        indexes = [
            models.Index(fields=['year']),
        ]
    
    def __str__(self):
        rating = f" 豆瓣评分:{self.douban_rating}" if self.douban_rating else ""
        return f"{self.year} - {self.title}{rating}"


class EventCache(models.Model):
    """
    Cache for DeepSeek API responses
    - For specific events: uuid = SHA256(event_title|year)
    - For year overviews: uuid = SHA256('__year__'|year)
    """
    
    uuid = models.CharField(
        max_length=64, 
        primary_key=True,
        help_text="SHA-256 hash of 'title|year' or '__year__|year'"
    )
    
    year = models.IntegerField(
        db_index=True,
        help_text="Historical year (negative for BCE)"
    )
    
    event_title = models.CharField(
        max_length=200, 
        blank=True, 
        default='',
        help_text="Event title (empty for year overviews)"
    )
    
    context = models.TextField(
        help_text="Query context passed to DeepSeek"
    )
    
    content = models.TextField(
        help_text="DeepSeek API response content"
    )
    
    is_cached = models.BooleanField(
        default=True,
        help_text="Whether this is cached (vs. directly fetched)"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Soft delete for cache invalidation
    is_deleted = models.BooleanField(
        default=False,
        help_text="Soft delete flag for cache invalidation"
    )

    class Meta:
        db_table = 'timeline_event_cache'
        indexes = [
            models.Index(fields=['year', 'event_title']),
            models.Index(fields=['created_at']),
        ]
        ordering = ['-updated_at']
        verbose_name = '事件详情缓存'
        verbose_name_plural = '事件详情缓存'

    def __str__(self):
        if self.event_title:
            return f"{self.year}: {self.event_title[:50]}"
        return f"{self.year}: 年份概况"

    @classmethod
    def get_or_fetch(cls, year: int, event_title: str = None, context: str = None):
        """
        Get from cache or fetch from DeepSeek
        Centralized cache management method
        """
        from .services import fetch_from_deepseek  # Avoid circular import
        
        # Generate UUID
        import hashlib
        title = event_title or '__year__'
        uuid = hashlib.sha256(f"{title}|{year}".encode()).hexdigest()
        
        # Try cache first
        try:
            cache_entry = cls.objects.get(uuid=uuid, is_deleted=False)
            return cache_entry.content, True  # cached=True
        except cls.DoesNotExist:
            pass
        
        # Fetch from DeepSeek
        content = fetch_from_deepseek(year, context)
        
        # Save to cache
        cache_entry = cls.objects.create(
            uuid=uuid,
            year=year,
            event_title=event_title or '',
            context=context or '',
            content=content,
            is_cached=False  # Newly fetched
        )
        
        return content, False  # cached=False

    @classmethod
    def invalidate(cls, uuid: str):
        """Invalidate a cache entry"""
        cls.objects.filter(uuid=uuid).update(is_deleted=True)

    @classmethod
    def cleanup_old_entries(cls, days: int = 365):
        """Remove entries older than X days"""
        from django.utils import timezone
        from datetime import timedelta
        
        cutoff = timezone.now() - timedelta(days=days)
        cls.objects.filter(updated_at__lt=cutoff).delete()
