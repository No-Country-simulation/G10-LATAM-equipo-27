import { apiRequest } from './client'

export interface ManualPublicationResponse {
    id: number
    plataforma: 'linkedin' | 'x'
    estado_publicacion: 'publicado'
    publicado_en: string
    url_publicacion: string
    responsable: string
}

export async function confirmManualPublication(
    contentId: number,
    publicationUrl: string,
): Promise<ManualPublicationResponse> {
    if (!Number.isInteger(contentId) || contentId <= 0) {
        throw new Error('Identificador de contenido invalido')
    }

    const url = publicationUrl.trim()

    if (!url || url.length > 2048) {
        throw new Error('Debes ingresar una URL de publicacion valida')
    }

    let parsed: URL

    try {
        parsed = new URL(url)
    } catch {
        throw new Error('La URL de publicacion no es valida')
    }

    if (parsed.protocol !== 'https:') {
        throw new Error('La URL debe utilizar HTTPS')
    }

    const response = await apiRequest(
        `/api/v1/content-workflow/${contentId}/confirm-manual-publication`,
        {
            method: 'POST',
            body: JSON.stringify({
                url_publicacion: url,
            }),
        },
    ) as ManualPublicationResponse

    if (
        response.id !== contentId ||
        response.estado_publicacion !== 'publicado' ||
        !['linkedin', 'x'].includes(response.plataforma) ||
        !response.publicado_en ||
        !response.url_publicacion
    ) {
        throw new Error(
            'El servidor no confirmo correctamente la publicacion manual',
        )
    }

    return response
}
