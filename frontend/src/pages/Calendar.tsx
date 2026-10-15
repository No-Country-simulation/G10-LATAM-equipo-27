import { CalendarDays } from "lucide-react";

import { mockCommunityData } from "../data/mockCommunityData";


function Calendar() {

    const calendarData = mockCommunityData.calendar;

    return (
        <div>
            {/* Encabezado */}
            <div>
                <h2 className="text-2xl font-bold text-slate-900">
                    Calendario
                </h2>

                <p className="mt-1 text-slate-500">
                    Explora la evolución de tu comunidad a través del tiempo.
                </p>
            </div>

            {/* Contenido */}
            <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                        <CalendarDays size={20} />
                    </div>

                    <div>
                        <h3 className="font-bold text-slate-900">
                            Actividad por fecha
                        </h3>

                        <p className="text-sm text-slate-500">
                            Analiza actividad, sentimiento y tendencias por día, semana o mes.
                        </p>
                    </div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
                    {calendarData.map((item) => (
                        <div
                            key={item.id}
                            className="rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-orange-200 hover:bg-orange-50/30"
                        >
                            <div className="border-b border-slate-200 pb-3">
                                <p className="text-xs font-medium uppercase text-slate-400">
                                    {item.day}
                                </p>

                                <p className="mt-1 font-bold text-slate-900">
                                    {new Date(`${item.date}T00:00:00`).toLocaleDateString(
                                        "es-CO",
                                        {
                                            day: "2-digit",
                                            month: "short",
                                        }
                                    )}
                                </p>
                            </div>

                            <div className="mt-4 space-y-3">
                                <div>
                                    <p className="text-xs text-slate-400">
                                        Mensajes
                                    </p>

                                    <p className="font-bold text-slate-800">
                                        {item.messages.toLocaleString("es-CO")}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs text-slate-400">
                                        Sentimiento
                                    </p>

                                    <p className="font-semibold text-green-600">
                                        {item.sentiment}%
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs text-slate-400">
                                        Destacadas
                                    </p>

                                    <p className="font-semibold text-orange-500">
                                        {item.highlights}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default Calendar;