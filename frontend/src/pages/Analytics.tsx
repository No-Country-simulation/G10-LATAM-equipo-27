import { updateMessageWorkflow } from '../api/messageWorkflow'
import { updateMessageCuration } from '../api/messageCuration'
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

import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'


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

type MotorMessageResponse = {
    messages: Array<{
        message: {
            interaction_id: number
            message_id: string
            author_name: string
            channel_name: string
            content: string
        }
        analysis: {
            sentiment: 'positive' | 'neutral' | 'negative'
            topic: string
            keywords: string[]
            relevance: number
            workflow_stage: string
            curation_status: 'pending' | 'curated' | 'discarded'
        }
    }>
}

const MOTOR_API_URL =
    import.meta.env.VITE_MOTOR_API_URL || 'http://127.0.0.1:8002'

type MotorAnalyticsResponse = {
    sentiment?: {
        distribution?: Array<{ name: string; value: number }>
    }
    topics?: Array<{ topic: string; percentage: number }>
    hashtags?: Array<{
        id: number
        name: string
        mentions: number
        growth: number | null
    }>
}

const topicIcons = [BarChart3, MessageSquare, ShieldCheck, Sparkles]

function Analytics() {
    const navigate = useNavigate()
    const location = useLocation()

    const [motorAnalytics, setMotorAnalytics] =
        useState<MotorAnalyticsResponse | null>(null)
    const [analyticsError, setAnalyticsError] = useState<string | null>(null)

    useEffect(() => {
        const controller = new AbortController()

        const loadAnalytics = async () => {
            try {
                const response = await fetch(
                    `${MOTOR_API_URL}/api/community/analytics`,
                    { signal: controller.signal },
                )
                if (!response.ok) {
                    throw new Error(`Analytics HTTP ${response.status}`)
                }
                const data =
                    (await response.json()) as MotorAnalyticsResponse
                setMotorAnalytics(data)
                setAnalyticsError(null)
            } catch (error) {
                if (controller.signal.aborted) return
                setAnalyticsError(
                    error instanceof Error ? error.message : 'Error de Analytics',
                )
            }
        }

        void loadAnalytics()
        return () => controller.abort()
    }, [])

    const [analysisQueue, setAnalysisQueue] = useState<
        Array<{
            interactionId: number
            curationStatus: 'pending' | 'curated' | 'discarded'
            interaction: IncomingInteraction
        }>
    >([])
    const [queueError, setQueueError] = useState<string | null>(null)
    const [queueLoading, setQueueLoading] = useState(true)
    const [sendingToContent, setSendingToContent] = useState(false)
    const [workflowError, setWorkflowError] = useState<string | null>(null)

    const interactionParam = new URLSearchParams(location.search)
        .get('interaction')

    const interactionId = interactionParam
        ? Number(interactionParam)
        : null

    useEffect(() => {
        const controller = new AbortController()

        const loadQueue = async () => {
            setQueueLoading(true)
            setQueueError(null)

            try {
                const response = await fetch(
                    `${MOTOR_API_URL}/api/community/messages?limit=500`,
                    { signal: controller.signal },
                )

                if (!response.ok) {
                    throw new Error('No se pudo consultar la bandeja de Analisis')
                }

                const data: MotorMessageResponse = await response.json()

                const queue = data.messages
                    .filter(
                        (item) =>
                            item.analysis.workflow_stage === 'en_analisis' &&
                        item.analysis.curation_status !== 'discarded',
                    )
                    .map((item) => {
                        const sentiment = item.analysis.sentiment
                        const sentimentLabel = {
                            positive: 'Positivo',
                            neutral: 'Neutral',
                            negative: 'Negativo',
                        }[sentiment]

                        return {
                            interactionId: item.message.interaction_id,
                            curationStatus: item.analysis.curation_status,
                            interaction: {
                                id: item.message.message_id,
                                author: item.message.author_name || 'Usuario',
                                channel: item.message.channel_name,
                                content: item.message.content,
                                sentiment,
                                sentimentLabel,
                                topic: item.analysis.topic,
                                keywords: item.analysis.keywords || [],
                                relevance: item.analysis.relevance,
                            },
                        }
                    })

                if (!controller.signal.aborted) {
                    setAnalysisQueue(queue)
                }
            } catch (error) {
                if (!controller.signal.aborted) {
                    setQueueError(
                        error instanceof Error
                            ? error.message
                            : 'No fue posible recuperar la bandeja',
                    )
                }
            } finally {
                if (!controller.signal.aborted) {
                    setQueueLoading(false)
                }
            }
        }

        void loadQueue()

        return () => controller.abort()
    }, [location.key])

    const selectedQueueItem =
        analysisQueue.find(
            (item) => item.interactionId === interactionId,
        ) ?? analysisQueue[0]

    const incomingInteraction =
        selectedQueueItem?.interaction ?? null

    const [messageStats, setMessageStats] = useState<{
        total: number
        positive: number
        relevance: number | null
        alerts: number
        priorityAlerts: number
        questionCount: number
        frequentQuestionTopic: string | null
        frequentQuestionTopicCount: number
    } | null>(null)

    useEffect(() => {
        const controller = new AbortController()

        const loadStats = async () => {
            try {
                const response = await fetch(
                    `${MOTOR_API_URL}/api/community/messages?limit=500`,
                    { signal: controller.signal },
                )
                if (!response.ok) throw new Error(`HTTP ${response.status}`)

                const data = (await response.json()) as MotorMessageResponse & {
                    total?: number
                }

                const messages = data.messages ?? []
                const analyzed = messages.filter(
                    (item) => Number.isFinite(Number(item.analysis?.relevance)),
                )
                const relevance = analyzed.length
                    ? analyzed.reduce(
                          (sum, item) => sum + Number(item.analysis.relevance),
                          0,
                      ) / analyzed.length
                    : null

                const questions = messages.filter((item) => {
                    const content = item.message?.content?.trim() ?? ''
                    return content.includes('?') ||
                        content.includes('?')
                })

                const questionTopics = new Map<string, number>()

                for (const item of questions) {
                    const topic = item.analysis?.topic?.trim()
                    if (
                        !topic ||
                        topic.toUpperCase() === 'SIN_CLASIFICAR'
                    ) continue
                    questionTopics.set(
                        topic,
                        (questionTopics.get(topic) ?? 0) + 1,
                    )
                }

                const mostFrequentQuestionTopic =
                    [...questionTopics.entries()].sort(
                        (a, b) => b[1] - a[1],
                    )[0] ?? null

                setMessageStats({
                    total: data.total ?? messages.length,
                    positive: messages.filter(
                        (item) => item.analysis?.sentiment === 'positive',
                    ).length,
                    relevance,
                    alerts: messages.filter(
                        (item) => item.analysis?.sentiment === 'negative',
                    ).length,
                    priorityAlerts: messages.filter(
                        (item) =>
                            item.analysis?.sentiment === 'negative' &&
                            Number(item.analysis?.relevance) >= 70,
                    ).length,
                    questionCount: questions.length,
                    frequentQuestionTopic:
                        mostFrequentQuestionTopic?.[0] ?? null,
                    frequentQuestionTopicCount:
                        mostFrequentQuestionTopic?.[1] ?? 0,
                })
            } catch (error) {
                if (!controller.signal.aborted) {
                    setAnalyticsError(
                        error instanceof Error ? error.message : 'Error al consultar mensajes',
                    )
                }
            }
        }

        void loadStats()
        return () => controller.abort()
    }, [])

    const totalMessages = messageStats?.total ?? 0
    const positivePercentage =
        messageStats && totalMessages > 0
            ? (messageStats.positive / totalMessages) * 100
            : null
    const relevanceAverage = messageStats?.relevance ?? null

    const popularHashtags = (motorAnalytics?.hashtags ?? [])
        .slice()
        .sort((a, b) => b.mentions - a.mentions)
        .slice(0, 15)
        .map((item) => ({
            tag: item.name,
            value: item.mentions,
            trend:
                item.growth === null
                    ? 'N/D'
                    : `${item.growth > 0 ? '+' : ''}${item.growth}%`,
        }))

    const keyTopics = (motorAnalytics?.topics ?? []).map((item, index) => ({
        title: item.topic,
        description: 'Tema detectado por el motor de análisis',
        percentage: item.percentage,
        icon: topicIcons[index % topicIcons.length],
    }))

    const brandAlignment = 'N/D'

    const leadingTopic = [...(motorAnalytics?.topics ?? [])]
        .sort((a, b) => b.percentage - a.percentage)[0]

    const analyticsData = {
        insights: {
            main: leadingTopic
                ? `Tema con mayor presencia: ${leadingTopic.topic} (${leadingTopic.percentage}%).`
                : 'Sin datos suficientes para identificar el tema principal.',
            frequent_questions:
                messageStats === null
                    ? 'Esperando datos de preguntas del Motor IA.'
                    : messageStats.questionCount === 0
                      ? 'No se detectaron preguntas en los mensajes consultados.'
                      : messageStats.frequentQuestionTopic
                        ? `${messageStats.questionCount} preguntas detectadas. Tema más frecuente: ${messageStats.frequentQuestionTopic} (${messageStats.frequentQuestionTopicCount} preguntas).`
                        : `${messageStats.questionCount} preguntas detectadas, sin temas clasificados.`,
            attention_required:
                messageStats === null
                    ? 'Sin datos disponibles sobre mensajes que requieren atención.'
                    : `${messageStats.alerts} mensajes negativos detectados; ${messageStats.priorityAlerts} con relevancia alta (70 o más).`,
        },
    }


    const [savingCuration, setSavingCuration] = useState(false)

    const handleReviewCuration = async (
        status: 'curated' | 'discarded',
    ) => {
        if (!selectedQueueItem || savingCuration) return

        const id = selectedQueueItem.interactionId
        setSavingCuration(true)
        setWorkflowError(null)

        try {
            await updateMessageCuration(id, status)

            setAnalysisQueue((current) =>
                status === 'discarded'
                    ? current.filter((item) => item.interactionId !== id)
                    : current.map((item) =>
                          item.interactionId === id
                              ? { ...item, curationStatus: status }
                              : item,
                      ),
            )
        } catch (error) {
            setWorkflowError(
                error instanceof Error
                    ? error.message
                    : 'No fue posible guardar la curaduría',
            )
        } finally {
            setSavingCuration(false)
        }
    }

    const handleSendToContent = async (
        interaction: IncomingInteraction,
    ) => {
        if (sendingToContent || !selectedQueueItem) return

        if (selectedQueueItem.curationStatus !== 'curated') {
            setWorkflowError(
                'Este mensaje sigue pendiente de curaduría. Debe ser curado antes de enviarlo a Redacción.',
            )
            return
        }

        setSendingToContent(true)
        setWorkflowError(null)

        try {
            await updateMessageWorkflow(
                selectedQueueItem.interactionId,
                'en_redaccion',
            )

            navigate('/content', {
                state: {
                    source: 'analytics',
                    interaction,
                    interactionId: selectedQueueItem.interactionId,
                },
            })
        } catch (error) {
            setWorkflowError(
                error instanceof Error
                    ? error.message
                    : 'No fue posible enviar el mensaje a Redaccion',
            )
        } finally {
            setSendingToContent(false)
        }
    }

    return (
        <div className="space-y-8">
            {analyticsError && (
                <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    No fue posible actualizar todas las métricas: {analyticsError}
                </p>
            )}
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
                        value={String(totalMessages)}
                        helper="Comunidad Discord"
                        icon={<MessageSquare size={19} />}
                        iconClass="bg-orange-100 text-orange-500"
                    />

                    <MetricCard
                        label="Sentimiento positivo"
                        value={positivePercentage === null ? 'N/D' : `${positivePercentage.toFixed(1)}%`}
                        helper="De los mensajes"
                        icon={<TrendingUp size={19} />}
                        iconClass="bg-emerald-100 text-emerald-600"
                    />

                    <MetricCard
                        label="Temas detectados"
                        value={String(motorAnalytics?.topics?.length ?? 0)}
                        helper="Temas principales"
                        icon={<BarChart3 size={19} />}
                        iconClass="bg-blue-100 text-blue-600"
                    />

                    <MetricCard
                        label="Relevancia promedio"
                        value={relevanceAverage === null ? 'N/D' : relevanceAverage.toFixed(2)}
                        helper="Contenido detectado"
                        icon={<Zap size={19} />}
                        iconClass="bg-purple-100 text-purple-600"
                    />

                    <MetricCard
                        label="Alineación de marca"
                        value={String(brandAlignment)}
                        helper="Consistencia de tono CloudEdTech"
                        icon={<ShieldCheck size={19} />}
                        iconClass="bg-emerald-100 text-emerald-600"
                        accent="text-emerald-600"
                    />

                    <MetricCard
                        label="Alertas"
                        value={messageStats === null ? "N/D" : String(messageStats.priorityAlerts)}
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
                    {([] as Array<{emoji: string; label: string; description: string; value: number; trend: string}>).map((item) => {
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
                                popularHashtags[0]?.value ? (hashtag.value / popularHashtags[0].value) * 100 : 0

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

            {/* BANDEJA PERSISTENTE DE ANALISIS */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="text-base font-bold text-slate-900">
                            Bandeja de mensajes en Analisis
                        </h2>
                        <p className="mt-1 text-xs text-slate-500">
                            Mensajes guardados en el flujo de trabajo.
                        </p>
                    </div>
                    <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-600">
                        {analysisQueue.length} en analisis
                    </span>
                </div>

                {queueLoading && (
                    <p className="text-sm text-slate-500">
                        Cargando mensajes...
                    </p>
                )}

                {queueError && (
                    <p role="alert" className="text-sm text-rose-600">
                        {queueError}
                    </p>
                )}

                {!queueLoading && !queueError && analysisQueue.length === 0 && (
                    <p className="text-sm text-slate-500">
                        No hay mensajes pendientes de analisis.
                    </p>
                )}

                {analysisQueue.length > 0 && (
                    <div className="grid gap-2 md:grid-cols-2">
                        {analysisQueue.map((item) => (
                            <button
                                key={item.interactionId}
                                type="button"
                                onClick={() =>
                                    navigate(
                                        `/analytics?interaction=${item.interactionId}`,
                                    )
                                }
                                className={`rounded-xl border p-4 text-left transition ${
                                    selectedQueueItem?.interactionId === item.interactionId
                                        ? 'border-orange-400 bg-orange-50'
                                        : 'border-slate-200 hover:border-orange-200'
                                }`}
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-xs font-bold text-slate-800">
                                        {item.interaction.author}
                                    </span>
                                    <span className="text-[11px] text-slate-500">
                                        #{item.interaction.channel}
                                    </span>
                                </div>
                                <p className="mt-2 line-clamp-2 text-xs text-slate-600">
                                    {item.interaction.content}
                                </p>
                            </button>
                        ))}
                    </div>
                )}
            </section>

            {workflowError && (
                <div
                    role="alert"
                    className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
                >
                    {workflowError}
                </div>
            )}

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
                                Revisión de mensajes y curaduría
                            </h2>

                            <p className="mt-0.5 text-xs text-slate-500">
                                Revisa las interacciones antes de habilitar su envío a Redacción.
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
                                    {selectedQueueItem?.curationStatus === 'curated'
                                        ? 'Listo para Copywriting'
                                        : 'Pendiente de curadur?a'}
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

                                {selectedQueueItem?.curationStatus === 'pending' && (
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            disabled={savingCuration}
                                            onClick={() => void handleReviewCuration('curated')}
                                            className="rounded-xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white disabled:opacity-50"
                                        >
                                            Aprobar curaduría
                                        </button>
                                        <button
                                            type="button"
                                            disabled={savingCuration}
                                            onClick={() => void handleReviewCuration('discarded')}
                                            className="rounded-xl border border-rose-300 px-4 py-3 text-xs font-bold text-rose-600 disabled:opacity-50"
                                        >
                                            Descartar
                                        </button>
                                    </div>
                                )}

                                {selectedQueueItem?.curationStatus === 'pending' && (
                                    <p className="text-xs text-amber-700">
                                        Pendiente de curaduría: aprueba el mensaje
                                        para habilitar su envío a Redacción.
                                    </p>
                                )}
                                <button
                                    type="button"
                                    onClick={() =>
                                        void handleSendToContent(incomingInteraction)
                                    }
                                    disabled={
                                        sendingToContent ||
                                        savingCuration ||
                                        selectedQueueItem?.curationStatus !== 'curated'
                                    }
                                    aria-busy={sendingToContent}
                                    className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-xs font-bold text-white shadow-sm transition ${
                                        selectedQueueItem?.curationStatus === 'curated'
                                            ? 'bg-orange-500 hover:bg-orange-600'
                                            : 'cursor-not-allowed bg-slate-400 opacity-70'
                                    }`}
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
                            CloudEdTech consulta estad?sticas de sentimiento,
                            temas y hashtags desde el Motor IA. Las preguntas
                            frecuentes y alertas se calculan con los mensajes
                            reales disponibles de Discord. El flujo editorial
                            conecta Ingesta, An?lisis, Redacci?n de Contenidos
                            y Aprobaciones. Algunas m?tricas complementarias
                            siguen pendientes de integraci?n.
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