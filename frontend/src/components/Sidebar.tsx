import {
    BarChart3,
    CheckCircle,
    FileText,
    Home,
    MessageSquare,
    Settings,
    ShieldCheck,
    Star,
    WandSparkles,
    LogOut,
    Hash,
    Users,
    CalendarDays,
    Download,
    FileClock,
    CloudUpload,
    X,
} from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { clearSession, getUser } from '../api/session'

interface SidebarItemProps {
    to: string
    icon: ReactNode
    label: string
    onNavigate?: () => void
}

interface SidebarProps {
    isOpen?: boolean
    onClose?: () => void
}

function SidebarItem({
    to,
    icon,
    label,
    onNavigate,
}: SidebarItemProps) {
    return (
        <NavLink
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
                `flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition ${
                    isActive
                        ? 'bg-orange-500 text-white'
                        : 'text-slate-300 hover:bg-slate-800'
                }`
            }
        >
            <span className="shrink-0">
                {icon}
            </span>

            <span className="min-w-0">
                {label}
            </span>
        </NavLink>
    )
}

function Sidebar({
    isOpen = false,
    onClose,
}: SidebarProps) {
    const navigate = useNavigate()
    const user = getUser()

    const isCommunityManager =
        user?.role === 'community_manager'

    const roleLabels: Record<string, string> = {
        admin: 'Administrador',
        community_manager: 'Community Manager',
        reviewer: 'Revisor',
    }

    const roleLabel = user?.role
        ? roleLabels[user.role] ?? user.role
        : 'Sin rol'

    const handleLogout = () => {
        clearSession()
        onClose?.()
        navigate('/login', { replace: true })
    }

    const handleNavigate = () => {
        onClose?.()
    }

    return (
        <>
            {/* Fondo oscuro para móvil */}
            <div
                aria-hidden="true"
                onClick={onClose}
                className={`fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-[1px] transition-opacity duration-300 lg:hidden ${
                    isOpen
                        ? 'pointer-events-auto opacity-100'
                        : 'pointer-events-none opacity-0'
                }`}
            />

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 flex h-dvh w-64 flex-col overflow-hidden bg-slate-950 text-white shadow-xl transition-transform duration-300 ease-in-out lg:z-40 lg:translate-x-0 lg:shadow-none ${
                    isOpen
                        ? 'translate-x-0'
                        : '-translate-x-full'
                }`}
            >
                {/* Identidad CloudEdTech */}
                <div className="flex h-20 shrink-0 items-center border-b border-slate-800 px-5">
                    <div className="mr-2 flex h-12 w-14 shrink-0 items-center justify-center">
                        <img
                            src="/brand/cloudedtech-icon.svg"
                            alt="CloudEdTech"
                            className="h-full w-full object-contain"
                        />
                    </div>

                    <div className="min-w-0 flex-1">
                        <h1 className="text-lg font-bold leading-none tracking-tight">
                            <span className="text-white">
                                Cloud
                            </span>
                            <span className="text-[#FF7400]">
                                Ed
                            </span>
                            <span className="text-white">
                                Tech
                            </span>
                        </h1>

                        <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                            Education &amp; Technology
                        </p>
                    </div>

                    {/* Cerrar menú en móvil */}
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Cerrar menú"
                        className="ml-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-white lg:hidden"
                    >
                        <X size={19} />
                    </button>
                </div>

                {/* Navegación con scroll independiente */}
                <nav className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
                    <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Principal
                    </p>

                    <div className="space-y-2">
                        {isCommunityManager ? (
                            <>
                                <SidebarItem
                                    to="/dashboard"
                                    icon={<Home size={18} />}
                                    label="Dashboard"
                                    onNavigate={handleNavigate}
                                />

                                <SidebarItem
                                    to="/messages"
                                    icon={
                                        <MessageSquare size={18} />
                                    }
                                    label="Ingesta Discord"
                                    onNavigate={handleNavigate}
                                />

                                <SidebarItem
                                    to="/analytics"
                                    icon={<BarChart3 size={18} />}
                                    label="Análisis"
                                    onNavigate={handleNavigate}
                                />

                                <SidebarItem
                                    to="/content"
                                    icon={
                                        <WandSparkles size={18} />
                                    }
                                    label="Redacción de contenidos"
                                    onNavigate={handleNavigate}
                                />

                                <SidebarItem
                                    to="/approvals"
                                    icon={
                                        <CheckCircle size={18} />
                                    }
                                    label="Aprobaciones"
                                    onNavigate={handleNavigate}
                                />

                                <SidebarItem
                                    to="/oci-storage"
                                    icon={
                                        <CloudUpload size={18} />
                                    }
                                    label="Informes y Almacenamiento"
                                    onNavigate={handleNavigate}
                                />
                            </>
                        ) : (
                            <>
                                <SidebarItem
                                    to="/dashboard"
                                    icon={<Home size={18} />}
                                    label="Dashboard"
                                    onNavigate={handleNavigate}
                                />

                                <SidebarItem
                                    to="/messages"
                                    icon={
                                        <MessageSquare size={18} />
                                    }
                                    label="Mensajes"
                                    onNavigate={handleNavigate}
                                />

                                <SidebarItem
                                    to="/highlights"
                                    icon={<Star size={18} />}
                                    label="Historias destacadas"
                                    onNavigate={handleNavigate}
                                />

                                <SidebarItem
                                    to="/hashtags"
                                    icon={<Hash size={18} />}
                                    label="Hashtags"
                                    onNavigate={handleNavigate}
                                />

                                <SidebarItem
                                    to="/audience"
                                    icon={<Users size={18} />}
                                    label="Audiencia"
                                    onNavigate={handleNavigate}
                                />

                                <SidebarItem
                                    to="/analytics"
                                    icon={<BarChart3 size={18} />}
                                    label="Análisis"
                                    onNavigate={handleNavigate}
                                />

                                <SidebarItem
                                    to="/calendar"
                                    icon={
                                        <CalendarDays size={18} />
                                    }
                                    label="Calendar"
                                    onNavigate={handleNavigate}
                                />

                                <SidebarItem
                                    to="/export"
                                    icon={<Download size={18} />}
                                    label="Export"
                                    onNavigate={handleNavigate}
                                />

                                <SidebarItem
                                    to="/my-reports"
                                    icon={<FileClock size={18} />}
                                    label="My Reports"
                                    onNavigate={handleNavigate}
                                />

                                {user?.role === 'admin' && (
                                    <SidebarItem
                                        to="/oci-storage"
                                        icon={
                                            <CloudUpload size={18} />
                                        }
                                        label="OCI Storage"
                                        onNavigate={
                                            handleNavigate
                                        }
                                    />
                                )}

                                {(user?.role === 'admin' ||
                                    user?.role ===
                                        'reviewer') && (
                                    <>
                                        <SidebarItem
                                            to="/content"
                                            icon={
                                                <WandSparkles
                                                    size={18}
                                                />
                                            }
                                            label="Content Studio"
                                            onNavigate={
                                                handleNavigate
                                            }
                                        />

                                        <SidebarItem
                                            to="/approvals"
                                            icon={
                                                <CheckCircle
                                                    size={18}
                                                />
                                            }
                                            label="Aprobaciones"
                                            onNavigate={
                                                handleNavigate
                                            }
                                        />
                                    </>
                                )}
                            </>
                        )}
                    </div>

                    {/* Administración */}
                    {user?.role === 'admin' && (
                        <>
                            <p className="mb-3 mt-8 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Administración
                            </p>

                            <div className="space-y-2">
                                <SidebarItem
                                    to="/audit"
                                    icon={<FileText size={18} />}
                                    label="Auditoría"
                                    onNavigate={handleNavigate}
                                />

                                <SidebarItem
                                    to="/security"
                                    icon={
                                        <ShieldCheck size={18} />
                                    }
                                    label="Seguridad"
                                    onNavigate={handleNavigate}
                                />

                                <SidebarItem
                                    to="/settings"
                                    icon={<Settings size={18} />}
                                    label="Configuración"
                                    onNavigate={handleNavigate}
                                />
                            </div>
                        </>
                    )}
                </nav>

                {/* Zona inferior siempre visible */}
                <div className="shrink-0 border-t border-slate-800 bg-slate-950">
                    <div className="px-4 pt-3">
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-300 transition-colors hover:bg-slate-800 hover:text-orange-400"
                        >
                            <LogOut className="h-4 w-4 shrink-0" />
                            <span>Cerrar sesión</span>
                        </button>
                    </div>

                    {/* Usuario */}
                    <div className="p-4 pt-2">
                        <div className="flex items-center gap-3 rounded-lg p-2">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-500 text-sm font-semibold">
                                {user
                                    ? `${user.first_name?.charAt(0) ?? ''}${user.last_name?.charAt(0) ?? ''}`.toUpperCase()
                                    : 'U'}
                            </div>

                            <div className="min-w-0">
                                <p className="truncate text-sm font-medium">
                                    {user
                                        ? `${user.first_name} ${user.last_name}`
                                        : 'Usuario'}
                                </p>

                                <p className="truncate text-xs text-slate-400">
                                    {roleLabel}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    )
}

export default Sidebar