import {
    AlertCircle,
    Check,
    CheckCircle2,
    Clock,
    MessageCircle,
    ShieldCheck,
    X,
    XCircle,
} from 'lucide-react'
import { useState } from 'react'
import { mockCommunityData } from '../data/mockCommunityData'

type ReviewFilter = 'pending' | 'approved' | 'rejected'

function Approvals() {
    const approvalsData = mockCommunityData.approvals
    const approvalsSummary = approvalsData.summary

    const [approvalItems, setApprovalItems] = useState(
        approvalsData.items
    )

    const [approvedItems, setApprovedItems] = useState<
        typeof approvalsData.items
    >([])

    const [rejectedItems, setRejectedItems] = useState<
        typeof approvalsData.items
    >([])

    const [approvedCount, setApprovedCount] = useState(
        approvalsSummary.approved_today
    )

    const [rejectedCount, setRejectedCount] = useState(
        approvalsSummary.rejected
    )

    const [activeFilter, setActiveFilter] =
        useState<ReviewFilter>('pending')

    const handleApprove = (itemId: number) => {
        const item = approvalItems.find(
            (currentItem) => currentItem.id === itemId
        )

        if (!item) return

        setApprovalItems((currentItems) =>
            currentItems.filter(
                (currentItem) => currentItem.id !== itemId
            )
        )

        setApprovedItems((currentItems) => [
            {
                ...item,
                status_label: 'Aprobado',
            },
            ...currentItems,
        ])

        setApprovedCount((currentCount) => currentCount + 1)
    }

    const handleReject = (itemId: number) => {
        const item = approvalItems.find(
            (currentItem) => currentItem.id === itemId
        )

        if (!item) return

        setApprovalItems((currentItems) =>
            currentItems.filter(
                (currentItem) => currentItem.id !== itemId
            )
        )

        setRejectedItems((currentItems) => [
            {
                ...item,
                status_label: 'Requiere ajustes',
            },
            ...currentItems,
        ])

        setRejectedCount((currentCount) => currentCount + 1)
    }

    const visibleItems =
        activeFilter === 'pending'
            ? approvalItems
            : activeFilter === 'approved'
              ? approvedItems
              : rejectedItems

    return (
        <div className="space-y-8">
            {/* ENCABEZADO */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-500">
                        <CheckCircle2 size={21} />
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">
                            Aprobaciones
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Revisión humana del contenido preparado por
                            CloudEdTech antes de continuar su flujo
                        </p>
                    </div>
                </div>

                <div className="flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                    <ShieldCheck size={14} />
                    Control humano activo
                </div>
            </div>

            {/* RESUMEN */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <SummaryCard
                    title="Pendientes"
                    value={approvalItems.length}
                    helper="Esperando revisión humana"
                    icon={
                        <Clock
                            size={19}
                            className="text-amber-600"
                        />
                    }
                />

                <SummaryCard
                    title="Aprobados hoy"
                    value={approvedCount}
                    helper="Contenidos validados"
                    icon={
                        <CheckCircle2
                            size={19}
                            className="text-emerald-600"
                        />
                    }
                />

                <SummaryCard
                    title="Requieren ajustes"
                    value={rejectedCount}
                    helper="Devueltos para revisión"
                    icon={
                        <AlertCircle
                            size={19}
                            className="text-red-500"
                        />
                    }
                />
            </div>

            {/* FLUJO */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-slate-900">
                            Flujo de revisión
                        </h3>

                        <p className="mt-1 text-xs text-slate-500">
                            Contenidos procedentes de Redacción de
                            Contenidos para validación humana.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                        <span className="rounded-lg bg-slate-100 px-3 py-2 text-slate-600">
                            Redacción de Contenidos
                        </span>

                        <span className="text-slate-300">→</span>

                        <span className="rounded-lg bg-orange-50 px-3 py-2 text-orange-600">
                            Aprobaciones
                        </span>

                        <span className="text-slate-300">→</span>

                        <span className="rounded-lg bg-emerald-50 px-3 py-2 text-emerald-700">
                            Contenido aprobado
                        </span>
                    </div>
                </div>
            </div>

            {/* FILTROS */}
            <div className="flex flex-wrap gap-2">
                <FilterButton
                    active={activeFilter === 'pending'}
                    onClick={() => setActiveFilter('pending')}
                >
                    Pendientes ({approvalItems.length})
                </FilterButton>

                <FilterButton
                    active={activeFilter === 'approved'}
                    onClick={() => setActiveFilter('approved')}
                >
                    Aprobados en esta sesión ({approvedItems.length})
                </FilterButton>

                <FilterButton
                    active={activeFilter === 'rejected'}
                    onClick={() => setActiveFilter('rejected')}
                >
                    Requieren ajustes ({rejectedItems.length})
                </FilterButton>
            </div>

            {/* LISTA */}
            <div className="space-y-5">
                {visibleItems.length === 0 && (
                    <EmptyState filter={activeFilter} />
                )}

                {visibleItems.map((item) => {
                    const isApproved =
                        activeFilter === 'approved'

                    const isRejected =
                        activeFilter === 'rejected'

                    return (
                        <article
                            key={`${activeFilter}-${item.id}`}
                            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                        >
                            {/* CABECERA DE TARJETA */}
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="flex items-start gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                                        <MessageCircle size={20} />
                                    </div>

                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="font-bold text-slate-900">
                                                {item.type}
                                            </h3>

                                            {activeFilter ===
                                                'pending' && (
                                                <StatusBadge type="pending">
                                                    {item.status_label}
                                                </StatusBadge>
                                            )}

                                            {isApproved && (
                                                <StatusBadge type="approved">
                                                    Aprobado
                                                </StatusBadge>
                                            )}

                                            {isRejected && (
                                                <StatusBadge type="rejected">
                                                    Requiere ajustes
                                                </StatusBadge>
                                            )}
                                        </div>

                                        <p className="mt-1 text-xs text-slate-400">
                                            Canal: #{item.channel} ·
                                            Preparado por CloudEdTech
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                    <Clock size={14} />
                                    {item.time}
                                </div>
                            </div>

                            {/* CONTENIDO */}
                            <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-5">
                                <p className="whitespace-pre-line text-sm leading-7 text-slate-700">
                                    {item.content}
                                </p>
                            </div>

                            {/* MÉTRICAS + ACCIONES */}
                            <div className="mt-5 flex flex-col gap-5 border-t border-slate-100 pt-5 lg:flex-row lg:items-end lg:justify-between">
                                <div>
                                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                        Criterios de evaluación
                                    </p>

                                    <div className="flex flex-wrap gap-3">
                                        <MetricBadge
                                            title="Relevancia"
                                            value={`${item.relevance}%`}
                                            className="bg-green-50 text-green-700"
                                        />

                                        <MetricBadge
                                            title="Sentimiento"
                                            value={`${item.sentiment}%`}
                                            className="bg-blue-50 text-blue-700"
                                        />

                                        <MetricBadge
                                            title="Alineación de marca"
                                            value="100%"
                                            className="bg-purple-50 text-purple-700"
                                        />
                                    </div>
                                </div>

                                {activeFilter === 'pending' && (
                                    <div className="flex flex-wrap gap-3">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleReject(item.id)
                                            }
                                            className="flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
                                        >
                                            <X size={16} />
                                            Solicitar ajustes
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleApprove(item.id)
                                            }
                                            className="flex items-center gap-2 rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600"
                                        >
                                            <Check size={16} />
                                            Aprobar contenido
                                        </button>
                                    </div>
                                )}

                                {isApproved && (
                                    <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600">
                                        <CheckCircle2 size={18} />
                                        Revisión completada
                                    </div>
                                )}

                                {isRejected && (
                                    <div className="flex items-center gap-2 text-sm font-semibold text-red-500">
                                        <XCircle size={18} />
                                        Pendiente de ajustes
                                    </div>
                                )}
                            </div>
                        </article>
                    )
                })}
            </div>

            {/* NOTA DE INTEGRACIÓN */}
            <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                <div className="flex items-start gap-3">
                    <ShieldCheck
                        size={17}
                        className="mt-0.5 shrink-0 text-blue-600"
                    />

                    <div>
                        <p className="text-xs font-bold text-blue-900">
                            Control de aprobación CloudEdTech
                        </p>

                        <p className="mt-1 text-xs leading-5 text-blue-700">
                            Las decisiones mostradas durante esta etapa
                            permanecen en el estado local de la interfaz
                            mientras se completa la integración definitiva
                            con el backend. La publicación externa no se
                            ejecuta automáticamente desde este tablero.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

function SummaryCard({
    title,
    value,
    helper,
    icon,
}: {
    title: string
    value: number
    helper: string
    icon: React.ReactNode
}) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-slate-500">
                        {title}
                    </p>

                    <p className="mt-2 text-3xl font-bold text-slate-900">
                        {value}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                        {helper}
                    </p>
                </div>

                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50">
                    {icon}
                </div>
            </div>
        </div>
    )
}

function FilterButton({
    active,
    onClick,
    children,
}: {
    active: boolean
    onClick: () => void
    children: React.ReactNode
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
                active
                    ? 'bg-[#080A27] text-white'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
        >
            {children}
        </button>
    )
}

function StatusBadge({
    type,
    children,
}: {
    type: 'pending' | 'approved' | 'rejected'
    children: React.ReactNode
}) {
    const styles = {
        pending: 'bg-yellow-100 text-yellow-700',
        approved: 'bg-emerald-100 text-emerald-700',
        rejected: 'bg-red-100 text-red-600',
    }

    return (
        <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${styles[type]}`}
        >
            {children}
        </span>
    )
}

function MetricBadge({
    title,
    value,
    className,
}: {
    title: string
    value: string
    className: string
}) {
    return (
        <div className={`rounded-lg px-3 py-2 ${className}`}>
            <p className="text-xs opacity-80">
                {title}
            </p>

            <p className="font-bold">
                {value}
            </p>
        </div>
    )
}

function EmptyState({
    filter,
}: {
    filter: ReviewFilter
}) {
    const content = {
        pending: {
            title: 'No hay contenidos pendientes',
            description:
                'Todas las propuestas disponibles han sido revisadas.',
            icon: (
                <Check
                    size={32}
                    className="mx-auto text-green-500"
                />
            ),
        },

        approved: {
            title: 'No hay aprobaciones en esta sesión',
            description:
                'Los contenidos que apruebes aparecerán aquí.',
            icon: (
                <CheckCircle2
                    size={32}
                    className="mx-auto text-slate-300"
                />
            ),
        },

        rejected: {
            title: 'No hay contenidos que requieran ajustes',
            description:
                'Los contenidos devueltos para revisión aparecerán aquí.',
            icon: (
                <XCircle
                    size={32}
                    className="mx-auto text-slate-300"
                />
            ),
        },
    }

    const current = content[filter]

    return (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            {current.icon}

            <h3 className="mt-4 font-bold text-slate-900">
                {current.title}
            </h3>

            <p className="mt-2 text-sm text-slate-500">
                {current.description}
            </p>
        </div>
    )
}

export default Approvals