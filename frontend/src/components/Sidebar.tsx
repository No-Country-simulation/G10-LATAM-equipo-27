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
} from 'lucide-react'

import { NavLink, useNavigate } from "react-router-dom";
import type { ReactNode } from 'react'

import { clearSession, getUser } from "../api/session";




interface SidebarItemProps {
    to: string
    icon: ReactNode
    label: string
}

function SidebarItem({ to, icon, label }: SidebarItemProps) {
    return (
        <NavLink
            to={to}
            className={({ isActive }) =>
                `flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition ${isActive
                    ? 'bg-orange-500 text-white'
                    : 'text-slate-300 hover:bg-slate-800'
                }`
            }
        >
            {icon}
            {label}
        </NavLink>
    )
}

function Sidebar() {
    const navigate = useNavigate();
    const user = getUser();
    const isCommunityManager = user?.role === "community_manager";
    const roleLabels: Record<string, string> = {
        admin: "Administrador",
        community_manager: "Community Manager",
        reviewer: "Revisor",
    };

    const roleLabel = user?.role
        ? roleLabels[user.role] ?? user.role
        : "Sin rol";

    const handleLogout = () => {
        clearSession();
        navigate("/login", { replace: true });
    };
    return (
        <aside className="fixed left-0 top-0 flex h-screen w-64 flex-col bg-slate-950 text-white">

            
            {/* Identidad CloudEdTech */}
            <div className="flex h-20 items-center border-b border-slate-800 px-5">
                <div className="mr-2 flex h-12 w-14 shrink-0 items-center justify-center">
                    <img
                        src="/brand/cloudedtech-icon.svg"
                        alt="CloudEdTech"
                        className="h-full w-full object-contain"
                    />
                </div>

                <div className="min-w-0">
                    <h1 className="text-lg font-bold tracking-tight leading-none">
                        <span className="text-white">Cloud</span>
                        <span className="text-[#FF7400]">Ed</span>
                        <span className="text-white">Tech</span>
                    </h1>

                    <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Education &amp; Technology
                    </p>
                </div>
            </div>

            {/* Navegación */}
            <nav className="flex-1 px-4 py-6">

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
                            />

                            <SidebarItem
                                to="/messages"
                                icon={<MessageSquare size={18} />}
                                label="Ingesta Discord"
                            />

                            <SidebarItem
                                to="/analytics"
                                icon={<BarChart3 size={18} />}
                                label="Análisis"
                            />

                            <SidebarItem
                                to="/content"
                                icon={<WandSparkles size={18} />}
                                label="Redacción de contenidos"
                            />

                            <SidebarItem
                                to="/approvals"
                                icon={<CheckCircle size={18} />}
                                label="Aprobaciones"
                            />

                            <SidebarItem
                                to="/oci-storage"
                                icon={<CloudUpload size={18} />}
                                label="Informes y Almacenamiento"
                            />
                        </>
                    ) : (
                        <>
                    

                    <SidebarItem
                        to="/dashboard"
                        icon={<Home size={18} />}
                        label="Dashboard"
                    />
                    <SidebarItem
                        to="/messages"
                        icon={<MessageSquare size={18} />}
                        label="Mensajes"
                    />

                    <SidebarItem
                        to="/highlights"
                        icon={<Star size={18} />}
                        label="Historias destacadas"
                    />

                    <SidebarItem
                        to="/hashtags"
                        icon={<Hash size={18} />}
                        label="Hashtags"
                    />

                    <SidebarItem
                        to="/audience"
                        icon={<Users size={18} />}
                        label="Audiencia"
                    />

                    <SidebarItem
                        to="/analytics"
                        icon={<BarChart3 size={18} />}
                        label="Análisis"
                    />

                    <SidebarItem
                        to="/calendar"
                        icon={<CalendarDays size={18} />}
                        label="Calendar"
                    />

                    <SidebarItem
                        to="/export"
                        icon={<Download size={18} />}
                        label="Export"
                    />

                    <SidebarItem
                        to="/my-reports"
                        icon={<FileClock size={18} />}
                        label="My Reports"
                    />

                    {user?.role === "admin" && (
                        <SidebarItem
                            to="/oci-storage"
                            icon={<CloudUpload size={18} />}
                            label="OCI Storage"
                        />
                    )}


                    {(user?.role === "admin" || user?.role === "reviewer") && (
                        <>
                            <SidebarItem
                                to="/content"
                                icon={<WandSparkles size={18} />}
                                label="Content Studio"
                            />

                            <SidebarItem
                                to="/approvals"
                                icon={<CheckCircle size={18} />}
                                label="Aprobaciones"
                            />
                        </>
                    )}
                            </>
    )}

</div>

                    

                

                {user?.role === "admin" && (
                    <>
                        <p className="mb-3 mt-8 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Administración
                        </p>

                        <div className="space-y-2">
                            <SidebarItem
                                to="/audit"
                                icon={<FileText size={18} />}
                                label="Auditoría"
                            />

                            <SidebarItem
                                to="/security"
                                icon={<ShieldCheck size={18} />}
                                label="Seguridad"
                            />

                            <SidebarItem
                                to="/settings"
                                icon={<Settings size={18} />}
                                label="Configuración"
                            />
                        </div>
                    </>
                )}

            </nav>
            <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-800 hover:text-orange-400"
            >
                <LogOut className="h-4 w-4" />
                <span>Cerrar sesión</span>
            </button>

            {/* Usuario */ }
    <div className="border-t border-slate-800 p-4">
        <div className="flex items-center gap-3 rounded-lg p-2">

            {/* Iniciales del usuario */}
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500 font-semibold">
                {user
                    ? `${user.first_name?.charAt(0) ?? ""}${user.last_name?.charAt(0) ?? ""}`.toUpperCase()
                    : "U"}
            </div>

            {/* Información del usuario */}
            <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                    {user
                        ? `${user.first_name} ${user.last_name}`
                        : "Usuario"}
                </p>

                <p className="truncate text-xs text-slate-400">
                    {roleLabel}
                </p>
            </div>

        </div>
    </div>

        </aside >
    )
}

export default Sidebar

