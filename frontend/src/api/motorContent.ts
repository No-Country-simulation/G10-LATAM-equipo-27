export type MotorContent = {
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

const MOTOR_API_URL = (
    import.meta.env.VITE_MOTOR_API_URL ||
    'http://127.0.0.1:8001'
).replace(/\/$/, '')

export async function getMotorContents(
    signal?: AbortSignal
): Promise<MotorContent[]> {
    const response = await fetch(
        `${MOTOR_API_URL}/api/content`,
        {
            method: 'GET',
            signal,
        }
    )

    if (!response.ok) {
        throw new Error(
            `Error al consultar contenidos: HTTP ${response.status}`
        )
    }

    const data: MotorContentResponse = await response.json()

    if (!Array.isArray(data.items)) {
        throw new Error('Respuesta inv?lida del Motor IA')
    }

    return data.items
}
