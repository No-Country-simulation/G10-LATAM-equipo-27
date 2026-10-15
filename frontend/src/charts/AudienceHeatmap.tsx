import { useEffect, useState } from 'react'


type ActivityRow = {
    day: string
    values: number[]
    counts: number[]
}

type ActivityHeatmap = {
    hours: string[]
    data: ActivityRow[]
}

type AnalyticsResponse = {
    activity_heatmap: ActivityHeatmap
}


function AudienceHeatmap() {

    const [activityData, setActivityData] = useState<ActivityRow[]>([])
    const [hours, setHours] = useState<string[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {

        const loadActivity = async () => {

            try {

                const response = await fetch(
                    'http://127.0.0.1:8001/api/community/analytics'
                )

                if (!response.ok) {
                    throw new Error(
                        'No fue posible cargar la actividad de audiencia'
                    )
                }

                const result: AnalyticsResponse = await response.json()

                setActivityData(result.activity_heatmap.data)
                setHours(result.activity_heatmap.hours)

            } catch (err) {

                setError(
                    err instanceof Error
                        ? err.message
                        : 'Error desconocido al cargar la actividad'
                )

            } finally {

                setLoading(false)

            }
        }

        loadActivity()

    }, [])

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <div>
                <h3 className="font-bold text-slate-900">
                    Actividad de audiencia
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                    Intensidad de actividad por día y hora
                </p>
            </div>

            {loading && (
                <div className="flex h-64 items-center justify-center text-sm text-slate-500">
                    Cargando actividad...
                </div>
            )}

            {error && (
                <div className="flex h-64 items-center justify-center text-sm text-red-600">
                    {error}
                </div>
            )}

            {!loading && !error && (
                <div className="mt-6 overflow-x-auto">

                    <div className="min-w-[620px]">

                        <div className="mb-2 grid grid-cols-[60px_repeat(6,1fr)] gap-2">

                            <div />

                            {hours.map((hour) => (
                                <div
                                    key={hour}
                                    className="text-center text-xs font-medium text-slate-400"
                                >
                                    {hour}
                                </div>
                            ))}

                        </div>

                        <div className="space-y-2">

                            {activityData.map((row) => (

                                <div
                                    key={row.day}
                                    className="grid grid-cols-[60px_repeat(6,1fr)] gap-2"
                                >

                                    <div className="flex items-center text-xs font-semibold text-slate-500">
                                        {row.day}
                                    </div>

                                    {row.values.map((value, index) => {

                                        const intensity =
                                            value >= 80
                                                ? 'bg-orange-500'
                                                : value >= 60
                                                    ? 'bg-orange-400'
                                                    : value >= 40
                                                        ? 'bg-orange-300'
                                                        : value >= 20
                                                            ? 'bg-orange-200'
                                                            : value > 0
                                                                ? 'bg-orange-100'
                                                                : 'bg-slate-100'

                                        const count = row.counts[index]

                                        return (
                                            <div
                                                key={`${row.day}-${index}`}
                                                title={`${row.day} ${hours[index]} · ${count} ${count === 1 ? 'mensaje' : 'mensajes'} · Intensidad ${value}%`}
                                                className={`h-10 rounded-lg ${intensity} transition hover:scale-105`}
                                            />
                                        )
                                    })}

                                </div>
                            ))}

                        </div>

                    </div>

                </div>
            )}

        </div>
    )
}

export default AudienceHeatmap