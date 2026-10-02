import { Hash } from "lucide-react";
import { mockCommunityData } from "../data/mockCommunityData";

function Hashtags() {

    const hashtags = mockCommunityData.hashtags;


    return (
        <div>
            {/* Encabezado */}
            <div>
                <h2 className="text-2xl font-bold text-slate-900">
                    Hashtags
                </h2>

                <p className="mt-1 text-slate-500">
                    Descubre los hashtags y conversaciones que están marcando tendencia
                    en tu comunidad.
                </p>
            </div>

            {/* Contenido */}
            <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                        <Hash size={20} />
                    </div>

                    <div>
                        <h3 className="font-bold text-slate-900">
                            Hashtags de la comunidad
                        </h3>

                        <p className="text-sm text-slate-500">
                            Tendencias detectadas a partir de las conversaciones.
                        </p>
                    </div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {hashtags.map((hashtag) => (
                        <div
                            key={hashtag.id}
                            className="rounded-xl border border-slate-200 bg-slate-50 p-5 transition hover:border-orange-200 hover:bg-orange-50/30"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-lg font-bold text-slate-900">
                                        {hashtag.name}
                                    </p>

                                    <p className="mt-1 text-sm text-slate-500">
                                        {hashtag.mentions.toLocaleString("es-CO")} menciones
                                    </p>
                                </div>

                                <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                                    +{hashtag.growth}%
                                </span>
                            </div>

                            <div className="mt-5 border-t border-slate-200 pt-4">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-500">
                                        Sentimiento positivo
                                    </span>

                                    <span className="font-semibold text-slate-700">
                                        {hashtag.sentiment}%
                                    </span>
                                </div>

                                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                                    <div
                                        className="h-full rounded-full bg-orange-500"
                                        style={{ width: `${hashtag.sentiment}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default Hashtags;