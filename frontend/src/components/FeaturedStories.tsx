import { useState } from 'react'
import {
    ArrowLeft,
    ArrowRight,
    MessageCircle,
    Sparkles,
    ThumbsUp,
} from 'lucide-react'

import { mockCommunityData } from '../data/mockCommunityData'




function FeaturedStories() {
    const stories = mockCommunityData.highlights
    
    const [currentIndex, setCurrentIndex] = useState(0)

    const currentStory = stories[currentIndex]

    const handlePrevious = () => {
        setCurrentIndex((previousIndex) =>
            previousIndex === 0
                ? stories.length - 1
                : previousIndex - 1
        )
    }

    const handleNext = () => {
        setCurrentIndex((previousIndex) =>
            previousIndex === stories.length - 1
                ? 0
                : previousIndex + 1
        )
    }

    return (
        <section className="mt-8">

            {/* Encabezado */}
            <div className="mb-4 flex items-center justify-between">

                <div>
                    <h3 className="text-xl font-bold text-slate-900">
                        Historias destacadas
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                        Contenido seleccionado por el motor inteligente
                    </p>
                </div>

                <div className="flex gap-2">

                    <button
                        type="button"
                        onClick={handlePrevious}
                        aria-label="Historia anterior"
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100"
                    >
                        <ArrowLeft size={18} />
                    </button>

                    <button
                        type="button"
                        onClick={handleNext}
                        aria-label="Historia siguiente"
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100"
                    >
                        <ArrowRight size={18} />
                    </button>

                </div>

            </div>

            {/* Historia principal */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                <div className="flex items-start justify-between gap-6">

                    <div className="flex-1">

                        <div className="flex items-center gap-3">

                            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                                {currentStory.type}
                            </span>

                            <span className="text-xs text-slate-400">
                                Seleccionada por IA
                            </span>

                        </div>

                        <h4 className="mt-4 text-xl font-bold text-slate-900">
                            {currentStory.title}
                        </h4>

                        <p className="mt-3 max-w-3xl text-slate-600">
                            "{currentStory.message}"
                        </p>

                        <p className="mt-4 text-sm font-medium text-slate-500">
                            — {currentStory.author}
                        </p>

                    </div>

                    {/* Métricas */}
                    <div className="hidden gap-4 md:flex">

                        <div className="rounded-xl bg-slate-50 p-4 text-center">
                            <Sparkles
                                size={18}
                                className="mx-auto text-orange-500"
                            />

                            <p className="mt-2 text-lg font-bold text-slate-900">
                                {currentStory.sentiment}%
                            </p>

                            <p className="text-xs text-slate-400">
                                Sentimiento
                            </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-4 text-center">
                            <ThumbsUp
                                size={18}
                                className="mx-auto text-orange-500"
                            />

                            <p className="mt-2 text-lg font-bold text-slate-900">
                                {currentStory.relevance}%
                            </p>

                            <p className="text-xs text-slate-400">
                                Relevancia
                            </p>
                        </div>

                    </div>

                </div>

                {/* Acciones */}
                <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-100 pt-5">

                    <button
                        type="button"
                        className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                        <MessageCircle size={16} />
                        Ver mensaje
                    </button>

                    <button
                        type="button"
                        className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
                    >
                        Generar publicación
                    </button>

                </div>

            </div>

            {/* Indicadores */}
            <div className="mt-4 flex justify-center gap-2">

                {stories.map((_, index) => (
                    <button
                        key={index}
                        type="button"
                        onClick={() => setCurrentIndex(index)}
                        aria-label={`Ver historia ${index + 1}`}
                        className={`h-2 rounded-full transition-all ${
                            currentIndex === index
                                ? 'w-6 bg-orange-500'
                                : 'w-2 bg-slate-300'
                        }`}
                    />
                ))}

            </div>

        </section>
    )
}

export default FeaturedStories