import { AlertCircle, CheckCircle2, Clock } from 'lucide-react'
import type { MotorApprovalGroups } from '../api/motorApprovalGroups'

type Props = {
    groups: MotorApprovalGroups
}

export default function MotorApprovalSummary({ groups }: Props) {
    const metrics = [
        {
            title: 'Pendientes',
            value: groups.pending.length,
            description: 'Esperando revisión humana',
            icon: Clock,
            color: 'text-amber-600',
        },
        {
            title: 'Aprobados',
            value: groups.approved.length,
            description: 'Contenidos aprobados registrados',
            icon: CheckCircle2,
            color: 'text-emerald-600',
        },
        {
            title: 'Requieren ajustes',
            value: groups.adjustments.length,
            description: 'Devueltos para corrección',
            icon: AlertCircle,
            color: 'text-red-500',
        },
    ]

    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {metrics.map((metric) => {
                const Icon = metric.icon

                return (
                    <div
                        key={metric.title}
                        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                    >
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-slate-600">
                                {metric.title}
                            </p>
                            <Icon size={19} className={metric.color} />
                        </div>

                        <p className="mt-3 text-3xl font-bold text-slate-900">
                            {metric.value}
                        </p>

                        <p className="mt-2 text-xs text-slate-500">
                            {metric.description}
                        </p>
                    </div>
                )
            })}
        </div>
    )
}
