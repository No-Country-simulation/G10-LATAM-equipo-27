import { CheckCircle2, Clock, MessageCircle, Send } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
    getMotorMessageOrigin,
    type MotorMessageOrigin,
} from '../api/motorMessageOrigin'
import type { ContentReviewStatus } from '../api/contentReview'
import type { DiscordPublishingChannel } from '../api/motorDiscordPublishing'
import type { MotorApprovalCard as MotorApprovalCardData } from '../api/motorApprovalMapper'

type Props = {
    item: MotorApprovalCardData
    onReview: (contentId: number, estado: ContentReviewStatus) => void
    reviewing: boolean
    reviewDisabled: boolean
    discordChannels?: DiscordPublishingChannel[]
    onDiscordPublish: (
        contentId: number,
        channelId: string,
        modo?: "publicacion" | "respuesta",
        mensajeOriginalId?: string,
    ) => void
    publishing: boolean
    publicationDisabled: boolean
    onManualPublish: (contentId: number, publicationUrl: string) => void
    manualPublishing: boolean
    manualPublicationDisabled: boolean
}

function platformLabel(platform: MotorApprovalCardData['platform']): string {
    switch (platform) {
        case 'discord':
            return 'Discord'
        case 'linkedin':
            return 'LinkedIn'
        case 'x':
            return 'X'
        default:
            return 'Sin definir'
    }
}

function publicationLabel(status: string): string {
    switch (status) {
        case 'publicado':
        case 'published':
            return 'Publicado'
        case 'no_publicado':
        case 'not_published':
            return 'No publicado'
        case 'fallido':
        case 'failed':
            return 'Publicación fallida'
        default:
            return status || 'Sin definir'
    }
}

