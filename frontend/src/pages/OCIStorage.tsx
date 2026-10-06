import {
    Cloud,
    CloudUpload,
    FileJson,
    MapPin,
    Server,
    SlidersHorizontal,



    Filter,
    FileText,

} from "lucide-react";

import {
    getOCIStorageStatus,
    getWeeklyPeriod,
    startWeeklySync,
} from "../api/ociStorage";

import type {
    OCIStorageStatus,
    WeeklyPeriod,
} from "../api/ociStorage";

import { useEffect, useState } from "react";

function OCIStorage() {
    const [weeklyPeriod, setWeeklyPeriod] =
        useState<WeeklyPeriod | null>(null);
    const [ociStatus, setOciStatus] =
        useState<OCIStorageStatus | null>(null);
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

        getOCIStorageStatus()
            .then((data) => {
                setOciStatus(data);
            })
            .catch((error) => {
                console.error("Error consultando OCI Storage:", error);
            });

        loadWeeklyPeriod();
    }, []);
    return (
        <div>
            {/* Encabezado */}
            <div>
                <h2 className="text-2xl font-bold text-slate-900">
                    Nube y Almacenamiento
                </h2>

                <p className="mt-1 text-slate-500">
                    Infraestructura, almacenamiento y distribución de CloudEdTech.
                </p>
            </div>


            {/* Estado OCI */}
            <div className="mt-8 overflow-hidden rounded-2xl bg-[#080A27] p-6 text-white shadow-sm">

                <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">

                    <div className="flex items-start gap-4">

                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/15 text-orange-400">
                            <Cloud size={24} />
                        </div>

                        <div>
                            <div className="flex flex-wrap items-center gap-3">

                                <h3 className="text-lg font-bold">
                                    OCI Object Storage
                                </h3>

                                <span
                                    className={`rounded-full px-3 py-1 text-xs font-semibold ${ociStatus?.status === "ready"
                                            ? "bg-emerald-500/15 text-emerald-300"
                                            : "bg-amber-500/15 text-amber-300"
                                        }`}
                                >
                                    {ociStatus?.status === "ready"
                                        ? "Módulo disponible"
                                        : "Verificando..."}
                                </span>

                            </div>

                            <p className="mt-2 text-sm text-slate-300">
                                {ociStatus?.message ??
                                    "Consultando el estado del módulo OCI Storage..."}
                            </p>

                            <div className="mt-4 flex items-center gap-2 text-sm text-slate-400">
                                <MapPin size={15} />
                                Colombia Central (Bogotá)
                            </div>
                        </div>

                    </div>


                    <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">

                        <div className="flex items-center gap-2">
                            <Server
                                size={16}
                                className="text-orange-400"
                            />

                            <span className="text-sm font-semibold">
                                Oracle Cloud
                            </span>
                        </div>

                        <p className="mt-1 text-xs text-slate-400">
                            Pendiente de conexión con infraestructura OCI
                        </p>

                    </div>

                </div>


                <div className="mt-6 grid grid-cols-2 gap-3 border-t border-white/10 pt-5 md:grid-cols-4">

                    {[
                        ["JSON", "—"],
                        ["Reportes", "—"],
                        ["Assets IA", "—"],
                        ["Exportaciones", "—"],
                    ].map(([label, value]) => (

                        <div
                            key={label}
                            className="rounded-xl bg-white/5 p-4"
                        >
                            <p className="text-xs text-slate-400">
                                {label}
                            </p>

                            <p className="mt-1 text-xl font-bold">
                                {value}
                            </p>
                        </div>

                    ))}

                </div>

            </div>
            {/* Infraestructura CloudEdTech */}
            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">

                {/* Servicios CloudEdTech */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                            <Server size={20} />
                        </div>

                        <div>
                            <h3 className="font-bold text-slate-900">
                                Servicios CloudEdTech
                            </h3>

                            <p className="text-sm text-slate-500">
                                APIs y servicios desplegados para la plataforma.
                            </p>
                        </div>
                    </div>


                    <div className="mt-6 space-y-4">

                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <div>
                                <p className="text-sm font-semibold text-slate-800">
                                    Admin API
                                </p>

                                <p className="text-xs text-slate-400">
                                    Autenticación, usuarios y administración
                                </p>
                            </div>

                            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                                Local
                            </span>
                        </div>


                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <div>
                                <p className="text-sm font-semibold text-slate-800">
                                    Motor IA
                                </p>

                                <p className="text-xs text-slate-400">
                                    Análisis de comunidad e inteligencia artificial
                                </p>
                            </div>

                            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                                Local
                            </span>
                        </div>


                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-slate-800">
                                    HTTPS
                                </p>

                                <p className="text-xs text-slate-400">
                                    Acceso seguro a las APIs
                                </p>
                            </div>

                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                                Pendiente
                            </span>
                        </div>

                    </div>
                </div>


                {/* Gestión administrativa */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                            <Cloud size={20} />
                        </div>

                        <div>
                            <h3 className="font-bold text-slate-900">
                                Gestión administrativa
                            </h3>

                            <p className="text-sm text-slate-500">
                                Persistencia, seguridad y control administrativo.
                            </p>
                        </div>
                    </div>


                    <div className="mt-6 space-y-4">

                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <div>
                                <p className="text-sm font-semibold text-slate-800">
                                    PostgreSQL
                                </p>

                                <p className="text-xs text-slate-400">
                                    Usuarios, roles y datos administrativos
                                </p>
                            </div>

                            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                                Local
                            </span>
                        </div>


                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <div>
                                <p className="text-sm font-semibold text-slate-800">
                                    Sesiones activas
                                </p>

                                <p className="text-xs text-slate-400">
                                    Control de acceso por usuario
                                </p>
                            </div>

                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                                Pendiente
                            </span>
                        </div>


                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-slate-800">
                                    Auditoría
                                </p>

                                <p className="text-xs text-slate-400">
                                    Registro de acciones administrativas
                                </p>
                            </div>

                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                Disponible
                            </span>
                        </div>

                    </div>
                </div>

            </div>

            {/* Sincronización semanal */}
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">

                    <div className="flex items-start gap-3">

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                            <CloudUpload size={20} />
                        </div>

                        <div>
                            <h3 className="font-bold text-slate-900">
                                Sincronización semanal
                            </h3>

                            <p className="text-sm text-slate-500">
                                Prepara y envía la información consolidada de la comunidad
                                hacia OCI Object Storage.
                            </p>
                        </div>

                    </div>


                    <span
                        className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${weeklyPeriod?.status === "pending"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-emerald-100 text-emerald-700"
                            }`}
                    >
                        {weeklyPeriod?.status === "pending"
                            ? "Pendiente"
                            : weeklyPeriod?.status ?? "Cargando..."}
                    </span>

                </div>


                <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto]">

                    <div className="rounded-xl bg-slate-50 p-5">

                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Período de sincronización
                        </p>

                        <p className="mt-2 font-semibold text-slate-800">
                            {weeklyPeriod
                                ? `${weeklyPeriod.start_date} — ${weeklyPeriod.end_date}`
                                : "Cargando período..."}
                        </p>

                        <p className="mt-2 text-sm text-slate-500">
                            Los datos recopilados durante este período serán preparados
                            para almacenamiento y respaldo en la nube.
                        </p>

                    </div>


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
                        className="inline-flex min-h-20 items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 lg:min-w-52"
                    >
                        <CloudUpload size={17} />
                        Preparar sincronización
                    </button>

                </div>


                <div className="mt-4 flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">

                    <Cloud
                        size={16}
                        className="mt-0.5 shrink-0 text-blue-500"
                    />

                    <p className="text-xs leading-5 text-blue-700">
                        El módulo de sincronización está disponible. El envío definitivo
                        quedará habilitado cuando OCI Object Storage esté conectado.
                    </p>

                </div>

            </div>

            {/* Automatización de reportes */}
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                {/* Encabezado */}
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">

                    <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#080A27] text-orange-500">
                            <SlidersHorizontal size={19} />
                        </div>

                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-bold text-slate-900">
                                    Panel de Automatización de Envíos de Reportes
                                </h3>

                                <span className="rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-[10px] font-semibold text-orange-600">
                                    LangGraph Cron Dispatcher
                                </span>
                            </div>

                            <p className="mt-1 text-sm text-slate-500">
                                Configura los disparadores automáticos para remitir datasets
                                semanales y diarios a los equipos técnicos.
                            </p>
                        </div>
                    </div>


                    <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-slate-600">
                            Envío Automatizado General:
                        </span>

                        <button
                            type="button"
                            className="relative h-6 w-11 rounded-full bg-orange-500"
                            aria-label="Envío automatizado general"
                        >
                            <span className="absolute right-1 top-1 h-4 w-4 rounded-full bg-white shadow" />
                        </button>
                    </div>

                </div>


                <div className="my-5 border-t border-slate-100" />


                {/* Frecuencia */}
                <p className="text-xs font-bold uppercase tracking-wide text-slate-700">
                    Frecuencia de programación
                </p>


                <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-2">

                    {/* Diario */}
                    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4">

                        <div>
                            <p className="text-sm font-bold text-slate-900">
                                Reporte Diario (11:59 PM)
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                                Compila el resumen de incidencias, temas y quejas RAG al cierre del día.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="relative ml-4 h-6 w-11 shrink-0 rounded-full bg-orange-500"
                            aria-label="Reporte diario"
                        >
                            <span className="absolute right-1 top-1 h-4 w-4 rounded-full bg-white shadow" />
                        </button>

                    </div>


                    {/* Semanal */}
                    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4">

                        <div>
                            <p className="text-sm font-bold text-slate-900">
                                Reporte Semanal (Domingos 11:59 PM)
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                                Genera el dataset integral con embeddings vectoriales para auditorías institucionales.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="relative ml-4 h-6 w-11 shrink-0 rounded-full bg-orange-500"
                            aria-label="Reporte semanal"
                        >
                            <span className="absolute right-1 top-1 h-4 w-4 rounded-full bg-white shadow" />
                        </button>

                    </div>

                </div>


                {/* Configuración */}
                <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">

                    <label className="block">
                        <span className="text-xs font-semibold text-slate-700">
                            Correo de Destino
                        </span>

                        <input
                            type="email"
                            placeholder="Configurar correo..."
                            className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-orange-400"
                        />
                    </label>


                    <label className="block">
                        <span className="text-xs font-semibold text-slate-700">
                            Webhook de Notificación (Discord / Slack)
                        </span>

                        <input
                            type="text"
                            placeholder="Configurar webhook..."
                            className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-orange-400"
                        />
                    </label>


                    <label className="block">
                        <span className="text-xs font-semibold text-slate-700">
                            Esquema de Formato JSON
                        </span>

                        <select
                            className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-orange-400"
                            defaultValue="json-v2"
                        >
                            <option value="json-v2">
                                JSON v2 (Enriquecido con Embeddings FAISS)
                            </option>

                            <option value="json-v1">
                                JSON v1 (Estructura estándar)
                            </option>
                        </select>
                    </label>

                </div>


                {/* Pie */}
                <div className="mt-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                        <span className="h-2 w-2 rounded-full bg-amber-400" />
                        Configuración pendiente de persistencia
                    </div>


                    <button
                        type="button"
                        disabled
                        className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white opacity-60"
                    >
                        Guardar Configuración de Automatización
                    </button>

                </div>

            </div>




            {/* Carga y respaldo manual */}
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                        <FileJson size={20} />
                    </div>

                    <div>
                        <h3 className="font-bold text-slate-900">
                            Carga y Respaldo Manual
                        </h3>

                        <p className="text-sm text-slate-500">
                            Gestiona cargas excepcionales y respaldos hacia OCI Object Storage.
                        </p>
                    </div>
                </div>


                <div className="mt-6 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">

                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white text-orange-500 shadow-sm">
                        <CloudUpload size={23} />
                    </div>

                    <p className="mt-4 text-sm font-bold text-slate-800">
                        Arrastra un archivo o selecciónalo manualmente
                    </p>

                    <p className="mx-auto mt-1 max-w-lg text-xs leading-5 text-slate-500">
                        Esta opción se utilizará para cargas excepcionales de archivos
                        JSON, reportes, exportaciones y paquetes generados por CloudEdTech.
                    </p>


                    <div className="mt-5 flex flex-wrap justify-center gap-2">

                        {[
                            "JSON",
                            "Reportes",
                            "Exportaciones",
                            "Assets IA",
                        ].map((type) => (
                            <span
                                key={type}
                                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-500"
                            >
                                {type}
                            </span>
                        ))}

                    </div>


                    <button
                        type="button"
                        disabled
                        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white opacity-60"
                    >
                        <CloudUpload size={16} />
                        Seleccionar archivo
                    </button>

                    <p className="mt-3 text-[11px] text-slate-400">
                        La carga estará disponible cuando OCI Object Storage esté conectado.
                    </p>

                </div>

            </div>

            {/* Estado de informes */}
            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                {/* Encabezado */}
                <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-6 lg:flex-row lg:items-center">

                    <div>
                        <h3 className="font-bold text-slate-900">
                            Estado de Informes Semanales y Diarios
                        </h3>

                        <p className="mt-1 text-xs text-slate-500">
                            Control de envíos programados y transmisión manual inmediata.
                        </p>
                    </div>


                    <div className="flex flex-wrap items-center gap-2">

                        <div className="mr-2 flex items-center gap-1 text-xs text-slate-500">
                            <Filter size={14} />
                            Filtrar por Estado:
                        </div>

                        <button
                            type="button"
                            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm"
                        >
                            Todos
                        </button>

                        <button
                            type="button"
                            className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50"
                        >
                            Enviado
                        </button>

                        <button
                            type="button"
                            className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50"
                        >
                            No Enviado / Pendiente
                        </button>

                        <button
                            type="button"
                            className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50"
                        >
                            Error
                        </button>

                    </div>

                </div>


                {/* Tabla */}
                <div className="overflow-x-auto">

                    <table className="w-full min-w-[950px]">

                        <thead className="bg-slate-50">

                            <tr className="border-b border-slate-200 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">

                                <th className="px-6 py-4">
                                    Semana / Período
                                </th>

                                <th className="px-6 py-4">
                                    Nombre de archivo JSON
                                </th>

                                <th className="px-6 py-4">
                                    Tamaño & subida
                                </th>

                                <th className="px-6 py-4">
                                    Estado de envío
                                </th>

                                <th className="px-6 py-4 text-right">
                                    Control de envío / Acciones
                                </th>

                            </tr>

                        </thead>


                        <tbody className="divide-y divide-slate-100">

                            {/* Sin datos reales */}
                            <tr>

                                <td
                                    colSpan={5}
                                    className="px-6 py-14 text-center"
                                >

                                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                                        <FileText size={22} />
                                    </div>

                                    <p className="mt-4 text-sm font-semibold text-slate-700">
                                        Aún no hay informes almacenados
                                    </p>

                                    <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-400">
                                        Los informes diarios y semanales aparecerán aquí
                                        cuando la generación y OCI Object Storage estén
                                        conectados.
                                    </p>

                                </td>

                            </tr>

                        </tbody>

                    </table>

                </div>

            </div>

        </div>
    );
}

export default OCIStorage;