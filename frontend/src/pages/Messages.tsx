import {
    MessageCircle,
    Search,
    Smile,
    Tag,    
} from 'lucide-react'

import { useEffect, useState } from 'react'

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





function Messages() {

    const [apiData, setApiData] = useState<MessagesApiResponse>({
        total: 0,
        messages: [],
    })



    const [searchTerm, setSearchTerm] = useState('')
    const [channelFilter, setChannelFilter] = useState('all')
    const [sentimentFilter, setSentimentFilter] = useState('all')

        useEffect(() => {
        const loadMessages = async () => {
            try {
                const response = await fetch(
                    'http://127.0.0.1:8000/api/community/messages'
                )

                if (!response.ok) {
                    throw new Error(
                        `Error HTTP ${response.status}`
                    )
                }

                const data: MessagesApiResponse =
                    await response.json()

                setApiData(data)

            } catch (err) {
                console.error(
                    'Error cargando mensajes:',
                    err
                )
            }
        }

        loadMessages()

        const interval = window.setInterval(
            loadMessages,
            5000
        )

        return () => {
            window.clearInterval(interval)
        }
    }, [])

    const messageItems = apiData.messages.map(
        ({ message, analysis }) => {

            const author =
                message.author_name || 'Usuario'

            const initials = author
                .split(/[\s._-]+/)
                .filter(Boolean)
                .slice(0, 2)
                .map((part) => part[0]?.toUpperCase())
                .join('') || 'U'

            const createdAt =
                new Date(message.created_at)

            const sentimentLabel = {
                positive: 'Positivo',
                neutral: 'Neutral',
                negative: 'Negativo',
            }[analysis.sentiment]

            return {
                id: message.message_id,
                initials,
                author,
                channel: message.channel_name,
                time: createdAt.toLocaleString('es-CO'),
                message: message.content,

                sentiment: analysis.sentiment,
                sentiment_label: sentimentLabel,
                sentiment_score:
                    Math.round(
                        analysis.sentiment_score * 100
                    ),

                topic: analysis.topic,

                classification:
                    analysis.highlight
                        ? 'Destacado'
                        : 'Mensaje',

                relevance:
                    Math.round(
                        analysis.sentiment_score * 100
                    ),

                highlight: analysis.highlight,
            }
        }
    )

    const positiveMessages =
        messageItems.filter(
            (message) =>
                message.sentiment === 'positive'
        ).length

    const questionMessages =
        messageItems.filter(
            (message) =>
                message.message
                    .trim()
                    .endsWith('?')
        ).length

    const highlightedMessages =
        messageItems.filter(
            (message) =>
                message.highlight
        ).length

    const messagesData = {
        summary: {
            analyzed: messageItems.length,

            positive: positiveMessages,

            positive_percentage:
                messageItems.length > 0
                    ? Math.round(
                        (
                            positiveMessages /
                            messageItems.length
                        ) * 100
                    )
                    : 0,

            questions: questionMessages,

            highlights: highlightedMessages,
        },
    }

    const filteredMessages = messageItems.filter((message) => {
        const search = searchTerm.toLowerCase()

        const matchesSearch =
            message.author.toLowerCase().includes(search) ||
            message.message.toLowerCase().includes(search) ||
            message.topic.toLowerCase().includes(search) ||
            message.channel.toLowerCase().includes(search) ||
            message.classification.toLowerCase().includes(search)

        const matchesChannel =
            channelFilter === 'all' ||
            message.channel === channelFilter

        const matchesSentiment =
            sentimentFilter === 'all' ||
            message.sentiment === sentimentFilter

        return matchesSearch && matchesChannel && matchesSentiment
    })

    return (
        <div>
            {/* Encabezado */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-500">
                        <MessageCircle size={21} />
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">
                            Mensajes
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Conversaciones analizadas de la comunidad de Discord
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />

                    <span className="text-xs font-medium text-indigo-700">
                        Discord conectado
                    </span>
                </div>

            </div>

            {/* KPIs */}
            <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-4">

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-sm text-slate-500">
                        Mensajes analizados
                    </p>

                    <p className="mt-2 text-3xl font-bold text-slate-900">
                        {messagesData.summary.analyzed.toLocaleString("es-CO")}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                        Últimos 7 días
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-sm text-slate-500">
                        Positivos
                    </p>

                    <p className="mt-2 text-3xl font-bold text-green-600">
                        {messagesData.summary.positive.toLocaleString("es-CO")}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                        {messagesData.summary.positive_percentage}% del total
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-sm text-slate-500">
                        Preguntas
                    </p>

                    <p className="mt-2 text-3xl font-bold text-blue-600">
                        {messagesData.summary.questions.toLocaleString("es-CO")}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                        Detectadas por IA
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-sm text-slate-500">
                        Destacados
                    </p>

                    <p className="mt-2 text-3xl font-bold text-orange-500">
                        {messagesData.summary.highlights.toLocaleString("es-CO")}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                        Alta relevancia
                    </p>
                </div>

            </div>

            {/* Filtros */}
            <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                <div className="flex flex-col gap-4 lg:flex-row">

                    {/* Buscar */}
                    <div className="relative flex-1">

                        <Search
                            size={18}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />

                        <input
                            type="text"
                            placeholder="Buscar mensajes..."
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                        />

                    </div>

                    {/* Canal */}
                    <select
                        value={channelFilter}
                        onChange={(event) => setChannelFilter(event.target.value)}
                        className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-600 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                    >
                        <option value="all">
                            Todos los canales
                        </option>

                        <option value="general">
                            #general
                        </option>

                        <option value="ia">
                            #ia
                        </option>

                        <option value="proyectos">
                            #proyectos
                        </option>

                        <option value="preguntas">
                            #preguntas
                        </option>

                        <option value="recursos">
                            #recursos
                        </option>
                    </select>

                    {/* Sentimiento */}
                    <select
                        value={sentimentFilter}
                        onChange={(event) => setSentimentFilter(event.target.value)}
                        className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-600 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
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
            </div>

            {/* Lista de mensajes */}
            <div className="mt-6 space-y-4">

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
                            Intenta cambiar la búsqueda o los filtros seleccionados.
                        </p>
                    </div>
                )}
                                    
                    {filteredMessages.map((message) => (
                    <div
                        key={message.id}
                        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                    >
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">

                            <div className="flex items-start gap-3">

                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-sm font-bold text-white">
                                    {message.initials}
                                </div>

                                <div>
                                    <div className="flex flex-wrap items-center gap-2">

                                        <p className="font-semibold text-slate-900">
                                            {message.author}
                                        </p>

                                        <span className="text-xs text-slate-400">
                                            #{message.channel}
                                        </span>

                                        <span className="text-xs text-slate-400">
                                            · {message.time}
                                        </span>

                                    </div>

                                    <p className="mt-2 text-sm leading-6 text-slate-600">
                                        {message.message}
                                    </p>
                                </div>

                            </div>

                            <span
                                className={`flex w-fit items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${message.sentiment === "positive"
                                        ? "bg-green-100 text-green-700"
                                        : message.sentiment === "negative"
                                            ? "bg-red-100 text-red-700"
                                            : "bg-blue-100 text-blue-700"
                                    }`}
                            >
                                <Smile size={13} />
                                {message.sentiment_label} · {message.sentiment_score}%
                            </span>

                        </div>

                        <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">

                            <span className="flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                                <Tag size={13} />
                                {message.topic}
                            </span>

                            <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700">
                                {message.classification}
                            </span>

                            <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700">
                                Relevancia {message.relevance}%
                            </span>

                        </div>

                    </div>
                ))}

                


            </div>
        </div>
    )
}

export default Messages