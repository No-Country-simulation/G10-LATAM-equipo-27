import { apiRequest } from '../api/client'
import {
  BriefcaseBusiness,
  CheckCircle,
  Copy,
  FileText,
  MessageCircle,
  Pencil,
  RotateCcw,
  Send,
  Sparkles,
} from 'lucide-react'

import { useEffect, useRef, useState } from 'react'

import { createContentDraft, updateContentDraftImage, generateComplaintResponse, regenerateContent, generateCorporateImage, getCorporateImageBlob } from '../api/contentWorkflow'
import { evaluateBrandAlignment, commitBrandAlignment } from '../api/contentWorkflow'
import type { BrandAlignmentResponse } from '../api/contentWorkflow'
import { getComplaintPublishPreview, publishComplaintResponse } from '../api/contentWorkflow'
import type { ComplaintPublishPreview } from '../api/contentWorkflow'
import { updateMessageWorkflow } from '../api/messageWorkflow'
import { getMotorContents } from '../api/motorContent'
import { getPublishedComplaintIds } from '../api/contentWorkflow'

type DiscordAttachment = {
  id: string
  filename: string
  content_type: string | null
  size: number
  url: string
}

type WorkflowMessage = {
  interactionId: number
  author: string
  channel: string
  content: string
  topic: string
  sentiment: string
  relevance: number
  attachments: DiscordAttachment[]
}

type WorkflowMessagesResponse = {
  messages: Array<{
    message: {
      interaction_id: number
      author_name: string
      channel_name: string
      content: string
      attachments?: DiscordAttachment[]
    }
    analysis: {
      workflow_stage: string
      topic: string
      sentiment: string
      relevance: number
    }
  }>
}

type ContentFormat = 'linkedin' | 'x' | 'discord'

type DraftState = {
  brandEvaluation?: BrandAlignmentResponse
  brandEvaluating?: boolean
  brandError?: string
  brandEvaluatedContent?: string
  interactionId?: number
  attachments?: DiscordAttachment[]
  content: string
  submitted: boolean
  submitting?: boolean
  regenerating?: boolean
  error?: string
  savedId?: number
  imageUrl?: string
  imagePrompt?: string
  corporateImagePreview?: string
  corporateImageId?: string
  corporateImageSourceContent?: string
  corporateImageLoading?: boolean
  corporateImageError?: string
}

