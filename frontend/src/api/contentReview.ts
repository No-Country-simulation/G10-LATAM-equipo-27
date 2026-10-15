import { apiRequest } from './client'

export type ContentReviewStatus =
    | 'aprobado'
    | 'rechazado'
    | 'ajustes_solicitados'

export interface ContentReviewRequest {
    estado: ContentReviewStatus
    observaciones_revision?: string | null
}

export interface ContentReviewResponse {
    id: number
    estado: ContentReviewStatus
    message: string
}

export async function reviewContent(
    contentId: number,
    review: ContentReviewRequest,
): Promise<ContentReviewResponse> {
    if (!Number.isInteger(contentId) || contentId <= 0) {
        throw new Error('Identificador de contenido invalido')
    }

    const observations = review.observaciones_revision?.trim()

    if (review.estado === 'ajustes_solicitados' && !observations) {
        throw new Error(
            'Debes indicar las observaciones para solicitar ajustes',
        )
    }

    const response = (await apiRequest(
        `/api/v1/content-workflow/${contentId}/status`,
        {
            method: 'PATCH',
            body: JSON.stringify({
                estado: review.estado,
                observaciones_revision: observations || null,
            }),
        },
    )) as ContentReviewResponse

    if (
        response.id !== contentId ||
        response.estado !== review.estado
    ) {
        throw new Error(
            'El servidor no confirmo correctamente la revision',
        )
    }

    return response
}
