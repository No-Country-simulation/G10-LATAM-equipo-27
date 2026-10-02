import {
    CloudUpload,
    FileJson,
} from "lucide-react";

import {
    getWeeklyPeriod,
    startWeeklySync,
} from "../api/ociStorage";

import type { WeeklyPeriod } from "../api/ociStorage";

import { useEffect, useState } from "react";

function OCIStorage() {
    const [weeklyPeriod, setWeeklyPeriod] =
        useState<WeeklyPeriod | null>(null);
    useEffect(() => {
        const loadWeeklyPeriod = async () => {
            try {
                const data = await getWeeklyPeriod();
                setWeeklyPeriod(data);
            } catch (error) {
                console.error(
                    "Error consultando el período semanal:",
                    error
                );
            }
        };

        loadWeeklyPeriod();
    }, []);
    return (
        <div>
            {/* Encabezado */}
            <div>
                <h2 className="text-2xl font-bold text-slate-900">
                    OCI Storage
                </h2>

                <p className="mt-1 text-slate-500">
                    Gestiona el enví­o de información de CloudEdTech a Oracle Cloud.
                </p>
            </div>

            {/* Sincronización semanal */}
            <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                        <CloudUpload size={20} />
                    </div>

                    <div>
                        <h3 className="font-bold text-slate-900">
                            Sincronización semanal
                        </h3>

                        <p className="text-sm text-slate-500">
                            Enví­a a OCI Object Storage la información recopilada durante la semana.
                        </p>
                    </div>
                </div>

                <div className="mt-6 rounded-xl bg-slate-50 p-5">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Período pendiente
                            </p>

                            <p className="mt-1 font-semibold text-slate-800">
                                {weeklyPeriod
                                    ? `${weeklyPeriod.start_date} — ${weeklyPeriod.end_date}`
                                    : "Cargando período..."}
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                                Los datos recopilados durante la semana están pendientes de sincronización.
                            </p>
                        </div>

                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                            {weeklyPeriod?.status === "pending"
                                ? "Pendiente"
                                : weeklyPeriod?.status ?? "Cargando..."}
                        </span>
                    </div>
                </div>
            </div>
            <div className="mt-4 flex justify-end">
                <button
                    type="button"
                    onClick={async () => {
                        try {
                            const data = await startWeeklySync();

                            console.log("WEEKLY SYNC:", data);
                        } catch (error) {
                            console.error(
                                "Error preparando sincronización semanal:",
                                error
                            );
                        }
                    }}
                    className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
                >
                    <CloudUpload size={16} />
                    Enviar semana a OCI
                </button>
            </div>

            {/* Carga manual */}
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                        <FileJson size={20} />
                    </div>

                    <div>
                        <h3 className="font-bold text-slate-900">
                            Carga manual JSON
                        </h3>

                        <p className="text-sm text-slate-500">
                            Envía manualmente un archivo JSON a OCI Object Storage.
                        </p>
                    </div>
                </div>

                <div className="mt-6 rounded-xl border-2 border-dashed border-slate-200 p-8 text-center">
                    <FileJson
                        size={32}
                        className="mx-auto text-slate-300"
                    />

                    <p className="mt-3 text-sm font-semibold text-slate-700">
                        Archivo JSON
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                        Esta opción se utilizará para cargas manuales excepcionales.
                    </p>
                </div>
            </div>


        </div>
    );
}

export default OCIStorage;