export default function MotorApprovalCard({
    item,
    onReview,
    reviewing,
    reviewDisabled,
    discordChannels = [],
    onDiscordPublish,
    publishing,
    publicationDisabled,
    onManualPublish,
    manualPublishing,
    manualPublicationDisabled,
}: Props) {
    const [selectedDiscordChannel, setSelectedDiscordChannel] = useState('')
    const [discordPublishMode, setDiscordPublishMode] = useState<"publicacion" | "respuesta">("publicacion")
    const [messageOrigin, setMessageOrigin] = useState<MotorMessageOrigin | null>(null)
    const [originLoading, setOriginLoading] = useState(false)
    const [originError, setOriginError] = useState(false)

    useEffect(() => {
        let active = true
        const interactionId = item.interaction_id

        setMessageOrigin(null)
        setOriginError(false)
        setOriginLoading(interactionId !== null)

        if (interactionId !== null) {
            void getMotorMessageOrigin(interactionId)
                .then((origin) => {
                    if (active) setMessageOrigin(origin)
                })
                .catch(() => {
                    if (active) setOriginError(true)
                })
                .finally(() => {
                    if (active) setOriginLoading(false)
                })
        }

        return () => {
            active = false
        }
    }, [item.interaction_id])

    const originIsBot = Boolean(
        messageOrigin?.autor?.toLowerCase().startsWith('cloudedtech community bot'),
    )

    const originUnverified = item.interaction_id !== null &&
        (originLoading || originError || !messageOrigin)

    const publicationBlockedByOrigin = originIsBot || originUnverified

    const [manualPublicationOpen, setManualPublicationOpen] = useState(false)
    const [manualPublicationUrl, setManualPublicationUrl] = useState('')

    function confirmManualPublication() {
        if (
            item.status !== 'aprobado' ||
            item.publication_status !== 'no_publicado' ||
            (item.platform !== 'linkedin' && item.platform !== 'x') ||
            manualPublishing ||
            manualPublicationDisabled
        ) return

        const url = manualPublicationUrl.trim()

        let parsed: URL

        try {
            parsed = new URL(url)
        } catch {
            window.alert('Ingresa una URL valida de la publicacion.')
            return
        }

        const host = parsed.hostname.toLowerCase().replace(/\.$/, '')

        const allowedHosts = item.platform === 'linkedin'
            ? ['linkedin.com', 'www.linkedin.com']
            : ['x.com', 'www.x.com', 'twitter.com', 'www.twitter.com']

        if (
            parsed.protocol !== 'https:' ||
            !allowedHosts.includes(host) ||
            url.length > 2048
        ) {
            window.alert('El enlace debe ser HTTPS y pertenecer a la red social correspondiente.')
            return
        }

        const confirmed = window.confirm(
            `Confirmar publicacion manual del contenido #${item.id}` +
            `\nRed social: ${platformLabel(item.platform)}` +
            `\nTitulo: ${item.title}` +
            `\nURL: ${url}` +
            '\n\nConfirma solo si ya publicaste realmente este contenido.'
        )

        if (!confirmed) return

        onManualPublish(item.id, url)
    }
    function confirmDiscordPublication() {
        if (publicationBlockedByOrigin || publicationDisabled || publishing) return
        if (item.status !== "aprobado" || item.publication_status !== "no_publicado") return

        const isReply = discordPublishMode === "respuesta"
        const channelId = isReply ? messageOrigin?.channel_id : selectedDiscordChannel
        const channel = discordChannels.find((entry) => entry.id === channelId)

        if (!channel || !channelId) {
            window.alert("Selecciona un canal autorizado de Discord.")
            return
        }
        if (isReply && (!messageOrigin?.message_id || originIsBot)) {
            window.alert("No se pudo verificar el mensaje original para responder.")
            return
        }

        const discordMessage = [
            item.title?.trim(),
            item.content?.trim(),
            item.call_to_action?.trim(),
            item.hashtags?.join(" ").trim(),
        ].filter(Boolean).join("\n\n")

        const confirmation = window.confirm(
            `CONFIRMAR ENVIO REAL A DISCORD` +
            `\n\nContenido #${item.id}` +
            `\nModalidad: ${isReply ? "Responder mensaje original" : "Nueva publicacion"}` +
            `\nCanal: #${channel.nombre}` +
            (isReply ? `\nMensaje original: ${messageOrigin?.message_id}` : "") +
            (item.attachments?.length
                ? `\n\nAVISO: Este contenido tiene ${item.attachments.length} archivo(s) adjunto(s).` +
                  `\nLa publicacion enviara SOLO TEXTO. Los archivos NO se adjuntaran al mensaje de Discord.`
                : "") +
            `\n\nCONTENIDO APROBADO:` +
            `\n${discordMessage}` +
            `\n\nConfirma solo si deseas enviar este contenido realmente a Discord.`
        )
        if (!confirmation) return

        onDiscordPublish(item.id, channelId, discordPublishMode, isReply ? messageOrigin?.message_id : undefined)
    }

    return (
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                        <MessageCircle size={20} />
                    </div>

                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700">
                                Contenido #{item.id}
                            </span>
                            <h3 className="font-bold text-slate-900">
                                {item.title}
                            </h3>

                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                                {item.status_label}
                            </span>
                        </div>

                        <p className="mt-2 text-xs text-slate-500">
                            {item.type} · Red social: {platformLabel(item.platform)}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                            Canal de origen: {item.source_channel_id || 'Sin definir'}
                            {' · '}Versión {item.version}
                        </p>

       {item.platform === 'discord' && item.interaction_id !== null && (
         <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
           <p className="font-semibold text-slate-800">
             Origen de la interaccion #{item.interaction_id}
           </p>

           {originLoading && (
             <p className="mt-1 text-slate-500">Consultando mensaje original...</p>
           )}

           {originError && (
             <p className="mt-1 text-amber-700">
               No fue posible verificar el origen. Publicacion bloqueada.
             </p>
           )}

           {messageOrigin && (
             <>
               <p className="mt-1 text-slate-700">
                 Autor: {messageOrigin.autor || 'No identificado'}
               </p>
               <p className="text-slate-700">
                 Canal de origen: {discordChannels.find(
                   (channel) => channel.id === messageOrigin.channel_id,
                 )?.nombre
                   ? `#${discordChannels.find(
                       (channel) => channel.id === messageOrigin.channel_id,
                     )?.nombre}`
                   : messageOrigin.channel_id}
               </p>
               {messageOrigin.guild_id &&
                 messageOrigin.channel_id &&
                 messageOrigin.message_id && (
                   <a
                     href={`https://discord.com/channels/${messageOrigin.guild_id}/${messageOrigin.channel_id}/${messageOrigin.message_id}`}
                     target="_blank"
                     rel="noopener noreferrer"
                     className="mt-1 inline-block font-medium text-blue-700 underline"
                   >
                     Ver mensaje original en Discord
                   </a>
                 )}
               {originIsBot && (
                 <p className="mt-2 font-semibold text-amber-700">
                   Mensaje generado por el propio bot. Publicacion bloqueada.
                 </p>
               )}
             </>
           )}
         </div>
       )}

                    </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Clock size={14} />
                    {item.time}
                </div>
            </div>

            <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-5">
                <p className="whitespace-pre-line text-sm leading-7 text-slate-700">
                    {item.content}
                </p>
            </div>

            {item.attachments.length > 0 && (
                <section className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <h4 className="mb-3 text-sm font-semibold text-slate-800">
                        Archivos adjuntos de Discord ({item.attachments.length})
                    </h4>

                    <div className="grid gap-4 sm:grid-cols-2">
                        {item.attachments
                            .filter((archivo) => archivo.url.startsWith('https://'))
                            .map((archivo, index) => {
                                const esImagen =
                                    archivo.content_type?.startsWith('image/') ||
                                    /\.(png|jpe?g|gif|webp)$/i.test(archivo.filename)

                                return (
                                    <div
                                        key={`${archivo.url}-${index}`}
                                        className="overflow-hidden rounded-xl border border-slate-200 bg-white"
                                    >
                                        {esImagen && (
                                            <a
                                                href={archivo.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                title="Abrir imagen original"
                                            >
                                                <img
                                                    src={archivo.url}
                                                    alt={archivo.filename}
                                                    loading="lazy"
                                                    className="h-48 w-full object-contain bg-slate-100"
                                                />
                                            </a>
                                        )}

                                        <div className="p-3">
                                            <p
                                                className="truncate text-xs font-medium text-slate-700"
                                                title={archivo.filename}
                                            >
                                                {archivo.filename}
                                            </p>

                                            <div className="mt-2 flex flex-wrap gap-3 text-xs">
                                                <a
                                                    href={archivo.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="font-semibold text-indigo-600 hover:underline"
                                                >
                                                    Abrir archivo
                                                </a>

                                                <a
                                                    href={archivo.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="font-semibold text-slate-600 hover:underline"
                                                >
                                                    Descargar / guardar
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                    </div>
                </section>
            )}

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
                <p className="text-sm text-slate-600">
                    Estado de publicación:{' '}
                    <span className="font-semibold">
                        {publicationLabel(item.publication_status)}
                    </span>
                </p>

                {item.status === 'pendiente_revision' && (
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            disabled={reviewDisabled}
                            onClick={() => onReview(item.id, 'aprobado')}
                            className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                            {reviewing ? 'Procesando...' : 'Aprobar'}
                        </button>
                        <button
                            type="button"
                            disabled={reviewDisabled}
                            onClick={() => onReview(item.id, 'rechazado')}
                            className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                        >
                            Rechazar
                        </button>
                        <button
                            type="button"
                            disabled={reviewDisabled}
                            onClick={() => onReview(item.id, 'ajustes_solicitados')}
                            className="rounded-lg border border-orange-300 px-3 py-2 text-xs font-semibold text-orange-700 hover:bg-orange-50 disabled:opacity-50"
                        >
                            Solicitar ajustes
                        </button>
                    </div>
                )}

                {item.status === 'aprobado' &&
                    item.publication_status === 'no_publicado' &&
                    (item.platform === 'linkedin' || item.platform === 'x') && (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={async () => {
                                try {
                                    await navigator.clipboard.writeText(item.content)
                                    window.alert('Contenido copiado. Puedes pegarlo en la red social.')
                                } catch {
                                    window.alert('No fue posible copiar. Selecciona el texto manualmente.')
                                }
                            }}
                            className="rounded-lg border border-indigo-300 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
                        >
                            Copiar contenido
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                const destino = item.platform === 'linkedin'
                                    ? 'https://www.linkedin.com/feed/'
                                    : 'https://x.com/home'

                                window.open(destino, '_blank', 'noopener,noreferrer')
                            }}
                            className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
                        >
                            Abrir LinkedIn / X
                        </button>

                        <button
                            type="button"
                            onClick={() => setManualPublicationOpen((current) => !current)}
                            disabled={manualPublishing || manualPublicationDisabled}
                            className="rounded-lg border border-emerald-300 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                        >
                            Ya publique - Confirmar
                        </button>

                        {manualPublicationOpen && (
                            <div className="w-full rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                                <label
                                    htmlFor={`manual-publication-url-${item.id}`}
                                    className="block text-xs font-semibold text-slate-700"
                                >
                                    Enlace de la publicacion en {platformLabel(item.platform)}
                                </label>
                                <input
                                    id={`manual-publication-url-${item.id}`}
                                    type="url"
                                    value={manualPublicationUrl}
                                    onChange={(event) => setManualPublicationUrl(event.target.value)}
                                    disabled={manualPublishing || manualPublicationDisabled}
                                    placeholder={
                                        item.platform === 'linkedin'
                                            ? 'https://www.linkedin.com/posts/...'
                                            : 'https://x.com/usuario/status/...'
                                    }
                                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 disabled:opacity-50"
                                />
                                <p className="mt-2 text-xs text-slate-600">
                                    El enlace se registrara como evidencia declarada por el usuario.
                                    CloudEdTech no verifica automaticamente la publicacion externa.
                                </p>
                                <button
                                    type="button"
                                    onClick={confirmManualPublication}
                                    disabled={manualPublishing || manualPublicationDisabled || !manualPublicationUrl.trim()}
                                    className="mt-3 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                                >
                                    {manualPublishing ? 'Confirmando...' : 'Registrar publicacion'}
                                </button>
                            </div>
                        )}
                        <span className="text-xs text-slate-500">
                            Publicacion manual. Abrir la red no confirma el envio.
                        </span>
                    </div>
                )}
                {item.status === 'aprobado' && (
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600">
                            <CheckCircle2 size={18} />
                            Revisión completada
                        </div>

                        {item.platform === 'discord' &&
                            item.publication_status === 'no_publicado' && (
                            <div className="flex flex-wrap items-center gap-2">
                                <select
                                    aria-label={`Modalidad Discord para contenido ${item.id}`}
                                    value={discordPublishMode}
                                    onChange={(event) => setDiscordPublishMode(event.target.value as "publicacion" | "respuesta")}
                                    disabled={publishing || publicationDisabled}
                                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 disabled:opacity-50"
                                >
                                    <option value="publicacion">Nueva publicación</option>
                                    <option value="respuesta" disabled={!messageOrigin?.message_id || originIsBot || originUnverified}>Responder mensaje original</option>
                                </select>
                                {discordPublishMode === "respuesta" && messageOrigin && (
                                    <span className="text-xs text-slate-600">
                                        Respuesta en canal original: #{discordChannels.find((c) => c.id === messageOrigin.channel_id)?.nombre || messageOrigin.channel_id}
                                    </span>
                                )}
                                <select
                                    aria-label={`Canal Discord para contenido ${item.id}`}
                                    value={selectedDiscordChannel}
                                    onChange={(event) => setSelectedDiscordChannel(event.target.value)}
                                    disabled={discordPublishMode === "respuesta" || discordChannels.length === 0 || publishing || publicationDisabled}
                                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 disabled:opacity-50"
                                >
                                    <option value="" disabled>
                                        Seleccionar canal Discord
                                    </option>
                                    {discordChannels.map((canal) => (
                                        <option key={canal.id} value={canal.id}>
                                            #{canal.nombre}
                                        </option>
                                    ))}
                                </select>

                                <button
                                    type="button"
                                    disabled={publicationDisabled || publishing || publicationBlockedByOrigin ||
                                        !discordChannels.some(
                                            (channel) => channel.id === (
                                                discordPublishMode === "respuesta"
                                                    ? messageOrigin?.channel_id
                                                    : selectedDiscordChannel
                                            )
                                        ) || (discordPublishMode === "respuesta" && !messageOrigin?.message_id)
                                    }
                                    onClick={confirmDiscordPublication}
                                    title={
                                        selectedDiscordChannel
                                            ? 'Publicar contenido aprobado en el canal seleccionado'
                                            : 'Selecciona un canal antes de publicar'
                                    }
                                    className="flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                                >
                                    <Send size={14} />
                                    Publicar en Discord
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </article>
    )
}
