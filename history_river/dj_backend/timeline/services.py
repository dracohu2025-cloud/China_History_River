"""
Integration services for external APIs
Currently supporting OpenRouter/DeepSeek for AI content generation
"""

import os
import requests
from django.conf import settings
from .models import EventCache

def fetch_from_deepseek(year: int, context: str) -> str:
    """
    Fetch historical event/year details from OpenRouter API using DeepSeek model
    
    Args:
        year: Historical year (negative for BCE)
        context: Query context describing the event or year
        
    Returns:
        Text content from DeepSeek API
        
    Raises:
        Exception: If API call fails or returns error
    """
    
    # Get API key from Django settings or environment
    api_key = os.environ.get('OPENROUTER_API_KEY') or \
              os.environ.get('OpenRouter_API_KEY')
    
    if not api_key:
        raise Exception("OpenRouter API Key not configured. Set OPENROUTER_API_KEY environment variable.")
    
    # Construct prompt for DeepSeek
    prompt = f"""你是一位精通中国历史的专家。请用简体中文为这一年的历史事件提供一个引人入胜的简短总结（约150字）。
用户交互上下文: "{context}". 年份: {year}.
如果该年份没有特别明确的单一重大事件，请描述当时的时代背景、文化风貌或正在发生的长期历史进程。侧重于文化、政治或军事意义。
请直接输出纯文本，分段落显示，不要使用 Markdown 标题。"""
    
    try:
        response = requests.post(
            'https://openrouter.ai/api/v1/chat/completions',
            headers={
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json'
            },
            json={
                'model': 'deepseek/deepseek-v3.2-exp',
                'messages': [
                    {
                        'role': 'system',
                        'content': '你是中国史专家，输出简体中文的简短文本。'
                    },
                    {
                        'role': 'user',
                        'content': prompt
                    }
                ]
            },
            timeout=30  # 30 second timeout
        )
        
        if response.status_code != 200:
            error_msg = f"OpenRouter API error: {response.status_code}"
            try:
                error_data = response.json()
                error_msg += f" - {error_data}"
            except:
                error_msg += f" - {response.text}"
            raise Exception(error_msg)
        
        data = response.json()
        
        # Extract text from response
        content = data.get('choices', [{}])[0].get('message', {}).get('content', '暂无详细信息。')
        
        if not content or content.strip() == '':
            content = '暂无详细信息。'
        
        return content
        
    except requests.RequestException as e:
        raise Exception(f"Network error calling OpenRouter API: {str(e)}")
    except Exception as e:
        raise Exception(f"Error processing OpenRouter response: {str(e)}")
