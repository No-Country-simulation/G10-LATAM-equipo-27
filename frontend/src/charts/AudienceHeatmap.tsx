import { mockCommunityData } from '../data/mockCommunityData'


function AudienceHeatmap() {

    const activityData = mockCommunityData.activity_heatmap.data
    
    const hours = mockCommunityData.activity_heatmap.hours

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

            <div className="mt-6 overflow-x-auto">
                <div className="min-w-[620px]">

                    {/* Horas */}
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

                    {/* Días */}
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
                                            ? "bg-orange-500"
                                            : value >= 60
                                                ? "bg-orange-400"
                                                : value >= 40
                                                    ? "bg-orange-300"
                                                    : value >= 20
                                                        ? "bg-orange-200"
                                                        : "bg-orange-100"

                                    return (
                                        <div
                                            key={`${row.day}-${index}`}
                                            title={`${row.day} ${hours[index]} · Actividad ${value}%`}
                                            className={`h-10 rounded-lg ${intensity} transition hover:scale-105`}
                                        />
                                    )
                                })}
                            </div>
                        ))}
                    </div>

                </div>
            </div>
        </div>
    )
}

export default AudienceHeatmap