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
