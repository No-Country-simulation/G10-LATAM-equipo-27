import {
    Bar,
    BarChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts'

import { mockCommunityData } from '../data/mockCommunityData'


function TopicsChart() {

    const data = mockCommunityData.topics
    
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
                            domain={[0, 40]}
                            tickFormatter={(value) => `${value}%`}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12 }}
                        />

                        <YAxis
                            type="category"
                            dataKey="topic"
                            width={80}
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

        </div>
    )
}

export default TopicsChart