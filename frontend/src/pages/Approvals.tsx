import {
    Check,
    Clock,
    MessageCircle,
    X,
} from 'lucide-react'
import { useState } from 'react'
import { mockCommunityData } from '../data/mockCommunityData'


function Approvals() {

    const approvalsData = mockCommunityData.approvals
    const approvalsSummary = approvalsData.summary
    const [approvalItems, setApprovalItems] = useState(
        approvalsData.items
    )

    const [approvedCount, setApprovedCount] = useState(
        approvalsSummary.approved_today
    )

    const [rejectedCount, setRejectedCount] = useState(
        approvalsSummary.rejected
    )

    const handleApprove = (itemId: number) => {
        setApprovalItems((currentItems) =>
            currentItems.filter((item) => item.id !== itemId)
        )

        setApprovedCount((currentCount) => currentCount + 1)
    }

    

    const handleReject = (itemId: number) => {
        setApprovalItems((currentItems) =>
            currentItems.filter((item) => item.id !== itemId)
        )

        setRejectedCount((currentCount) => currentCount + 1)
    }

    return (
        <div>
            {/* Encabezado */}
            <div>
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-500">
                        <Check size={21} />
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">
                            Aprobaciones
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Revisa y aprueba el contenido generado para Discord
                        </p>
                    </div>
                </div>
            </div>

            {/* Resumen */}
            <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-sm text-slate-500">
                        Pendientes
                    </p>

                    <p className="mt-2 text-3xl font-bold text-slate-900">
                        {approvalItems.length}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                        Contenidos esperando revisión
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-sm text-slate-500">
                        Aprobados hoy
                    </p>

                    <p className="mt-2 text-3xl font-bold text-slate-900">
                        {approvedCount}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                        Publicaciones aprobadas
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-sm text-slate-500">
                        Rechazados
                    </p>

                    <p className="mt-2 text-3xl font-bold text-slate-900">
                        {rejectedCount}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                        Requieren regeneración
                    </p>
                </div>

            </div>

            {/* Lista */}
            <div className="mt-8 space-y-5">
                {approvalItems.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
                        <Check
                            size={32}
                            className="mx-auto text-green-500"
                        />

                        <h3 className="mt-4 font-bold text-slate-900">
                            No hay contenidos pendientes
                        </h3>

                        <p className="mt-2 text-sm text-slate-500">
                            Todas las propuestas han sido revisadas.
                        </p>
                    </div>
                )}
                {approvalItems.map((item) => (
                    <div
                        key={item.id}
                        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                    >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="flex items-start gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                                    <MessageCircle size={20} />
                                </div>

                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-slate-900">
                                            {item.type}
                                        </h3>

                                        <span className="rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-semibold text-yellow-700">
                                            {item.status_label}
                                        </span>
                                    </div>

                                    <p className="mt-1 text-xs text-slate-400">
                                        Canal: #{item.channel} · Generado por CloudEdTech
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                <Clock size={14} />
                                {item.time}
                            </div>
                        </div>

                        <div className="mt-5 rounded-xl bg-slate-50 p-5">
                            <p className="whitespace-pre-line text-sm leading-7 text-slate-700">
                                {item.content}
                            </p>
                        </div>

                        <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                            <div className="flex gap-3">
                                <div className="rounded-lg bg-green-50 px-3 py-2">
                                    <p className="text-xs text-green-600">
                                        Relevancia
                                    </p>

                                    <p className="font-bold text-green-700">
                                        {item.relevance}%
                                    </p>
                                </div>

                                <div className="rounded-lg bg-blue-50 px-3 py-2">
                                    <p className="text-xs text-blue-600">
                                        Sentimiento
                                    </p>

                                    <p className="font-bold text-blue-700">
                                        {item.sentiment}%
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => handleReject(item.id)}
                                    className="flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                                >
                                    <X size={16} />
                                    Rechazar
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleApprove(item.id)}
                                    className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
                                >
                                    <Check size={16} />
                                    Aprobar
                                </button>
                            </div>
                        </div>
                    </div>
                ))}           

                

            </div>
        </div>
    )
}

export default Approvals