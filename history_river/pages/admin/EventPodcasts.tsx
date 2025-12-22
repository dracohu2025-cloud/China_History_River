import React, { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { KEY_EVENTS } from '../../data/historyData'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = (url && key) ? createClient(url, key) : null

interface EventPodcastRow {
    id: string
    event_year: number
    event_title: string
    podcast_uuid: string
    book_title: string
    douban_rating?: number
    created_at?: string
}

const EventPodcasts: React.FC = () => {
    const [rows, setRows] = useState<EventPodcastRow[]>([])
    const [formData, setFormData] = useState<{
        event_year: number
        event_title: string
        podcast_uuid: string
        book_title: string
        douban_rating: string
    }>({
        event_year: 755,
        event_title: '',
        podcast_uuid: '',
        book_title: '',
        douban_rating: ''
    })
    const [editingId, setEditingId] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')

    // Get unique events from KEY_EVENTS, sorted by year
    const uniqueEvents = React.useMemo(() => {
        const seen = new Set<string>()
        return KEY_EVENTS
            .filter(e => {
                const key = `${e.year}:${e.title}`
                if (seen.has(key)) return false
                seen.add(key)
                return true
            })
            .sort((a, b) => a.year - b.year)
    }, [])

    // Filter events by search query
    const filteredEvents = React.useMemo(() => {
        if (!searchQuery.trim()) return uniqueEvents
        const q = searchQuery.toLowerCase()
        return uniqueEvents.filter(e =>
            e.title.toLowerCase().includes(q) ||
            e.titleEn?.toLowerCase().includes(q) ||
            String(e.year).includes(q)
        )
    }, [searchQuery, uniqueEvents])

    const refresh = async () => {
        if (!supabase) return
        const { data } = await supabase
            .from('event_podcasts')
            .select('*')
            .order('event_year', { ascending: true })
        setRows(data || [])
    }

    useEffect(() => { refresh() }, [])

    const save = async () => {
        if (!supabase) return
        if (!formData.event_title || !formData.podcast_uuid || !formData.book_title) {
            alert('请填写完整信息：事件、播客UUID、书名')
            return
        }

        setLoading(true)

        const payload = {
            event_year: formData.event_year,
            event_title: formData.event_title.trim(),
            podcast_uuid: formData.podcast_uuid.trim(),
            book_title: formData.book_title.trim(),
            douban_rating: formData.douban_rating ? parseFloat(formData.douban_rating) : null
        }

        if (editingId) {
            await supabase.from('event_podcasts').update(payload).eq('id', editingId)
        } else {
            await supabase.from('event_podcasts').insert(payload)
        }

        resetForm()
        setLoading(false)
        refresh()
    }

    const startEdit = (row: EventPodcastRow) => {
        setEditingId(row.id)
        setFormData({
            event_year: row.event_year,
            event_title: row.event_title,
            podcast_uuid: row.podcast_uuid,
            book_title: row.book_title,
            douban_rating: row.douban_rating ? String(row.douban_rating) : ''
        })
    }

    const resetForm = () => {
        setEditingId(null)
        setFormData({
            event_year: 755,
            event_title: '',
            podcast_uuid: '',
            book_title: '',
            douban_rating: ''
        })
        setSearchQuery('')
    }

    const remove = async (id: string) => {
        if (!supabase || !window.confirm('确定删除吗？')) return
        await supabase.from('event_podcasts').delete().eq('id', id)
        refresh()
    }

    const selectEvent = (event: { year: number; title: string }) => {
        setFormData({
            ...formData,
            event_year: event.year,
            event_title: event.title
        })
        setSearchQuery('')
    }

    const formatYear = (year: number) => {
        return year < 0 ? `公元前${Math.abs(year)}年` : `公元${year}年`
    }

    return (
        <div className="space-y-6">
            {/* Form */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-stone-200">
                <h3 className="text-lg font-bold mb-4 text-stone-800">
                    {editingId ? '编辑事件播客' : '添加事件播客'}
                </h3>

                {/* Event Selector */}
                <div className="mb-4">
                    <label className="block text-xs font-medium text-stone-500 mb-2">选择历史事件</label>
                    <div className="relative">
                        <input
                            type="text"
                            value={formData.event_title ? `${formatYear(formData.event_year)} - ${formData.event_title}` : searchQuery}
                            onChange={e => {
                                setSearchQuery(e.target.value)
                                if (formData.event_title) {
                                    setFormData({ ...formData, event_title: '' })
                                }
                            }}
                            placeholder="搜索事件（输入年份或事件名称）..."
                            className="border border-stone-300 w-full px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        />
                        {formData.event_title && (
                            <button
                                onClick={() => setFormData({ ...formData, event_title: '', event_year: 755 })}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    {/* Event Dropdown */}
                    {searchQuery && !formData.event_title && (
                        <div className="mt-1 max-h-48 overflow-y-auto border border-stone-200 rounded-lg bg-white shadow-lg">
                            {filteredEvents.slice(0, 20).map(event => (
                                <button
                                    key={`${event.year}-${event.title}`}
                                    onClick={() => selectEvent(event)}
                                    className="w-full text-left px-4 py-2 hover:bg-amber-50 border-b border-stone-100 last:border-b-0"
                                >
                                    <span className="text-amber-600 font-medium">{formatYear(event.year)}</span>
                                    <span className="mx-2 text-stone-300">|</span>
                                    <span className="text-stone-700">{event.title}</span>
                                    {event.titleEn && (
                                        <span className="text-stone-400 text-sm ml-2">({event.titleEn})</span>
                                    )}
                                </button>
                            ))}
                            {filteredEvents.length === 0 && (
                                <div className="px-4 py-3 text-stone-400 text-center">未找到匹配的事件</div>
                            )}
                            {filteredEvents.length > 20 && (
                                <div className="px-4 py-2 text-stone-400 text-sm text-center border-t">
                                    还有 {filteredEvents.length - 20} 个结果，请输入更精确的关键词
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Other Fields */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-xs font-medium text-stone-500 mb-1">播客UUID</label>
                        <input
                            value={formData.podcast_uuid}
                            onChange={e => setFormData({ ...formData, podcast_uuid: e.target.value })}
                            placeholder="e.g. 16ec7d2c-cd25-..."
                            className="border border-stone-300 w-full px-3 py-2 rounded-lg font-mono text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-stone-500 mb-1">书名</label>
                        <input
                            value={formData.book_title}
                            onChange={e => setFormData({ ...formData, book_title: e.target.value })}
                            placeholder="书籍名称"
                            className="border border-stone-300 w-full px-3 py-2 rounded-lg"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-stone-500 mb-1">豆瓣评分</label>
                        <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="10"
                            value={formData.douban_rating}
                            onChange={e => setFormData({ ...formData, douban_rating: e.target.value })}
                            placeholder="8.5"
                            className="border border-stone-300 w-full px-3 py-2 rounded-lg"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            disabled={loading}
                            onClick={save}
                            className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 text-white rounded-lg px-4 py-2 font-medium transition-colors"
                        >
                            {loading ? '保存中...' : (editingId ? '更新' : '添加')}
                        </button>
                        {editingId && (
                            <button
                                onClick={resetForm}
                                className="bg-stone-200 hover:bg-stone-300 text-stone-700 rounded-lg px-4 py-2 font-medium transition-colors"
                            >
                                取消
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
                <div className="px-4 py-3 bg-stone-50 border-b border-stone-200">
                    <h4 className="font-semibold text-stone-700">已配置的事件播客 ({rows.length})</h4>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-stone-100 text-stone-600">
                                <th className="px-4 py-3 text-left font-medium">年份</th>
                                <th className="px-4 py-3 text-left font-medium">历史事件</th>
                                <th className="px-4 py-3 text-left font-medium">书名</th>
                                <th className="px-4 py-3 text-left font-medium">评分</th>
                                <th className="px-4 py-3 text-left font-medium">播客UUID</th>
                                <th className="px-4 py-3 text-center font-medium">操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-stone-400">
                                        暂无数据，请添加事件播客
                                    </td>
                                </tr>
                            ) : rows.map(r => (
                                <tr key={r.id} className={`border-t border-stone-100 hover:bg-stone-50 transition-colors ${editingId === r.id ? 'bg-amber-50' : ''}`}>
                                    <td className="px-4 py-3 font-medium text-amber-600">
                                        {formatYear(r.event_year)}
                                    </td>
                                    <td className="px-4 py-3 text-stone-800">{r.event_title}</td>
                                    <td className="px-4 py-3 font-medium text-stone-700">{r.book_title}</td>
                                    <td className="px-4 py-3">
                                        {r.douban_rating ? (
                                            <span className="inline-flex items-center gap-1 text-green-600">
                                                <span className="text-yellow-500">★</span>
                                                {r.douban_rating}
                                            </span>
                                        ) : (
                                            <span className="text-stone-300">-</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 font-mono text-xs text-stone-400 max-w-[200px] truncate">
                                        {r.podcast_uuid}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <button
                                            className="text-blue-600 hover:text-blue-800 hover:underline mr-4"
                                            onClick={() => startEdit(r)}
                                        >
                                            编辑
                                        </button>
                                        <button
                                            className="text-red-600 hover:text-red-800 hover:underline"
                                            onClick={() => remove(r.id)}
                                        >
                                            删除
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

export default EventPodcasts
