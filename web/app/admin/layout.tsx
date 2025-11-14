/**
 * Admin Layout
 * Layout wrapper for admin pages with sidebar navigation
 */

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'

interface AdminLayoutProps {
  children: ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname()

  const navItems = [
    {
      title: 'Dashboard',
      href: '/admin',
      icon: '📊'
    },
    {
      title: 'Courses',
      href: '/admin/courses',
      icon: '📚'
    },
    {
      title: 'Students',
      href: '/admin/students',
      icon: '👥'
    },
    {
      title: 'Import Students',
      href: '/admin/students/import',
      icon: '📥'
    },
    {
      title: 'Teachers',
      href: '/admin/teachers',
      icon: '👨‍🏫'
    },
    {
      title: 'Reports',
      href: '/admin/reports',
      icon: '📈'
    },
    {
      title: 'Settings',
      href: '/admin/settings',
      icon: '⚙️'
    }
  ]

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 fixed h-full overflow-y-auto">
        <div className="p-6">
          <Link href="/" className="text-2xl font-bold text-blue-600">
            BH EDU Admin
          </Link>
        </div>

        <nav className="px-4 pb-6">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.title}</span>
              </Link>
            )
          })}
        </nav>

        <div className="px-4 py-4 border-t border-gray-200 absolute bottom-0 w-64 bg-white">
          <Link
            href="/"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm"
          >
            <span>←</span>
            <span>Back to Site</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64">
        {children}
      </main>
    </div>
  )
}
