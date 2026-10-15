import { useEffect, useState } from 'react'

import {
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
} from 'recharts'


const COLORS = ['#22c55e', '#94a3b8', '#ef4444']

type SentimentItem = {
    name: string
    value: number
}

type AnalyticsResponse = {
    sentiment: {
        distribution: SentimentItem[]
    }
}

function SentimentChart() {

    const [data, setData] = useState<SentimentItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {

        const loadSentiment = async () => {

            try {

                const response = await fetch(
                    'http://127.0.0.1:8001/api/community/analytics'
                )

                if (!response.ok) {
                    throw new Error('No fue posible cargar el sentimiento')
                }

                const result: AnalyticsResponse = await response.json()

                setData(result.sentiment.distribution)

            } catch (err) {

                setError(
                    err instanceof Error
                        ? err.message
                        : 'Error desconocido al cargar el sentimiento'
                )

            } finally {

                setLoading(false)

            }
        }

        loadSentiment()

    }, [])

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <div>
                <h3 className="text-lg font-bold text-slate-900">
                    Sentimiento de la comunidad
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                    Distribución de las conversaciones analizadas
                </p>
            </div>

            {loading && (
                <div className="flex h-64 items-center justify-center text-sm text-slate-500">
                    Cargando sentimiento...
                </div>
            )}

            {error && (
                <div className="flex h-64 items-center justify-center text-sm text-red-600">
                    {error}
                </div>
            )}

            {!loading && !error && (
                <>
                    <div className="mt-6 h-64">

                        <ResponsiveContainer width="100%" height="100%">

                            <PieChart>

                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={65}
                                    outerRadius={95}
                                    paddingAngle={3}
                                    dataKey="value"
                                >

                                    {data.map((entry, index) => (
                                        <Cell
                                            key={`cell-${entry.name}`}
                                            fill={COLORS[index]}
                                        />
                                    ))}

                                </Pie>

                                <Tooltip
                                    formatter={(value) => [`${value}%`, 'Porcentaje']}
                                />

                            </PieChart>

                        </ResponsiveContainer>

                    </div>

                    <div className="mt-2 flex justify-center gap-6">

                        {data.map((item, index) => (
                            <div
                                key={item.name}
                                className="flex items-center gap-2"
                            >

                                <span
                                    className="h-3 w-3 rounded-full"
                                    style={{
                                        backgroundColor: COLORS[index],
                                    }}
                                />

                                <span>
                                    {item.name} {item.value}%
                                </span>

                            </div>
                        ))}

                    </div>
                </>
            )}

        </div>
    )
}

export default SentimentChart