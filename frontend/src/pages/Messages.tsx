import {
    Check,
    ChevronRight,
    CirclePlus,
    Clock3,
    Copy,
    Filter,
    Hash,
    MessageCircle,
    RefreshCw,
    Search,
    Send,
    Server,
    ShieldAlert,
    Smile,
    Tag,
    ThumbsUp,
    X,
} from 'lucide-react'

import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

type ApiMessage = {
    message: {
        platform: string
        guild_id: string
        guild_name: string
        channel_id: string
        channel_name: string
        message_id: string
        author_id: string
        author_name: string
        content: string
        created_at: string
    }
    analysis: {
        sentiment: 'positive' | 'neutral' | 'negative'
        sentiment_score: number
        topic: string
        keywords: string[]
        highlight: boolean
    }
}

type MessagesApiResponse = {
    total: number
    messages: ApiMessage[]
}

type CurationStatus = 'pending' | 'curated' | 'discarded'

type MessageItem = {
    id: string
    initials: string
    author: string
    guild: string
    channel: string
    time: string
    rawDate: Date
    message: string
    sentiment: 'positive' | 'neutral' | 'negative'
    sentimentLabel: string
    sentimentScore: number
    topic: string
    keywords: string[]
    classification: string
    relevance: number
    highlight: boolean
}

const API_BASE_URL =
    import.meta.env.VITE_MOTOR_API_URL || 'http://127.0.0.1:8001'

