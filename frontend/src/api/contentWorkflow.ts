import { apiRequest, apiRequestBlob } from './client'

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
  imagen_generada_url?: string | null
  imagen_generada_prompt?: string | null
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

export interface UpdateContentDraftImageResponse {
  id: number
  estado: string
  imagen_generada_url: string | null
  message: string
}

export async function updateContentDraftImage(
  contenidoId: number,
  imageUrl: string | null,
): Promise<UpdateContentDraftImageResponse> {
  if (!Number.isSafeInteger(contenidoId) || contenidoId <= 0) {
    throw new Error('Identificador de borrador no valido.')
  }

  if (
    imageUrl !== null &&
    !/^\/api\/v1\/content-workflow\/corporate-images\/[a-f0-9]{32}$/.test(imageUrl)
  ) {
    throw new Error('Referencia de imagen corporativa no valida.')
  }

  const response = (await apiRequest(
    `/api/v1/content-workflow/drafts/${contenidoId}/image`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        imagen_generada_url: imageUrl,
      }),
    },
  )) as UpdateContentDraftImageResponse

  if (
    !response ||
    response.id !== contenidoId ||
    response.estado !== 'pendiente_revision' ||
    response.imagen_generada_url !== imageUrl
  ) {
    throw new Error(
      'El servidor no confirmo la actualizacion de la imagen.',
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


export interface BrandAlignmentRequest {
  contenido: string
  plataforma: 'linkedin' | 'x' | 'discord'
  origen?: string
  contenido_id?: number
}

export interface BrandAlignmentResponse {
  puntuacion: number
  tono_y_voz: number
  estructura_y_claridad: number
  valores_de_marca: number
  seguridad_y_credibilidad: number
  fortalezas: string[]
  mejoras: string[]
  justificacion: string
  registrada?: boolean
  evaluacion_id?: number
}

export async function evaluateBrandAlignment(
  solicitud: BrandAlignmentRequest,
): Promise<BrandAlignmentResponse> {
  const resultado = (await apiRequest(
    '/api/v1/content-workflow/brand-alignment',
    {
      method: 'POST',
      body: JSON.stringify(solicitud),
    },
  )) as BrandAlignmentResponse

  if (
    !resultado ||
    typeof resultado.puntuacion !== 'number' ||
    !Number.isFinite(resultado.puntuacion) ||
    resultado.puntuacion < 0 ||
    resultado.puntuacion > 100 ||
    !Array.isArray(resultado.fortalezas) ||
    !Array.isArray(resultado.mejoras)
  ) {
    throw new Error(
      'El Motor IA no devolvio una evaluacion de marca valida.',
    )
  }

  return resultado
}

export async function commitBrandAlignment(solicitud: {
  contenido_id: number
  contenido: string
  plataforma: ContentPlatform
  evaluacion: BrandAlignmentResponse
}): Promise<void> {
  const result = await apiRequest('/api/v1/content-workflow/brand-alignment/commit', {
    method: 'POST',
    body: JSON.stringify(solicitud),
  }) as { registrada: boolean }
  if (!result?.registrada) throw new Error('No se confirmó el registro de alineación de marca.')
}


export interface CorporateImageRequest {
  plataforma: ContentPlatform
  titulo: string
  mensaje: string
}

export interface CorporateImageResponse {
  image_id: string
  image_url: string
  platform: ContentPlatform
  generator: 'corporate_template'
}

export async function generateCorporateImage(
  request: CorporateImageRequest,
): Promise<CorporateImageResponse> {
  const result = (await apiRequest(
    '/api/v1/content-workflow/corporate-images',
    {
      method: 'POST',
      body: JSON.stringify(request),
    },
  )) as CorporateImageResponse

  if (
    !result ||
    !/^[a-f0-9]{32}$/.test(result.image_id) ||
    result.platform !== request.plataforma ||
    result.generator !== 'corporate_template' ||
    result.image_url !==
      `/api/v1/content-workflow/corporate-images/${result.image_id}`
  ) {
    throw new Error('El generador devolvio una respuesta inesperada.')
  }

  return result
}


export async function getCorporateImageBlob(
  imageUrl: string,
): Promise<Blob> {
  if (!/^\/api\/v1\/content-workflow\/corporate-images\/[a-f0-9]{32}$/.test(imageUrl)) {
    throw new Error('Ruta de imagen corporativa no valida.')
  }

  return apiRequestBlob(imageUrl)
}


export async function loadApprovalCorporateImage(
  imageUrl: string,
): Promise<Blob> {
  const match = imageUrl.match(
    /^\/api\/v1\/content-workflow\/corporate-images\/([a-f0-9]{32})$/,
  )

  if (!match) {
    throw new Error('Referencia de imagen corporativa no valida.')
  }

  const blob = await getCorporateImageBlob(imageUrl)

  if (blob.type !== 'image/png') {
    throw new Error('El servidor no devolvio una imagen PNG.')
  }

  if (blob.size === 0 || blob.size > 10 * 1024 * 1024) {
    throw new Error('La imagen tiene un tamano no permitido.')
  }

  return blob
}
