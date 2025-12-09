import React, { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = (url && key) ? createClient(url, key) : null

interface Dynasty {
    id: string
    name: string
    chinese_name: string
    start_year: number
    end_year: number
    color: string
    description?: string
}

const Dynasties: React.FC = () => {
    const [rows, setRows] = useState<Dynasty[]>([])
    const [loading, setLoading] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)

    // Form State
    const [formData, setFormData] = useState<Dynasty>({
        id: '', name: '', chinese_name: '', start_year: 0, end_year: 0, color: '#888888', description: ''
    })

    const refresh = async () => {
        if (!supabase) return
        const { data } = await supabase.from('dynasties').select('*').order('start_year', { ascending: true })
        setRows(data || [])
    }

    useEffect(() => { refresh() }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!supabase) return
        setLoading(true)

        if (editingId) {
            await supabase.from('dynasties').update(formData).eq('id', editingId)
        } else {
            await supabase.from('dynasties').insert(formData)
        }

        setLoading(false)
        setEditingId(null)
        setFormData({ id: '', name: '', chinese_name: '', start_year: 0, end_year: 0, color: '#888888', description: '' })
        refresh()
    }

    const handleEdit = (item: Dynasty) => {
        setEditingId(item.id)
        setFormData(item)
    }

    const handleDelete = async (id: string) => {
        if (!supabase || !window.confirm('确定删除吗？')) return
        await supabase.from('dynasties').delete().eq('id', id)
        refresh()
    }

    return (
        <div className="space-y-6">
            <div className="bg-white p-4 rounded shadow">
                <h3 className="text-lg font-bold mb-4">{editingId ? '编辑朝代' : '添加朝代'}</h3>
                <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm text-gray-600">ID (唯一标识, e.g. tang)</label>
                        <input className="border w-full p-2 rounded" value={formData.id} onChange={e => setFormData({ ...formData, id: e.target.value })} disabled={!!editingId} required />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600">中文名称</label>
                        <input className="border w-full p-2 rounded" value={formData.chinese_name} onChange={e => setFormData({ ...formData, chinese_name: e.target.value })} required />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600">英文名称</label>
                        <input className="border w-full p-2 rounded" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600">颜色</label>
                        <input type="color" className="border w-full h-10 p-1 rounded" value={formData.color} onChange={e => setFormData({ ...formData, color: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600">开始年份</label>
                        <input type="number" className="border w-full p-2 rounded" value={formData.start_year} onChange={e => setFormData({ ...formData, start_year: parseInt(e.target.value) })} required />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600">结束年份</label>
                        <input type="number" className="border w-full p-2 rounded" value={formData.end_year} onChange={e => setFormData({ ...formData, end_year: parseInt(e.target.value) })} required />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-sm text-gray-600">描述</label>
                        <textarea className="border w-full p-2 rounded" rows={3} value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                    </div>
                    <div className="col-span-2 flex gap-2">
                        <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                            {loading ? '保存中...' : '保存'}
                        </button>
                        {editingId && (
                            <button type="button" onClick={() => { setEditingId(null); setFormData({ id: '', name: '', chinese_name: '', start_year: 0, end_year: 0, color: '#888888', description: '' }) }} className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500">
                                取消
                            </button>
                        )}
                    </div>
                </form>
            </div>

            <div className="bg-white rounded shadow overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-100 text-gray-700">
                        <tr>
                            <th className="p-3">ID</th>
                            <th className="p-3">名称</th>
                            <th className="p-3">年份</th>
                            <th className="p-3">颜色</th>
                            <th className="p-3">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map(row => (
                            <tr key={row.id} className="border-t hover:bg-gray-50">
                                <td className="p-3">{row.id}</td>
                                <td className="p-3">{row.chinese_name} ({row.name})</td>
                                <td className="p-3">{row.start_year} - {row.end_year}</td>
                                <td className="p-3"><div className="w-6 h-6 rounded" style={{ backgroundColor: row.color }}></div></td>
                                <td className="p-3 flex gap-2">
                                    <button onClick={() => handleEdit(row)} className="text-blue-600 hover:underline">编辑</button>
                                    <button onClick={() => handleDelete(row.id)} className="text-red-600 hover:underline">删除</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default Dynasties
