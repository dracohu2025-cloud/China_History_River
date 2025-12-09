from django.urls import path
from . import views, api_views, api_views_event_cache

urlpatterns = [
    # 原有路由（向后兼容）
    path('pins/', views.river_pins_list, name='river-pins-list'),
    
    # API路由
    path('api/dynasties/', api_views.dynasties_api, name='api-dynasties'),
    path('api/events/', api_views.events_api, name='api-events'),
    path('api/events/<int:event_id>/', api_views.event_detail_api, name='api-event-detail'),
    path('api/timeline/', api_views.timeline_data_api, name='api-timeline'),
    path('api/riverpins/', api_views.river_pins_api, name='api-riverpins'),
    path('api/health/', api_views.health_check_api, name='api-health'),
    
    # EventCache API (new) - 事件详情缓存查询
    path('api/event-details/', api_views_event_cache.get_event_details, name='api-event-details'),
]
