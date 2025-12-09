from django.contrib import admin
from django.utils.html import format_html
from .models import Dynasty, HistoricalEvent, RiverPin, EventCache


@admin.register(Dynasty)
class DynastyAdmin(admin.ModelAdmin):
    list_display = ('chinese_name', 'name', 'start_year', 'end_year', 'duration', 'color_preview', 'event_count')
    list_filter = ('start_year', 'end_year')
    search_fields = ('name', 'chinese_name', 'description')
    ordering = ('start_year',)
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('基本信息', {
            'fields': ('id', 'name', 'chinese_name')
        }),
        ('时间信息', {
            'fields': ('start_year', 'end_year', 'duration')
        }),
        ('样式信息', {
            'fields': ('color', 'color_preview')
        }),
        ('描述信息', {
            'fields': ('description',)
        }),
        ('系统信息', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def color_preview(self, obj):
        """显示颜色预览"""
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 8px; border-radius: 3px;">{}</span>',
            obj.color, obj.color
        )
    color_preview.short_description = '颜色预览'
    
    def duration(self, obj):
        """计算朝代持续时间"""
        return obj.duration
    duration.short_description = '持续年数'
    
    def event_count(self, obj):
        """统计该朝代的事件数量"""
        count = obj.events.count()
        return format_html(
            '<strong>{}</strong> 个事件',
            count
        )
    event_count.short_description = '事件数量'
    
    def get_readonly_fields(self, request, obj=None):
        """动态设置只读字段"""
        readonly_fields = list(self.readonly_fields)
        if obj:  # 编辑时
            readonly_fields.append('id')  # 朝代ID不可编辑
        return readonly_fields
    
    class Media:
        css = {
            'all': ('admin/css/widgets.css',),
        }


