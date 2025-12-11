import React, { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = (url && key) ? createClient(url, key) : null

interface HistoricalEvent {
    id: number
    year: number
    title: string
    event_type: string
    importance: number
    dynasty_id: string
    description?: string
    source_reference?: string
}

interface DynastyOption {
    id: string
    chinese_name: string
}

const Events: React.FC = () => {
    const [rows, setRows] = useState<HistoricalEvent[]>([])
    const [dynasties, setDynasties] = useState<DynastyOption[]>([])
    const [loading, setLoading] = useState(false)
    const [editingId, setEditingId] = useState<number | null>(null)
    const [totalCount, setTotalCount] = useState(0)

    // Pagination
    const [page, setPage] = useState(0)
    const pageSize = 50

    // Form State
    const [formData, setFormData] = useState<Omit<HistoricalEvent, 'id'>>({
        year: 0, title: '', event_type: 'politics', importance: 3, dynasty_id: '', description: '', source_reference: ''
    })

    const fetchDynasties = async () => {
        if (!supabase) return
        const { data } = await supabase.from('dynasties').select('id, chinese_name').order('start_year')
        setDynasties(data || [])
    }

    const refresh = async () => {
        if (!supabase) return
        const { data, count } = await supabase
            .from('historical_events')
            .select('*', { count: 'exact' })
            .order('year', { ascending: true })
            .range(page * pageSize, (page + 1) * pageSize - 1)

        setRows(data || [])
        setTotalCount(count || 0)
    }

    useEffect(() => { fetchDynasties() }, [])
    useEffect(() => { refresh() }, [page])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!supabase) return
        setLoading(true)

        // Handle empty string for dynasty_id -> NULL in simpler way (or let supabase handle if nullable)
        const payload = { ...formData, dynasty_id: formData.dynasty_id || null }

        if (editingId) {
            await supabase.from('historical_events').update(payload).eq('id', editingId)
        } else {
            await supabase.from('historical_events').insert(payload)
        }

        setLoading(false)
        setEditingId(null)
        setFormData({ year: 0, title: '', event_type: 'politics', importance: 3, dynasty_id: '', description: '', source_reference: '' })
        refresh()
    }

    const handleEdit = (item: HistoricalEvent) => {
        setEditingId(item.id)
        setFormData({
            year: item.year,
            title: item.title,
            event_type: item.event_type,
            importance: item.importance,
            dynasty_id: item.dynasty_id || '',
            description: item.description || '',
            source_reference: item.source_reference || ''
        })
    }

    const handleDelete = async (id: number) => {
        if (!supabase || !window.confirm('确定删除吗？')) return
        await supabase.from('historical_events').delete().eq('id', id)
        refresh()
    }

    return (
        <div className="space-y-6">
            <div className="bg-white p-4 rounded shadow">
                <h3 className="text-lg font-bold mb-4">{editingId ? '编辑事件' : '添加事件'}</h3>
                <form onSubmit={handleSubmit} className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="md:col-span-1">
                        <label className="block text-sm text-gray-600">年份</label>
                        <input type="number" className="border w-full p-2 rounded" value={formData.year} onChange={e => setFormData({ ...formData, year: parseInt(e.target.value) })} required />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm text-gray-600">标题</label>
                        <input className="border w-full p-2 rounded" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600">重要性 (1-5, 1最高)</label>
                        <select className="border w-full p-2 rounded" value={formData.importance} onChange={e => setFormData({ ...formData, importance: parseInt(e.target.value) })}>
                            {[1, 2, 3, 4, 5].map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600">类型</label>
                        <select className="border w-full p-2 rounded" value={formData.event_type} onChange={e => setFormData({ ...formData, event_type: e.target.value })}>
                            <option value="politics">政治</option>
                            <option value="war">战争</option>
                            <option value="culture">文化</option>
                            <option value="science">科技</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600">所属朝代</label>
                        <select className="border w-full p-2 rounded" value={formData.dynasty_id} onChange={e => setFormData({ ...formData, dynasty_id: e.target.value })}>
                            <option value="">-- 无/未知 --</option>
                            {dynasties.map(d => <option key={d.id} value={d.id}>{d.chinese_name}</option>)}
                        </select>
                    </div>
                    <div className="md:col-span-4">
                        <label className="block text-sm text-gray-600">描述</label>
                        <textarea className="border w-full p-2 rounded" rows={2} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                    </div>

                    <div className="md:col-span-4 flex gap-2">
                        <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                            {loading ? '保存中...' : '保存'}
                        </button>
                        {editingId && (
                            <button type="button" onClick={() => { setEditingId(null); setFormData({ year: 0, title: '', event_type: 'politics', importance: 3, dynasty_id: '', description: '', source_reference: '' }) }} className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500">
                                取消
                            </button>
                        )}
                    </div>
                </form>
            </div>

            <div className="bg-white rounded shadow overflow-hidden">
                <div className="p-2 border-b flex justify-between items-center bg-gray-50">
                    <h4 className="font-semibold text-gray-700">列表 (分页显示)</h4>
                    <div className="space-x-2">
                        <button disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))} className="text-blue-600 disabled:text-gray-400">上一页</button>
                        <span>第 {page + 1} / {Math.ceil(totalCount / pageSize)} 页</span>
                        <button disabled={(page + 1) * pageSize >= totalCount} onClick={() => setPage(p => p + 1)} className="text-blue-600 disabled:text-gray-400">下一页</button>
                    </div>
                </div>
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-100 text-gray-700">
                        <tr>
                            <th className="p-3">年份</th>
                            <th className="p-3">标题</th>
                            <th className="p-3">类型</th>
                            <th className="p-3">重要性</th>
                            <th className="p-3">朝代</th>
                            <th className="p-3">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map(row => (
                            <tr key={row.id} className="border-t hover:bg-gray-50">
                                <td className="p-3">{row.year}</td>
                                <td className="p-3 font-medium">{row.title}</td>
                                <td className="p-3">
                                    <span className={`px-2 py-0.5 rounded text-xs ${row.event_type === 'war' ? 'bg-red-100 text-red-800' :
                                        row.event_type === 'culture' ? 'bg-purple-100 text-purple-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                        {row.event_type === 'politics' ? '政治' : row.event_type === 'war' ? '战争' : row.event_type === 'culture' ? '文化' : '科技'}
                                    </span>
                                </td>
                                <td className="p-3 text-center">{row.importance}</td>
                                <td className="p-3 text-gray-500">{row.dynasty_id}</td>
                                <td className="p-3 flex gap-2">
                                    <button onClick={() => handleEdit(row)} className="text-blue-600 hover:underline">编辑</button>
                                    <button onClick={() => handleDelete(row.id)} className="text-red-600 hover:underline">删除</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {/* Bottom Pagination */}
                <div className="p-3 border-t flex justify-between items-center bg-gray-50">
                    <span className="text-xs text-gray-500">共 {totalCount} 条记录</span>
                    <div className="space-x-2 text-sm">
                        <button disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))} className="text-blue-600 disabled:text-gray-400">上一页</button>
                        <span>第 {page + 1} / {Math.ceil(totalCount / pageSize)} 页</span>
                        <button disabled={(page + 1) * pageSize >= totalCount} onClick={() => setPage(p => p + 1)} className="text-blue-600 disabled:text-gray-400">下一页</button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Events
