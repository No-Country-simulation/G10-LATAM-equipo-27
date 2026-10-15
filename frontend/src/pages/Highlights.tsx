import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  MessageCircle,
  Sparkles,
  Star,
  Tag,
} from 'lucide-react'

import { useState } from 'react'

import { mockCommunityData } from '../data/mockCommunityData'

const stories = mockCommunityData.highlights


function Highlights() {
  const [current, setCurrent] = useState(0)

  const story = stories[current]

  const highlightsSummary = mockCommunityData.highlights_summary

  const previousStory = () => {
    setCurrent((current) =>
      current === 0 ? stories.length - 1 : current - 1
    )
  }

  const nextStory = () => {
    setCurrent((current) =>
      current === stories.length - 1 ? 0 : current + 1
    )
  }

  return (
    <div>
      {/* Encabezado */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        <div className="flex items-center gap-3">

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-500">
            <Star size={21} />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Historias destacadas
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Insights seleccionados automáticamente de la comunidad de Discord
            </p>
          </div>

        </div>

        <div className="flex items-center gap-2 rounded-lg bg-orange-50 px-3 py-2">

          <Sparkles
            size={16}
            className="text-orange-500"
          />

          <span className="text-xs font-medium text-orange-700">
            Seleccionado por IA
          </span>

        </div>

      </div>

      {/* Estadísticas */}
      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <p className="text-sm text-slate-500">
            Historias detectadas
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-900">
            {highlightsSummary.detected}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Durante los últimos 7 días
          </p>

        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <p className="text-sm text-slate-500">
            Alta relevancia
          </p>

          <p className="mt-2 text-3xl font-bold text-orange-500">
            {highlightsSummary.high_relevance}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Relevancia superior al 80%
          </p>

        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <p className="text-sm text-slate-500">
            Listas para contenido
          </p>

          <p className="mt-2 text-3xl font-bold text-green-600">
            {highlightsSummary.ready_for_content}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Pueden pasar a Content Studio
          </p>

        </div>

      </div>

      {/* Historia principal */}
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        <div className="flex items-center justify-between">

          <div className="flex items-center gap-2">

            <MessageCircle
              size={18}
              className="text-orange-500"
            />

            <h3 className="font-bold text-slate-900">
              Insight destacado
            </h3>

          </div>

          <div className="text-sm text-slate-400">
            {current + 1} / {stories.length}
          </div>

        </div>

        {/* Tarjeta */}
        <div className="mt-6 rounded-2xl bg-slate-50 p-6">

          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

            <div className="max-w-3xl">

              <div className="flex flex-wrap items-center gap-2">

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    story.color === 'green'
                      ? 'bg-green-100 text-green-700'
                      : story.color === 'blue'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-purple-100 text-purple-700'
                  }`}
                >
                  {story.type}
                </span>

                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <Tag size={13} />
                  {story.channel}
                </span>

              </div>

              <h4 className="mt-4 text-2xl font-bold text-slate-900">
                {story.title}
              </h4>

              <p className="mt-4 text-base leading-7 text-slate-600">
                {story.message}
              </p>

              <div className="mt-5 flex items-center gap-3">

                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">
                  {story.author
                    .split(' ')
                    .map((name) => name[0])
                    .join('')}
                </div>

                <div>

                  <p className="text-sm font-semibold text-slate-800">
                    {story.author}
                  </p>

                  <p className="text-xs text-slate-400">
                    Comunidad Discord
                  </p>

                </div>

              </div>

            </div>

            {/* Métricas */}
            <div className="grid grid-cols-2 gap-4 lg:w-64">

              <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">

                <p className="text-2xl font-bold text-green-600">
                  {story.sentiment}%
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Sentimiento
                </p>

              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">

                <p className="text-2xl font-bold text-orange-500">
                  {story.relevance}%
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Relevancia
                </p>

              </div>

            </div>

          </div>

        </div>

        {/* Controles */}
        <div className="mt-6 flex items-center justify-between">

          <button
            type="button"
            onClick={previousStory}
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <ArrowLeft size={16} />
            Anterior
          </button>

          <div className="flex items-center gap-2">

            {stories.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setCurrent(index)}
                className={`h-2.5 rounded-full transition-all ${
                  index === current
                    ? 'w-7 bg-orange-500'
                    : 'w-2.5 bg-slate-300'
                }`}
                aria-label={`Ver historia ${index + 1}`}
              />
            ))}

          </div>

          <button
            type="button"
            onClick={nextStory}
            className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
          >
            Siguiente
            <ArrowRight size={16} />
          </button>

        </div>

      </div>

      {/* Acciones */}
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">

        <button
          type="button"
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
        >
          <ExternalLink size={17} />
          Ver mensaje original
        </button>

        <button
          type="button"
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
        >
          <MessageCircle size={17} />
          Analizar conversación
        </button>

        <button
          type="button"
          className="flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-4 text-sm font-semibold text-white shadow-sm hover:bg-orange-600"
        >
          <Sparkles size={17} />
          Generar contenido
        </button>

      </div>
    </div>
  )
}

export default Highlights