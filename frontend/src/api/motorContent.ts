import { apiRequest } from './client'
export type MotorAttachment = {
    filename: string
    url: string
    content_type?: string | null
    size?: number | null
}

export type MotorContent = {
  imagen_generada_url?: string | null
  imagen_generada_prompt?: string | null
    attachments?: MotorAttachment[]
    id: number
    interaccion_id: number | null
    formato: string
    titulo: string
    contenido: string
    llamada_accion: string | null
    hashtags: string[]
    tono: string
    estado: string
    creado_en: string
    actualizado_en: string
    rechazado_en?: string | null
    plataforma: 'discord' | 'linkedin' | 'x' | null
    tipo_contenido: string
    observaciones_revision: string | null
    version: number
    estado_publicacion: string
    publicado_en: string | null
    source_channel_id: string | null
    source_message_id: string | null
}

type MotorContentResponse = {
    items: MotorContent[]
}

export async function getMotorContents(
    signal?: AbortSignal
): Promise<MotorContent[]> {
    const data = (await apiRequest(
        '/api/v1/content-workflow/content',
        { signal, cache: 'no-store' }
    )) as MotorContentResponse
    if (!Array.isArray(data.items)) {
        throw new Error('Respuesta inv?lida del Motor IA')
    }

    return data.items
}
