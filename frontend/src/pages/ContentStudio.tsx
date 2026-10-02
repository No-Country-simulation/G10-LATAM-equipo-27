import {
  Bell,
  CheckCircle,
  Copy,
  FileText,
  Hash,
  MessageCircle,
  Sparkles,
} from 'lucide-react'

import { useState } from 'react'

import { mockCommunityData } from '../data/mockCommunityData'


function ContentStudio() {

  const selectedStory = mockCommunityData.highlights[0]

  const generatedContent = mockCommunityData.content_studio[0]

  const [copied, setCopied] = useState(false)
  const [content, setContent] = useState(
    generatedContent.content
  )

  const [contentType, setContentType] = useState<
    'announcement' | 'resource' | 'response'
  >('announcement')

  const [channel, setChannel] = useState('ia')

  
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content)

    setCopied(true)

    setTimeout(() => {
      setCopied(false)
    }, 2000)
  }

  

  return (
    <div>
      {/* Encabezado */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-500">
          <Sparkles size={21} />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Content Studio
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Convierte las conversaciones de Discord en contenido útil para la comunidad
          </p>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-3">

        {/* Historia seleccionada */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex items-center gap-2">
            <MessageCircle size={18} className="text-orange-500" />

            <h3 className="font-bold text-slate-900">
              Conversación seleccionada
            </h3>
          </div>

          <div className="mt-5 rounded-xl bg-slate-50 p-4">

            <div className="flex items-center gap-2">
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                {selectedStory.type}
              </span>

              <span className="text-xs text-slate-400">
                Discord
              </span>
            </div>

            <h4 className="mt-4 font-bold text-slate-900">
              {selectedStory.title}
            </h4>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              {selectedStory.message}
            </p>

            <div className="mt-4 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">
                {selectedStory.author
                  .split(' ')
                  .map((name) => name[0])
                  .join('')}
              </div>

              <p className="text-xs font-medium text-slate-500">
                {selectedStory.author}
              </p>
            </div>
          </div>

          {/* Métricas */}
          <div className="mt-5 grid grid-cols-2 gap-3">

            <div className="rounded-xl border border-slate-200 p-3 text-center">
              <p className="text-lg font-bold text-slate-900">
                {selectedStory.sentiment}%
              </p>

              <p className="text-xs text-slate-400">
                Sentimiento
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 p-3 text-center">
              <p className="text-lg font-bold text-slate-900">
                {selectedStory.relevance}%
              </p>

              <p className="text-xs text-slate-400">
                Relevancia
              </p>
            </div>

          </div>
        </div>

        {/* Generador */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">

          <div className="flex flex-wrap items-center justify-between gap-4">

            <div>
              <h3 className="font-bold text-slate-900">
                Generador para Discord
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Genera contenido adaptado al contexto de la comunidad
              </p>
            </div>

            {/* Tipo de contenido */}
            <div className="flex rounded-lg bg-slate-100 p-1">

              <button
                type="button"
                onClick={() => setContentType('announcement')}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${contentType === 'announcement'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                  }`}
              >
                <Bell size={16} />
                Anuncio
              </button>

              <button
                type="button"
                onClick={() => setContentType('resource')}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${contentType === 'resource'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                  }`}
              >
                <FileText size={16} />
                Recurso
              </button>

              <button
                type="button"
                onClick={() => setContentType('response')}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${contentType === 'response'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                  }`}
              >
                <MessageCircle size={16} />
                Respuesta
              </button>

            </div>
          </div>

          {/* Canal */}
          <div className="mt-6">

            <label
              htmlFor="discord-channel"
              className="text-sm font-semibold text-slate-700"
            >
              Canal de Discord
            </label>

            <div className="relative mt-3">

              <Hash
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <select
                id="discord-channel"
                value={channel}
                onChange={(event) => setChannel(event.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              >
                <option value="general">
                  general
                </option>

                <option value="ia">
                  ia
                </option>

                <option value="proyectos">
                  proyectos
                </option>

                <option value="preguntas">
                  preguntas
                </option>

                <option value="recursos">
                  recursos
                </option>

                <option value="anuncios">
                  anuncios
                </option>
              </select>

            </div>
          </div>

          {/* Contenido generado */}
          <div className="mt-6">

            <label
              htmlFor="generated-content"
              className="text-sm font-semibold text-slate-700"
            >
              Contenido generado por IA
            </label>

            <textarea
              id="generated-content"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              
              className="mt-3 min-h-72 w-full resize-y rounded-xl border border-slate-200 p-4 text-sm leading-7 text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            />

          </div>

          {/* Acciones */}
          <div className="mt-5 flex flex-wrap justify-between gap-3">

            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
              {copied ? 'Copiado' : 'Copiar'}
            </button>

            <div className="flex gap-3">

              <button
                type="button"
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Regenerar
              </button>

              <button
                type="button"
                onClick={() => setIsSubmitted(true)}
                disabled={isSubmitted}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${isSubmitted
                  ? 'cursor-not-allowed bg-orange-100 text-orange-700'
                  : 'bg-orange-500 text-white hover:bg-orange-600'
                  }`}
              >
                <CheckCircle size={16} />
                {isSubmitted ? 'Enviado a aprobación' : 'Enviar a aprobación'}
              </button>

            </div>

          </div>

        </div>
      </div>
    </div>
  )
}

export default ContentStudio