import { Menu } from 'lucide-react'
import { useState } from 'react'
import type { ReactNode } from 'react'
import Sidebar from '../components/Sidebar'

interface MainLayoutProps {
    children: ReactNode
}

function MainLayout({ children }: MainLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false)

    return (
        <div className="min-h-screen bg-slate-50">
            <Sidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            {/* Barra superior móvil */}
            <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
                <div className="flex items-center gap-3">
                    <img
                        src="/brand/cloudedtech-icon.svg"
                        alt="CloudEdTech"
                        className="h-9 w-10 object-contain"
                    />

                    <div>
                        <h1 className="text-base font-bold leading-none text-slate-900">
                            <span>Cloud</span>
                            <span className="text-[#FF7400]">Ed</span>
                            <span>Tech</span>
                        </h1>

                        <p className="mt-1 text-[8px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                            Education &amp; Technology
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => setSidebarOpen(true)}
                    aria-label="Abrir menú"
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                    <Menu size={21} />
                </button>
            </header>

            <main className="min-h-screen min-w-0 p-4 sm:p-6 lg:ml-64 lg:p-8">
                <div className="mx-auto w-full min-w-0">
                    {children}
                </div>
            </main>
        </div>
    )
}

export default MainLayout