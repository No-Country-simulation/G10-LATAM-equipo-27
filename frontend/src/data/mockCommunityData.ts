export const mockCommunityData = {
    metadata: {
        generated_at: "2026-09-29T10:00:00Z",
        platform: "discord",
        environment: "testing",
        version: "1.0",
    },

    dashboard: {
        messages_processed: 2481,
        messages_change: 12.4,

        total_audience: 1842,
        audience_change: 6.8,

        positive_sentiment: 72,
        sentiment_change: 4.2,

        topics_detected: 24,
        new_topics: 8,

        content_generated: 37,

        pending_approvals: 8,
    },

    analytics: {
        messages_analyzed: 2481,
        positive_sentiment: 72,
        topics_detected: 24,
        average_relevance: 89,
        alerts: 6,

        insights: {
            main:
                "Las conversaciones relacionadas con agentes de IA están generando una alta participación y presentan un elevado potencial para convertirse en contenido educativo.",

            frequent_questions:
                "Las preguntas sobre LangGraph, RAG y agentes de IA aparecen con frecuencia y pueden convertirse en recursos educativos para la comunidad.",

            attention_required:
                "Se detectaron conversaciones con sentimiento negativo o dificultades recurrentes que podrían requerir intervención del Community Manager.",
        },
    },

    messages: {
        summary: {
            analyzed: 2481,
            positive: 1786,
            positive_percentage: 72,
            questions: 438,
            highlights: 37,
        },

        items: [
            {
                id: 1,
                initials: "CG",
                author: "Carlos Gómez",
                channel: "ia",
                time: "Hace 18 min",
                message:
                    "Después de varias semanas estudiando agentes de IA, finalmente logré construir mi primer proyecto funcional.",
                sentiment: "positive",
                sentiment_label: "Positivo",
                sentiment_score: 94,
                topic: "Agentes IA",
                classification: "Historia de éxito",
                relevance: 92,
            },

            {
                id: 2,
                initials: "LR",
                author: "Laura Rodríguez",
                channel: "proyectos",
                time: "Hace 32 min",
                message:
                    "Terminé mi primer agente con LangGraph. Ahora quiero agregar memoria y conectarlo con una API. ¿Qué arquitectura me recomiendan?",
                sentiment: "positive",
                sentiment_label: "Positivo",
                sentiment_score: 91,
                topic: "LangGraph",
                classification: "Pregunta",
                relevance: 89,
            },

            {
                id: 3,
                initials: "AP",
                author: "Andrés Pérez",
                channel: "preguntas",
                time: "Hace 1 hora",
                message:
                    "¿Alguien tiene algún recurso para aprender RAG desde cero? Estoy intentando entender cómo funciona la recuperación de documentos.",
                sentiment: "neutral",
                sentiment_label: "Neutral",
                sentiment_score: 76,
                topic: "RAG",
                classification: "Pregunta frecuente",
                relevance: 86,
            },
        ],
    },

    sentiment: {
        distribution: [
            {
                name: "Positivo",
                value: 72,
            },
            {
                name: "Neutral",
                value: 18,
            },
            {
                name: "Negativo",
                value: 10,
            },
        ],

        evolution: [
            {
                day: "Lun",
                positive: 64,
            },
            {
                day: "Mar",
                positive: 67,
            },
            {
                day: "Mié",
                positive: 69,
            },
            {
                day: "Jue",
                positive: 71,
            },
            {
                day: "Vie",
                positive: 68,
            },
            {
                day: "Sáb",
                positive: 73,
            },
            {
                day: "Dom",
                positive: 72,
            },
        ],
    },

    topics: [
        {
            topic: "LangGraph",
            percentage: 34,
        },
        {
            topic: "Agentes IA",
            percentage: 29,
        },
        {
            topic: "RAG",
            percentage: 24,
        },
        {
            topic: "Python",
            percentage: 18,
        },
        {
            topic: "APIs",
            percentage: 14,
        },
    ],

    hashtags: [
        {
            id: 1,
            name: "#LangGraph",
            mentions: 486,
            growth: 18.4,
            sentiment: 82,
            trend: "up",
        },
        {
            id: 2,
            name: "#AgentesIA",
            mentions: 421,
            growth: 14.7,
            sentiment: 79,
            trend: "up",
        },
        {
            id: 3,
            name: "#RAG",
            mentions: 318,
            growth: 11.2,
            sentiment: 74,
            trend: "up",
        },
        {
            id: 4,
            name: "#Python",
            mentions: 276,
            growth: 6.8,
            sentiment: 71,
            trend: "up",
        },
        {
            id: 5,
            name: "#APIs",
            mentions: 194,
            growth: 3.5,
            sentiment: 69,
            trend: "up",
        },
    ],

    audience: {
        total_members: 1842,
        growth: 6.8,
        active_members: 1264,
        participation_rate: 68.6,

        segments: [
            {
                name: "Muy activos",
                members: 486,
                percentage: 26,
            },
            {
                name: "Activos",
                members: 778,
                percentage: 42,
            },
            {
                name: "Ocasionales",
                members: 412,
                percentage: 22,
            },
            {
                name: "Baja actividad",
                members: 166,
                percentage: 10,
            },
        ],
    },

    activity_heatmap: {
        hours: ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00"],

        data: [
            {
                day: "Lun",
                values: [12, 18, 42, 78, 64, 31],
            },
            {
                day: "Mar",
                values: [9, 24, 55, 86, 73, 40],
            },
            {
                day: "Mié",
                values: [8, 16, 38, 67, 82, 58],
            },
            {
                day: "Jue",
                values: [11, 29, 71, 91, 69, 43],
            },
            {
                day: "Vie",
                values: [14, 22, 61, 88, 94, 72],
            },
            {
                day: "Sáb",
                values: [7, 13, 32, 57, 46, 25],
            },
            {
                day: "Dom",
                values: [5, 10, 21, 39, 34, 18],
            },
        ],
    },

    highlights_summary: {
        detected: 37,
        high_relevance: 18,
        ready_for_content: 12,
    },

    highlights: [
        {
            id: 1,
            type: "Historia de éxito",
            title: "Mi primer proyecto con IA",
            message:
                "Después de varias semanas estudiando agentes de IA, finalmente logré construir mi primer proyecto funcional.",
            author: "Carlos Gómez",
            channel: "#ia",
            sentiment: 94,
            relevance: 92,
            color: "green",
        },
        {
            id: 2,
            type: "Proyecto destacado",
            title: "Construí mi primer agente",
            message:
                "Hoy terminé mi primer agente utilizando LangGraph y aprendí muchísimo durante el proceso.",
            author: "Laura Rodríguez",
            channel: "#proyectos",
            sentiment: 91,
            relevance: 89,
            color: "blue",
        },
        {
            id: 3,
            type: "Testimonio",
            title: "La comunidad me ayudó a avanzar",
            message:
                "Tenía muchas dudas sobre RAG, pero las respuestas de la comunidad me ayudaron a entenderlo.",
            author: "Andrés Pérez",
            channel: "#preguntas",
            sentiment: 88,
            relevance: 86,
            color: "purple",
        },
    ],

    content_studio: [
        {
            id: 1,
            source_highlight_id: 1,
            type: "announcement",
            type_label: "Anuncio",
            channel: "ia",
            status: "draft",
            content: `🚀 ¡Nuevo logro en nuestra comunidad!

Después de varias semanas estudiando agentes de IA, Carlos logró construir su primer proyecto funcional.

Este tipo de proyectos demuestra cómo el aprendizaje puede convertirse en soluciones reales.

💡 ¿Qué proyecto estás construyendo actualmente?

#IA #AgentesIA #Comunidad #Aprendizaje`,
        },
    ],

    approvals: {
        summary: {
            pending: 8,
            approved_today: 12,
            rejected: 3,
        },

        items: [
            {
                id: 1,
                type: "Historia de éxito",
                channel: "ia",
                status: "pending",
                status_label: "Pendiente",
                time: "Hace 12 minutos",
                content: `🚀 ¡Nuevo logro en nuestra comunidad!

Después de varias semanas estudiando agentes de IA, Carlos logró construir su primer proyecto funcional.

Este tipo de proyectos demuestra cómo el aprendizaje puede convertirse en soluciones reales.

💡 ¿Qué proyecto estás construyendo actualmente?`,
                relevance: 92,
                sentiment: 94,
            },

            {
                id: 2,
                type: "Recurso educativo",
                channel: "recursos",
                status: "pending",
                status_label: "Pendiente",
                time: "Hace 34 minutos",
                content: `📚 Recurso recomendado para la comunidad

Varios miembros han estado preguntando sobre RAG y cómo utilizarlo junto con agentes de IA.

Hemos preparado este recurso para facilitar el aprendizaje y resolver las dudas más frecuentes.`,
                relevance: 86,
                sentiment: 88,
            },
        ],
    },

    calendar: [
        {
            id: 1,
            date: "2026-09-24",
            day: "Mié",
            messages: 318,
            sentiment: 69,
            highlights: 4,
        },
        {
            id: 2,
            date: "2026-09-25",
            day: "Jue",
            messages: 386,
            sentiment: 71,
            highlights: 6,
        },
        {
            id: 3,
            date: "2026-09-26",
            day: "Vie",
            messages: 421,
            sentiment: 68,
            highlights: 8,
        },
        {
            id: 4,
            date: "2026-09-27",
            day: "Sáb",
            messages: 274,
            sentiment: 73,
            highlights: 3,
        },
        {
            id: 5,
            date: "2026-09-28",
            day: "Dom",
            messages: 219,
            sentiment: 72,
            highlights: 2,
        },
        {
            id: 6,
            date: "2026-09-29",
            day: "Lun",
            messages: 403,
            sentiment: 74,
            highlights: 7,
        },
        {
            id: 7,
            date: "2026-09-30",
            day: "Mar",
            messages: 460,
            sentiment: 76,
            highlights: 7,
        },
    ],

    reports: [
        {
            id: 1,
            name: "Resumen semanal de comunidad",
            type: "Análisis semanal",
            format: "JSON",
            created_at: "2026-09-30T10:30:00Z",
            status: "completed",
            status_label: "Completado",
        },
        {
            id: 2,
            name: "Análisis de sentimiento",
            type: "Sentimiento",
            format: "JSON",
            created_at: "2026-09-29T16:45:00Z",
            status: "completed",
            status_label: "Completado",
        },
        {
            id: 3,
            name: "Temas y tendencias",
            type: "Tendencias",
            format: "JSON",
            created_at: "2026-09-28T14:20:00Z",
            status: "completed",
            status_label: "Completado",
        },
    ],

    audit: [],
};