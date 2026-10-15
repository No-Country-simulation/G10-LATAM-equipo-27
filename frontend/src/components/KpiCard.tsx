import type { ReactNode } from 'react'

interface KpiCardProps {
    title: string
    value: string
    description: string
    icon: ReactNode
}

function KpiCard({
    title,
    value,
    description,
    icon,
}: KpiCardProps) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-start justify-between">

                <div>
                    <p className="text-sm font-medium text-slate-500">
                        {title}
                    </p>

                    <p className="mt-2 text-3xl font-bold text-slate-900">
                        {value}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                        {description}
                    </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-500">
                    {icon}
                </div>

            </div>

        </div>
    )
}

export default KpiCard