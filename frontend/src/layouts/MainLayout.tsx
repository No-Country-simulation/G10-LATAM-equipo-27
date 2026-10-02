import type { ReactNode } from 'react'
import Sidebar from '../components/Sidebar'

interface MainLayoutProps {
    children: ReactNode
}

function MainLayout({ children }: MainLayoutProps) {
    return (
        <div className="min-h-screen bg-slate-50">
            <Sidebar />

            <main className="ml-64 min-h-screen p-8">
                {children}
            </main>
        </div>
    )
}

export default MainLayout