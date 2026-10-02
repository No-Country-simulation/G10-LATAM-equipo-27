import {
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
} from 'recharts'

import { mockCommunityData } from '../data/mockCommunityData'


const COLORS = ['#22c55e', '#94a3b8', '#ef4444']

function SentimentChart() {

    const data = mockCommunityData.sentiment.distribution
    
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

                        <Tooltip />

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

                        <span className="text-sm text-slate-600">
                            {item.name} {item.value}%
                        </span>

                    </div>
                ))}

            </div>

        </div>
    )
}

export default SentimentChart