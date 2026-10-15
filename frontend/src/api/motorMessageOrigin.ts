import { apiRequest } from './client'

export type MotorMessageOrigin = {
    interaccion_id: number
    guild_id: string
    channel_id: string
    message_id: string
    autor: string
    texto: string
}

export async function getMotorMessageOrigin(
    interactionId: number,
): Promise<MotorMessageOrigin> {
    if (!Number.isSafeInteger(interactionId) || interactionId <= 0) {
        throw new Error('Identificador de interaccion invalido')
    }

    return apiRequest(
        `/api/v1/content-workflow/messages/${interactionId}/origin`,
    ) as Promise<MotorMessageOrigin>
}