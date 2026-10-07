import {
  BriefcaseBusiness,
  CheckCircle,
  Copy,
  FileText,
  MessageCircle,
  Newspaper,
  Pencil,
  RotateCcw,
  Send,
  Sparkles,
} from 'lucide-react'

import { useState } from 'react'

import { mockCommunityData } from '../data/mockCommunityData'

type ContentFormat = 'linkedin' | 'newsletter' | 'discord'

type DraftState = {
  content: string
  submitted: boolean
}

function ContentStudio() {
  const [selectedStory, setSelectedStory] = useState(
    mockCommunityData.highlights[0]
  )

  const generatedContent = mockCommunityData.content_studio[0]

  const waitingStories = mockCommunityData.highlights

  const [searchTerm, setSearchTerm] = useState('')

  const [channelFilter, setChannelFilter] = useState('all')

  const [topicFilter, setTopicFilter] = useState('all')

  const [sentimentFilter, setSentimentFilter] = useState('all')

  const filteredStories = waitingStories.filter((story) => {
  const search = searchTerm.trim().toLowerCase()

  const matchesAuthor =
    search === '' ||
    story.author.toLowerCase().includes(search)

  const matchesChannel =
    channelFilter === 'all' ||
    story.channel === channelFilter
    const matchesTopic =
      topicFilter === 'all' ||
      story.type === topicFilter
    const matchesSentiment =
      sentimentFilter === 'all' ||
      (sentimentFilter === 'positive' && story.sentiment >= 80) ||
      (sentimentFilter === 'neutral' &&
        story.sentiment >= 60 &&
        story.sentiment < 80) ||
      (sentimentFilter === 'negative' && story.sentiment < 60)

    return (
      matchesAuthor &&
      matchesChannel &&
      matchesTopic &&
      matchesSentiment
    )
})




  

  const [activeFormat, setActiveFormat] =
    useState<ContentFormat>('linkedin')

  const [copiedFormat, setCopiedFormat] =
    useState<ContentFormat | null>(null)
  const [showDiscordFiles, setShowDiscordFiles] =
    useState(false)

  const discordFiles = [
    {
      id: 1,
      name: 'imagen-comunidad.png',
      type: 'Imagen',
      size: '—',
    },
    {
      id: 2,
      name: 'documento-adjunto.pdf',
      type: 'PDF',
      size: '—',
    },
  ]

  const [drafts, setDrafts] = useState<
    Record<ContentFormat, DraftState>
  >({
    linkedin: {
      content: generatedContent.content,
      submitted: false,
    },

    newsletter: {
      content: `Boletín CloudEdTech

Una experiencia compartida por nuestra comunidad demuestra cómo el aprendizaje práctico puede convertirse en resultados reales.

${selectedStory.message}

Desde CloudEdTech seguimos destacando experiencias que aportan valor, conocimiento y nuevas oportunidades para nuestra comunidad.

#CloudEdTech #Comunidad #Aprendizaje`,
      submitted: false,
    },

    discord: {
      content: `🚀 ¡Tenemos una nueva historia para compartir!

${selectedStory.message}

💡 Seguimos construyendo y aprendiendo juntos como comunidad.

#CloudEdTech #Comunidad`,
      submitted: false,
    },
  })

  const updateContent = (
    format: ContentFormat,
    content: string,
  ) => {
    setDrafts((current) => ({
      ...current,
      [format]: {
        ...current[format],
        content,
      },
    }))
  }

  const handleCopy = async (format: ContentFormat) => {
    await navigator.clipboard.writeText(
      drafts[format].content,
    )

    setCopiedFormat(format)

    setTimeout(() => {
      setCopiedFormat(null)
    }, 2000)
  }

  const handleSubmit = (format: ContentFormat) => {
    setDrafts((current) => ({
      ...current,
      [format]: {
        ...current[format],
        submitted: true,
      },
    }))
  }

  const handleRegenerate = (format: ContentFormat) => {
    /*
      En la siguiente fase esta acción llamará al Motor IA.
      Por ahora conserva el contenido para no simular una
      generación que todavía no está conectada.
    */
    setActiveFormat(format)
  }
  const handleSelectStory = (
    story: typeof selectedStory,
  ) => {
    setSelectedStory(story)
    setActiveFormat('linkedin')
    setShowDiscordFiles(false)

    setDrafts({
      linkedin: {
        content: `A partir de una conversación de nuestra comunidad:

${story.message}

Esta experiencia refleja cómo el aprendizaje compartido puede generar nuevas oportunidades y conocimiento.

#CloudEdTech #Comunidad #Aprendizaje`,
        submitted: false,
      },

      newsletter: {
        content: `Boletín CloudEdTech

Una experiencia compartida por nuestra comunidad demuestra cómo el aprendizaje práctico puede convertirse en resultados reales.

${story.message}

Desde CloudEdTech seguimos destacando experiencias que aportan valor, conocimiento y nuevas oportunidades para nuestra comunidad.

#CloudEdTech #Comunidad #Aprendizaje`,
        submitted: false,
      },

      discord: {
        content: `🚀 ¡Tenemos una nueva historia para compartir!

${story.message}

💡 Seguimos construyendo y aprendiendo juntos como comunidad.

#CloudEdTech #Comunidad`,
        submitted: false,
      },
    })
  }

  const formats: Array<{
    id: ContentFormat
    name: string
    description: string
    icon: typeof BriefcaseBusiness
  }> = [
      {
        id: 'linkedin',
        name: 'LinkedIn',
        description: 'Publicación profesional',
        icon: BriefcaseBusiness,
      },
      {
        id: 'newsletter',
        name: 'Newsletter',
        description: 'Contenido editorial',
        icon: Newspaper,
      },
      {
        id: 'discord',
        name: 'Discord',
        description: 'Mensaje para la comunidad',
        icon: MessageCircle,
      },
    ]

  return (
    <div>
      {/* Encabezado */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-500">
            <Sparkles size={21} />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Redacción de Contenidos
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Convierte conversaciones de Discord en contenido
              adaptado para diferentes canales
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-2">
          <span className="h-2 w-2 rounded-full bg-green-500" />

          <span className="text-xs font-semibold text-green-700">
            Discord conectado
          </span>
        </div>
      </div>

      {/* Mensaje original */}
      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <MessageCircle size={19} />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold text-slate-900">
                  Mensaje original de Discord
                </h3>

                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  Mesa de trabajo
                </span>
              </div>

              <p className="mt-1 text-xs text-slate-400">
                Insumo seleccionado para generación de contenido
              </p>
            </div>
          </div>

          <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">
            Discord
          </span>
        </div>

        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-slate-900">
                {selectedStory.author}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Conversación seleccionada
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                Sentimiento {selectedStory.sentiment}%
              </span>

              <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                Relevancia {selectedStory.relevance}%
              </span>
            </div>
          </div>

          <h4 className="mt-4 font-bold text-slate-900">
            {selectedStory.title}
          </h4>

          <p className="mt-3 text-sm leading-7 text-slate-600">
            {selectedStory.message}
          </p>
        </div>
      </section>

      {/* Selector de formato */}
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50 text-orange-500">
            <FileText size={18} />
          </div>

          <div>
            <h3 className="font-bold text-slate-900">
              Contenido generado
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Revisa y adapta cada formato antes de enviarlo a
              aprobación
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
          {formats.map((format) => {
            const Icon = format.icon
            const selected = activeFormat === format.id

            return (
              <button
                key={format.id}
                type="button"
                onClick={() => setActiveFormat(format.id)}
                className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${selected
                  ? 'border-orange-300 bg-orange-50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${selected
                    ? 'bg-orange-500 text-white'
                    : 'bg-slate-100 text-slate-600'
                    }`}
                >
                  <Icon size={19} />
                </div>

                <div>
                  <p className="font-semibold text-slate-900">
                    {format.name}
                  </p>

                  <p className="mt-0.5 text-xs text-slate-500">
                    {format.description}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </section>

      {/* Tarjetas */}
      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        {formats.map((format) => {
          const Icon = format.icon
          const draft = drafts[format.id]

          return (
            <section
              key={format.id}
              className={`flex flex-col rounded-2xl border bg-white shadow-sm transition ${activeFormat === format.id
                ? 'border-orange-300 ring-2 ring-orange-50'
                : 'border-slate-200'
                }`}
            >
              {/* Cabecera tarjeta */}
              <div className="border-b border-slate-100 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                      <Icon size={18} />
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900">
                        {format.name}
                      </h3>

                      <p className="text-xs text-slate-400">
                        {format.description}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${draft.submitted
                      ? 'bg-green-50 text-green-700'
                      : 'bg-amber-50 text-amber-700'
                      }`}
                  >
                    {draft.submitted
                      ? 'En aprobación'
                      : 'Borrador'}
                  </span>
                </div>
              </div>

              {/* Editor */}
              <div className="flex flex-1 flex-col p-5">
                <label
                  htmlFor={`content-${format.id}`}
                  className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  <Pencil size={14} />
                  Contenido editable
                </label>

                <textarea
                  id={`content-${format.id}`}
                  value={draft.content}
                  disabled={draft.submitted}
                  onFocus={() => setActiveFormat(format.id)}
                  onChange={(event) =>
                    updateContent(
                      format.id,
                      event.target.value,
                    )
                  }
                  className="mt-3 min-h-72 flex-1 resize-y rounded-xl border border-slate-200 p-4 text-sm leading-6 text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100 disabled:bg-slate-50 disabled:text-slate-500"
                />
                {format.id === 'discord' && (
                  <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          Archivos adjuntos
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {discordFiles.length === 0
                            ? 'Sin archivos adjuntos'
                            : `${discordFiles.length} archivos asociados a este mensaje`}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={discordFiles.length === 0}
                          onClick={() =>
                            setShowDiscordFiles((current) => !current)
                          }
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
                        >
                          {showDiscordFiles ? 'Ocultar archivos' : 'Ver archivos'}
                        </button>

                        <button
                          type="button"
                          disabled={discordFiles.length === 0}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
                        >
                          Descargar archivos
                        </button>
                      </div>
                    </div>

                    {showDiscordFiles && discordFiles.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {discordFiles.map((file) => (
                          <div
                            key={file.id}
                            className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2"
                          >
                            <div>
                              <p className="text-xs font-semibold text-slate-700">
                                {file.name}
                              </p>

                              <p className="mt-0.5 text-xs text-slate-400">
                                {file.type} · {file.size}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Acciones auxiliares */}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopy(format.id)}
                    className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                  >
                    {copiedFormat === format.id ? (
                      <CheckCircle size={15} />
                    ) : (
                      <Copy size={15} />
                    )}

                    {copiedFormat === format.id
                      ? 'Copiado'
                      : 'Copiar'}
                  </button>

                  <button
                    type="button"
                    disabled={draft.submitted}
                    onClick={() =>
                      handleRegenerate(format.id)
                    }
                    className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                  >
                    <RotateCcw size={15} />
                    Regenerar
                  </button>
                </div>

                {/* Enviar a aprobación */}
                <button
                  type="button"
                  onClick={() => handleSubmit(format.id)}
                  disabled={draft.submitted}
                  className={`mt-3 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${draft.submitted
                    ? 'cursor-not-allowed bg-green-50 text-green-700'
                    : 'bg-orange-500 text-white hover:bg-orange-600'
                    }`}
                >
                  {draft.submitted ? (
                    <CheckCircle size={16} />
                  ) : (
                    <Send size={16} />
                  )}

                  {draft.submitted
                    ? 'Enviado a aprobación'
                    : 'Enviar a aprobación'}
                </button>

                {format.id === 'discord' && (
                  <p className="mt-3 text-center text-xs leading-5 text-slate-400">
                    La publicación en Discord estará disponible
                    únicamente después de su aprobación. Este contenido
                    incluye {discordFiles.length} archivo(s) adjunto(s).
                  </p>
                )}

                {format.id !== 'discord' && (
                  <p className="mt-3 text-center text-xs leading-5 text-slate-400">
                    Una vez aprobado, el contenido podrá copiarse
                    para su publicación externa.
                  </p>
                )}
              </div>
            </section>
          )
        })}
      </div>

      {/* Quejas, reclamos y soporte crítico */}
      <section className="mt-6 rounded-2xl border border-rose-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <MessageCircle size={19} />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold text-slate-900">
                  Panel de Quejas, Reclamos y Soporte Crítico
                </h3>

                <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-600">
                  IA + revisión humana
                </span>
              </div>

              <p className="mt-1 text-sm text-slate-500">
                Mensajes que requieren atención prioritaria antes de
                generar una respuesta.
              </p>
            </div>
          </div>

          <span className="rounded-full bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600">
            2 pendientes
          </span>
        </div>

        <div className="mt-5 space-y-3">
          <div className="rounded-xl border border-rose-100 bg-rose-50/30 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700">
                  Soporte crítico
                </span>

                <span className="text-xs text-slate-400">
                  Discord
                </span>
              </div>

              <span className="text-xs font-medium text-orange-600">
                Alta relevancia
              </span>
            </div>

            <p className="mt-3 text-sm leading-6 text-slate-700">
              Mensaje identificado por el sistema como una consulta que
              requiere atención prioritaria de la comunidad.
            </p>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700"
              >
                Preparar respuesta
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-rose-100 bg-rose-50/30 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700">
                  Queja / Reclamo
                </span>

                <span className="text-xs text-slate-400">
                  Discord
                </span>
              </div>

              <span className="text-xs font-medium text-orange-600">
                Revisión requerida
              </span>
            </div>

            <p className="mt-3 text-sm leading-6 text-slate-700">
              Mensaje detectado como reclamo y pendiente de revisión antes
              de elaborar una respuesta.
            </p>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700"
              >
                Preparar respuesta
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Cola de mensajes en espera */}
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <FileText size={19} />
            </div>

            <div>
              <h3 className="font-bold text-slate-900">
                Cola de Mensajes en Espera
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Mensajes disponibles para seleccionar y convertir en nuevo contenido.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
              5 pendientes
            </span>

            <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
              0 enviados a aprobación
            </span>
          </div>
        </div>

        {/* Filtros */}
        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar autor..."
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
          />

          <select
            value={channelFilter}
            onChange={(event) => setChannelFilter(event.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-orange-400"
          >
            <option value="all">Todos los canales</option>

            {[...new Set(waitingStories.map((story) => story.channel))].map(
              (channel) => (
                <option key={channel} value={channel}>
                  {channel}
                </option>
              ),
            )}
          </select>

          <select
            value={topicFilter}
            onChange={(event) => setTopicFilter(event.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-orange-400"
          >
            <option value="all">Todos los tipos</option>

            {[...new Set(waitingStories.map((story) => story.type))].map(
              (type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ),
            )}
          </select>

          <select
            value={sentimentFilter}
            onChange={(event) => setSentimentFilter(event.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-orange-400"
          >
            <option value="all">Todos los sentimientos</option>
            <option value="positive">Positivo</option>
            <option value="neutral">Neutral</option>
            <option value="negative">Negativo</option>
          </select>
        </div>

        {/* Tabla */}
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                <th className="px-3 py-3 font-semibold">
                  Autor y canal
                </th>

                <th className="px-3 py-3 font-semibold">
                  Contenido
                </th>

                <th className="px-3 py-3 font-semibold">
                  Tema
                </th>

                <th className="px-3 py-3 font-semibold">
                  Sentimiento
                </th>

                <th className="px-3 py-3 font-semibold">
                  Estado
                </th>

                <th className="px-3 py-3 text-right font-semibold">
                  Acción
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredStories.map((story) => {
                const isActive = selectedStory.id === story.id

                return (
                  <tr
                    key={story.id}
                    className={`text-sm transition ${isActive ? 'bg-orange-50/50' : 'hover:bg-slate-50/50'
                      }`}
                  >
                    <td className="px-3 py-4">
                      <p className="font-semibold text-slate-800">
                        {story.author}
                      </p>

                      <p className="mt-1 text-xs text-indigo-500">
                        {story.channel}
                      </p>
                    </td>

                    <td className="max-w-sm px-3 py-4">
                      <p className="line-clamp-2 text-sm leading-5 text-slate-600">
                        {story.message}
                      </p>
                    </td>

                    <td className="px-3 py-4">
                      <div>
                        <p className="font-medium text-slate-700">
                          {story.type}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          Relevancia {story.relevance}%
                        </p>
                      </div>
                    </td>

                    <td className="px-3 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${story.sentiment >= 80
                          ? 'bg-green-50 text-green-700'
                          : story.sentiment >= 60
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-rose-50 text-rose-700'
                          }`}
                      >
                        {story.sentiment}%
                      </span>
                    </td>

                    <td className="px-3 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${isActive
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-slate-100 text-slate-600'
                          }`}
                      >
                        {isActive ? 'En redacción' : 'En espera'}
                      </span>
                    </td>

                    <td className="px-3 py-4 text-right">
                      <button
                        type="button"
                        disabled={isActive}
                        onClick={() => handleSelectStory(story)}
                        className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${isActive
                          ? 'cursor-not-allowed border-orange-200 bg-orange-50 text-orange-600'
                          : 'border-slate-200 text-slate-700 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600'
                          }`}
                      >
                        {isActive ? 'En redacción' : 'Usar para redactar'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3">
          <p className="text-xs leading-5 text-slate-500">
            Los mensajes mostrados aquí son temporales para validar la
            interfaz. Posteriormente esta cola se alimentará con las
            interacciones procesadas por la ingesta y el análisis de
            CloudEdTech.
          </p>
        </div>
      </section>


      {/* Flujo */}
      <section className="mt-6 rounded-2xl border border-orange-100 bg-orange-50/50 p-5">
        <div className="flex items-start gap-3">
          <Sparkles
            size={18}
            className="mt-0.5 shrink-0 text-orange-500"
          />

          <div>
            <p className="text-sm font-semibold text-slate-800">
              Flujo de revisión humana
            </p>

            <p className="mt-1 text-sm leading-6 text-slate-600">
              El contenido generado aquí no se publica
              automáticamente. Primero debe enviarse al módulo de
              Aprobaciones. Los contenidos de LinkedIn y Newsletter
              podrán copiarse después de ser aprobados, mientras que
              Discord podrá publicarse mediante la integración del
              bot.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default ContentStudio