function Messages() {
    const navigate = useNavigate()

    const [apiData, setApiData] = useState<MessagesApiResponse>({
        total: 0,
        messages: [],
    })

    const [searchTerm, setSearchTerm] = useState('')
    const [channelFilter, setChannelFilter] = useState('all')
    const [sentimentFilter, setSentimentFilter] = useState('all')
    const [timeFilter, setTimeFilter] = useState('all')
    const [curationFilter, setCurationFilter] = useState('all')
    const [curationStatus, setCurationStatus] = useState<
        Record<string, CurationStatus>
    >({})
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [apiConnected, setApiConnected] = useState(false)

    const loadMessages = async () => {
        try {
            setIsRefreshing(true)

            const response = await fetch(
                `${API_BASE_URL}/api/community/messages`
            )

            if (!response.ok) {
                throw new Error(`Error HTTP ${response.status}`)
            }

            const data: MessagesApiResponse = await response.json()

            setApiData(data)
            setApiConnected(true)
        } catch (error) {
            console.error('Error cargando mensajes:', error)
            setApiConnected(false)
        } finally {
            setIsRefreshing(false)
        }
    }

    useEffect(() => {
        loadMessages()

        const interval = window.setInterval(loadMessages, 5000)

        return () => {
            window.clearInterval(interval)
        }
    }, [])

    const messageItems: MessageItem[] = useMemo(
        () =>
            apiData.messages.map(({ message, analysis }) => {
                const author = message.author_name || 'Usuario'

                const initials =
                    author
                        .split(/[\s._-]+/)
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((part) => part[0]?.toUpperCase())
                        .join('') || 'U'

                const createdAt = new Date(message.created_at)

                const sentimentLabel = {
                    positive: 'Positivo',
                    neutral: 'Neutral',
                    negative: 'Negativo',
                }[analysis.sentiment]

                const score = Math.round(
                    Math.max(0, Math.min(1, analysis.sentiment_score)) * 100
                )

                return {
                    id: message.message_id,
                    initials,
                    author,
                    guild: message.guild_name || 'Discord',
                    channel: message.channel_name,
                    time: createdAt.toLocaleString('es-CO'),
                    rawDate: createdAt,
                    message: message.content,
                    sentiment: analysis.sentiment,
                    sentimentLabel,
                    sentimentScore: score,
                    topic: analysis.topic,
                    keywords: analysis.keywords || [],
                    classification: analysis.highlight
                        ? 'Destacado'
                        : 'Mensaje',
                    relevance: score,
                    highlight: analysis.highlight,
                }
            }),
        [apiData.messages]
    )

    const channels = useMemo(
        () =>
            Array.from(
                new Set(
                    messageItems
                        .map((message) => message.channel)
                        .filter(Boolean)
                )
            ).sort(),
        [messageItems]
    )

    const positiveMessages = messageItems.filter(
        (message) => message.sentiment === 'positive'
    ).length

    const questionMessages = messageItems.filter((message) =>
        message.message.trim().endsWith('?')
    ).length

    const highlightedMessages = messageItems.filter(
        (message) => message.highlight
    ).length

    const curatedMessages = Object.values(curationStatus).filter(
        (status) => status === 'curated'
    ).length

    const ragIncidents = messageItems.filter(
        (message) =>
            message.sentiment === 'negative' &&
            message.relevance >= 70
    ).length

    const matchesTimeFilter = (date: Date) => {
        if (timeFilter === 'all') return true

        const now = new Date()
        const difference = now.getTime() - date.getTime()
        const hours = difference / (1000 * 60 * 60)

        if (timeFilter === '24h') return hours <= 24
        if (timeFilter === 'week') return hours <= 24 * 7
        if (timeFilter === 'month') return hours <= 24 * 30

        return true
    }

    const filteredMessages = messageItems.filter((message) => {
        const search = searchTerm.trim().toLowerCase()

        const matchesSearch =
            !search ||
            message.author.toLowerCase().includes(search) ||
            message.message.toLowerCase().includes(search) ||
            message.topic.toLowerCase().includes(search) ||
            message.channel.toLowerCase().includes(search) ||
            message.keywords.some((keyword) =>
                keyword.toLowerCase().includes(search)
            )

        const matchesChannel =
            channelFilter === 'all' ||
            message.channel === channelFilter

        const matchesSentiment =
            sentimentFilter === 'all' ||
            message.sentiment === sentimentFilter

        const currentStatus =
            curationStatus[message.id] || 'pending'

        const matchesCuration =
            curationFilter === 'all' ||
            currentStatus === curationFilter

        return (
            matchesSearch &&
            matchesChannel &&
            matchesSentiment &&
            matchesCuration &&
            matchesTimeFilter(message.rawDate)
        )
    })

    const markCuration = (
        messageId: string,
        status: CurationStatus
    ) => {
        setCurationStatus((current) => ({
            ...current,
            [messageId]: status,
        }))
    }

    const handleAnalyze = (message: MessageItem) => {
    navigate('/analytics', {
        state: {
            source: 'ingesta',
            interaction: {
                id: message.id,
                author: message.author,
                channel: message.channel,
                content: message.message,
                sentiment: message.sentiment,
                sentimentLabel: message.sentimentLabel,
                topic: message.topic,
                keywords: message.keywords,
                relevance: message.relevance,
            },
        },
    })
}

    const clearFilters = () => {
        setSearchTerm('')
        setChannelFilter('all')
        setSentimentFilter('all')
        setTimeFilter('all')
        setCurationFilter('all')
    }

    return (
        <div className="space-y-6">
            {/* Encabezado */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-500">
                        <MessageCircle size={21} />
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">
                            Ingesta de mensajes
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Monitoreo, análisis y curaduría de conversaciones de Discord
                        </p>
                    </div>
                </div>

                <div
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 ${
                        apiConnected
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                    }`}
                >
                    <div
                        className={`h-2 w-2 rounded-full ${
                            apiConnected
                                ? 'bg-emerald-500'
                                : 'bg-amber-500'
                        }`}
                    />

                    <span className="text-xs font-semibold">
                        {apiConnected
                            ? 'Motor de ingesta conectado'
                            : 'Esperando conexión del Motor IA'}
                    </span>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <KpiCard
                    label="Mensajes analizados"
                    value={messageItems.length}
                    helper="Datos recibidos del motor"
                />

                <KpiCard
                    label="Positivos"
                    value={positiveMessages}
                    helper={
                        messageItems.length > 0
                            ? `${Math.round(
                                  (positiveMessages /
                                      messageItems.length) *
                                      100
                              )}% del total`
                            : 'Sin datos disponibles'
                    }
                    valueClass="text-emerald-600"
                />

                <KpiCard
                    label="Preguntas"
                    value={questionMessages}
                    helper="Detectadas en la ingesta"
                    valueClass="text-blue-600"
                />

                <KpiCard
                    label="Destacados"
                    value={highlightedMessages}
                    helper="Interacciones relevantes"
                    valueClass="text-orange-500"
                />
            </div>

            {/* Estado Discord */}
            <section className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-sm">
                            <MessageCircle size={25} />
                        </div>

                        <div>
                            <div className="flex flex-wrap items-baseline gap-2">
                                <span className="text-3xl font-black tracking-tight text-slate-950">
                                    {apiData.total || messageItems.length}
                                </span>

                                <span className="text-sm font-semibold text-slate-500">
                                    Mensajes totales recibidos
                                </span>
                            </div>

                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                                <span
                                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-semibold ${
                                        apiConnected
                                            ? 'bg-emerald-50 text-emerald-700'
                                            : 'bg-amber-50 text-amber-700'
                                    }`}
                                >
                                    <span
                                        className={`h-1.5 w-1.5 rounded-full ${
                                            apiConnected
                                                ? 'bg-emerald-500'
                                                : 'bg-amber-500'
                                        }`}
                                    />

                                    {apiConnected
                                        ? 'Conexión a Discord activa'
                                        : 'Conexión pendiente'}
                                </span>

                                <span className="text-slate-400">
                                    Gateway WebSocket
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex divide-x divide-slate-200 rounded-xl border border-slate-100">
                        <div className="px-6 py-2 text-center">
                            <p className="text-xs font-medium text-slate-500">
                                Listos para curaduría
                            </p>
                            <p className="mt-1 text-lg font-bold text-orange-500">
                                {Math.max(
                                    messageItems.length -
                                        curatedMessages,
                                    0
                                )}
                            </p>
                        </div>

                        <div className="px-6 py-2 text-center">
                            <p className="text-xs font-medium text-slate-500">
                                Incidentes RAG
                            </p>
                            <p className="mt-1 text-lg font-bold text-rose-600">
                                {ragIncidents}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Panel de filtrado */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-2">
                        <Filter size={17} className="text-orange-500" />
                        <h3 className="font-bold text-slate-900">
                            Panel de filtrado de mensajes
                        </h3>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={clearFilters}
                            className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-200"
                        >
                            Deseleccionar
                        </button>

                        <button
                            type="button"
                            onClick={loadMessages}
                            className="inline-flex items-center gap-2 rounded-xl bg-[#080A27] px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90"
                        >
                            <RefreshCw
                                size={14}
                                className={
                                    isRefreshing
                                        ? 'animate-spin'
                                        : ''
                                }
                            />
                            Actualizar
                        </button>

                        <button
                            type="button"
                            disabled
                            title="Disponible cuando se integre la creación manual de interacciones"
                            className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-xs font-semibold text-white opacity-60"
                        >
                            <CirclePlus size={14} />
                            Añadir interacción
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1.1fr_1.35fr_1fr]">
                    {/* Tiempo */}
                    <div>
                        <label className="mb-2 block text-xs font-semibold text-slate-600">
                            Filtro de tiempo
                        </label>

                        <div className="grid grid-cols-4 rounded-xl bg-slate-100 p-1">
                            {[
                                ['24h', '24 Horas'],
                                ['week', 'Semana'],
                                ['month', 'Mes'],
                                ['all', 'Todo'],
                            ].map(([value, label]) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() =>
                                        setTimeFilter(value)
                                    }
                                    className={`rounded-lg px-2 py-2 text-[11px] font-semibold transition ${
                                        timeFilter === value
                                            ? 'bg-white text-slate-900 shadow-sm'
                                            : 'text-slate-500'
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Canal */}
                    <div>
                        <label className="mb-2 block text-xs font-semibold text-slate-600">
                            Canales monitoreados
                        </label>

                        <div className="relative">
                            <Hash
                                size={15}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <select
                                value={channelFilter}
                                onChange={(event) =>
                                    setChannelFilter(
                                        event.target.value
                                    )
                                }
                                className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-xs font-medium text-slate-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                            >
                                <option value="all">
                                    Todos los canales ({channels.length})
                                </option>

                                {channels.map((channel) => (
                                    <option
                                        key={channel}
                                        value={channel}
                                    >
                                        #{channel}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Búsqueda */}
                    <div>
                        <label className="mb-2 block text-xs font-semibold text-slate-600">
                            Identificación y búsqueda
                        </label>

                        <div className="relative">
                            <Search
                                size={15}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <input
                                type="text"
                                placeholder="Buscar usuario, tema, canal o palabra clave..."
                                value={searchTerm}
                                onChange={(event) =>
                                    setSearchTerm(event.target.value)
                                }
                                className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-4 text-xs outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                            />
                        </div>
                    </div>

                    {/* Estado */}
                    <div>
                        <label className="mb-2 block text-xs font-semibold text-slate-600">
                            Estado de curación
                        </label>

                        <select
                            value={curationFilter}
                            onChange={(event) =>
                                setCurationFilter(event.target.value)
                            }
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                        >
                            <option value="all">
                                Todos los estados
                            </option>
                            <option value="pending">
                                Pendiente
                            </option>
                            <option value="curated">
                                Pasado a curaduría
                            </option>
                            <option value="discarded">
                                Descartado
                            </option>
                        </select>
                    </div>
                </div>

                <div className="mt-4">
                    <select
                        value={sentimentFilter}
                        onChange={(event) =>
                            setSentimentFilter(event.target.value)
                        }
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 outline-none focus:border-orange-400"
                    >
                        <option value="all">
                            Todos los sentimientos
                        </option>
                        <option value="positive">
                            Positivo
                        </option>
                        <option value="neutral">
                            Neutral
                        </option>
                        <option value="negative">
                            Negativo
                        </option>
                    </select>
                </div>
            </section>

            {/* Cabecera de cola */}
            <div className="flex flex-col gap-2 px-1 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs font-medium text-slate-500">
                    Mostrando{' '}
                    <span className="font-bold text-slate-700">
                        {filteredMessages.length}
                    </span>{' '}
                    mensajes en la cola de ingesta
                </p>

                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span
                        className={`h-2 w-2 rounded-full ${
                            apiConnected
                                ? 'bg-emerald-500'
                                : 'bg-amber-400'
                        }`}
                    />
                    Actualización en streaming
                    {apiConnected ? ' activa' : ' pendiente'}
                </div>
            </div>

            {/* Mensajes */}
            <div className="space-y-4">
                {filteredMessages.length === 0 && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                        <MessageCircle
                            size={36}
                            className="mx-auto text-slate-300"
                        />

                        <h3 className="mt-4 font-semibold text-slate-900">
                            No se encontraron mensajes
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                            No hay mensajes disponibles con los filtros seleccionados.
                        </p>
                    </div>
                )}

                {filteredMessages.map((message) => {
                    const status =
                        curationStatus[message.id] || 'pending'

                    return (
                        <article
                            key={message.id}
                            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
                        >
                            <div className="flex flex-col xl:flex-row">
                                {/* Contenido */}
                                <div className="min-w-0 flex-1 p-5">
                                    <div className="flex items-start gap-3">
                                        <input
                                            type="checkbox"
                                            aria-label={`Seleccionar mensaje de ${message.author}`}
                                            className="mt-3 h-4 w-4 rounded border-slate-300 accent-orange-500"
                                        />

                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
                                            {message.initials}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                                <p className="font-bold text-slate-900">
                                                    {message.author}
                                                </p>

                                                <span className="text-xs text-slate-400">
                                                    @{message.author
                                                        .toLowerCase()
                                                        .replace(
                                                            /\s+/g,
                                                            '_'
                                                        )}
                                                </span>

                                                <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-500">
                                                    {message.classification}
                                                </span>

                                                <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-1 text-[10px] font-semibold text-indigo-600">
                                                    <Hash size={11} />
                                                    {message.channel}
                                                </span>

                                                <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
                                                    <Clock3 size={11} />
                                                    {message.time}
                                                </span>
                                            </div>

                                            <p className="mt-3 text-sm leading-6 text-slate-700">
                                                {message.message}
                                            </p>

                                            {/* Keywords */}
                                            {message.keywords.length > 0 && (
                                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                                    <Tag
                                                        size={13}
                                                        className="text-slate-400"
                                                    />

                                                    {message.keywords
                                                        .slice(0, 6)
                                                        .map(
                                                            (
                                                                keyword
                                                            ) => (
                                                                <span
                                                                    key={
                                                                        keyword
                                                                    }
                                                                    className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-medium text-slate-600"
                                                                >
                                                                    #
                                                                    {
                                                                        keyword
                                                                    }
                                                                </span>
                                                            )
                                                        )}
                                                </div>
                                            )}

                                            {/* Reacciones visuales */}
                                            <div className="mt-4 flex flex-wrap gap-2">
                                                <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] text-slate-600">
                                                    <Smile size={12} />
                                                    IA
                                                </span>

                                                <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] text-slate-600">
                                                    <ThumbsUp size={12} />
                                                    Analizado
                                                </span>

                                                {message.highlight && (
                                                    <span className="rounded-lg border border-orange-200 bg-orange-50 px-2.5 py-1 text-[11px] font-semibold text-orange-700">
                                                        Destacado
                                                    </span>
                                                )}
                                            </div>

                                            {/* Metadatos IA */}
                                            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 pt-3 text-[11px]">
                                                <span className="text-slate-500">
                                                    Tema:{' '}
                                                    <strong className="text-slate-700">
                                                        {message.topic}
                                                    </strong>
                                                </span>

                                                <span className="text-slate-500">
                                                    Relevancia:{' '}
                                                    <strong className="text-slate-700">
                                                        {message.relevance}%
                                                    </strong>
                                                </span>

                                                <span className="text-slate-500">
                                                    Sentimiento:{' '}
                                                    <strong
                                                        className={
                                                            message.sentiment ===
                                                            'positive'
                                                                ? 'text-emerald-600'
                                                                : message.sentiment ===
                                                                    'negative'
                                                                  ? 'text-rose-600'
                                                                  : 'text-blue-600'
                                                        }
                                                    >
                                                        {
                                                            message.sentimentLabel
                                                        }
                                                    </strong>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Acciones */}
                                <aside className="flex shrink-0 flex-col justify-between gap-4 border-t border-slate-100 bg-slate-50/40 p-4 xl:w-56 xl:border-l xl:border-t-0">
                                    <div>
                                        <StatusBadge
                                            status={status}
                                        />

                                        <div className="mt-3 grid grid-cols-3 gap-1 rounded-xl border border-slate-200 bg-white p-1">
                                            <button
                                                type="button"
                                                title="Pasar a curaduría"
                                                onClick={() =>
                                                    markCuration(
                                                        message.id,
                                                        'curated'
                                                    )
                                                }
                                                className={`flex h-9 items-center justify-center rounded-lg transition ${
                                                    status ===
                                                    'curated'
                                                        ? 'bg-emerald-600 text-white'
                                                        : 'text-slate-400 hover:bg-emerald-50 hover:text-emerald-600'
                                                }`}
                                            >
                                                <Check size={15} />
                                            </button>

                                            <button
                                                type="button"
                                                title="Descartar"
                                                onClick={() =>
                                                    markCuration(
                                                        message.id,
                                                        'discarded'
                                                    )
                                                }
                                                className={`flex h-9 items-center justify-center rounded-lg transition ${
                                                    status ===
                                                    'discarded'
                                                        ? 'bg-rose-500 text-white'
                                                        : 'text-slate-400 hover:bg-rose-50 hover:text-rose-500'
                                                }`}
                                            >
                                                <X size={15} />
                                            </button>

                                            <button
                                                type="button"
                                                title="Copiar contenido"
                                                onClick={() =>
                                                    navigator.clipboard.writeText(
                                                        message.message
                                                    )
                                                }
                                                className="flex h-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                                            >
                                                <Copy size={15} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            disabled
                                            title="La función de respuesta se conectará cuando esté definido el backend definitivo"
                                            className="inline-flex cursor-not-allowed items-center justify-center gap-1 rounded-xl bg-slate-100 px-3 py-2.5 text-xs font-semibold text-slate-500 opacity-70"
                                        >
                                            <Send size={13} />
                                            Responder
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleAnalyze(message)
                                            }
                                            className="inline-flex items-center justify-center gap-1 rounded-xl bg-orange-500 px-3 py-2.5 text-xs font-bold text-white transition hover:bg-orange-600"
                                        >
                                            Analizar
                                            <ChevronRight
                                                size={14}
                                            />
                                        </button>
                                    </div>
                                </aside>
                            </div>
                        </article>
                    )
                })}
            </div>

            {/* Nota integración */}
            <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                <Server
                    size={17}
                    className="mt-0.5 shrink-0 text-blue-600"
                />

                <div>
                    <p className="text-xs font-semibold text-blue-900">
                        Flujo de ingesta CloudEdTech
                    </p>

                    <p className="mt-1 text-xs leading-5 text-blue-700">
                        Las acciones de curaduría son visuales mientras se
                        completa la integración definitiva con el backend.
                        Analizar dirige la interacción seleccionada al tablero
                        de Análisis. La respuesta directa se habilitará cuando
                        se defina el flujo correspondiente con Discord.
                    </p>
                </div>
            </div>
        </div>
    )
}

function KpiCard({
    label,
    value,
    helper,
    valueClass = 'text-slate-900',
}: {
    label: string
    value: number
    helper: string
    valueClass?: string
}) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">{label}</p>

            <p className={`mt-2 text-3xl font-bold ${valueClass}`}>
                {value.toLocaleString('es-CO')}
            </p>

            <p className="mt-1 text-xs text-slate-400">
                {helper}
            </p>
        </div>
    )
}

function StatusBadge({
    status,
}: {
    status: CurationStatus
}) {
    if (status === 'curated') {
        return (
            <span className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Pasado a curaduría
            </span>
        )
    }

    if (status === 'discarded') {
        return (
            <span className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-[11px] font-bold text-rose-700">
                <ShieldAlert size={12} />
                Descartado
            </span>
        )
    }

    return (
        <span className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[11px] font-bold text-amber-700">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Pendiente de curaduría
        </span>
    )
}

export default Messages