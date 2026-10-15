import { useEffect, useState } from 'react'

import {
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts'


type EvolutionItem = {
    day: string
    date: string
    positive: number
    messages: number
}

type AnalyticsResponse = {
    sentiment: {
        evolution: EvolutionItem[]
    }
}

function SentimentEvolution() {

    const [data, setData] = useState<EvolutionItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {

        const loadEvolution = async () => {

            try {

                const response = await fetch(
                    'http://127.0.0.1:8001/api/community/analytics'
                )

                if (!response.ok) {
                    throw new Error(
                        'No fue posible cargar la evolución del sentimiento'
                    )
                }

                const result: AnalyticsResponse = await response.json()

                setData(result.sentiment.evolution)

            } catch (err) {

                setError(
                    err instanceof Error
                        ? err.message
                        : 'Error desconocido al cargar la evolución'
                )

            } finally {

                setLoading(false)

            }
        }

        loadEvolution()

    }, [])

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <div>
                <h3 className="text-lg font-bold text-slate-900">
                    Evolución del sentimiento
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                    Porcentaje de sentimiento positivo por día con actividad
                </p>
            </div>

            {loading && (
                <div className="flex h-72 items-center justify-center text-sm text-slate-500">
                    Cargando evolución...
                </div>
            )}

            {error && (
                <div className="flex h-72 items-center justify-center text-sm text-red-600">
                    {error}
                </div>
            )}

            {!loading && !error && (
                <div className="mt-6 h-72">

                    <ResponsiveContainer width="100%" height="100%">

                        <LineChart
                            data={data}
                            margin={{
                                top: 10,
                                right: 10,
                                left: 0,
                                bottom: 5,
                            }}
                        >

                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12 }}
                                tickFormatter={(value) => {
                                    const [, month, day] = value.split('-')
                                    return `${day}/${month}`
                                }}
                            />

                            <YAxis
                                domain={[0, 100]}
                                tickFormatter={(value) => `${value}%`}
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12 }}
                            />

                            <Tooltip
                                labelFormatter={(value) => `Fecha: ${value}`}
                                formatter={(value, name, item) => {

                                    if (name === 'positive') {
                                        return [
                                            `${value}%`,
                                            `Sentimiento positivo (${item.payload.messages} mensajes)`,
                                        ]
                                    }

                                    return [value, name]
                                }}
                            />

                            <Line
                                type="monotone"
                                dataKey="positive"
                                stroke="#f97316"
                                strokeWidth={3}
                                dot={{
                                    r: 4,
                                }}
                                activeDot={{
                                    r: 6,
                                }}
                            />

                        </LineChart>

                    </ResponsiveContainer>

                </div>
            )}

        </div>
    )
}

export default SentimentEvolution