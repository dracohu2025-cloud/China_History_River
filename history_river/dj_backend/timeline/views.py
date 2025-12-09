from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
import json
from .models import RiverPin

@require_http_methods(["GET"])
def river_pins_list(request):
    """获取所有river pins，按年份排序"""
    pins = RiverPin.objects.all().order_by('year')
    
    data = [
        {
            'id': pin.id,
            'job_id': pin.job_id,
            'title': pin.title,
            'year': pin.year,
            'created_at': pin.created_at.isoformat() if pin.created_at else None,
        }
        for pin in pins
    ]
    
    return JsonResponse({
        'count': len(data),
        'results': data
    }, safe=False)
