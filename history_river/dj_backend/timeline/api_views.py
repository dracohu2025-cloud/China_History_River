"""
Timeline API视图
提供历史数据的REST API接口
"""

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.core.paginator import Paginator
from django.db.models import Q
import json

from .models import Dynasty, HistoricalEvent, RiverPin


@csrf_exempt
@require_http_methods(["GET"])
def dynasties_api(request):
    """获取所有朝代信息"""
    try:
        dynasties = Dynasty.objects.all().order_by('start_year')
        
        # 分页参数
        page = int(request.GET.get('page', 1))
        per_page = int(request.GET.get('per_page', 50))
        
        # 分页处理
        paginator = Paginator(dynasties, per_page)
        page_obj = paginator.get_page(page)
        
        # 构造响应数据
        dynasties_data = []
        for dynasty in page_obj:
            dynasties_data.append({
                'id': dynasty.id,
                'name': dynasty.name,
                'chineseName': dynasty.chinese_name,
                'startYear': dynasty.start_year,
                'endYear': dynasty.end_year,
                'color': dynasty.color,
                'description': dynasty.description,
                'duration': dynasty.duration,
                'eventCount': dynasty.events.count(),
            })
        
        response_data = {
            'success': True,
            'data': dynasties_data,
            'pagination': {
                'current_page': page_obj.number,
                'total_pages': paginator.num_pages,
                'total_items': paginator.count,
                'items_per_page': per_page,
                'has_next': page_obj.has_next(),
                'has_previous': page_obj.has_previous(),
            }
        }
        
        return JsonResponse(response_data)
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@csrf_exempt
@require_http_methods(["GET"])
def events_api(request):
    """获取历史事件列表"""
    try:
        # 查询参数
        year_from = request.GET.get('year_from')
        year_to = request.GET.get('year_to')
        event_type = request.GET.get('type')
        importance = request.GET.get('importance')
        dynasty_id = request.GET.get('dynasty_id')
        search = request.GET.get('search')
        
        # 构建查询
        queryset = HistoricalEvent.objects.all()
        
        if year_from:
            queryset = queryset.filter(year__gte=int(year_from))
        if year_to:
            queryset = queryset.filter(year__lte=int(year_to))
        if event_type:
            queryset = queryset.filter(event_type=event_type)
        if importance:
            queryset = queryset.filter(importance=int(importance))
        if dynasty_id:
            queryset = queryset.filter(dynasty_id=dynasty_id)
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | 
                Q(description__icontains=search)
            )
        
        # 排序
        queryset = queryset.order_by('year', 'importance', 'title')
        
        # 分页参数
        page = int(request.GET.get('page', 1))
        per_page = int(request.GET.get('per_page', 100))
        
        # 分页处理
        paginator = Paginator(queryset, per_page)
        page_obj = paginator.get_page(page)
        
        # 构造响应数据
        events_data = []
        for event in page_obj:
            events_data.append({
                'id': event.id,
                'year': event.year,
                'title': event.title,
                'type': event.event_type,
                'typeDisplay': event.get_event_type_display_name(),
                'importance': event.importance,
                'importanceDisplay': event.get_importance_display_name(),
                'description': event.description or '',
                'dynasty': {
                    'id': event.dynasty.id,
                    'chineseName': event.dynasty.chinese_name,
                    'name': event.dynasty.name
                } if event.dynasty else None,
                'sourceReference': event.source_reference or '',
            })
        
        response_data = {
            'success': True,
            'data': events_data,
            'pagination': {
                'current_page': page_obj.number,
                'total_pages': paginator.num_pages,
                'total_items': paginator.count,
                'items_per_page': per_page,
                'has_next': page_obj.has_next(),
                'has_previous': page_obj.has_previous(),
            }
        }
        
        return JsonResponse(response_data)
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@csrf_exempt
@require_http_methods(["GET"])
def event_detail_api(request, event_id):
    """获取单个历史事件详情"""
    try:
        event = HistoricalEvent.objects.get(id=event_id)
        
        event_data = {
            'id': event.id,
            'year': event.year,
            'title': event.title,
            'type': event.event_type,
            'typeDisplay': event.get_event_type_display_name(),
            'importance': event.importance,
            'importanceDisplay': event.get_importance_display_name(),
            'description': event.description or '',
            'dynasty': {
                'id': event.dynasty.id,
                'chineseName': event.dynasty.chinese_name,
                'name': event.dynasty.name,
                'startYear': event.dynasty.start_year,
                'endYear': event.dynasty.end_year,
            } if event.dynasty else None,
            'sourceReference': event.source_reference or '',
            'createdAt': event.created_at.isoformat(),
            'updatedAt': event.updated_at.isoformat(),
        }
        
        return JsonResponse({
            'success': True,
            'data': event_data
        })
        
    except HistoricalEvent.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': 'Event not found'
        }, status=404)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@csrf_exempt
