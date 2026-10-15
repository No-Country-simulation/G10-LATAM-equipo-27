import { apiRequest } from './client'

export type CurationStatus = 'pending' | 'curated' | 'discarded'

export interface CurationResponse {
    id: number
    curation_status: CurationStatus
    updated: boolean
}

export async function updateMessageCuration(
    interactionId: number,
    status: CurationStatus,
): Promise<CurationResponse> {
    if (!Number.isInteger(interactionId) || interactionId <= 0) {
        throw new Error('Identificador de interacci?n inv?lido')
    }

    const result = (await apiRequest(
        `/api/v1/content-workflow/messages/${interactionId}/curation`,
        {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        },
    )) as CurationResponse

    if (
        result.id !== interactionId ||
        result.curation_status !== status ||
        result.updated !== true
    ) {
        throw new Error('El servidor no confirm? la curadur?a')
    }

    return result
}
