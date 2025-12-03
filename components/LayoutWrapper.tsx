'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Sidebar } from './Sidebar'

interface LayoutWrapperProps {
  children: React.ReactNode
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const pathname = usePathname()

  // Don't show sidebar on landing page or auth pages
  const hideSidebar = pathname === '/landing' || pathname?.startsWith('/auth')

  // Load sidebar state from localStorage
  useEffect(() => {
    if (!hideSidebar) {
      const saved = localStorage.getItem('sidebarCollapsed')
      if (saved !== null) {
        setIsSidebarCollapsed(JSON.parse(saved))
      }
    }
  }, [hideSidebar])

  // Save sidebar state to localStorage
  const toggleSidebar = () => {
    const newState = !isSidebarCollapsed
    setIsSidebarCollapsed(newState)
    localStorage.setItem('sidebarCollapsed', JSON.stringify(newState))
  }

  if (hideSidebar) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen bg-dark-950">
      <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
      <main
        className={`flex-1 transition-all duration-300 ${
          isSidebarCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        {children}
      </main>
    </div>
  )
}