@require_http_methods(["GET"])
def timeline_data_api(request):
    """获取时间线数据（为前端图表准备）"""
    try:
        # 获取朝代数据
        dynasties = Dynasty.objects.all().order_by('start_year')
        dynasties_data = []
        for dynasty in dynasties:
            dynasties_data.append({
                'id': dynasty.id,
                'name': dynasty.chinese_name,
                'startYear': dynasty.start_year,
                'endYear': dynasty.end_year,
                'color': dynasty.color,
                'power': get_dynasty_power(dynasty),
            })
        
        # 获取历史事件数据
        events = HistoricalEvent.objects.filter(importance__in=[1, 2, 3]).order_by('year', 'importance')
        events_data = []
        for event in events:
            events_data.append({
                'id': event.id,
                'year': event.year,
                'title': event.title,
                'type': event.event_type,
                'importance': event.importance,
                'dynastyId': event.dynasty.id if event.dynasty else None,
            })
        
        return JsonResponse({
            'success': True,
            'data': {
                'dynasties': dynasties_data,
                'events': events_data,
                'stats': {
                    'totalDynasties': len(dynasties_data),
                    'totalEvents': len(events_data),
                    'eventTypes': get_event_type_stats(),
                    'importanceStats': get_importance_stats(),
                }
            }
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


def get_dynasty_power(dynasty):
    """计算朝代影响力（用于时间线图表）"""
    duration = dynasty.duration
    weight = 50
    
    # 重要朝代权重
    important_dynasties = ['tang', 'han_west', 'han_east', 'qing', 'yuan', 'prc', 'ming']
    if dynasty.id in important_dynasties:
        weight = 90
    elif dynasty.id in ['song', 'sui']:
        weight = 70
    elif dynasty.id in ['qin', 'shang', 'zhou_west', 'zhou_east']:
        weight = 60
    
    return min(weight, max(10, duration // 10 + weight // 2))


def get_event_type_stats():
    """获取事件类型统计"""
    stats = {}
    for event_type, display_name in HistoricalEvent.EVENT_TYPES:
        count = HistoricalEvent.objects.filter(event_type=event_type).count()
        stats[event_type] = {
            'display': display_name,
            'count': count
        }
    return stats


def get_importance_stats():
    """获取重要性统计"""
    stats = {}
    for importance, display_name in HistoricalEvent.IMPORTANCE_LEVELS:
        count = HistoricalEvent.objects.filter(importance=importance).count()
        stats[importance] = {
            'display': display_name,
            'count': count
        }
    return stats


@csrf_exempt
@require_http_methods(["GET"])
def river_pins_api(request):
    """获取播客轨道 pins"""
    try:
        # 支持按 job_id 过滤
        job_id = request.GET.get('job_id')
        if job_id:
            pins = RiverPin.objects.filter(job_id=job_id).order_by('year')
        else:
            pins = RiverPin.objects.all().order_by('year')
        
        pins_data = []
        for pin in pins:
            pins_data.append({
                'year': pin.year,
                'jobId': pin.job_id,
                'title': pin.title,
                'doubanRating': float(pin.douban_rating) if pin.douban_rating else None,
            })
        return JsonResponse({
            'success': True,
            'data': pins_data
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@csrf_exempt
@require_http_methods(["GET"])
def health_check_api(request):
    """健康检查接口"""
    try:
        dynasty_count = Dynasty.objects.count()
        event_count = HistoricalEvent.objects.count()
        
        return JsonResponse({
            'success': True,
            'status': 'healthy',
            'data': {
                'dynasty_count': dynasty_count,
                'event_count': event_count,
                'version': '1.0.0'
            }
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'status': 'unhealthy',
            'error': str(e)
        }, status=500)