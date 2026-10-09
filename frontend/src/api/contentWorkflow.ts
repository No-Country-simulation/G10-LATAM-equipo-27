import { apiRequest } from './client'

export type ContentPlatform = 'linkedin' | 'x' | 'discord'

export interface CreateContentDraftRequest {
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
