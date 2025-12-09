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
  created_at?: string
}

const AdminPins: React.FC = () => {
  const [rows, setRows] = useState<PinRow[]>([])
  const [jobId, setJobId] = useState('')
  const [title, setTitle] = useState('')
  const [year, setYear] = useState<number>(1900)
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
    await supabase.from('river_pins').insert({ job_id: jobId.trim(), title: title.trim(), year })
    setJobId(''); setTitle(''); setYear(1900)
    setLoading(false)
    refresh()
  }

  const remove = async (id: string) => {
    if (!supabase) return
    await supabase.from('river_pins').delete().eq('id', id)
    refresh()
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <header className="sticky top-0 z-20 bg-[#0f172a] text-white border-b border-[#0b1220]">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="font-semibold">播客轨道管理</div>
          <button className="text-stone-300 hover:text-white" onClick={() => { window.location.href = '/' }}>← 返回</button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-6">
        <div className="bg-white border border-stone-200 rounded-xl p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input value={jobId} onChange={e => setJobId(e.target.value)} placeholder="任务ID" className="border rounded px-3 py-2" />
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="书籍名称" className="border rounded px-3 py-2" />
            <input type="number" value={year} onChange={e => setYear(Number(e.target.value))} placeholder="年份" className="border rounded px-3 py-2" />
            <button disabled={loading} onClick={add} className="bg-amber-600 hover:bg-amber-700 text-white rounded px-4">{loading ? '保存中...' : '保存'}</button>
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-100 text-stone-700">
                <th className="px-3 py-2 text-left">年份</th>
                <th className="px-3 py-2 text-left">书籍名称</th>
                <th className="px-3 py-2 text-left">任务ID</th>
                <th className="px-3 py-2">操作</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-t">
                  <td className="px-3 py-2">{r.year}</td>
                  <td className="px-3 py-2">{r.title}</td>
                  <td className="px-3 py-2 font-mono text-xs">{r.job_id}</td>
                  <td className="px-3 py-2 text-center">
                    <button className="text-red-600 hover:underline" onClick={() => remove(r.id)}>删除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}

export default AdminPins

