import { FileClock } from "lucide-react";

import { mockCommunityData } from "../data/mockCommunityData";


function MyReports() {

    const reports = mockCommunityData.reports;

    return (
        <div>
            {/* Encabezado */}
            <div>
                <h2 className="text-2xl font-bold text-slate-900">
                    Mis reportes
                </h2>

                <p className="mt-1 text-slate-500">
                    Consulta el histórico de tus reportes generados.
                </p>
            </div>

            {/* Contenido */}
            <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                        <FileClock size={20} />
                    </div>

                    <div>
                        <h3 className="font-bold text-slate-900">
                            Mis reportes
                        </h3>

                        <p className="text-sm text-slate-500">
                            Historial de reportes creados por tu cuenta.
                        </p>
                    </div>
                </div>

                <div className="mt-6 space-y-3">
                    {reports.map((report) => (
                        <div
                            key={report.id}
                            className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                            <div className="flex items-start gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-orange-500">
                                    <FileClock size={18} />
                                </div>

                                <div>
                                    <h4 className="font-semibold text-slate-900">
                                        {report.name}
                                    </h4>

                                    <p className="mt-1 text-sm text-slate-500">
                                        {report.type} · {report.format}
                                    </p>

                                    <p className="mt-1 text-xs text-slate-400">
                                        {new Date(report.created_at).toLocaleString("es-CO", {
                                            day: "2-digit",
                                            month: "short",
                                            year: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </p>
                                </div>
                            </div>

                            <span className="w-fit rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                                {report.status_label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default MyReports;