import {
    AlertTriangle,
    BarChart3,
    CheckCircle2,
    ChevronRight,
    Hash,
    Lightbulb,
    MessageSquare,
    ShieldCheck,
    Sparkles,
    Tag,
    TrendingUp,
    Zap,
} from 'lucide-react'

import { useLocation, useNavigate } from 'react-router-dom'
import { mockCommunityData } from '../data/mockCommunityData'

type IncomingInteraction = {
    id: string
    author: string
    channel: string
    content: string
    sentiment: 'positive' | 'neutral' | 'negative'
    sentimentLabel: string
    topic: string
    keywords: string[]
    relevance: number
}

type LocationState = {
    source?: string
    interaction?: IncomingInteraction
}

const emojiScores = [
    {
        emoji: '🔥',
        label: 'Fuego',
        description: 'Entusiasmo / Impacto',
        value: 248,
        trend: '+18.4%',
    },
    {
        emoji: '🚀',
        label: 'Cohete',
        description: 'Lanzamiento / DevOps',
        value: 215,
        trend: '+12.1%',
    },
    {
        emoji: '👍',
        label: 'Pulgar arriba',
        description: 'Aprobación',
        value: 320,
        trend: '+8.7%',
    },
    {
        emoji: '💡',
        label: 'Bombilla',
        description: 'Ideas / Innovación',
        value: 142,
        trend: '+15.3%',
    },
    {
        emoji: '⚠️',
        label: 'Alerta',
        description: 'Incidencias RAG',
        value: 86,
        trend: '-4.2%',
    },
]

const popularHashtags = [
    { tag: '#ServidoresNVMe', value: 432, trend: '+24%' },
    { tag: '#EdTech', value: 368, trend: '+18%' },
    { tag: '#KVM', value: 295, trend: '+31%' },
    { tag: '#Kubernetes', value: 230, trend: '+15%' },
    { tag: '#CloudSLA', value: 215, trend: '+9%' },
    { tag: '#Postgres', value: 180, trend: '+22%' },
    { tag: '#InfoSec', value: 145, trend: '+12%' },
    { tag: '#CloudComputing', value: 132, trend: '+16%' },
    { tag: '#DevOps', value: 118, trend: '+11%' },
    { tag: '#Virtualizacion', value: 104, trend: '+8%' },
    { tag: '#IA', value: 96, trend: '+19%' },
    { tag: '#Backend', value: 84, trend: '+7%' },
    { tag: '#BasesDeDatos', value: 78, trend: '+14%' },
    { tag: '#Ciberseguridad', value: 69, trend: '+10%' },
    { tag: '#ComunidadTech', value: 61, trend: '+6%' },
]

const keyTopics = [
    {
        title: 'Rendimiento de Servidores y Virtualización',
        description:
            'Hipervisores KVM, GPU Passthrough, balance de carga y aislamiento multi-tenant.',
        percentage: 42,
        icon: BarChart3,
    },
    {
        title: 'Soporte Técnico',
        description:
            'Resolución de incidencias críticas en campus, SLAs y tutoriales técnicos.',
        percentage: 28,
        icon: MessageSquare,
    },
    {
        title: 'Almacenamiento All-NVMe',
        description:
            'Discos PCIe Gen5, reducción de latencia y cifrado de información en reposo.',
        percentage: 18,
        icon: ShieldCheck,
    },
    {
        title: 'Migración Multi-Cloud y Kubernetes',
        description:
            'Orquestación de pods, escalabilidad, cuotas dinámicas y contención de costes.',
        percentage: 12,
        icon: Sparkles,
    },
]

