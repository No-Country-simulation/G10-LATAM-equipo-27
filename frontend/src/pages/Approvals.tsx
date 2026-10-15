import RecoverDiscordMessagesModal from '../components/RecoverDiscordMessagesModal'
import { CheckCircle2, ShieldCheck, RefreshCcw } from 'lucide-react'
import { useEffect, useState , useRef } from 'react'
import { getMotorContents } from '../api/motorContent'
import { confirmManualPublication } from '../api/motorManualPublishing'
import { reviewContent, type ContentReviewStatus } from '../api/contentReview'
import MotorApprovalCard from '../components/MotorApprovalCard'
import {
    getDiscordPublishingChannels,
    publishApprovedContent,
    type DiscordPublishingChannel,
} from '../api/motorDiscordPublishing'
import MotorApprovalSummary from '../components/MotorApprovalSummary'
import MotorApprovalFilters, { type MotorReviewFilter } from '../components/MotorApprovalFilters'
import { groupMotorApprovals, type MotorApprovalGroups } from '../api/motorApprovalGroups'

function Approvals() {
    const [recoverModalOpen, setRecoverModalOpen] = useState(false)
    const [motorActiveFilter, setMotorActiveFilter] =
        useState<MotorReviewFilter>('pending')

    const [motorGroups, setMotorGroups] = useState<MotorApprovalGroups | null>(null)
    const [motorLoading, setMotorLoading] = useState(false)
    const [motorError, setMotorError] = useState<string | null>(null)

    const [discordChannels, setDiscordChannels] = useState<DiscordPublishingChannel[]>([])
    const [discordChannelsError, setDiscordChannelsError] = useState<string | null>(null)

    const [reloadKey, setReloadKey] = useState(0)
    const [reviewingId, setReviewingId] = useState<number | null>(null)
    const [publishingId, setPublishingId] = useState<number | null>(null)
    const publicationInFlightRef = useRef(false)
    const [publicationLockedIds, setPublicationLockedIds] = useState<number[]>([])
    const [publicationMessage, setPublicationMessage] = useState<string | null>(null)
    const [reviewMessage, setReviewMessage] = useState<string | null>(null)

    useEffect(() => {
        const controller = new AbortController()

        async function loadMotorApprovals() {
            setMotorLoading(true)
            setMotorError(null)

            try {
                const contents = await getMotorContents(controller.signal)

                if (!controller.signal.aborted) {
                    setMotorGroups(groupMotorApprovals(contents))
                }
            } catch (error) {
                if (!controller.signal.aborted) {
                    setMotorError(
                        error instanceof Error
                            ? error.message
                            : 'No fue posible consultar el Motor IA'
                    )
                }
            } finally {
                if (!controller.signal.aborted) {
                    setMotorLoading(false)
                }
            }
        }

        void loadMotorApprovals()

        return () => {
            controller.abort()
        }
    }, [reloadKey])

    useEffect(() => {
        let active = true

        async function loadDiscordChannels() {
            try {
                const channels = await getDiscordPublishingChannels()

                if (active) {
                    setDiscordChannels(channels)
                    setDiscordChannelsError(null)
                }
            } catch (error) {
                if (active) {
                    setDiscordChannels([])
                    setDiscordChannelsError(
                        error instanceof Error
                            ? error.message
                            : 'No fue posible consultar los canales Discord'
                    )
                }
            }
        }

        void loadDiscordChannels()

        return () => {
            active = false
        }
    }, [])

    async function handleDiscordPublish(
        contentId: number,
        channelId: string,
        modo: "publicacion" | "respuesta" = "publicacion",
        mensajeOriginalId?: string,
    ) {
        if (
            publicationInFlightRef.current ||
            publishingId !== null ||
            reviewingId !== null
        ) return
        if (publicationLockedIds.includes(contentId)) return

        const content = motorGroups
            ? [
                ...motorGroups.pending,
                ...motorGroups.approved,
                ...motorGroups.adjustments,
                ...motorGroups.rejected,
                ...motorGroups.other,
            ].find((item) => item.id === contentId)
            : undefined

        if (
            !content ||
            content.status !== 'aprobado' ||
            content.platform !== 'discord' ||
            content.publication_status !== 'no_publicado'
        ) {
            setPublicationMessage(
                'El contenido no cumple los requisitos de publicacion.'
            )
            return
        }

        if (!discordChannels.some((channel) => channel.id === channelId)) {
            setPublicationMessage('El canal seleccionado no esta autorizado.')
            return
        }

        publicationInFlightRef.current = true
        setPublishingId(contentId)
        setPublicationLockedIds((current) =>
            current.includes(contentId) ? current : [...current, contentId]
        )
        setPublicationMessage(null)

        try {
            const result = await publishApprovedContent(contentId, channelId, modo, mensajeOriginalId)

            setPublicationMessage(
                `Contenido #${contentId} publicado en Discord. ` +
                `Mensaje: ${result.mensaje_id}`
            )
        } catch (error) {
            const detail = error instanceof Error
                ? error.message
                : 'Error desconocido'

            const invalidChannel =
                /canal de discord invalido|canal de discord inv?lido/i.test(detail)

            if (invalidChannel) {
                setPublicationLockedIds((current) =>
                    current.filter((id) => id !== contentId)
                )
                setPublicationMessage(
                    `Contenido #${contentId}: el servidor rechazo el canal seleccionado. ` +
                    `El contenido no fue confirmado como publicado. ` +
                    `Puedes seleccionar otro canal autorizado. Detalle: ${detail}`
                )
            } else {
                setPublicationMessage(
                    `Contenido #${contentId}: resultado no confirmado. ` +
                    `Verifica el estado antes de reintentar. Detalle: ${detail}`
                )
            }
        } finally {
            publicationInFlightRef.current = false
            setPublishingId(null)
            setReloadKey((current) => current + 1)
        }
    }

    async function handleManualPublication(
        contentId: number,
        publicationUrl: string,
    ) {
        if (
            publicationInFlightRef.current ||
            publishingId !== null ||
            reviewingId !== null ||
            publicationLockedIds.includes(contentId)
        ) return

        const content = motorGroups
            ? [
                ...motorGroups.pending,
                ...motorGroups.approved,
                ...motorGroups.adjustments,
                ...motorGroups.rejected,
                ...motorGroups.other,
            ].find((item) => item.id === contentId)
            : undefined

        if (
            !content ||
            content.status !== 'aprobado' ||
            (content.platform !== 'linkedin' && content.platform !== 'x') ||
            content.publication_status !== 'no_publicado'
        ) {
            setPublicationMessage(
                'El contenido no cumple los requisitos de publicacion manual.'
            )
            return
        }

        publicationInFlightRef.current = true
        setPublishingId(contentId)
        setPublicationLockedIds((current) =>
            current.includes(contentId) ? current : [...current, contentId]
        )
        setPublicationMessage(null)

        try {
            const result = await confirmManualPublication(
                contentId,
                publicationUrl,
            )

            if (result.plataforma !== content.platform) {
                throw new Error(
                    'La plataforma confirmada no coincide con el contenido.'
                )
            }

            setPublicationMessage(
                `Contenido #${contentId}: publicacion manual registrada en ` +
                `${result.plataforma.toUpperCase()}. Responsable: ${result.responsable}`
            )
        } catch (error) {
            setPublicationMessage(
                `Contenido #${contentId}: confirmacion no verificada. ` +
                `Consulta el estado antes de reintentar. Detalle: ` +
                (error instanceof Error ? error.message : 'Error desconocido')
            )
        } finally {
            publicationInFlightRef.current = false
            setPublishingId(null)
            setReloadKey((current) => current + 1)
        }
    }
    async function handleReview(
        contentId: number,
        estado: ContentReviewStatus,
    ) {
        if (reviewingId !== null) return

        let observaciones_revision: string | null = null

        if (estado === 'ajustes_solicitados') {
            const respuesta = window.prompt(
                'Indica los ajustes que debe realizar el redactor:'
            )

            if (respuesta === null) return

            observaciones_revision = respuesta.trim()

            if (!observaciones_revision) {
                setReviewMessage('Debes indicar las observaciones.')
                return
            }
        } else {
            const accion = estado === 'aprobado' ? 'aprobar' : 'rechazar'
            if (!window.confirm(
                `?Confirmas que deseas ${accion} el contenido #${contentId}?`
            )) return
        }

        setReviewingId(contentId)
        setReviewMessage(null)

        try {
            await reviewContent(contentId, {
                estado,
                observaciones_revision,
            })

            setReviewMessage(
                `Contenido #${contentId}: revisión guardada correctamente.`
            )
            setReloadKey((actual) => actual + 1)
        } catch (error) {
            setReviewMessage(
                error instanceof Error
                    ? error.message
                    : 'No fue posible guardar la revisión.'
            )
        } finally {
            setReviewingId(null)
        }
    }

    return (
        <div className="space-y-8">
            <RecoverDiscordMessagesModal
                open={recoverModalOpen}
                onClose={() => setRecoverModalOpen(false)}
                channels={discordChannels}
            />
            {/* ENCABEZADO */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-500">
                        <CheckCircle2 size={21} />
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">
                            Aprobaciones
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Revisión humana del contenido preparado por
                            CloudEdTech antes de continuar su flujo
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        type="button"
                        disabled={motorLoading || reviewingId !== null}
                        onClick={() => setRecoverModalOpen(true)}
                        title="Actualizar contenidos e indicadores del Motor IA"
                        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                        <RefreshCcw size={16} />
                        Recuperar mensajes
                    </button>

                    <div className="flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                        <ShieldCheck size={14} />
                        Control humano activo
                    </div>
                </div>
            </div>

            {publicationMessage && (
                <div
                    role="status"
                    className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-800"
                >
                    {publicationMessage}
                </div>
            )}

            {reviewMessage && (
                <div role="status" className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                    {reviewMessage}
                </div>
            )}

            {/* ESTADO DE CONEXION CON MOTOR IA */}
            <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-800">
                    Conexión con Motor IA
                </p>

                {motorLoading && (
                    <p className="mt-2 text-sm text-slate-500">
                        Consultando contenidos reales...
                    </p>
                )}

                {motorError && (
                    <p className="mt-2 text-sm text-red-600">
                        Error de conexión: {motorError}
                    </p>
                )}

                {!motorLoading && !motorError && motorGroups && (
                    <div className="mt-2 space-y-1 text-sm text-slate-600">
                        <p>Pendientes: {motorGroups.pending.length}</p>
                        <p>Aprobados: {motorGroups.approved.length}</p>
                        <p>Requieren ajustes: {motorGroups.adjustments.length}</p>
                        <p>Rechazados: {motorGroups.rejected.length}</p>
                        <p>Otros estados: {motorGroups.other.length}</p>
                    </div>
                )}
            </div>

            {/* RESUMEN REAL DEL MOTOR IA */}
            {motorLoading && (
                <p className="text-sm text-slate-500">
                    Cargando indicadores reales...
                </p>
            )}

            {motorError && (
                <p className="text-sm text-red-600">
                    Indicadores no disponibles: {motorError}
                </p>
            )}

            {!motorLoading && !motorError && motorGroups && (
                <MotorApprovalSummary groups={motorGroups} />
            )}

            {/* FLUJO */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-slate-900">
                            Flujo de revisión
                        </h3>

                        <p className="mt-1 text-xs text-slate-500">
                            Contenidos procedentes de Redacción de
                            Contenidos para validación humana.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                        <span className="rounded-lg bg-slate-100 px-3 py-2 text-slate-600">
                            Redacción de Contenidos
                        </span>

                        <span className="text-slate-300">→</span>

                        <span className="rounded-lg bg-orange-50 px-3 py-2 text-orange-600">
                            Aprobaciones
                        </span>

                        <span className="text-slate-300">→</span>

                        <span className="rounded-lg bg-emerald-50 px-3 py-2 text-emerald-700">
                            Contenido aprobado
                        </span>
                    </div>
                </div>
            </div>

            {/* FILTROS REALES DEL MOTOR IA */}
            {!motorLoading && !motorError && motorGroups && (
                <MotorApprovalFilters
                    groups={motorGroups}
                    activeFilter={motorActiveFilter}
                    onChange={setMotorActiveFilter}
                />
            )}

            {discordChannelsError && (
                <div
                    role="alert"
                    className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
                >
                    No se pudieron cargar los canales de Discord:
                    {' '}{discordChannelsError}
                </div>
            )}

            {/* CONTENIDOS REALES DEL MOTOR IA */}
            <section className="space-y-4">
                <div>
                    <h3 className="text-lg font-bold text-slate-900">
                        Contenidos reales del Motor IA
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                        Registros del Motor IA con revisión humana habilitada.
                    </p>
                </div>

                {motorLoading && (
                    <p className="text-sm text-slate-500">
                        Cargando contenidos...
                    </p>
                )}

                {motorError && (
                    <p className="text-sm text-red-600">
                        No fue posible cargar los contenidos reales.
                    </p>
                )}

                {!motorLoading && !motorError && motorGroups && (
                    <>
                        {motorGroups[motorActiveFilter].length === 0 && (
                            <p className="text-sm text-slate-500">
                                No hay contenidos registrados para este estado.
                            </p>
                        )}

                        {motorGroups[motorActiveFilter].map((item) => (
                            <MotorApprovalCard
                                key={item.id}
                                item={item}
                                discordChannels={discordChannels}
                                                                onDiscordPublish={handleDiscordPublish}
                                onManualPublish={handleManualPublication}
                                manualPublishing={publishingId === item.id}
                                manualPublicationDisabled={
                                    motorLoading ||
                                    reviewingId !== null ||
                                    publishingId !== null ||
                                    publicationLockedIds.includes(item.id)
                                }
                                publishing={publishingId === item.id}
                                publicationDisabled={
                                    motorLoading ||
                                    reviewingId !== null ||
                                    publishingId !== null ||
                                    publicationLockedIds.includes(item.id)
                                }
                                onReview={handleReview}
                                reviewing={reviewingId === item.id}
                                reviewDisabled={reviewingId !== null || motorLoading}
                            />
                        ))}
                    </>
                )}
            </section>

            {/* NOTA DE INTEGRACIÓN */}
            <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                <div className="flex items-start gap-3">
                    <ShieldCheck
                        size={17}
                        className="mt-0.5 shrink-0 text-blue-600"
                    />

                    <div>
                        <p className="text-xs font-bold text-blue-900">
                            Control de aprobación CloudEdTech
                        </p>

                        <p className="mt-1 text-xs leading-5 text-blue-700">
                            Los contenidos provienen del Motor IA y requieren
                            revision humana. Aprobar, rechazar y solicitar ajustes
                            son acciones independientes de la publicacion.
                            Discord solo permite enviar contenidos aprobados,
                            con seleccion de canal y confirmacion explicita.
                            LinkedIn y X utilizan registro manual de publicacion.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Approvals