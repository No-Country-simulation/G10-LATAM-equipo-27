import { apiRequest } from './client'

export interface DiscordPublishingChannel {
    id: string
    nombre: string
}

export interface DiscordPublishingChannelsResponse {
    items: DiscordPublishingChannel[]
}

export interface DiscordPublishResponse {
    id: number
    canal_id: string
    mensaje_id: string
    estado_publicacion: 'publicado'
}

export async function getDiscordPublishingChannels():
    Promise<DiscordPublishingChannel[]> {

    const response = await apiRequest(
        '/api/v1/content-workflow/discord-channels',
    ) as DiscordPublishingChannelsResponse

    if (!Array.isArray(response.items)) {
        throw new Error(
            'El servidor no devolvio una lista valida de canales',
        )
    }

    return response.items.filter(
        (item) =>
            typeof item.id === 'string' &&
            typeof item.nombre === 'string' &&
            item.id.length > 0,
    )
}

export async function publishApprovedContent(
    contentId: number,
    channelId: string,
    modo: "publicacion" | "respuesta" = "publicacion",
    mensajeOriginalId?: string,
): Promise<DiscordPublishResponse> {

    if (!Number.isInteger(contentId) || contentId <= 0) {
        throw new Error('Identificador de contenido invalido')
    }

    if (!/^\d+$/.test(channelId)) {
        throw new Error('Canal de Discord invalido')
    }

    const response = await apiRequest(
        `/api/v1/content-workflow/${contentId}/publish`,
        {
            method: 'POST',
            body: JSON.stringify({
                canal_id: channelId,
                modo,
                mensaje_original_id: modo === "respuesta" ? mensajeOriginalId : null,
            }),
        },
    ) as DiscordPublishResponse

    if (
        response.id !== contentId ||
        response.estado_publicacion !== 'publicado' ||
        !response.mensaje_id
    ) {
        throw new Error(
            'El servidor no confirmo la publicacion en Discord',
        )
    }

    return response
}
