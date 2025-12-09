"""
API views for EventCache operations
Handles fetching event/year details with caching
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
import hashlib
from .models import EventCache
from .services import fetch_from_deepseek
import logging

logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([AllowAny])
def get_event_details(request):
    """
    Get event or year details with caching
    
    POST data:
    - year: int, required
    - event_title: str, optional (if specific event)
    - context: str, optional (query context)
    
    Returns:
    - text: str (cached or freshly fetched content)
    - cached: bool (whether it was from cache)
    
    Status codes:
    - 200: Success
    - 400: Missing required parameters
    - 500: Server error (API failure)
    """
    try:
        # Validate input
        data = request.data
        if not data:
            return Response(
                {'error': 'No data provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        year = data.get('year')
        if year is None:
            return Response(
                {'error': 'Missing required parameter: year'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Ensure year is integer
        try:
            year = int(year)
        except (ValueError, TypeError):
            return Response(
                {'error': 'Invalid year format, must be integer'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get optional parameters
        event_title = data.get('event_title', '')
        context = data.get('context', '')
        
        # Generate UUID for cache lookup
        title = event_title or '__year__'
        uuid = hashlib.sha256(f"{title}|{year}".encode()).hexdigest()
        
        # Try cache first
        try:
            cache_entry = EventCache.objects.get(uuid=uuid, is_deleted=False)
            logger.info(f"Cache hit for {uuid} ({year}: {event_title})")
            
            return Response({
                'text': cache_entry.content,
                'cached': True,
                'year': cache_entry.year,
                'event_title': cache_entry.event_title
            })
            
        except EventCache.DoesNotExist:
            logger.info(f"Cache miss for {uuid} ({year}: {event_title}), fetching from DeepSeek")
        
        # Cache miss - fetch from DeepSeek
        try:
            content = fetch_from_deepseek(year, context)
            
            # Save to cache
            cache_entry = EventCache.objects.create(
                uuid=uuid,
                year=year,
                event_title=event_title,
                context=context,
                content=content,
                is_cached=True
            )
            
            logger.info(f"Successfully fetched and cached {uuid}")
            
            return Response({
                'text': content,
                'cached': False,
                'year': year,
                'event_title': event_title
            })
            
        except Exception as e:
            logger.error(f"Error fetching from DeepSeek: {str(e)}")
            return Response(
                {'error': f'Failed to fetch from DeepSeek API: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    except Exception as e:
        logger.error(f"Unexpected error in get_event_details: {str(e)}")
        return Response(
            {'error': f'Internal server error: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