function ContentStudio() {

  async function handleGenerateCorporateImage(
    platform: ContentFormat,
    message: string,
  ) {
    const current = drafts[platform]

    if (
      !current.interactionId ||
      !message.trim() ||
      current.submitted ||
      current.submitting ||
      current.savedId ||
      current.corporateImageLoading
    ) {
      return
    }

    setDrafts((previous) => ({
      ...previous,
      [platform]: {
        ...previous[platform],
        corporateImageLoading: true,
        corporateImageError: '',
      },
    }))

    try {
      const result = await generateCorporateImage({
        plataforma: platform,
        titulo: 'CloudEdTech',
        mensaje: message.trim().slice(0, 2000),
      })

      const blob = await getCorporateImageBlob(result.image_url)
      const preview = URL.createObjectURL(blob)

      setDrafts((previous) => {
        const existing = previous[platform]

        if (
          existing.interactionId !== current.interactionId ||
          existing.content !== current.content
        ) {
          URL.revokeObjectURL(preview)
          return previous
        }

        if (existing.corporateImagePreview) {
          URL.revokeObjectURL(existing.corporateImagePreview)
        }

        return {
          ...previous,
          [platform]: {
            ...existing,
            corporateImagePreview: preview,
            corporateImageId: result.image_id,
            corporateImageSourceContent: current.content,
            corporateImageLoading: false,
            corporateImageError: '',
          },
        }
      })
    } catch (error) {
      setDrafts((previous) => ({
        ...previous,
        [platform]: {
          ...previous[platform],
          corporateImageLoading: false,
          corporateImageError:
            error instanceof Error
              ? error.message
              : 'No fue posible generar la imagen.',
        },
      }))
    }
  }


  const [workflowMessages, setWorkflowMessages] =
    useState<WorkflowMessage[]>([])
  const [selectedWorkflowId, setSelectedWorkflowId] =
    useState<number | null>(null)
  const [workflowLoading, setWorkflowLoading] = useState(true)
  const [workflowError, setWorkflowError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    const loadWorkflowMessages = async () => {
      setWorkflowLoading(true)
      setWorkflowError('')

      try {
        const data = (await apiRequest(
          '/api/v1/content-workflow/messages?limit=500',
          { signal: controller.signal }
        )) as WorkflowMessagesResponse
        const messages = data.messages
          .filter(
            (item) =>
              item.analysis.workflow_stage === 'en_redaccion',
          )
          .map((item) => ({
            interactionId: item.message.interaction_id,
            author: item.message.author_name || 'Usuario',
            channel: item.message.channel_name,
            content: item.message.content,
            attachments: Array.isArray(item.message.attachments)
              ? item.message.attachments
              : [],
            topic: item.analysis.topic,
            sentiment: item.analysis.sentiment,
            relevance: item.analysis.relevance,
          }))

        if (!controller.signal.aborted) {
          setWorkflowMessages(messages)
          setSelectedWorkflowId((current) =>
            messages.some((item) => item.interactionId === current)
              ? current
              : null,
          )
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setWorkflowError(
            error instanceof Error
              ? error.message
              : 'No fue posible cargar los mensajes',
          )
        }
      } finally {
        if (!controller.signal.aborted) {
          setWorkflowLoading(false)
        }
      }
    }

    void loadWorkflowMessages()

    return () => controller.abort()
  }, [])

  const selectedWorkflowMessage =
    workflowMessages.find(
      (item) => item.interactionId === selectedWorkflowId,
    ) ?? null





  const [activeComplaint, setActiveComplaint] = useState<number | null>(null)
  const activeComplaintRef = useRef<number | null>(null)
  const complaintRequestRef = useRef(0)
  const [complaintResponse, setComplaintResponse] = useState('')
  const [complaintGenerating, setComplaintGenerating] = useState(false)
  const [complaintGenerationError, setComplaintGenerationError] = useState('')
  const [complaintPublishing, setComplaintPublishing] = useState(false)
  const [complaintPublishError, setComplaintPublishError] = useState('')
  const [complaintPublishSuccess, setComplaintPublishSuccess] = useState('')
  const complaintPublishingRef = useRef(false)
  const complaintPublishLockedIds = useRef(new Set<number>())

  const [complaintDestination, setComplaintDestination] =
    useState<ComplaintPublishPreview | null>(null)
  const [complaintDestinationLoading, setComplaintDestinationLoading] =
    useState(false)
  const [complaintDestinationError, setComplaintDestinationError] =
    useState('')
  const complaintDestinationRequestRef = useRef(0)

  useEffect(() => {
    const interaccionId = activeComplaint
    const requestId = ++complaintDestinationRequestRef.current

    setComplaintDestination(null)
    setComplaintDestinationError('')

    if (interaccionId === null) {
      setComplaintDestinationLoading(false)
      return
    }

    setComplaintDestinationLoading(true)

    void getComplaintPublishPreview(interaccionId)
      .then((destino) => {
        if (complaintDestinationRequestRef.current !== requestId) return

        setComplaintDestination(destino)
      })
      .catch((error: unknown) => {
        if (complaintDestinationRequestRef.current !== requestId) return

        setComplaintDestinationError(
          error instanceof Error
            ? error.message
            : 'No fue posible verificar el destino de Discord.',
        )
      })
      .finally(() => {
        if (complaintDestinationRequestRef.current !== requestId) return

        setComplaintDestinationLoading(false)
      })

    return () => {
      if (complaintDestinationRequestRef.current === requestId) {
        complaintDestinationRequestRef.current += 1
      }
    }
  }, [activeComplaint])

  void setComplaintDestination
  void setComplaintDestinationLoading
  void setComplaintDestinationError
  void complaintDestinationRequestRef
  void complaintDestination
  void complaintDestinationLoading
  void complaintDestinationError



  type Complaint = {
    id: number
    texto: string
    autor: string | null
    canal: string | null
    sentimiento: string | null
    relevancia: number | null
    clasificacion: string
  }

  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [complaintsLoading, setComplaintsLoading] = useState(true)
  const [complaintsError, setComplaintsError] = useState('')
  const [complaintHistoryVerified, setComplaintHistoryVerified] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    const cargarQuejas = async () => {
      try {
        setComplaintsLoading(true)
        setComplaintsError('')
        setComplaintHistoryVerified(false)

        const data = (await apiRequest(
          '/api/v1/content-workflow/complaints',
          { signal: controller.signal }
        )) as { items: Complaint[] }
        let publishedIds: number[] = []
        let historialDisponible = true

        try {
          publishedIds = await getPublishedComplaintIds()
        } catch (historialError) {
          historialDisponible = false
          console.error(
            'No fue posible consultar el historial de respuestas publicadas:',
            historialError,
          )
        }

        const publishedSet = new Set(publishedIds)
        if (!controller.signal.aborted) {
          setComplaintHistoryVerified(historialDisponible)
        }

        if (!controller.signal.aborted) {
          setComplaints(
            (data.items ?? []).filter(
              (complaint) => !publishedSet.has(complaint.id),
            ),
          )

          if (!historialDisponible) {
            setComplaintsError(
              'Las quejas se recuperaron, pero no se pudo verificar el historial de respuestas publicadas. No envíes respuestas hasta restablecer esa consulta.',
            )
          }
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setComplaintsError(
            error instanceof Error
              ? error.message
              : 'No se pudieron cargar las posibles quejas.'
          )
        }
      } finally {
        if (!controller.signal.aborted) {
          setComplaintsLoading(false)
        }
      }
    }

    void cargarQuejas()

    return () => controller.abort()
  }, [])

  const [activeFormat, setActiveFormat] =
    useState<ContentFormat>('linkedin')

  const [copiedFormat, setCopiedFormat] =
    useState<ContentFormat | null>(null)
  const [showDiscordFiles, setShowDiscordFiles] =
    useState(false)

  const [drafts, setDrafts] = useState<Record<ContentFormat, DraftState>>({
    linkedin: { content: '', submitted: false },
    x: { content: '', submitted: false },
    discord: { content: '', submitted: false },
  })

  const discordFiles = (drafts.discord.attachments ?? []).filter(
    (file) => typeof file.filename === 'string' && file.filename.trim().length > 0,
  )

  const formatDiscordFileSize = (bytes: number) => {
    if (!Number.isFinite(bytes) || bytes < 0) return 'Tamaño desconocido'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const updateContent = (
    format: ContentFormat,
    content: string,
  ) => {
    setDrafts((current) => {
      if (
        current[format].savedId ||
        current[format].submitted ||
        current[format].submitting
      ) {
        return current
      }

      return {
      ...current,
      [format]: {
        ...current[format],
        content,
        corporateImageId: undefined,
        corporateImageSourceContent: undefined,
        brandEvaluation: undefined,
        brandEvaluatedContent: undefined,
        brandError: '',
      },
    }
    })
  }

  const prepareWorkflowContent = (chosenMessage?: WorkflowMessage) => {
    const message = chosenMessage ?? selectedWorkflowMessage
    if (!message) return
    const source = message.content.trim()

    if (!source) return

    const newDrafts: Record<ContentFormat, DraftState> = {
      linkedin: {
        interactionId: message.interactionId,
        attachments: [...message.attachments],
        content: `Una conversacion de nuestra comunidad nos invita a reflexionar:

"${source}"

Tema: ${message.topic}

En CloudEdTech valoramos las experiencias compartidas y el aprendizaje colaborativo.

#CloudEdTech #Comunidad #Aprendizaje`,
        submitted: false,
      },
      x: {
        interactionId: message.interactionId,
        attachments: [...message.attachments],
        content: `Desde nuestra comunidad: ${source}`,
        submitted: false,
      },
      discord: {
        interactionId: message.interactionId,
        attachments: [...message.attachments],
        content: `Gracias por compartir tu mensaje en #${message.channel}.

"${source}"

Desde CloudEdTech queremos continuar esta conversacion con la comunidad.`,
        submitted: false,
      },
    }

    setDrafts(newDrafts)
    setActiveFormat('linkedin')
    setShowDiscordFiles(false)
  }

  const handleEvaluateBrand = async (format: ContentFormat) => {
    const draft = drafts[format]
    const content = draft.content.trim()

    if (
      !draft.interactionId ||
      !content ||
      draft.brandEvaluating ||
      draft.submitting
    ) return

    const source = workflowMessages.find(
      (item) => item.interactionId === draft.interactionId,
    )

    setDrafts((current) => ({
      ...current,
      [format]: {
        ...current[format],
        brandEvaluating: true,
        brandError: '',
        brandEvaluation: undefined,
      },
    }))

    try {
      const evaluation = await evaluateBrandAlignment({
        contenido: content,
        plataforma: format,
        origen: source?.content ?? '',
        ...(draft.savedId ? { contenido_id: draft.savedId } : {}),
      })

      setDrafts((current) => {
        if (current[format].content.trim() !== content) return current

        return {
          ...current,
          [format]: {
            ...current[format],
            brandEvaluation: evaluation,
            brandEvaluatedContent: content,
            brandEvaluating: false,
          },
        }
      })
    } catch (error) {
      setDrafts((current) => ({
        ...current,
        [format]: {
          ...current[format],
          brandError: error instanceof Error
            ? error.message
            : 'No fue posible evaluar la marca.',
          brandEvaluating: false,
        },
      }))
    } finally {
      setDrafts((current) => ({
        ...current,
        [format]: {
          ...current[format],
          brandEvaluating: false,
        },
      }))
    }
  }

  const handleCopy = async (format: ContentFormat) => {
    await navigator.clipboard.writeText(
      drafts[format].content,
    )

    setCopiedFormat(format)

    setTimeout(() => {
      setCopiedFormat(null)
    }, 2000)
  }

  const submittingRef = useRef<Set<ContentFormat>>(new Set())

  const handleSubmit = async (format: ContentFormat) => {
    const draft = drafts[format]
    const content = draft.content.trim()

    if (draft.submitted || submittingRef.current.has(format)) return

    if (draft.corporateImageLoading) {
      setDrafts((current) => ({
        ...current,
        [format]: {
          ...current[format],
          error: 'Espera a que termine la generacion de la imagen corporativa.',
        },
      }))
      return
    }

    if (
      draft.corporateImageId &&
      draft.corporateImageSourceContent !== draft.content
    ) {
      setDrafts((current) => ({
        ...current,
        [format]: {
          ...current[format],
          error: 'El texto cambio despues de generar la imagen. Genera una nueva imagen antes de enviar.',
        },
      }))
      return
    }

    if (!draft.interactionId) {
      setDrafts(current => ({ ...current, [format]: { ...current[format], error: 'Selecciona una interacción real de Discord.' } }))
      return
    }

    if (!draft.savedId && !content) {
      setDrafts((current) => ({
        ...current,
        [format]: {
          ...current[format],
          error: 'Escribe un contenido antes de enviarlo.',
        },
      }))
      return
    }

    if (!draft.savedId && format === 'x' && [...content].length > 280) {
      setDrafts((current) => ({
        ...current,
        [format]: {
          ...current[format],
          error: 'El contenido supera los 280 caracteres.',
        },
      }))
      return
    }


    submittingRef.current.add(format)

    setDrafts((current) => ({
      ...current,
      [format]: {
        ...current[format],
        submitting: true,
        error: '',
      },
    }))

    let savedId = draft.savedId

    try {
      if (!savedId) {
        const result = await createContentDraft({
          interaccion_id: draft.interactionId,
          plataforma: format,
          titulo: `Contenido ${format.toUpperCase()} - ${new Date().toLocaleDateString('es-CO')}`,
          contenido: content,
          tono: 'profesional',
          tipo_contenido: 'publicacion',
          imagen_generada_url: draft.corporateImageId
            ? `/api/v1/content-workflow/corporate-images/${draft.corporateImageId}`
            : null,
          imagen_generada_prompt: null,
        })

        savedId = result.id

        setDrafts((current) => ({
          ...current,
          [format]: {
            ...current[format],
            savedId: result.id,
          },
        }))
      }

      if (!savedId) {
        throw new Error(
          'No se obtuvo un identificador valido del borrador.'
        )
      }

      // Sincronizar la imagen elegida antes de enviar a Aprobaciones.
      // Si el borrador ya existe, se actualiza sin crear duplicados.
      const selectedImageUrl = draft.corporateImageId
        ? `/api/v1/content-workflow/corporate-images/${draft.corporateImageId}`
        : null

      await updateContentDraftImage(savedId, selectedImageUrl)

      const persistedContents = await getMotorContents()
      const persistedDraft = persistedContents.find(
        (item) => item.id === savedId
      )

      if (!persistedDraft) {
        throw new Error(
          `El borrador #${savedId} no aparece en el Motor IA. ` +
          'No se confirmo su envio a Aprobaciones.'
        )
      }

      if (persistedDraft.estado !== 'pendiente_revision') {
        throw new Error(
          `El borrador #${savedId} no esta pendiente de revision.`
        )
      }

      if (draft.corporateImageId) {
        const expectedImageUrl =
          `/api/v1/content-workflow/corporate-images/${draft.corporateImageId}`

        if (persistedDraft.imagen_generada_url !== expectedImageUrl) {
          throw new Error(
            `La imagen corporativa no quedo guardada en el borrador #${savedId}. ` +
            'No se envio a Aprobaciones.'
          )
        }
      }

      if (draft.interactionId) {
        await updateMessageWorkflow(draft.interactionId, 'en_aprobacion')
        setWorkflowMessages((current) =>
          current.filter((item) => item.interactionId !== draft.interactionId),
        )
        setSelectedWorkflowId((current) =>
          current === draft.interactionId ? null : current,
        )
      }

      // Solo la última evaluación del texto efectivamente enviado cuenta en Analytics.
      // Si falla el registro, el envío sigue siendo válido; el usuario puede reevaluar.
      let alignmentWarning = ''
      if (savedId && draft.brandEvaluation && draft.brandEvaluatedContent === content) {
        try {
          await commitBrandAlignment({
            contenido_id: savedId,
            contenido: content,
            plataforma: format,
            evaluacion: draft.brandEvaluation,
          })
        } catch (error) {
          alignmentWarning = error instanceof Error ? error.message : 'No se pudo registrar la evaluación final.'
        }
      }

      setDrafts((current) => ({
        ...current,
        [format]: {
          ...current[format],
          submitted: true,
          submitting: false,
          savedId,
          error: alignmentWarning,
        },
      }))
    } catch (error) {
      setDrafts((current) => ({
        ...current,
        [format]: {
          ...current[format],
          submitting: false,
          savedId,
          error:
            error instanceof Error
              ? error.message
              : 'No fue posible completar el envio a aprobacion.',
        },
      }))
    } finally {
      submittingRef.current.delete(format)
    }
  }

  const regeneratingRef = useRef<Set<ContentFormat>>(new Set())
  const draftsRef = useRef(drafts)
  draftsRef.current = drafts

  const handleRegenerate = async (format: ContentFormat) => {
    const draft = draftsRef.current[format]

    if (
      draft.submitted ||
      draft.submitting ||
      draft.savedId ||
      regeneratingRef.current.has(format)
    ) return

    const message = workflowMessages.find(
      (item) => item.interactionId === draft.interactionId,
    )

    if (!message || !message.content.trim()) {
      setDrafts((current) => ({
        ...current,
        [format]: {
          ...current[format],
          error: 'Selecciona primero un mensaje real de Discord para regenerar.',
        },
      }))
      return
    }

    const interactionId = message.interactionId
    const originalContent = draft.content

    regeneratingRef.current.add(format)
    setActiveFormat(format)

    setDrafts((current) => ({
      ...current,
      [format]: {
        ...current[format],
        regenerating: true,
        error: '',
      },
    }))

    try {
      const result = await regenerateContent({
        texto: message.content,
        canal: message.channel,
        formato: format,
        tono: 'profesional',
      })

      setDrafts((current) => {
        const actual = current[format]

        if (
          actual.interactionId !== interactionId ||
          actual.submitted ||
          actual.submitting ||
          actual.savedId ||
          actual.content !== originalContent
        ) {
          return current
        }

        return {
          ...current,
          [format]: {
            ...actual,
            content: result.contenido,
            regenerating: false,
            brandEvaluation: undefined,
            brandEvaluatedContent: undefined,
            brandError: '',
            error: '',
          },
        }
      })
    } catch (error) {
      setDrafts((current) => {
        if (current[format].interactionId !== interactionId) return current

        return {
          ...current,
          [format]: {
            ...current[format],
            error: error instanceof Error
              ? error.message
              : 'No fue posible regenerar el contenido.',
          },
        }
      })
    } finally {
      regeneratingRef.current.delete(format)

      setDrafts((current) => {
        if (current[format].interactionId !== interactionId) return current

        return {
          ...current,
          [format]: {
            ...current[format],
            regenerating: false,
          },
        }
      })
    }
  }

  const formats: Array<{
    id: ContentFormat
    name: string
    description: string
    icon: typeof BriefcaseBusiness
  }> = [
      {
        id: 'linkedin',
        name: 'LinkedIn',
        description: 'Publicación profesional',
        icon: BriefcaseBusiness,
      },
      {
        id: 'x',
        name: 'X',
        description: 'Publicación breve para X',
        icon: MessageCircle,
      },
      {
        id: 'discord',
        name: 'Discord',
        description: 'Mensaje para la comunidad',
        icon: MessageCircle,
      },
    ]

  return (
    <div>
      {/* BANDEJA PERSISTENTE DE REDACCION */}
      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Bandeja de mensajes en Redaccion
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Interacciones recibidas desde Analisis.
            </p>
          </div>
          <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-600">
            {workflowMessages.length} en redaccion
          </span>
        </div>

        {workflowLoading && (
          <p className="text-sm text-slate-500">
            Cargando mensajes...
          </p>
        )}

        {workflowError && (
          <p role="alert" className="text-sm text-rose-600">
            {workflowError}
          </p>
        )}

        {!workflowLoading &&
          !workflowError &&
          workflowMessages.length === 0 && (
            <p className="text-sm text-slate-500">
              No hay mensajes pendientes de redaccion.
            </p>
          )}

        {workflowMessages.length > 0 && (
          <div className="grid gap-3 md:grid-cols-2">
            {workflowMessages.map((item) => (
              <button
                key={item.interactionId}
                type="button"
                onClick={() => setSelectedWorkflowId(item.interactionId)}
                className={`rounded-xl border p-4 text-left transition ${
                  selectedWorkflowId === item.interactionId
                    ? 'border-orange-400 bg-orange-50'
                    : 'border-slate-200 hover:border-orange-200'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-800">
                    {item.author}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    #{item.channel}
                  </span>
                </div>
                <p className="mt-2 line-clamp-3 text-xs text-slate-600">
                  {item.content}
                </p>
              </button>
            ))}
          </div>
        )}

        {selectedWorkflowMessage && (
          <div className="mt-4 rounded-xl border border-orange-200 bg-orange-50/50 p-4">
            <p className="text-xs font-bold text-orange-700">
              Mensaje seleccionado para redaccion
            </p>
            <p className="mt-2 text-sm text-slate-700">
              {selectedWorkflowMessage.content}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Tema: {selectedWorkflowMessage.topic} |
              Relevancia: {selectedWorkflowMessage.relevance}/100
            </p>
            {selectedWorkflowMessage.attachments.length > 0 && (
              <p className="mt-2 break-all text-xs text-slate-600">
                Adjuntos ({selectedWorkflowMessage.attachments.length}): {selectedWorkflowMessage.attachments.map(f => f.filename).join(', ')}
              </p>
            )}
            <button
              type="button"
              onClick={() => prepareWorkflowContent()}
              className="mt-4 rounded-xl bg-orange-500 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-orange-600"
            >
              Preparar contenido en el editor
            </button>
          </div>
        )}
      </section>

      {/* Encabezado */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-500">
            <Sparkles size={21} />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Redacción de Contenidos
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Convierte conversaciones de Discord en contenido
              adaptado para diferentes canales
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-2">
          <span className="h-2 w-2 rounded-full bg-green-500" />

          <span className="text-xs font-semibold text-green-700">
            Discord conectado
          </span>
        </div>
      </div>

      {/* Mensaje original */}
      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <MessageCircle size={19} />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold text-slate-900">
                  Mensaje original de Discord
                </h3>

                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  Mesa de trabajo
                </span>
              </div>

              <p className="mt-1 text-xs text-slate-400">
                Insumo seleccionado para generación de contenido
              </p>
            </div>
          </div>

          <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">
            Discord
          </span>
        </div>

        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-slate-900">
                {selectedWorkflowMessage?.author ?? 'Sin mensaje seleccionado'}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Conversación seleccionada
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                Sentimiento {selectedWorkflowMessage?.sentiment ?? 'Sin datos'}
              </span>

              <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                Relevancia {selectedWorkflowMessage?.relevance ?? 'Sin datos'}
              </span>
            </div>
          </div>

          <h4 className="mt-4 font-bold text-slate-900">
            {selectedWorkflowMessage?.topic ?? 'Selecciona una interacción'}
          </h4>

          <p className="mt-3 text-sm leading-7 text-slate-600">
            {selectedWorkflowMessage?.content ?? 'Selecciona un mensaje de la cola para redactar.'}
          </p>
        </div>
      </section>

      {/* Selector de formato */}
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50 text-orange-500">
            <FileText size={18} />
          </div>

          <div>
            <h3 className="font-bold text-slate-900">
              Contenido generado
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Revisa y adapta cada formato antes de enviarlo a
              aprobación
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
          {formats.map((format) => {
            const Icon = format.icon
            const selected = activeFormat === format.id

            return (
              <button
                key={format.id}
                type="button"
                onClick={() => setActiveFormat(format.id)}
                className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${selected
                  ? 'border-orange-300 bg-orange-50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${selected
                    ? 'bg-orange-500 text-white'
                    : 'bg-slate-100 text-slate-600'
                    }`}
                >
                  <Icon size={19} />
                </div>

                <div>
                  <p className="font-semibold text-slate-900">
                    {format.name}
                  </p>

                  <p className="mt-0.5 text-xs text-slate-500">
                    {format.description}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </section>

      {/* Tarjetas */}
      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        {formats.map((format) => {
          const Icon = format.icon
          const draft = drafts[format.id]

          return (
            <section
              key={format.id}
              className={`flex flex-col rounded-2xl border bg-white shadow-sm transition ${activeFormat === format.id
                ? 'border-orange-300 ring-2 ring-orange-50'
                : 'border-slate-200'
                }`}
            >
              {/* Cabecera tarjeta */}
              <div className="border-b border-slate-100 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                      <Icon size={18} />
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900">
                        {format.name}
                      </h3>

                      <p className="text-xs text-slate-400">
                        {format.description}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${draft.submitted
                      ? 'bg-green-50 text-green-700'
                      : 'bg-amber-50 text-amber-700'
                      }`}
                  >
                    {draft.submitted
                      ? 'En aprobación'
                      : 'Borrador'}
                  </span>
                </div>
              </div>

              {/* Editor */}
              <div className="flex flex-1 flex-col p-5">
                <label
                  htmlFor={`content-${format.id}`}
                  className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  <Pencil size={14} />
                  Contenido editable
                </label>

                <textarea
                  id={`content-${format.id}`}
                  value={draft.content}
                  disabled={draft.submitted}
                  onFocus={() => setActiveFormat(format.id)}
                  onChange={(event) =>
                    updateContent(
                      format.id,
                      event.target.value,
                    )
                  }
                  className="mt-3 min-h-72 flex-1 resize-y rounded-xl border border-slate-200 p-4 text-sm leading-6 text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100 disabled:bg-slate-50 disabled:text-slate-500"
                />
                {format.id === 'x' && (
                  <p
                    className={`mt-2 text-right text-xs font-semibold ${
                      [...draft.content].length > 280
                        ? 'text-rose-600'
                        : 'text-slate-500'
                    }`}
                  >
                    {[...draft.content].length} / 280 caracteres
                  </p>
                )}
                {format.id === 'discord' && discordFiles.length > 0 && (
                  <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          Archivos adjuntos
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {discordFiles.length} archivo(s) del mensaje original
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setShowDiscordFiles((current) => !current)
                        }
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        {showDiscordFiles ? 'Ocultar archivos' : 'Ver archivos'}
                      </button>
                    </div>

                    {showDiscordFiles && (
                      <div className="mt-3 space-y-2">
                        {discordFiles.map((file) => (
                          <div
                            key={file.id}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2"
                          >
                            <div className="min-w-0">
                              <p className="break-all text-xs font-semibold text-slate-700">
                                {file.filename}
                              </p>
                              <p className="mt-0.5 text-xs text-slate-400">
                                {file.content_type || file.filename.split('.').pop()?.toUpperCase() || 'Archivo'} · {formatDiscordFileSize(file.size)}
                              </p>
                            </div>

                            <span className="text-xs text-slate-500">Descarga disponible en Aprobaciones</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Evaluaci?n de alineación de marca */}
                <div className="mt-4 space-y-3">
                  <button
                    type="button"
                    onClick={() => void handleEvaluateBrand(format.id)}
                    disabled={
                      draft.brandEvaluating ||
                      !draft.content.trim() ||
                      !draft.interactionId ||
                      draft.submitting
                    }
                    className="inline-flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700 transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Sparkles size={16} />
                    {draft.brandEvaluating
                      ? 'Evaluando marca...'
                      : 'Evaluar alineación de marca'}
                  </button>

                  {draft.brandError && (
                    <p className="text-sm text-rose-600">
                      {draft.brandError}
                    </p>
                  )}

                  {draft.brandEvaluation &&
                    draft.brandEvaluatedContent === draft.content.trim() && (
                      <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <h4 className="text-sm font-bold text-slate-900">
                            Alineación de marca
                          </h4>
                          <span className="text-xl font-bold text-orange-600">
                            {draft.brandEvaluation.puntuacion}/100
                          </span>
                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="h-full rounded-full bg-orange-500"
                            style={{
                              width: `${draft.brandEvaluation.puntuacion}%`,
                            }}
                          />
                        </div>

                        <div className="grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                          <span>
                            Tono y voz: {draft.brandEvaluation.tono_y_voz}%
                          </span>
                          <span>
                            Estructura: {draft.brandEvaluation.estructura_y_claridad}%
                          </span>
                          <span>
                            Valores: {draft.brandEvaluation.valores_de_marca}%
                          </span>
                          <span>
                            Credibilidad: {draft.brandEvaluation.seguridad_y_credibilidad}%
                          </span>
                        </div>

                        <p className="text-sm text-slate-700">
                          {draft.brandEvaluation.justificacion}
                        </p>

                        {draft.brandEvaluation.fortalezas.length > 0 && (
                          <div>
                            <p className="mb-1 text-xs font-bold text-emerald-700">
                              Fortalezas
                            </p>
                            <ul className="list-inside list-disc text-sm text-slate-700">
                              {draft.brandEvaluation.fortalezas.map(
                                (item, index) => (
                                  <li key={index}>{item}</li>
                                ),
                              )}
                            </ul>
                          </div>
                        )}

                        {draft.brandEvaluation.mejoras.length > 0 && (
                          <div>
                            <p className="mb-1 text-xs font-bold text-amber-700">
                              Recomendaciones
                            </p>
                            <ul className="list-inside list-disc text-sm text-slate-700">
                              {draft.brandEvaluation.mejoras.map(
                                (item, index) => (
                                  <li key={index}>{item}</li>
                                ),
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                </div>

                {true && (
                  <section className="mt-5 rounded-xl border border-indigo-200 bg-indigo-50/40 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-800">
                          Imagen corporativa para {format.name}
                        </h4>
                        <p className="mt-1 text-xs text-slate-500">
                          Genera una pieza con el isotipo oficial de CloudEdTech. No utiliza IA generativa.
                        </p>
                      </div>
                      <Sparkles size={18} className="text-indigo-500" />
                    </div>

                    <button
                      type="button"
                      disabled={
                        !draft.interactionId ||
                        !draft.content.trim() ||
                        draft.submitted ||
                        draft.submitting ||
                        Boolean(draft.savedId) ||
                        Boolean(draft.corporateImageLoading)
                      }
                      onClick={() =>
                        void handleGenerateCorporateImage(
                          format.id,
                          draft.content,
                        )
                      }
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Sparkles size={17} />
                      {draft.corporateImageLoading
                        ? 'Creando imagen corporativa...'
                        : 'Crear pieza corporativa'}
                    </button>

                    {draft.corporateImageError && (
                      <p className="mt-2 text-xs text-red-600">
                        {draft.corporateImageError}
                      </p>
                    )}

                    {draft.corporateImagePreview &&
                      draft.corporateImageId &&
                      draft.corporateImageSourceContent === draft.content && (
                        <div className="mt-4 rounded-lg border border-orange-200 bg-white p-3">
                          <img
                            src={draft.corporateImagePreview}
                            alt={`Imagen corporativa para ${format.name}`}
                            className="max-h-72 w-full rounded-lg object-contain"
                          />
                          <button
                            type="button"
                            disabled={draft.submitted || draft.submitting}
                            onClick={() => {
                              setDrafts((current) => ({
                                ...current,
                                [format.id]: {
                                  ...current[format.id],
                                  corporateImageId: undefined,
                                  corporateImagePreview: undefined,
                                  corporateImageSourceContent: undefined,
                                  corporateImageError: '',
                                },
                              }))
                            }}
                            className="mt-3 flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            Eliminar imagen
                          </button>
                        </div>
                      )}

                    <p className="mt-3 text-xs leading-5 text-slate-500">
                      La imagen se adjunta al texto editable y se enviara
                      a Aprobaciones si decides conservarla.
                    </p>
                  </section>
                )}

                {/* Acciones auxiliares */}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopy(format.id)}
                    className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                  >
                    {copiedFormat === format.id ? (
                      <CheckCircle size={15} />
                    ) : (
                      <Copy size={15} />
                    )}

                    {copiedFormat === format.id
                      ? 'Copiado'
                      : 'Copiar'}
                  </button>

                  <button
                    type="button"
                    disabled={draft.submitted || draft.submitting || draft.regenerating || !draft.interactionId || Boolean(draft.savedId)}
                    onClick={() =>
                      handleRegenerate(format.id)
                    }
                    className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                  >
                    <RotateCcw size={15} className={draft.regenerating ? 'animate-spin' : ''} />
                    {draft.regenerating ? 'Regenerando...' : 'Regenerar'}
                  </button>
                </div>

                {/* Enviar a aprobación */}
                <button
                  type="button"
                  onClick={() => handleSubmit(format.id)}
                  disabled={draft.submitted || draft.submitting || draft.regenerating || draft.corporateImageLoading || !draft.interactionId || !draft.content.trim() || (format.id === 'x' && [...draft.content].length > 280)}
                  className={`mt-3 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${draft.submitted
                    ? 'cursor-not-allowed bg-green-50 text-green-700'
                    : 'bg-orange-500 text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:hover:bg-slate-200'
                    }`}
                >
                  {draft.submitted ? (
                    <CheckCircle size={16} />
                  ) : (
                    <Send size={16} />
                  )}

                  {draft.submitted
                    ? 'Enviado a aprobación'
                    : draft.submitting
                      ? 'Enviando...'
                      : draft.savedId
                        ? 'Reintentar envio a aprobacion'
                        : 'Enviar a aprobación'}
                </button>

                {draft.savedId && (
                  <p className="mt-2 text-center text-xs font-medium text-green-700">
                    Borrador #{draft.savedId} guardado para revisión.
                  </p>
                )}

                {draft.error && (
                  <p role="alert" className="mt-2 text-center text-xs text-red-600">
                    {draft.error}
                  </p>
                )}

                {format.id === 'discord' && (
                  <p className="mt-3 text-center text-xs leading-5 text-slate-400">
                    La publicación en Discord estará disponible
                    únicamente después de su aprobación. Este contenido
                    incluye {discordFiles.length} archivo(s) adjunto(s).
                  </p>
                )}

                {format.id !== 'discord' && (
                  <p className="mt-3 text-center text-xs leading-5 text-slate-400">
                    Una vez aprobado, el contenido podrá copiarse
                    para su publicación externa.
                  </p>
                )}
              </div>
            </section>
          )
        })}
      </div>

      {/* Quejas, reclamos y soporte crítico */}
      <section className="mt-6 rounded-2xl border border-rose-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <MessageCircle size={19} />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold text-slate-900">
                  Panel de Quejas, Reclamos y Soporte Crítico
                </h3>

                <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-600">
                  IA + revisión humana
                </span>
              </div>

              <p className="mt-1 text-sm text-slate-500">
                Interacciones negativas de Discord que requieren revisión
                para determinar si necesitan una respuesta.
              </p>
            </div>
          </div>

          <span className="rounded-full bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600">
            {complaintsLoading ? 'Cargando...' : `${complaints.length} posibles quejas`}
          </span>
        </div>

        {complaintsError && (
          <p role="alert" className="mt-4 text-sm text-red-600">
            No se pudieron cargar las interacciones: {complaintsError}
          </p>
        )}

        <div className="mt-5 space-y-3">
          {!complaintsLoading && !complaintsError && complaints.length === 0 && (
            <p className="text-sm text-slate-500">
              No hay interacciones negativas para revisar.
            </p>
          )}

          {complaints.map((complaint) => (
            <div
              key={complaint.id}
              className="rounded-xl border border-rose-100 bg-rose-50/30 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700">
                    Posible queja
                  </span>

                  <span className="text-xs text-slate-500">
                    {complaint.canal || 'Discord'} · {complaint.autor || 'Autor desconocido'}
                  </span>
                </div>

                <span className="text-xs font-medium text-orange-600">
                  Relevancia: {complaint.relevancia ?? 'Sin evaluar'}
                </span>
              </div>

              <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                {complaint.texto}
              </p>

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  disabled={complaintPublishing}
                  onClick={() => {
                    if (complaintPublishingRef.current) return
                    complaintRequestRef.current += 1
                    setComplaintPublishError('')
                    setComplaintPublishSuccess('')
                    activeComplaintRef.current = complaint.id
                    setActiveComplaint(complaint.id)
                    setComplaintGenerating(false)
                    setComplaintGenerationError('')
                    setComplaintResponse('')
                  }}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700"
                >
                  Preparar respuesta
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Ventana de respuesta a quejas */}
      {activeComplaint !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-3 sm:p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !complaintPublishingRef.current) {
              complaintRequestRef.current += 1
              activeComplaintRef.current = null
              setComplaintGenerating(false)
              setActiveComplaint(null)
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="complaint-dialog-title"
            className="max-h-[90dvh] overflow-y-auto overscroll-contain w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3
                  id="complaint-dialog-title"
                  className="text-xl font-bold text-slate-900"
                >
                  Preparar respuesta
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Revisa y redacta una respuesta antes de enviarla a Discord.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (complaintPublishingRef.current) return
                  complaintRequestRef.current += 1
                  activeComplaintRef.current = null
                  setComplaintGenerating(false)
                  setActiveComplaint(null)
                }}
                aria-label="Cerrar ventana"
                className="rounded-lg px-3 py-1 text-slate-500 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 rounded-xl border border-indigo-100 bg-indigo-50 p-4">
              <p className="text-xs font-semibold uppercase text-indigo-600">
                Mensaje seleccionado
              </p>
              <p className="mt-2 text-sm text-slate-700">
                {complaints.find((item) => item.id === activeComplaint)?.texto
                  || 'No se encontró el mensaje seleccionado.'}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Autor: {complaints.find((item) => item.id === activeComplaint)?.autor || 'Desconocido'}
                {' · '}
                Canal: {complaints.find((item) => item.id === activeComplaint)?.canal || 'Discord'}
              </p>
            </div>

            <div className="mt-5">
              <button
                type="button"
                disabled={complaintGenerating || complaintPublishing}
                onClick={async () => {
                  if (activeComplaint === null) return

                  const interactionId = activeComplaint
                  const requestId = ++complaintRequestRef.current
                  activeComplaintRef.current = interactionId

                  setComplaintGenerating(true)
                  setComplaintGenerationError('')

                  try {
                    const data = await generateComplaintResponse(interactionId)

                    if (
                      typeof data.respuesta !== 'string' ||
                      !data.respuesta.trim()
                    ) {
                      throw new Error('El servidor no devolvio una respuesta valida.')
                    }

                    if (
                      complaintRequestRef.current === requestId &&
                      activeComplaintRef.current === interactionId
                    ) {
                      setComplaintResponse(data.respuesta)
                    }
                  } catch (error) {
                    if (complaintRequestRef.current === requestId) {
                      setComplaintGenerationError(
                        error instanceof Error
                          ? error.message
                          : 'No se pudo generar la respuesta.'
                      )
                    }
                  } finally {
                    if (complaintRequestRef.current === requestId) {
                      setComplaintGenerating(false)
                    }
                  }
                }}
                className="flex items-center gap-2 rounded-lg bg-indigo-100 px-4 py-2.5 text-sm font-semibold text-indigo-500 disabled:cursor-not-allowed"
              >
                <Sparkles size={16} className={complaintGenerating ? 'animate-pulse' : ''} />
                {complaintGenerating ? 'Generando respuesta...' : 'Generar con IA'}
              </button>
            </div>

            {complaintGenerationError && (
              <p
                role="alert"
                className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              >
                No se pudo generar la respuesta: {complaintGenerationError}
              </p>
            )}

            <label
              htmlFor="complaint-response"
              className="mt-5 block text-sm font-semibold text-slate-700"
            >
              Respuesta editable
            </label>

            <textarea
              id="complaint-response"
              value={complaintResponse}
              disabled={complaintPublishing || Boolean(complaintPublishSuccess)}
              onChange={(event) => setComplaintResponse(event.target.value)}
              placeholder="Escribe aquí tu respuesta a la queja..."
              rows={7}
              className="mt-2 w-full resize-y rounded-xl border border-slate-200 p-4 text-sm leading-6 text-slate-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            />

            <p className="mt-2 text-xs text-slate-500">
              La respuesta no se enviará hasta que confirmes su publicación.
            </p>

            {complaintResponse.trim() && (
              <div className="mt-5 rounded-xl border border-orange-200 bg-orange-50 p-4">
                <p className="text-sm font-semibold text-orange-800">
                  Vista previa de publicación en Discord
                </p>

                {complaintDestinationLoading && (
                  <p className="mt-3 text-sm text-indigo-700">
                    Verificando el destino con el backend...
                  </p>
                )}

                {complaintDestinationError && (
                  <p className="mt-3 text-sm text-red-700" role="alert">
                    {complaintDestinationError}
                  </p>
                )}

                {complaintDestination?.ready &&
                complaintDestination.interaccion_id === activeComplaint ? (
                  <div className="mt-3 space-y-2 rounded-lg border border-green-200 bg-white p-3">
                    <p className="text-sm font-semibold text-green-800">
                      Destino verificado por el backend
                    </p>
                    <p className="text-xs text-slate-700">
                      Canal: <strong>#{complaintDestination.channel_name}</strong>
                    </p>
                    <p className="break-all text-xs text-slate-600">
                      ID del canal: {complaintDestination.channel_id}
                    </p>
                    <p className="text-xs text-slate-700">
                      Autor original: {complaintDestination.author}
                    </p>
                    <p className="text-xs font-semibold text-slate-700">
                      Mensaje original:
                    </p>
                    <p className="whitespace-pre-wrap break-words text-sm text-slate-700">
                      {complaintDestination.original_content || '(Sin contenido de texto)'}
                    </p>
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-amber-800">
                    Canal indicado en la lista: <strong>
                      {complaints.find((item) => item.id === activeComplaint)?.canal || 'No identificado'}
                    </strong>. Destino pendiente de verificaci?n.
                  </p>
                )}

                <p className="mt-1 text-xs text-slate-600">
                  Interacción: <strong>{activeComplaint}</strong>
                </p>

                <p className="mt-3 text-xs font-semibold text-slate-700">
                  Texto que se enviaría:
                </p>

                <p className="mt-2 whitespace-pre-wrap break-words rounded-lg border border-orange-100 bg-white p-3 text-sm text-slate-700">
                  {complaintResponse.trim()}
                </p>

                <p className="mt-3 text-xs text-orange-800">
                  Vista previa únicamente. No se enviará ningún mensaje
                  hasta completar la validación del destino y confirmar
                  expresamente la publicación.
                </p>
              </div>
            )}

            <div className="mt-4 space-y-2" aria-live="polite">
              {complaintPublishing && (
                <p className="text-sm text-indigo-600">
                  Procesando publicación...
                </p>
              )}
              {complaintPublishError && (
                <p className="text-sm text-red-600" role="alert">
                  {complaintPublishError}
                </p>
              )}
              {complaintPublishSuccess && (
                <p className="text-sm text-green-700">
                  {complaintPublishSuccess}
                </p>
              )}
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  if (complaintPublishingRef.current) return
                  complaintRequestRef.current += 1
                  activeComplaintRef.current = null
                  setComplaintGenerating(false)
                  setActiveComplaint(null)
                }}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={
                  !complaintHistoryVerified ||
                  complaintPublishing ||
                  complaintGenerating ||
                  complaintDestinationLoading ||
                  !complaintDestination?.ready ||
                  complaintDestination.interaccion_id !== activeComplaint ||
                  !complaintResponse.trim() ||
                  complaintResponse.trim().length > 2000 ||
                  Boolean(complaintPublishSuccess) ||
                  (activeComplaint !== null &&
                    complaintPublishLockedIds.current.has(activeComplaint))
                }
                onClick={async () => {
                  const interactionId = activeComplaint
                  const destination = complaintDestination
                  const respuesta = complaintResponse.trim()

                  if (
                    interactionId === null ||
                    !complaintHistoryVerified ||
                    !destination?.ready ||
                    destination.interaccion_id !== interactionId ||
                    !respuesta ||
                    respuesta.length > 2000 ||
                    complaintPublishingRef.current ||
                    complaintPublishLockedIds.current.has(interactionId)
                  ) return

                  const confirmado = window.confirm(
                    `PUBLICAR RESPUESTA REAL EN DISCORD?\n\n` +
                    `Canal: #${destination.channel_name}\n` +
                    `ID del canal: ${destination.channel_id}\n` +
                    `Interaccion: ${interactionId}\n\n` +
                    `TEXTO EXACTO:\n${respuesta}\n\n` +
                    `Aceptar enviara este mensaje a Discord.`
                  )

                  if (!confirmado) return

                  complaintPublishingRef.current = true
                  complaintPublishLockedIds.current.add(interactionId)
                  setComplaintPublishing(true)
                  setComplaintPublishError('')
                  setComplaintPublishSuccess('')

                  try {
                    const resultado = await publishComplaintResponse({
                      interaccion_id: interactionId,
                      respuesta,
                      confirmado: true,
                    })

                    setComplaintPublishSuccess(
                      `Publicado en Discord. Canal: #${destination.channel_name}. ` +
                      `ID del mensaje: ${resultado.discord_message_id}`
                    )
                    setComplaints((actuales) =>
                      actuales.filter((queja) => queja.id !== interactionId)
                    )

                    activeComplaintRef.current = null
                    setActiveComplaint(null)
                  } catch (error) {
                    setComplaintPublishError(
                      (error instanceof Error ? error.message : 'Error de publicacion.') +
                      ' Verifica Discord y Auditoria antes de volver a intentarlo.'
                    )
                  } finally {
                    complaintPublishingRef.current = false
                    setComplaintPublishing(false)
                  }
                }}
                className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-orange-200"
              >
                <Send size={16} />
                {complaintPublishing ? 'Publicando...' : 'Enviar respuesta a Discord'}
              </button>
            </div>
          </section>
        </div>
      )}

      {/* Cola de mensajes reales en espera */}
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-slate-900">
              Cola de Mensajes en Espera
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Interacciones reales procesadas por Ingesta y Análisis.
            </p>
          </div>
          <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
            {workflowMessages.length} pendientes
          </span>
        </div>

        {workflowLoading && (
          <p className="mt-5 text-sm text-slate-500">Cargando mensajes...</p>
        )}

        {workflowError && (
          <p className="mt-5 text-sm text-red-600">{workflowError}</p>
        )}

        {!workflowLoading && !workflowError && workflowMessages.length === 0 && (
          <p className="mt-5 text-sm text-slate-500">
            No hay mensajes pendientes de redacción.
          </p>
        )}

        {!workflowLoading && !workflowError && workflowMessages.length > 0 && (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[850px] text-left">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase text-slate-400">
                  <th className="px-3 py-3">Autor y canal</th>
                  <th className="px-3 py-3">Contenido</th>
                  <th className="px-3 py-3">Tema</th>
                  <th className="px-3 py-3">Sentimiento</th>
                  <th className="px-3 py-3">Estado</th>
                  <th className="px-3 py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {workflowMessages.map((message) => {
                  const isActive = selectedWorkflowId === message.interactionId

                  return (
                    <tr key={message.interactionId} className="text-sm">
                      <td className="px-3 py-4">
                        <p className="font-semibold text-slate-800">{message.author}</p>
                        <p className="text-xs text-indigo-500">#{message.channel}</p>
                      </td>
                      <td className="max-w-sm px-3 py-4 text-slate-600">
                        {message.content}
                      </td>
                      <td className="px-3 py-4">
                        <p>{message.topic}</p>
                        <p className="text-xs text-slate-400">
                          Relevancia {message.relevance}%
                        </p>
                      </td>
                      <td className="px-3 py-4">{message.sentiment}</td>
                      <td className="px-3 py-4">
                        {isActive ? 'En redacción' : 'En espera'}
                      </td>
                      <td className="px-3 py-4 text-right">
                        <button
                          type="button"
                          disabled={isActive}
                          onClick={() => {
                            setSelectedWorkflowId(message.interactionId)
                            prepareWorkflowContent(message)
                          }}
                          className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-orange-50 disabled:opacity-50"
                        >
                          {isActive ? 'Seleccionado' : 'Usar para redactar'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Flujo */}
      <section className="mt-6 rounded-2xl border border-orange-100 bg-orange-50/50 p-5">
        <div className="flex items-start gap-3">
          <Sparkles
            size={18}
            className="mt-0.5 shrink-0 text-orange-500"
          />

          <div>
            <p className="text-sm font-semibold text-slate-800">
              Flujo de revisión humana
            </p>

            <p className="mt-1 text-sm leading-6 text-slate-600">
              El contenido generado aquí no se publica
              automáticamente. Primero debe enviarse al módulo de
              Aprobaciones. Los contenidos de LinkedIn y X
              podrán copiarse después de ser aprobados, mientras que
              Discord podrá publicarse mediante la integración del
              bot.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default ContentStudio


