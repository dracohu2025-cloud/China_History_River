import React, { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = (url && key) ? createClient(url, key) : null

interface PinRow {
    id: string
    job_id: string
    title: string
    year: number
    douban_rating?: number
    created_at?: string
}

const Pins: React.FC = () => {
    const [rows, setRows] = useState<PinRow[]>([])
    const [formData, setFormData] = useState<{ job_id: string, title: string, year: number, douban_rating: string }>({
        job_id: '', title: '', year: 1900, douban_rating: ''
    })
    const [loading, setLoading] = useState(false)

    const refresh = async () => {
        if (!supabase) return
        const { data } = await supabase.from('river_pins').select('*').order('year', { ascending: true })
        setRows(data || [])
    }

    useEffect(() => { refresh() }, [])

    const add = async () => {
        if (!supabase) return
        setLoading(true)
        await supabase.from('river_pins').insert({
            job_id: formData.job_id.trim(),
            title: formData.title.trim(),
            year: formData.year,
            douban_rating: formData.douban_rating ? parseFloat(formData.douban_rating) : null
        })
        setFormData({ job_id: '', title: '', year: 1900, douban_rating: '' })
        setLoading(false)
        refresh()
    }

    const remove = async (id: string) => {
        if (!supabase || !window.confirm('确定删除吗？')) return
        await supabase.from('river_pins').delete().eq('id', id)
        refresh()
    }

    return (
        <div className="space-y-6">
            <div className="bg-white p-4 rounded shadow mb-6">
                <h3 className="text-lg font-bold mb-4">添加播客锚点</h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">任务ID (Job ID)</label>
                        <input value={formData.job_id} onChange={e => setFormData({ ...formData, job_id: e.target.value })} placeholder="UUID" className="border w-full px-3 py-2 rounded" />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">书籍/播客名称</label>
                        <input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Title" className="border w-full px-3 py-2 rounded" />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">年份</label>
                        <input type="number" value={formData.year} onChange={e => setFormData({ ...formData, year: Number(e.target.value) })} placeholder="Year" className="border w-full px-3 py-2 rounded" />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">豆瓣评分 (Optional)</label>
                        <input type="number" step="0.1" value={formData.douban_rating} onChange={e => setFormData({ ...formData, douban_rating: e.target.value })} placeholder="8.5" className="border w-full px-3 py-2 rounded" />
                    </div>
                    <button disabled={loading} onClick={add} className="bg-amber-600 hover:bg-amber-700 text-white rounded px-4 py-2 font-medium h-10">{loading ? '保存中...' : '保存'}</button>
                </div>
            </div>

            <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-stone-100 text-stone-700">
                            <th className="px-3 py-2 text-left">年份</th>
                            <th className="px-3 py-2 text-left">书籍名称</th>
                            <th className="px-3 py-2 text-left">任务ID</th>
                            <th className="px-3 py-2 text-left">评分</th>
                            <th className="px-3 py-2 text-center">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map(r => (
                            <tr key={r.id} className="border-t hover:bg-stone-50">
                                <td className="px-3 py-2">{r.year}</td>
                                <td className="px-3 py-2 font-medium">{r.title}</td>
                                <td className="px-3 py-2 font-mono text-xs text-stone-500">{r.job_id}</td>
                                <td className="px-3 py-2 text-xs">{r.douban_rating || '-'}</td>
                                <td className="px-3 py-2 text-center">
                                    <button className="text-red-600 hover:underline" onClick={() => remove(r.id)}>删除</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default Pins
