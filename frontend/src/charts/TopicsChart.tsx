import { useEffect, useState } from 'react'

import {
    Bar,
    BarChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts'


type TopicItem = {
    topic: string
    percentage: number
}

type AnalyticsResponse = {
    topics: TopicItem[]
}

function TopicsChart() {

    const [data, setData] = useState<TopicItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {

        const loadTopics = async () => {

            try {

                const response = await fetch(
                    'http://127.0.0.1:8001/api/community/analytics'
                )

                if (!response.ok) {
                    throw new Error('No fue posible cargar los temas')
                }

                const result: AnalyticsResponse = await response.json()

                setData(result.topics)

            } catch (err) {

                setError(
                    err instanceof Error
                        ? err.message
                        : 'Error desconocido al cargar los temas'
                )

            } finally {

                setLoading(false)

            }
        }

        loadTopics()

    }, [])

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <div>
                <h3 className="text-lg font-bold text-slate-900">
                    Temas principales
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                    Temas más frecuentes en la comunidad
                </p>
            </div>

            {loading && (
                <div className="flex h-64 items-center justify-center text-sm text-slate-500">
                    Cargando temas...
                </div>
            )}

            {error && (
                <div className="flex h-64 items-center justify-center text-sm text-red-600">
                    {error}
                </div>
            )}

            {!loading && !error && (
                <div className="mt-6 h-64">

                    <ResponsiveContainer width="100%" height="100%">

                        <BarChart
                            data={data}
                            layout="vertical"
                            margin={{
                                top: 5,
                                right: 20,
                                left: 10,
                                bottom: 5,
                            }}
                        >

                            <XAxis
                                type="number"
                                domain={[0, 100]}
                                tickFormatter={(value) => `${value}%`}
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12 }}
                            />

                            <YAxis
                                type="category"
                                dataKey="topic"
                                width={100}
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12 }}
                            />

                            <Tooltip
                                formatter={(value) => [`${value}%`, 'Frecuencia']}
                            />

                            <Bar
                                dataKey="percentage"
                                fill="#f97316"
                                radius={[0, 6, 6, 0]}
                                barSize={18}
                            />

                        </BarChart>

                    </ResponsiveContainer>

                </div>
            )}

        </div>
    )
}

export default TopicsChart