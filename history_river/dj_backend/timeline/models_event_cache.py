# dj_backend/timeline/models_event_cache.py
"""
EventCache model for storing DeepSeek API responses
This centralizes all event detail caching in Django/PostgreSQL
"""

from django.db import models

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
