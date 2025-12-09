"use client"
import React from 'react'
import nextDynamic from 'next/dynamic'

const App = nextDynamic(() => import('../App'), { ssr: false })

export default function Page() { return <App /> }