@admin.register(HistoricalEvent)
class HistoricalEventAdmin(admin.ModelAdmin):
    list_display = (
        'year_display', 'title', 'event_type_display', 
        'importance_display', 'dynasty_link', 'created_at'
    )
    list_filter = (
        'event_type', 'importance', 'dynasty', 'year'
    )
    search_fields = ('title', 'description', 'source_reference')
    ordering = ('year', 'importance', 'title')
    readonly_fields = ('created_at', 'updated_at', 'importance_display_detail')
    
    fieldsets = (
        ('基本信息', {
            'fields': ('year', 'title')
        }),
        ('分类信息', {
            'fields': ('event_type', 'importance', 'dynasty')
        }),
        ('详细内容', {
            'fields': ('description', 'source_reference')
        }),
        ('系统信息', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def year_display(self, obj):
        """年份显示（区分公元前/公元后）"""
        if obj.is_bce:
            return f"公元前{abs(obj.year)}年"
        else:
            return f"公元{obj.year}年"
    year_display.short_description = '年份'
    year_display.admin_order_field = 'year'
    
    def event_type_display(self, obj):
        """事件类型显示"""
        return obj.get_event_type_display_name()
    event_type_display.short_description = '事件类型'
    event_type_display.admin_order_field = 'event_type'
    
    def importance_display(self, obj):
        """重要性等级显示（带序号格式）"""
        colors = {
            1: '#dc2626',  # 红色 - 极其重要
            2: '#f97316',  # 橙色 - 非常重要
            3: '#eab308',  # 黄色 - 重要
            4: '#22c55e',  # 绿色 - 一般
            5: '#6b7280',  # 灰色 - 次要
        }
        color = colors.get(obj.importance, '#6b7280')
        importance_text = obj.get_importance_display_name()
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 8px; border-radius: 3px; font-weight: bold; font-size: 12px;">{}</span>',
            color, importance_text
        )
    importance_display.short_description = '重要性'
    importance_display.admin_order_field = 'importance'
    
    def dynasty_link(self, obj):
        """朝代链接"""
        if obj.dynasty:
            url = f"/admin/timeline/dynasty/{obj.dynasty.id}/change/"
            return format_html(
                '<a href="{}" style="color: #2563eb; text-decoration: none;">{}</a>',
                url, obj.dynasty.chinese_name
            )
        return "无"
    dynasty_link.short_description = '所属朝代'
    dynasty_link.admin_order_field = 'dynasty__chinese_name'
    
    def importance_display_detail(self, obj):
        """详情页面重要性等级显示（带序号格式）"""
        colors = {
            1: '#dc2626',  # 红色 - 极其重要
            2: '#f97316',  # 橙色 - 非常重要
            3: '#eab308',  # 黄色 - 重要
            4: '#22c55e',  # 绿色 - 一般
            5: '#6b7280',  # 灰色 - 次要
        }
        color = colors.get(obj.importance, '#6b7280')
        importance_text = obj.get_importance_display_name()
        return format_html(
            '<span style="background-color: {}; color: white; padding: 4px 12px; border-radius: 6px; font-weight: bold; font-size: 14px;">{}</span>',
            color, importance_text
        )
    importance_display_detail.short_description = '重要性等级'
    
    actions = ['mark_as_important', 'mark_as_major_event']
    
    def mark_as_important(self, request, queryset):
        """批量标记为极其重要"""
        updated = queryset.update(importance=1)
        self.message_user(request, f'成功将 {updated} 个事件标记为极其重要')
    mark_as_important.short_description = '标记为极其重要'
    
    def mark_as_major_event(self, request, queryset):
        """批量标记为重大事件"""
        updated = queryset.update(importance=2)
        self.message_user(request, f'成功将 {updated} 个事件标记为非常重要')
    mark_as_major_event.short_description = '标记为非常重要'
    
    def get_readonly_fields(self, request, obj=None):
        """动态设置只读字段"""
        readonly_fields = list(self.readonly_fields)
        if not request.user.is_superuser:
            readonly_fields.extend(['created_at', 'updated_at'])
        return readonly_fields
    
    def get_exclude(self, request, obj=None):
        """根据用户权限排除字段"""
        exclude = []
        if not request.user.is_superuser:
            exclude.extend(['source_reference'])
        return exclude
    
    class Media:
        css = {
            'all': ('admin/css/widgets.css',),
        }


@admin.register(RiverPin)
class RiverPinAdmin(admin.ModelAdmin):
    list_display = ('year', 'title', 'douban_rating_display', 'job_id', 'created_at')
    list_filter = ('year', 'created_at', 'douban_rating')
    search_fields = ('title', 'job_id')
    ordering = ('year',)
    
    fieldsets = (
        (None, {
            'fields': ('job_id', 'title', 'year', 'douban_rating')
        }),
        ('其他信息', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ('created_at',)
    
    def douban_rating_display(self, obj):
        """显示豆瓣评分"""
        if obj.douban_rating:
            return f"{obj.douban_rating} ⭐"
        return "-"
    douban_rating_display.short_description = '豆瓣评分'
    douban_rating_display.admin_order_field = 'douban_rating'
    
    def has_add_permission(self, request):
        return True
    
    def has_delete_permission(self, request, obj=None):
        return True


@admin.register(EventCache)
class EventCacheAdmin(admin.ModelAdmin):
    list_display = (
        'year', 'event_title_short', 'preview_short', 
        'is_cached', 'created_at', 'updated_at'
    )
    list_filter = ('year', 'is_cached', 'created_at')
    search_fields = ('event_title', 'content', 'uuid')
    ordering = ('-updated_at',)
    readonly_fields = (
        'uuid', 'year', 'event_title', 'context', 
        'content_preview', 'created_at', 'updated_at'
    )
    
    fieldsets = (
        ('基本信息', {
            'fields': ('uuid', 'year', 'event_title')
        }),
        ('缓存内容', {
            'fields': ('context', 'content_preview')
        }),
        ('系统信息', {
            'fields': ('is_cached', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def has_add_permission(self, request):
        # Prevent manual creation - only via API
        return False
    
    def has_change_permission(self, request, obj=None):
        # Prevent editing - content is from DeepSeek
        return False
    
    def event_title_short(self, obj):
        """Shortened event title for list view"""
        if not obj.event_title:
            return "年份概况"
        if len(obj.event_title) > 50:
            return obj.event_title[:47] + "..."
        return obj.event_title
    event_title_short.short_description = '事件标题'
    
    def preview_short(self, obj):
        """Short content preview"""
        content_preview = obj.content[:100]
        if len(obj.content) > 100:
            content_preview += "..."
        return format_html(
            '<div style="white-space: normal; word-wrap: break-word; font-size: 12px; line-height: 1.4;">{}</div>',
            content_preview
        )
    preview_short.short_description = '内容预览'
    
    def content_preview(self, obj):
        """Full content preview in detail view"""
        return format_html(
            '<div style="white-space: pre-wrap; font-family: monospace; background: #f9f9f9; padding: 10px; border-radius: 4px; max-height: 400px; overflow-y: auto;">{}</div>',
            obj.content
        )
    content_preview.short_description = '详细内容'


# 自定义管理站点头部
admin.site.site_header = "历史长河管理系统"
admin.site.site_title = "历史管理"
admin.site.index_title = "历史数据管理控制台"

# 添加自定义样式
admin.site.enable_nav_sidebar = False
