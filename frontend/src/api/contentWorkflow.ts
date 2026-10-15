import { apiRequest } from './client'

export type ContentPlatform = 'linkedin' | 'x' | 'discord'

export interface CreateContentDraftRequest {
  interaccion_id?: number
  plataforma: ContentPlatform
  titulo: string
  contenido: string
  llamada_accion?: string | null
  hashtags?: string[]
  tono?: string
  tipo_contenido?: string
}

export interface ContentDraftResponse {
  id: number
  estado: string
  message: string
}

export interface RegenerateContentRequest {
  texto: string
  canal: string
  formato: ContentPlatform
  tono?: string
}

export interface RegenerateContentResponse {
  formato: ContentPlatform
  titulo: string
  contenido: string
  llamada_accion: string
  hashtags: string[]
}

export async function regenerateContent(
  solicitud: RegenerateContentRequest,
): Promise<RegenerateContentResponse> {
  const data = (await apiRequest(
    '/api/v1/content-workflow/regenerate',
    {
      method: 'POST',
      body: JSON.stringify({
        ...solicitud,
        tono: solicitud.tono ?? 'profesional',
      }),
    },
  )) as RegenerateContentResponse

  if (
    !data ||
    data.formato !== solicitud.formato ||
    typeof data.contenido !== 'string' ||
    !data.contenido.trim()
  ) {
    throw new Error(
      'El Motor IA no devolvio un contenido valido para el formato solicitado.',
    )
  }

  if (solicitud.formato === 'x' && [...data.contenido].length > 280) {
    throw new Error(
      'El Motor IA genero un texto que supera los 280 caracteres de X.',
    )
  }

  return data
}


export async function createContentDraft(
  draft: CreateContentDraftRequest,
): Promise<ContentDraftResponse> {
  const response = (await apiRequest(
    '/api/v1/content-workflow/drafts',
    {
      method: 'POST',
      body: JSON.stringify(draft),
    },
  )) as ContentDraftResponse

  if (
    !Number.isInteger(response.id) ||
    response.id <= 0 ||
    response.estado !== 'pendiente_revision'
  ) {
    throw new Error(
      'El servidor no confirmó correctamente el guardado del borrador.',
    )
  }

  return response
}

export async function generateComplaintResponse(
  interaccionId: number,
): Promise<{ respuesta: string }> {
  return (await apiRequest(
    '/api/v1/content-workflow/complaints/generate-response',
    {
      method: 'POST',
      body: JSON.stringify({
        interaccion_id: interaccionId,
      }),
    },
  )) as { respuesta: string }
}


export interface PublishComplaintResponseRequest {
  interaccion_id: number
  respuesta: string
  confirmado: true
}

export interface PublishComplaintResponseResult {
  estado: 'publicado'
  interaccion_id: number
  discord_message_id: string
  channel_id: string
}

export async function publishComplaintResponse(
  solicitud: PublishComplaintResponseRequest,
): Promise<PublishComplaintResponseResult> {
  if (!Number.isSafeInteger(solicitud.interaccion_id) || solicitud.interaccion_id <= 0) {
    throw new Error('La interacci?n seleccionada no es v?lida.')
  }

  const respuesta = solicitud.respuesta.trim()

  if (!respuesta || respuesta.length > 2000) {
    throw new Error('La respuesta debe contener entre 1 y 2000 caracteres.')
  }

  return (await apiRequest(
    '/api/v1/content-workflow/complaints/publish-response',
    {
      method: 'POST',
      body: JSON.stringify({
        interaccion_id: solicitud.interaccion_id,
        respuesta,
        confirmado: true,
      }),
    },
  )) as PublishComplaintResponseResult
}


export interface ComplaintPublishPreview {
  interaccion_id: number
  guild_id: string
  channel_id: string
  channel_name: string
  source_message_id: string
  author: string
  original_content: string
  ready: boolean
}

export async function getComplaintPublishPreview(
  interaccionId: number,
): Promise<ComplaintPublishPreview> {
  if (!Number.isSafeInteger(interaccionId) || interaccionId <= 0) {
    throw new Error('La interacci?n seleccionada no es v?lida.')
  }

  const data = (await apiRequest(
    `/api/v1/content-workflow/complaints/${interaccionId}/publish-preview`,
    {
      method: 'GET',
    },
  )) as ComplaintPublishPreview

  if (
    data.interaccion_id !== interaccionId ||
    !data.ready ||
    !data.channel_id ||
    !data.channel_name ||
    !data.source_message_id
  ) {
    throw new Error('No se pudo verificar el destino de Discord.')
  }

  return data
}

export interface PublishedComplaintIdsResponse {
  interaction_ids: number[]
}

export async function getPublishedComplaintIds(): Promise<number[]> {
  const data = (await apiRequest(
    '/api/v1/content-workflow/complaints/published-responses',
    { method: 'GET' },
  )) as PublishedComplaintIdsResponse

  if (
    !data ||
    !Array.isArray(data.interaction_ids) ||
    !data.interaction_ids.every(
      (id) => Number.isSafeInteger(id) && id > 0,
    )
  ) {
    throw new Error(
      'El servidor devolvio una lista de publicaciones no valida.',
    )
  }

  return data.interaction_ids
}
