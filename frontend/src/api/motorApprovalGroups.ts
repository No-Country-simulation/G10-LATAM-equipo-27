import type { MotorContent } from './motorContent'
import {
    mapMotorContentToApproval,
    type MotorApprovalCard,
} from './motorApprovalMapper'

export type MotorApprovalGroups = {
    pending: MotorApprovalCard[]
    approved: MotorApprovalCard[]
    adjustments: MotorApprovalCard[]
    rejected: MotorApprovalCard[]
    other: MotorApprovalCard[]
}

export function groupMotorApprovals(
    contents: MotorContent[]
): MotorApprovalGroups {
    const groups: MotorApprovalGroups = {
        pending: [],
        approved: [],
        adjustments: [],
        rejected: [],
        other: [],
    }

    for (const content of contents) {
        const card = mapMotorContentToApproval(content)

        switch (content.estado) {
            case 'pendiente_revision':
                groups.pending.push(card)
                break
            case 'aprobado':
                groups.approved.push(card)
                break
            case 'ajustes_solicitados':
                groups.adjustments.push(card)
                break
            case 'rechazado':
                groups.rejected.push(card)
                break
            default:
                groups.other.push(card)
        }
    }

    return groups
}
