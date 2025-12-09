export const fetchEventDetails = async (
  year: number,
  context: string,
  eventTitle?: string
): Promise<string> => {
  try {
    // FIX: 修正 API 路径，使用 /timeline-api 前缀以确保被正确代理到 Django (端口8000)
    // 原路径 /api/timeline/api/event-details/ 会被代理到 Express (端口4000)，导致 403 错误
    // 新路径 /timeline-api/api/event-details/ 会被正确代理到 Django

    const base = process.env.NEXT_PUBLIC_API_BASE || ''
    const prefix = base ? base.replace(/\/$/, '') : ''
    const url = `${prefix}/api/event-details` // Updated to Vercel API route

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        year,
        context,
        event_title: eventTitle || ''
      })
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(errorData.error || `API error: ${res.status}`)
    }

    const data = await res.json()

    // Return content text
    if (!data.text) {
      throw new Error('No text in response')
    }

    return data.text

  } catch (error) {
    console.error('Error fetching event details:', error)

    // Try to provide helpful error messages
    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch')) {
        return '无法连接到后端服务。请确保Django服务器在运行 (端口8000)。'
      }
      return `获取历史数据时出错: ${error.message}`
    }

    return '获取历史数据时出错，请稍后再试。'
  }
};