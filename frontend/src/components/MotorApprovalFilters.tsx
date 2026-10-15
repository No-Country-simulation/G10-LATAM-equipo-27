import type { MotorApprovalGroups } from '../api/motorApprovalGroups'

export type MotorReviewFilter =
    | 'pending'
    | 'approved'
    | 'adjustments'
    | 'rejected'

type Props = {
    groups: MotorApprovalGroups
    activeFilter: MotorReviewFilter
    onChange: (filter: MotorReviewFilter) => void
}

export default function MotorApprovalFilters({
    groups,
    activeFilter,
    onChange,
}: Props) {
    const filters: Array<{
        key: MotorReviewFilter
        label: string
        count: number
    }> = [
        {
            key: 'pending',
            label: 'Pendientes',
            count: groups.pending.length,
        },
        {
            key: 'approved',
            label: 'Aprobados',
            count: groups.approved.length,
        },
        {
            key: 'adjustments',
            label: 'Requieren ajustes',
            count: groups.adjustments.length,
        },
        {
            key: 'rejected',
            label: 'Rechazados',
            count: groups.rejected.length,
        },
    ]

    return (
        <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
                <button
                    key={filter.key}
                    type="button"
                    onClick={() => onChange(filter.key)}
                    aria-pressed={activeFilter === filter.key}
                    className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
                        activeFilter === filter.key
                            ? 'bg-[#080A27] text-white'
                            : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                >
                    {filter.label} ({filter.count})
                </button>
            ))}
        </div>
    )
}