function Analytics() {
    const navigate = useNavigate()
    const location = useLocation()

    const state = location.state as LocationState | null
    const incomingInteraction = state?.interaction

    const analyticsData = mockCommunityData.analytics

    const brandAlignment = 100

    const handleSendToContent = (interaction: IncomingInteraction) => {
        navigate('/content', {
            state: {
                source: 'analytics',
                interaction,
            },
        })
    }

    return (
        <div className="space-y-8">
            {/* HEADER */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-orange-500">
                        <BarChart3 size={22} />
                    </div>

                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">
                            Análisis
                        </h1>

                        <p className="mt-1 text-sm text-slate-500">
                            Curaduría, relevancia e inteligencia de la comunidad de Discord
                        </p>
                    </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs text-slate-500 shadow-sm">
                    Evaluación algorítmica de relevancia, voz de marca e intención
                </div>
            </div>

            {/* MÉTRICAS PRINCIPALES */}
            <section>
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-base font-bold text-slate-900">
                        Métricas globales de curaduría
                    </h2>

                    <span className="text-xs text-slate-400">
                        Procesamiento y clasificación de interacciones
                    </span>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-6">
                    <MetricCard
                        label="Mensajes analizados"
                        value={analyticsData.messages_analyzed.toLocaleString('es-CO')}
                        helper="Comunidad Discord"
                        icon={<MessageSquare size={19} />}
                        iconClass="bg-orange-100 text-orange-500"
                    />

                    <MetricCard
                        label="Sentimiento positivo"
                        value={`${analyticsData.positive_sentiment}%`}
                        helper="De los mensajes"
                        icon={<TrendingUp size={19} />}
                        iconClass="bg-emerald-100 text-emerald-600"
                    />

                    <MetricCard
                        label="Temas detectados"
                        value={String(analyticsData.topics_detected)}
                        helper="Temas principales"
                        icon={<BarChart3 size={19} />}
                        iconClass="bg-blue-100 text-blue-600"
                    />

                    <MetricCard
                        label="Relevancia promedio"
                        value={`${analyticsData.average_relevance}%`}
                        helper="Contenido detectado"
                        icon={<Zap size={19} />}
                        iconClass="bg-purple-100 text-purple-600"
                    />

                    <MetricCard
                        label="Alineación de marca"
                        value={`${brandAlignment}%`}
                        helper="Consistencia de tono CloudEdTech"
                        icon={<ShieldCheck size={19} />}
                        iconClass="bg-emerald-100 text-emerald-600"
                        accent="text-emerald-600"
                    />

                    <MetricCard
                        label="Alertas"
                        value={String(analyticsData.alerts)}
                        helper="Requieren atención"
                        icon={<AlertTriangle size={19} />}
                        iconClass="bg-red-100 text-red-500"
                        accent="text-red-500"
                    />
                </div>
            </section>

            {/* SCORECARDS EMOJIS */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-orange-500">
                            <Sparkles size={16} />
                        </div>

                        <div>
                            <h2 className="font-bold text-slate-900">
                                Scorecards de Emojis Destacados en la Comunidad
                            </h2>

                            <p className="mt-0.5 text-xs text-slate-400">
                                Señales rápidas de interacción y comportamiento
                            </p>
                        </div>
                    </div>

                    <span className="text-xs text-slate-400">
                        Frecuencia agregada y sentiment telemetry
                    </span>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
                    {emojiScores.map((item) => {
                        const negative = item.trend.startsWith('-')

                        return (
                            <div
                                key={item.label}
                                className="rounded-xl border border-slate-200 bg-slate-50/50 p-4"
                            >
                                <div className="flex items-start justify-between">
                                    <span className="text-2xl">
                                        {item.emoji}
                                    </span>

                                    <span
                                        className={`rounded-md px-2 py-1 text-[10px] font-bold ${
                                            negative
                                                ? 'bg-rose-50 text-rose-600'
                                                : 'bg-emerald-50 text-emerald-600'
                                        }`}
                                    >
                                        {item.trend}
                                    </span>
                                </div>

                                <p className="mt-3 text-xl font-black text-slate-900">
                                    {item.value}
                                </p>

                                <p className="mt-1 text-xs font-semibold text-slate-700">
                                    {item.label}
                                </p>

                                <p className="mt-1 text-[11px] text-slate-400">
                                    {item.description}
                                </p>
                            </div>
                        )
                    })}
                </div>
            </section>

            {/* HASHTAGS + TEMAS */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                {/* HASHTAGS */}
                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Hash size={18} className="text-orange-500" />

                            <h2 className="font-bold text-slate-900">
                                Hashtags más populares
                            </h2>
                        </div>

                        <span className="text-[11px] text-slate-400">
                            Top 15
                        </span>
                    </div>

                    <p className="mb-5 text-xs leading-5 text-slate-500">
                        Ranking de hashtags con mayor presencia en las conversaciones analizadas.
                    </p>

                    <div className="max-h-[520px] space-y-2 overflow-y-auto pr-1">
                        {popularHashtags.map((hashtag, index) => {
                            const percentage =
                                (hashtag.value / popularHashtags[0].value) * 100

                            return (
                                <div
                                    key={hashtag.tag}
                                    className="rounded-xl border border-slate-100 px-3 py-3"
                                >
                                    <div className="grid grid-cols-[28px_minmax(0,1fr)_120px_50px] items-center gap-2">
                                        <span className="text-[10px] font-bold text-slate-400">
                                            {String(index + 1).padStart(2, '0')}
                                        </span>

                                        <span className="truncate text-xs font-bold text-slate-700">
                                            {hashtag.tag}
                                        </span>

                                        <div className="flex items-center gap-2">
                                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                                                <div
                                                    className="h-full rounded-full bg-orange-500"
                                                    style={{
                                                        width: `${percentage}%`,
                                                    }}
                                                />
                                            </div>

                                            <span className="w-7 text-right text-[10px] font-semibold text-slate-500">
                                                {hashtag.value}
                                            </span>
                                        </div>

                                        <span className="rounded-md bg-emerald-50 px-1.5 py-1 text-center text-[9px] font-bold text-emerald-600">
                                            {hashtag.trend}
                                        </span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                        <span className="text-[11px] text-slate-400">
                            Clasificación automática mediante NLP
                        </span>

                        <button
                            type="button"
                            onClick={() => navigate('/messages')}
                            className="inline-flex items-center gap-1 text-xs font-bold text-orange-500 hover:text-orange-600"
                        >
                            Ver en Ingesta
                            <ChevronRight size={14} />
                        </button>
                    </div>
                </section>

                {/* TEMAS CLAVE */}
                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Tag size={18} className="text-orange-500" />

                            <h2 className="font-bold text-slate-900">
                                Temas clave detectados en la comunidad
                            </h2>
                        </div>

                        <span className="text-[11px] text-slate-400">
                            Clasificación semántica mediante IA
                        </span>
                    </div>

                    <p className="mb-5 text-xs leading-5 text-slate-500">
                        Agrupación temática de las conversaciones con mayor relevancia.
                    </p>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {keyTopics.map((topic) => {
                            const Icon = topic.icon

                            return (
                                <article
                                    key={topic.title}
                                    className="rounded-xl border border-slate-200 bg-slate-50/40 p-4"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex min-w-0 items-start gap-3">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                                                <Icon size={17} />
                                            </div>

                                            <h3 className="text-xs font-bold leading-5 text-slate-800">
                                                {topic.title}
                                            </h3>
                                        </div>

                                        <span className="shrink-0 text-sm font-black text-slate-900">
                                            {topic.percentage}%
                                        </span>
                                    </div>

                                    <p className="mt-3 min-h-[40px] text-[11px] leading-5 text-slate-500">
                                        {topic.description}
                                    </p>

                                    <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-200">
                                        <div
                                            className="h-full rounded-full bg-orange-500"
                                            style={{
                                                width: `${topic.percentage}%`,
                                            }}
                                        />
                                    </div>
                                </article>
                            )
                        })}
                    </div>
                </section>
            </div>

            {/* MENSAJES LISTOS PARA COPYWRITING */}
            <section>
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                        <CheckCircle2
                            size={19}
                            className="text-emerald-600"
                        />

                        <div>
                            <h2 className="font-bold text-slate-900">
                                Mensajes listos para Copywriting
                            </h2>

                            <p className="mt-0.5 text-xs text-slate-500">
                                Interacciones que cumplen los criterios de relevancia, tono y utilidad.
                            </p>
                        </div>
                    </div>

                    <span className="text-xs font-bold text-slate-600">
                        {incomingInteraction ? '1 mensaje seleccionado' : 'Sin selección desde Ingesta'}
                    </span>
                </div>

                {incomingInteraction ? (
                    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex flex-col gap-5">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#080A27] text-xs font-bold text-white">
                                        {incomingInteraction.author
                                            .split(/[\s._-]+/)
                                            .filter(Boolean)
                                            .slice(0, 2)
                                            .map((part) => part[0]?.toUpperCase())
                                            .join('')}
                                    </div>

                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="font-bold text-slate-900">
                                                {incomingInteraction.author}
                                            </p>

                                            <span className="rounded-md bg-indigo-50 px-2 py-1 text-[10px] font-semibold text-indigo-600">
                                                #{incomingInteraction.channel}
                                            </span>
                                        </div>

                                        <p className="mt-1 text-xs text-slate-500">
                                            Tema: {incomingInteraction.topic}
                                        </p>
                                    </div>
                                </div>

                                <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-700">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                    Listo para Copywriting
                                </span>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                                <p className="text-sm italic leading-6 text-slate-700">
                                    “{incomingInteraction.content}”
                                </p>
                            </div>

                            {incomingInteraction.keywords.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {incomingInteraction.keywords.map((keyword) => (
                                        <span
                                            key={keyword}
                                            className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600"
                                        >
                                            #{keyword}
                                        </span>
                                    ))}
                                </div>
                            )}

                            <div className="flex flex-col gap-4 border-t border-slate-100 pt-4 lg:flex-row lg:items-center lg:justify-between">
                                <div className="flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-slate-500">
                                    <span>
                                        Relevancia:{' '}
                                        <strong className="text-slate-800">
                                            {incomingInteraction.relevance}/100
                                        </strong>
                                    </span>

                                    <span>
                                        Alineación de marca:{' '}
                                        <strong className="text-slate-800">
                                            {brandAlignment}%
                                        </strong>
                                    </span>

                                    <span>
                                        Sentimiento:{' '}
                                        <strong
                                            className={
                                                incomingInteraction.sentiment === 'positive'
                                                    ? 'text-emerald-600'
                                                    : incomingInteraction.sentiment === 'negative'
                                                      ? 'text-rose-600'
                                                      : 'text-blue-600'
                                            }
                                        >
                                            {incomingInteraction.sentimentLabel}
                                        </strong>
                                    </span>
                                </div>

                                <button
                                    type="button"
                                    onClick={() =>
                                        handleSendToContent(incomingInteraction)
                                    }
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-orange-600"
                                >
                                    Enviar a Redacción de Contenidos
                                    <ChevronRight size={15} />
                                </button>
                            </div>
                        </div>
                    </article>
                ) : (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
                        <MessageSquare
                            size={32}
                            className="mx-auto text-slate-300"
                        />

                        <h3 className="mt-3 text-sm font-bold text-slate-700">
                            Aún no hay una interacción seleccionada
                        </h3>

                        <p className="mx-auto mt-1 max-w-xl text-xs leading-5 text-slate-500">
                            Desde Ingesta utiliza el botón Analizar para enviar una interacción a esta etapa del flujo.
                        </p>

                        <button
                            type="button"
                            onClick={() => navigate('/messages')}
                            className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-orange-500 hover:text-orange-600"
                        >
                            Ir a Ingesta
                            <ChevronRight size={14} />
                        </button>
                    </div>
                )}
            </section>

            {/* INSIGHTS */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <InsightCard
                    icon={<Lightbulb size={20} />}
                    iconClass="bg-orange-100 text-orange-500"
                    title="Insight principal"
                    subtitle="Detectado por IA"
                    content={analyticsData.insights.main}
                />

                <InsightCard
                    icon={<MessageSquare size={20} />}
                    iconClass="bg-blue-100 text-blue-600"
                    title="Preguntas frecuentes"
                    subtitle="Oportunidades de contenido"
                    content={analyticsData.insights.frequent_questions}
                />

                <InsightCard
                    icon={<AlertTriangle size={20} />}
                    iconClass="bg-red-100 text-red-500"
                    title="Atención requerida"
                    subtitle="Señales detectadas"
                    content={analyticsData.insights.attention_required}
                />
            </div>

            {/* ESTADO DE INTEGRACIÓN */}
            <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                <div className="flex items-start gap-3">
                    <Sparkles
                        size={17}
                        className="mt-0.5 shrink-0 text-blue-600"
                    />

                    <div>
                        <p className="text-xs font-bold text-blue-900">
                            Flujo de análisis CloudEdTech
                        </p>

                        <p className="mt-1 text-xs leading-5 text-blue-700">
                            Las métricas complementarias de emojis, hashtags,
                            alineación de marca y temas clave quedan preparadas
                            visualmente para conectarse al Motor IA definitivo.
                            Las interacciones seleccionadas desde Ingesta pueden
                            continuar hacia Redacción de Contenidos.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

function MetricCard({
    label,
    value,
    helper,
    icon,
    iconClass,
    accent = 'text-slate-900',
}: {
    label: string
    value: string
    helper: string
    icon: React.ReactNode
    iconClass: string
    accent?: string
}) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {label}
                    </p>

                    <p className={`mt-3 text-2xl font-black ${accent}`}>
                        {value}
                    </p>

                    <p className="mt-2 text-[11px] leading-4 text-slate-400">
                        {helper}
                    </p>
                </div>

                <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
                >
                    {icon}
                </div>
            </div>
        </div>
    )
}

function InsightCard({
    icon,
    iconClass,
    title,
    subtitle,
    content,
}: {
    icon: React.ReactNode
    iconClass: string
    title: string
    subtitle: string
    content: string
}) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
                <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClass}`}
                >
                    {icon}
                </div>

                <div>
                    <h3 className="font-semibold text-slate-900">
                        {title}
                    </h3>

                    <p className="text-xs text-slate-400">
                        {subtitle}
                    </p>
                </div>
            </div>

            <p className="text-sm leading-6 text-slate-600">
                {content}
            </p>
        </div>
    )
}

export default Analytics