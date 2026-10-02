import {
    Activity,
    AlertTriangle,
    BarChart3,
    MessageSquare,
    Sparkles,
    TrendingUp,
} from 'lucide-react'

import SentimentChart from '../charts/SentimentChart'
import TopicsChart from '../charts/TopicsChart'
import SentimentEvolution from '../charts/SentimentEvolution'
import { mockCommunityData } from '../data/mockCommunityData'

function Analytics() {

    const analyticsData = mockCommunityData.analytics

    return (
        <div className="space-y-8">

            {/* HEADER */}
            <div>
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-orange-500">
                        <BarChart3 size={22} />
                    </div>

                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">
                            Análisis
                        </h1>

                        <p className="mt-1 text-sm text-slate-500">
                            Métricas e inteligencia de la comunidad de Discord
                        </p>
                    </div>
                </div>
            </div>

            {/* KPI */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-5">

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500">
                                Mensajes analizados
                            </p>

                            <p className="mt-2 text-3xl font-bold text-slate-900">
                                {analyticsData.messages_analyzed.toLocaleString("es-CO")}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                                Comunidad Discord
                            </p>

                        </div>

                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-500">
                            <MessageSquare size={20} />
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500">
                                Sentimiento positivo
                            </p>

                            <p className="mt-2 text-3xl font-bold text-slate-900">
                                {analyticsData.positive_sentiment}%
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                                De los mensajes
                            </p>

                        </div>

                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-600">
                            <TrendingUp size={20} />
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between">
                        <div>

                            <p className="text-sm font-medium text-slate-500">
                                Temas detectados
                            </p>

                            <p className="mt-2 text-3xl font-bold text-slate-900">
                                {analyticsData.topics_detected}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                                Temas principales
                            </p>

                        </div>

                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                            <Activity size={20} />
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between">
                        <div>

                            <p className="text-sm font-medium text-slate-500">
                                Relevancia promedio
                            </p>

                            <p className="mt-2 text-3xl font-bold text-slate-900">
                                {analyticsData.average_relevance}%
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                                Contenido detectado
                            </p>

                        </div>

                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                            <Sparkles size={20} />
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between">
                        <div>

                            <p className="text-sm font-medium text-slate-500">
                                Alertas
                            </p>

                            <p className="mt-2 text-3xl font-bold text-slate-900">
                                {analyticsData.alerts}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                                Requieren atención
                            </p>

                        </div>

                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-500">
                            <AlertTriangle size={20} />
                        </div>
                    </div>
                </div>

            </div>

            {/* GRÁFICOS PRINCIPALES */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

                {/* SENTIMIENTO */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                    <div className="mb-5">
                        <h2 className="text-lg font-semibold text-slate-900">
                            Distribución del sentimiento
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Análisis de las conversaciones de Discord
                        </p>
                    </div>

                    <SentimentChart />

                </div>

                {/* TEMAS */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                    <div className="mb-5">
                        <h2 className="text-lg font-semibold text-slate-900">
                            Principales temas
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Temas más frecuentes detectados por la IA
                        </p>
                    </div>

                    <TopicsChart />

                </div>

            </div>

            {/* EVOLUCIÓN */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                <div className="mb-5 flex items-center justify-between">

                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">
                            Evolución del sentimiento
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Comportamiento de la comunidad durante la semana
                        </p>
                    </div>

                    <div className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600">
                        Últimos 7 días
                    </div>

                </div>

                <SentimentEvolution />

            </div>

            {/* INSIGHTS */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                    <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-500">
                            <Sparkles size={20} />
                        </div>

                        <div>
                            <h3 className="font-semibold text-slate-900">
                                Insight principal
                            </h3>

                            <p className="text-xs text-slate-400">
                                Detectado por IA
                            </p>
                        </div>
                    </div>

                    <p className="text-sm leading-6 text-slate-600">
                        {analyticsData.insights.main}
                    </p>

                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                    <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                            <MessageSquare size={20} />
                        </div>

                        <div>
                            <h3 className="font-semibold text-slate-900">
                                Preguntas frecuentes
                            </h3>

                            <p className="text-xs text-slate-400">
                                Oportunidades de contenido
                            </p>
                        </div>
                    </div>

                    <p className="text-sm leading-6 text-slate-600">
                        {analyticsData.insights.frequent_questions}
                    </p>

                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                    <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-500">
                            <AlertTriangle size={20} />
                        </div>

                        <div>
                            <h3 className="font-semibold text-slate-900">
                                Atención requerida
                            </h3>

                            <p className="text-xs text-slate-400">
                                Señales detectadas
                            </p>
                        </div>
                    </div>

                    <p className="text-sm leading-6 text-slate-600">
                        {analyticsData.insights.attention_required}
                    </p>

                </div>

            </div>

            {/* DEMO */}
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center">
                <p className="text-xs text-slate-400">
                    Datos de demostración — posteriormente serán obtenidos desde
                    FastAPI, LangGraph y Discord.
                </p>
            </div>

        </div>
    )
}

export default Analytics