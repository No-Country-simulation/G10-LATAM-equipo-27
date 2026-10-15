import { apiRequest } from './client'

export type WorkflowStage =
    | 'ingesta'
    | 'en_analisis'
    | 'en_redaccion'
    | 'en_aprobacion'

export type WorkflowDestination =
    Exclude<WorkflowStage, 'ingesta'>

export interface WorkflowResponse {
    id: number
    workflow_stage: WorkflowStage
    updated: boolean
}

export async function updateMessageWorkflow(
    interactionId: number,
    stage: WorkflowDestination,
): Promise<WorkflowResponse> {
    if (!Number.isSafeInteger(interactionId) || interactionId <= 0) {
        throw new Error('Identificador de interaccion invalido')
    }

    const result = (await apiRequest(
        `/api/v1/content-workflow/messages/${interactionId}/workflow`,
        {
            method: 'PATCH',
            body: JSON.stringify({ stage }),
        },
    )) as WorkflowResponse

    if (
        result.id !== interactionId ||
        result.workflow_stage !== stage ||
        result.updated !== true
    ) {
        throw new Error(
            'El Motor IA no confirmo el cambio de etapa'
        )
    }

    return result
}
