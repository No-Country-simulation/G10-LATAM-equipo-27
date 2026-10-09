import { CheckCircle2, ShieldCheck, RefreshCcw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getMotorContents } from '../api/motorContent'
import { reviewContent, type ContentReviewStatus } from '../api/contentReview'
import MotorApprovalCard from '../components/MotorApprovalCard'
import MotorApprovalSummary from '../components/MotorApprovalSummary'
import MotorApprovalFilters, { type MotorReviewFilter } from '../components/MotorApprovalFilters'
import { groupMotorApprovals, type MotorApprovalGroups } from '../api/motorApprovalGroups'

function Approvals() {
    const [motorActiveFilter, setMotorActiveFilter] =
        useState<MotorReviewFilter>('pending')

    const [motorGroups, setMotorGroups] = useState<MotorApprovalGroups | null>(null)
    const [motorLoading, setMotorLoading] = useState(false)
    const [motorError, setMotorError] = useState<string | null>(null)

    const [reloadKey, setReloadKey] = useState(0)
    const [reviewingId, setReviewingId] = useState<number | null>(null)
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
                `Contenido #${contentId}: revisi?n guardada correctamente.`
            )
            setReloadKey((actual) => actual + 1)
        } catch (error) {
            setReviewMessage(
                error instanceof Error
                    ? error.message
                    : 'No fue posible guardar la revisi?n.'
            )
        } finally {
            setReviewingId(null)
        }
    }

    return (
        <div className="space-y-8">
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
                        onClick={() => setReloadKey((actual) => actual + 1)}
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
                        Error de conexi?n: {motorError}
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

            {/* CONTENIDOS REALES DEL MOTOR IA */}
            <section className="space-y-4">
                <div>
                    <h3 className="text-lg font-bold text-slate-900">
                        Contenidos reales del Motor IA
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                        Registros del Motor IA con revisi?n humana habilitada.
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
                            Los contenidos e indicadores provienen del Motor IA.
                            Este tablero permanece en modo de consulta hasta
                            implementar la autenticacion y los permisos de revision.
                            Aprobar y publicar seran acciones independientes.
                            No se publican contenidos externos desde esta pantalla.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Approvals