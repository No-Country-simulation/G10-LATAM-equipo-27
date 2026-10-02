import {
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts'

import { mockCommunityData } from '../data/mockCommunityData'




function SentimentEvolution() {

    const data = mockCommunityData.sentiment.evolution
    
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <div>
                <h3 className="text-lg font-bold text-slate-900">
                    Evolución del sentimiento
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                    Porcentaje de sentimiento positivo durante la semana
                </p>
            </div>

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
                            dataKey="day"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12 }}
                        />

                        <YAxis
                            domain={[50, 80]}
                            tickFormatter={(value) => `${value}%`}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12 }}
                        />

                        <Tooltip
                            formatter={(value) => [
                                `${value}%`,
                                'Sentimiento positivo',
                            ]}
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

        </div>
    )
}

export default SentimentEvolution