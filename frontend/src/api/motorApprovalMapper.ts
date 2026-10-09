import type { MotorContent } from './motorContent'

export type MotorApprovalCard = {
    id: number
    type: string
    title: string
    content: string
    channel: string | null
    time: string
    status: string
    status_label: string
    platform: MotorContent['plataforma']
    content_kind: 'publication' | 'reply'
    publication_status: string
    source_channel_id: string | null
    source_message_id: string | null
    review_notes: string | null
    version: number
    relevance?: number
    sentiment?: number
}

function reviewLabel(status: string): string {
    switch (status) {
        case 'pendiente_revision':
            return 'Pendiente'
        case 'aprobado':
            return 'Aprobado'
        case 'rechazado':
            return 'Rechazado'
        case 'ajustes_solicitados':
            return 'Requiere ajustes'
        default:
            return 'Estado no reconocido'
    }
}

export function mapMotorContentToApproval(
    item: MotorContent
): MotorApprovalCard {
    return {
        id: item.id,
        type: item.tipo_contenido === 'respuesta'
            ? 'Respuesta'
            : 'Publicación',
        title: item.titulo,
        content: item.contenido,
        channel: item.source_channel_id,
        time: item.creado_en,
        status: item.estado,
        status_label: reviewLabel(item.estado),
        platform: item.plataforma,
        content_kind: item.tipo_contenido === 'respuesta'
            ? 'reply'
            : 'publication',
        publication_status: item.estado_publicacion,
        source_channel_id: item.source_channel_id,
        source_message_id: item.source_message_id,
        review_notes: item.observaciones_revision,
        version: item.version,
    }
}
