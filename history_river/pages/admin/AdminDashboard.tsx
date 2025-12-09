import React, { useState, useEffect } from 'react'
import Login from './Login'
import Dynasties from './Dynasties'
import Events from './Events'
import Pins from './Pins'
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = (url && key) ? createClient(url, key) : null

const AdminDashboard: React.FC = () => {
    const [session, setSession] = useState<any>(null)
    const [tab, setTab] = useState<'dynasties' | 'events' | 'pins'>('dynasties')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (supabase) {
            supabase.auth.getSession().then(({ data: { session } }) => {
                setSession(session)
                setLoading(false)
            })

            const {
                data: { subscription },
            } = supabase.auth.onAuthStateChange((_event, session) => {
                setSession(session)
            })

            return () => subscription.unsubscribe()
        } else {
            setLoading(false)
        }
    }, [])

    if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>

    if (!session) {
        return <Login onLogin={() => { }} /> // Login component handles auth state update via Supabase listener
    }

    const handleLogout = async () => {
        await supabase?.auth.signOut()
    }

    return (
        <div className="min-h-screen bg-stone-100 text-stone-900 font-sans">
            {/* Header */}
            <header className="bg-stone-900 text-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-bold tracking-wider">历史长河 <span className="text-amber-500 font-light">管理后台</span></h1>
                        <nav className="flex space-x-2 ml-8">
                            <button onClick={() => setTab('dynasties')} className={`px-3 py-1 rounded-md text-sm font-medium ${tab === 'dynasties' ? 'bg-stone-800 text-white' : 'text-stone-400 hover:text-white hover:bg-stone-800'}`}>朝代管理</button>
                            <button onClick={() => setTab('events')} className={`px-3 py-1 rounded-md text-sm font-medium ${tab === 'events' ? 'bg-stone-800 text-white' : 'text-stone-400 hover:text-white hover:bg-stone-800'}`}>事件管理</button>
                            <button onClick={() => setTab('pins')} className={`px-3 py-1 rounded-md text-sm font-medium ${tab === 'pins' ? 'bg-stone-800 text-white' : 'text-stone-400 hover:text-white hover:bg-stone-800'}`}>播客轨道</button>
                        </nav>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-xs text-stone-400">{session.user.email}</span>
                        <button onClick={handleLogout} className="text-sm text-stone-300 hover:text-white">退出</button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {tab === 'dynasties' && <Dynasties />}
                {tab === 'events' && <Events />}
                {tab === 'pins' && <Pins />}
            </main>
        </div>
    )
}

export default AdminDashboard
