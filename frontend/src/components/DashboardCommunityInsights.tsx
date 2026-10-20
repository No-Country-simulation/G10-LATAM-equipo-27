import { useEffect, useState } from 'react'
import { apiRequest } from '../api/client'
import { ArrowLeft, ArrowRight, Hash, Sparkles } from 'lucide-react'

type MotorMessage = {
  message: {
    message_id: string
    author_id?: string
    author_is_bot?: boolean
    is_bot?: boolean
    author_name: string
    channel_name: string
    content: string
    created_at: string
  }
  analysis: {
    highlight: boolean
    relevance: number
    topic: string
  }
}

type MessagesResponse = {
  total: number
  messages: MotorMessage[]
}

const CHANNELS = [
  'general',
  'faq',
  'pqrs',
  'notificaciones',
  'chat-egresados',
  'oportunidades-laborales',
]

const normalizeChannel = (name: string) =>
  name.replace(/^#/, '').replace(/^preguntas$/i, 'faq').toLowerCase()


const BOT_ID = (import.meta.env.VITE_DISCORD_BOT_ID ?? '').trim()

const isBotMessage = (item: MotorMessage): boolean => {
  const message = item.message
  if (message.author_is_bot === true || message.is_bot === true) return true

  if (BOT_ID && message.author_id === BOT_ID) return true

  const author = (message.author_name ?? '').trim().toLowerCase()
  return author === 'cloudedtech community bot'
    || author === 'cloudedtech bot'
}

export default function DashboardCommunityInsights({
  refreshVersion,
}: {
  refreshVersion: number
}) {
  const [messages, setMessages] = useState<MotorMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    let active = true

    const load = async () => {
      setLoading(true)
      try {
        const result = await apiRequest(
          '/api/v1/content-workflow/messages?limit=500',
          { cache: 'no-store' },
        ) as MessagesResponse

        if (!active) return
        setMessages(result.messages ?? [])
        setCurrent(0)
        setError(null)
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Error al cargar mensajes')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()
    return () => { active = false }
  }, [refreshVersion])

  const highlights = messages
    .filter(item =>
      item.analysis?.highlight &&
      item.message?.content?.trim() &&
      !isBotMessage(item)
    )
    .sort((a, b) => (b.analysis.relevance ?? 0) - (a.analysis.relevance ?? 0))
    .slice(0, 12)

  const selected = highlights[current] ?? highlights[0]

  const counts = CHANNELS.map(channel => ({
    channel,
    count: messages.filter(
      item => normalizeChannel(item.message.channel_name ?? '') === channel,
    ).length,
  }))

  const total = counts.reduce((sum, item) => sum + item.count, 0)

  return (
    <div className="mt-8 space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <Sparkles size={20} className="text-orange-500" />
              Historias destacadas
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Mensajes reales destacados por el Motor IA
            </p>
          </div>
          {highlights.length > 1 && (
            <div className="flex gap-2">
              <button
                type="button"
                aria-label="Historia anterior"
                onClick={() => setCurrent(index =>
                  (index - 1 + highlights.length) % highlights.length
                )}
                className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50"
              >
                <ArrowLeft size={17} />
              </button>
              <button
                type="button"
                aria-label="Historia siguiente"
                onClick={() => setCurrent(index => (index + 1) % highlights.length)}
                className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50"
              >
                <ArrowRight size={17} />
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <p className="mt-6 text-sm text-slate-500">Cargando historias...</p>
        ) : error ? (
          <p className="mt-6 text-sm text-red-600">{error}</p>
        ) : selected ? (
          <div className="mt-5 rounded-xl bg-slate-50 p-5">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="rounded-full bg-orange-100 px-3 py-1 font-semibold text-orange-700">
                #{normalizeChannel(selected.message.channel_name)}
              </span>
              <span>{selected.analysis.topic || 'Comunidad'}</span>
              <span className="ml-auto">{current + 1} de {highlights.length}</span>
            </div>
            <p className="mt-4 whitespace-pre-wrap break-words text-base leading-7 text-slate-800">
              {selected.message.content}
            </p>
            <p className="mt-4 text-sm text-slate-500">
              {selected.message.author_name || 'Usuario de Discord'}
            </p>
          </div>
        ) : (
          <p className="mt-6 text-sm text-slate-500">
            Todavía no hay mensajes marcados como destacados por el Motor IA.
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <Hash size={20} className="text-orange-500" />
          Participación por canal
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Distribución de mensajes registrados en los seis canales de Discord
        </p>

        <div className="mt-6 space-y-4">
          {counts.map(item => {
            const percentage = total ? item.count / total * 100 : 0
            return (
              <div key={item.channel}>
                <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                  <span className="truncate font-medium text-slate-700">
                    #{item.channel}
                  </span>
                  <span className="shrink-0 font-semibold text-slate-800">
                    {percentage.toFixed(1)}% · {item.count}
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-orange-500 transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
        {!loading && !error && total === 0 && (
          <p className="mt-4 text-sm text-slate-500">
            No hay mensajes registrados en estos canales.
          </p>
        )}
      </section>
    </div>
  )
}
