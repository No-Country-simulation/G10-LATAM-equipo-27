import { useEffect, useState } from 'react'
import {
  CheckCircle,
  FileText,
  MessageSquare,
  Sparkles,
  Tag,
  Users,
} from 'lucide-react'

import KpiCard from '../components/KpiCard'
import FeaturedStories from '../components/FeaturedStories'
import SentimentChart from '../charts/SentimentChart'
import TopicsChart from '../charts/TopicsChart'
import SentimentEvolution from '../charts/SentimentEvolution'
import AudienceHeatmap from '../charts/AudienceHeatmap'

type DashboardData = {
  messages_processed: number
  messages_change: number | null
  total_audience: number
  audience_change: number | null
  positive_sentiment: number
  sentiment_change: number | null
  topics_detected: number
  new_topics: number
  content_generated: number
  pending_approvals: number
}



function Dashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const response = await fetch(
          'http://127.0.0.1:8001/api/community/dashboard'
        )

        if (!response.ok) {
          throw new Error('No fue posible cargar el dashboard')
        }

        const data: DashboardData = await response.json()
        setDashboardData(data)
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Error desconocido al cargar el dashboard'
        )
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [])

  if (loading) {
    return <div className="p-6 text-slate-500">Cargando dashboard...</div>
  }

  if (error || !dashboardData) {
    return (
      <div className="p-6 text-red-600">
        {error ?? 'No hay datos disponibles'}
      </div>
    )
  }



  return (
    <div>

      {/* Encabezado */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          Dashboard
        </h2>

        <p className="mt-1 text-slate-500">
          Resumen de tu comunidad
        </p>
      </div>


      {/* KPIs */}
      <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">

        <KpiCard
          title="Mensajes procesados"
          value={dashboardData.messages_processed.toLocaleString("es-CO")}
          description={
            dashboardData.messages_change === null
              ? 'Sin comparación'
              : `${dashboardData.messages_change > 0 ? '+' : ''}${dashboardData.messages_change.toLocaleString('es-CO')}% esta semana`
          }
          icon={<MessageSquare size={20} />}
        />

        <KpiCard
          title="Total de audiencia"
          value={dashboardData.total_audience.toLocaleString("es-CO")}
          description={
            dashboardData.audience_change === null
              ? 'Sin comparación'
              : `${dashboardData.audience_change > 0 ? '+' : ''}${dashboardData.audience_change.toLocaleString('es-CO')}% esta semana`
          }
          icon={<Users size={20} />}
        />


        <KpiCard
          title="Sentimiento positivo"
          value={`${dashboardData.positive_sentiment}%`}
          description={
            dashboardData.sentiment_change === null
              ? 'Sin comparación'
              : `${dashboardData.sentiment_change > 0 ? '+' : ''}${dashboardData.sentiment_change.toLocaleString('es-CO')} puntos esta semana`
          }
          icon={<Sparkles size={20} />}
        />


        <KpiCard
          title="Temas detectados"
          value={dashboardData.topics_detected.toString()}
          description={`${dashboardData.new_topics} nuevos temas`}
          icon={<Tag size={20} />}
        />


        <KpiCard
          title="Contenidos generados"
          value={dashboardData.content_generated.toString()}
          description="Esta semana"
          icon={<FileText size={20} />}
        />


        <KpiCard
          title="Pendientes"
          value={dashboardData.pending_approvals.toString()}
          description="Requieren aprobación"
          icon={<CheckCircle size={20} />}
        />
        

      </div>
      
             
      <FeaturedStories />

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">

        <SentimentChart />

        <TopicsChart />

      </div>

      <div className="mt-8">
        <SentimentEvolution />
      </div>
      <div className="mt-8">
        <AudienceHeatmap />
      </div>

    </div>
  )
}

export default Dashboard