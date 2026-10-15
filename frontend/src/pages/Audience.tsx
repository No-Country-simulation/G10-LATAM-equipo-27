import { Users } from "lucide-react";

import { mockCommunityData } from "../data/mockCommunityData";


function Audience() {

    const audience = mockCommunityData.audience;


    return (
        <div>
            {/* Encabezado */}
            <div>
                <h2 className="text-2xl font-bold text-slate-900">
                    Audiencia
                </h2>

                <p className="mt-1 text-slate-500">
                    Conoce cómo participa y evoluciona tu comunidad.
                </p>
            </div>

            {/* Contenido */}
            <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                        <Users size={20} />
                    </div>

                    <div>
                        <h3 className="font-bold text-slate-900">
                            Análisis de audiencia
                        </h3>

                        <p className="text-sm text-slate-500">
                            Comportamiento, crecimiento y participación de la comunidad.
                        </p>
                    </div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                        <p className="text-sm text-slate-500">
                            Miembros totales
                        </p>

                        <p className="mt-2 text-2xl font-bold text-slate-900">
                            {audience.total_members.toLocaleString("es-CO")}
                        </p>

                        <p className="mt-1 text-xs font-medium text-green-600">
                            +{audience.growth}% crecimiento
                        </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                        <p className="text-sm text-slate-500">
                            Miembros activos
                        </p>

                        <p className="mt-2 text-2xl font-bold text-slate-900">
                            {audience.active_members.toLocaleString("es-CO")}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                            Participaron recientemente
                        </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                        <p className="text-sm text-slate-500">
                            Tasa de participación
                        </p>

                        <p className="mt-2 text-2xl font-bold text-orange-500">
                            {audience.participation_rate}%
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                            Sobre la audiencia total
                        </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                        <p className="text-sm text-slate-500">
                            Crecimiento
                        </p>

                        <p className="mt-2 text-2xl font-bold text-green-600">
                            +{audience.growth}%
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                            Evolución de la comunidad
                        </p>
                    </div>
                </div> 
                <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
                    <div>
                        <h4 className="font-semibold text-slate-900">
                            Distribución de la audiencia
                        </h4>

                        <p className="mt-1 text-sm text-slate-500">
                            Miembros agrupados según su nivel de actividad.
                        </p>
                    </div>

                    <div className="mt-5 space-y-4">
                        {audience.segments.map((segment) => (
                            <div key={segment.name}>
                                <div className="mb-2 flex items-center justify-between gap-4">
                                    <div>
                                        <span className="text-sm font-medium text-slate-700">
                                            {segment.name}
                                        </span>

                                        <span className="ml-2 text-xs text-slate-400">
                                            {segment.members.toLocaleString("es-CO")} miembros
                                        </span>
                                    </div>

                                    <span className="text-sm font-semibold text-slate-700">
                                        {segment.percentage}%
                                    </span>
                                </div>

                                <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                                    <div
                                        className="h-full rounded-full bg-orange-500"
                                        style={{ width: `${segment.percentage}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>           
            </div>
            
        </div>
        


    );
}

export default Audience;