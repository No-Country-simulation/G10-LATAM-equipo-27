import { CheckCircle2, Clock, MessageCircle, Send } from 'lucide-react'
import type { ContentReviewStatus } from '../api/contentReview'
import type { MotorApprovalCard as MotorApprovalCardData } from '../api/motorApprovalMapper'

type Props = {
    item: MotorApprovalCardData
    onReview: (contentId: number, estado: ContentReviewStatus) => void
    reviewing: boolean
    reviewDisabled: boolean
}

function platformLabel(platform: MotorApprovalCardData['platform']): string {
    switch (platform) {
        case 'discord':
            return 'Discord'
        case 'linkedin':
            return 'LinkedIn'
        case 'x':
            return 'X'
        default:
            return 'Sin definir'
    }
}

function publicationLabel(status: string): string {
    switch (status) {
        case 'publicado':
        case 'published':
            return 'Publicado'
        case 'no_publicado':
        case 'not_published':
            return 'No publicado'
        case 'fallido':
        case 'failed':
            return 'Publicación fallida'
        default:
            return status || 'Sin definir'
    }
}

export default function MotorApprovalCard({
    item,
    onReview,
    reviewing,
    reviewDisabled,
}: Props) {
    return (
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                        <MessageCircle size={20} />
                    </div>

                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-slate-900">
                                {item.title}
                            </h3>

                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                                {item.status_label}
                            </span>
                        </div>

                        <p className="mt-2 text-xs text-slate-500">
                            {item.type} · Red social: {platformLabel(item.platform)}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                            Canal de origen: {item.source_channel_id || 'Sin definir'}
                            {' · '}Versión {item.version}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Clock size={14} />
                    {item.time}
                </div>
            </div>

            <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-5">
                <p className="whitespace-pre-line text-sm leading-7 text-slate-700">
                    {item.content}
                </p>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
                <p className="text-sm text-slate-600">
                    Estado de publicación:{' '}
                    <span className="font-semibold">
                        {publicationLabel(item.publication_status)}
                    </span>
                </p>

                {item.status === 'pendiente_revision' && (
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            disabled={reviewDisabled}
                            onClick={() => onReview(item.id, 'aprobado')}
                            className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                            {reviewing ? 'Procesando...' : 'Aprobar'}
                        </button>
                        <button
                            type="button"
                            disabled={reviewDisabled}
                            onClick={() => onReview(item.id, 'rechazado')}
                            className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                        >
                            Rechazar
                        </button>
                        <button
                            type="button"
                            disabled={reviewDisabled}
                            onClick={() => onReview(item.id, 'ajustes_solicitados')}
                            className="rounded-lg border border-orange-300 px-3 py-2 text-xs font-semibold text-orange-700 hover:bg-orange-50 disabled:opacity-50"
                        >
                            Solicitar ajustes
                        </button>
                    </div>
                )}

                {item.status === 'aprobado' && (
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600">
                            <CheckCircle2 size={18} />
                            Revisi?n completada
                        </div>

                        {item.platform === 'discord' && (
                            <button
                                type="button"
                                disabled
                                title="Publicaci?n en Discord pendiente de implementaci?n"
                                className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-400 cursor-not-allowed"
                            >
                                <Send size={14} />
                                Publicar en Discord
                            </button>
                        )}
                    </div>
                )}
            </div>
        </article>
    )
}
