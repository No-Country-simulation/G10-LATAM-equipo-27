import { apiRequest } from './client'

export type DiscordRecoveryMessage = {
  message_id: string
  channel_id: string
  canal: string
  autor: string
  texto: string
  fecha: string
  recuperado: boolean
}

export type DiscordRecoveryResponse = {
  mensajes: DiscordRecoveryMessage[]
  total: number
  pagina: number
  tamano_pagina: number
  limite_inspeccion_por_canal: number
}

export type DiscordRecoveryFilters = {
  canal_id?: string
  buscar?: string
  dias?: number
  solo_pendientes?: boolean
  pagina?: number
}

export async function getDiscordRecoveryPreview(
  filters: DiscordRecoveryFilters = {},
): Promise<DiscordRecoveryResponse> {
  const params = new URLSearchParams()

  if (filters.canal_id) params.set('canal_id', filters.canal_id)
  if (filters.buscar) params.set('buscar', filters.buscar)
  params.set('dias', String(filters.dias ?? 7))
  params.set('solo_pendientes', String(filters.solo_pendientes ?? true))
  params.set('pagina', String(filters.pagina ?? 1))

  return await apiRequest(
    `/api/v1/content-workflow/discord/recovery-preview?${params.toString()}`,
  ) as DiscordRecoveryResponse
}

export type DiscordRecoverySelection = {
  channel_id: string
  message_id: string
}

export type DiscordRecoveryResult = {
  status: string
  total_solicitados: number
  encontrados: number
  no_encontrados: string[]
  guardadas_nuevas: number
  repetidas_omitidas: number
}

export async function recoverSelectedDiscordMessages(
  mensajes: DiscordRecoverySelection[],
): Promise<DiscordRecoveryResult> {
  if (mensajes.length < 1 || mensajes.length > 20) {
    throw new Error('Selecciona entre 1 y 20 mensajes para recuperar.')
  }

  return await apiRequest(
    '/api/v1/content-workflow/discord/recover-selected',
    {
      method: 'POST',
      body: JSON.stringify({ mensajes }),
    },
  ) as DiscordRecoveryResult
}