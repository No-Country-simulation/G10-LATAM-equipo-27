import {
  Bell,
  Bot,
  CheckCircle2,
  Cloud,
  Database,
  MessageSquare,
  Save,
  Settings as SettingsIcon,
  ShieldCheck,
  Users,
} from 'lucide-react'

import { useEffect, useState } from "react";
import { getUsers } from "../api/users";
import type { User } from "../api/users";


function Settings() {
  const [users, setUsers] = useState<User[]>([]);
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const data = await getUsers();
        setUsers(data);
      } catch (error) {
        console.error("No fue posible cargar los usuarios:", error);
      }
    };

    loadUsers();
  }, []);
  return (
    <div className="space-y-8">

      {/* HEADER */}
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-orange-500">
            <SettingsIcon size={22} />
          </div>

          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Configuración
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Configura CloudEdTech, la inteligencia artificial y las
              integraciones de la comunidad
            </p>
          </div>
        </div>
      </div>

      {/* ESTADO GENERAL */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        <div className="flex items-center justify-between">

          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100 text-green-600">
              <CheckCircle2 size={22} />
            </div>

            <div>
              <h2 className="font-semibold text-slate-900">
                Estado del sistema
              </h2>

              <p className="text-sm text-slate-500">
                Servicios principales disponibles en entorno de pruebas
              </p>
            </div>
          </div>

          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
            Activo
          </span>

        </div>
      </div>

      {/* CONFIGURACIÓN */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

        {/* DISCORD */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
              <MessageSquare size={20} />
            </div>

            <div>
              <h2 className="font-semibold text-slate-900">
                Discord
              </h2>

              <p className="text-xs text-slate-400">
                Integración con la comunidad
              </p>
            </div>
          </div>

          <div className="space-y-5">

            <div>
              <label className="text-sm font-medium text-slate-700">
                Servidor
              </label>

              <input
                type="text"
                defaultValue="CloudEdTech"
                className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Canal principal
              </label>

              <select
                defaultValue="general"
                className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-500"
              >
                <option value="general">#general</option>
                <option value="ia">#ia</option>
                <option value="proyectos">#proyectos</option>
                <option value="preguntas">#preguntas</option>
                <option value="recursos">#recursos</option>
                <option value="anuncios">#anuncios</option>
              </select>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-slate-50 p-4">
              <div>
                <p className="text-sm font-medium text-slate-700">
                  Bot de Discord
                </p>

                <p className="text-xs text-slate-400">
                  Permitir lectura y publicación
                </p>
              </div>

              <div className="h-6 w-11 rounded-full bg-orange-500 p-1">
                <div className="ml-auto h-4 w-4 rounded-full bg-white" />
              </div>
            </div>

          </div>
        </div>

        {/* IA */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
              <Bot size={20} />
            </div>

            <div>
              <h2 className="font-semibold text-slate-900">
                Inteligencia artificial
              </h2>

              <p className="text-xs text-slate-400">
                Motor de análisis y generación
              </p>
            </div>
          </div>

          <div className="space-y-5">

            <div>
              <label className="text-sm font-medium text-slate-700">
                Modelo
              </label>

              <select
                defaultValue="qwen"
                className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-500"
              >
                <option value="qwen">
                  Qwen — Open Source
                </option>

                <option value="mistral">
                  Mistral — Open Source
                </option>

                <option value="gemini">
                  Gemini
                </option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Temperatura
              </label>

              <div className="mt-2 flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="100"
                  defaultValue="30"
                  className="w-full accent-orange-500"
                />

                <span className="text-sm font-semibold text-slate-700">
                  0.3
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-slate-50 p-4">
              <div>
                <p className="text-sm font-medium text-slate-700">
                  Generación automática
                </p>

                <p className="text-xs text-slate-400">
                  Generar contenido a partir de insights
                </p>
              </div>

              <div className="h-6 w-11 rounded-full bg-orange-500 p-1">
                <div className="ml-auto h-4 w-4 rounded-full bg-white" />
              </div>
            </div>

          </div>
        </div>

        {/* RAG */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <Database size={20} />
            </div>

            <div>
              <h2 className="font-semibold text-slate-900">
                Base de conocimiento
              </h2>

              <p className="text-xs text-slate-400">
                RAG y contexto institucional
              </p>
            </div>
          </div>

          <div className="space-y-4">

            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <p className="text-sm font-medium text-slate-700">
                  RAG
                </p>

                <p className="text-xs text-slate-400">
                  Recuperar información relevante
                </p>
              </div>

              <div className="h-6 w-11 rounded-full bg-orange-500 p-1">
                <div className="ml-auto h-4 w-4 rounded-full bg-white" />
              </div>
            </div>

            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <p className="text-sm font-medium text-slate-700">
                  Documentación
                </p>

                <p className="text-xs text-slate-400">
                  Cursos, FAQs y recursos
                </p>
              </div>

              <span className="text-sm font-semibold text-slate-700">
                42 documentos
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700">
                  Vector database
                </p>

                <p className="text-xs text-slate-400">
                  Almacenamiento de embeddings
                </p>
              </div>

              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                PostgreSQL + pgvector
              </span>
            </div>

          </div>
        </div>

        {/* OCI */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-500">
              <Cloud size={20} />
            </div>

            <div>
              <h2 className="font-semibold text-slate-900">
                Oracle Cloud Infrastructure
              </h2>

              <p className="text-xs text-slate-400">
                Almacenamiento de archivos y resultados
              </p>
            </div>
          </div>

          <div className="space-y-5">

            <div>
              <label className="text-sm font-medium text-slate-700">
                Object Storage
              </label>

              <input
                type="text"
                defaultValue="CloudEdTech"
                className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-500"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg bg-slate-50 p-4">
              <div>
                <p className="text-sm font-medium text-slate-700">
                  Estado de conexión
                </p>

                <p className="text-xs text-slate-400">
                  OCI Object Storage
                </p>
              </div>

              <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
                Pendiente de conexión
              </span>
            </div>

          </div>
        </div>

      </div>

      {/* SEGURIDAD Y USUARIOS */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* USUARIOS */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-600">
              <Users size={20} />
            </div>

            <div>
              <h2 className="font-semibold text-slate-900">
                Usuarios y roles
              </h2>

              <p className="text-xs text-slate-400">
                Control de acceso al sistema
              </p>
            </div>
          </div>

          <div className="space-y-3">

            <div className="flex items-center justify-between rounded-lg bg-slate-50 p-4">
              <div>
                <p className="text-sm font-medium text-slate-700">
                  Administradores
                </p>
              </div>

              <span className="font-semibold text-slate-900">
                {users.filter((user) => user.role === "admin").length}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-slate-50 p-4">
              <div>
                <p className="text-sm font-medium text-slate-700">
                  Revisores
                </p>
              </div>

              <span className="font-semibold text-slate-900">
                {users.filter((user) => user.role === "reviewer").length}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-slate-50 p-4">
              <div>
                <p className="text-sm font-medium text-slate-700">
                  Analistas
                </p>
              </div>

              <span className="font-semibold text-slate-900">
                {users.filter((user) => user.role === "analyst").length}
              </span>
            </div>

          </div>
        </div>

        {/* SEGURIDAD */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-500">
              <ShieldCheck size={20} />
            </div>

            <div>
              <h2 className="font-semibold text-slate-900">
                Seguridad
              </h2>

              <p className="text-xs text-slate-400">
                Protección y autenticación
              </p>
            </div>
          </div>

          <div className="space-y-4">

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700">
                  Autenticación
                </p>

                <p className="text-xs text-slate-400">
                  Inicio de sesión protegido
                </p>
              </div>

              <span className="text-sm font-semibold text-green-600">
                Activa
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700">
                  Registro de auditoría
                </p>

                <p className="text-xs text-slate-400">
                  Acciones administrativas
                </p>
              </div>

              <span className="text-sm font-semibold text-green-600">
                Activo
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700">
                  Control de roles
                </p>

                <p className="text-xs text-slate-400">
                  Permisos por usuario
                </p>
              </div>

              <span className="text-sm font-semibold text-green-600">
                Activo
              </span>
            </div>

          </div>
        </div>

      </div>

      {/* NOTIFICACIONES */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-100 text-yellow-600">
            <Bell size={20} />
          </div>

          <div>
            <h2 className="font-semibold text-slate-900">
              Notificaciones
            </h2>

            <p className="text-xs text-slate-400">
              Alertas importantes de CloudEdTech
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">

          <label className="flex items-center gap-3 rounded-lg bg-slate-50 p-4">
            <input
              type="checkbox"
              defaultChecked
              className="h-4 w-4 accent-orange-500"
            />

            <span className="text-sm text-slate-700">
              Nuevas historias destacadas
            </span>
          </label>

          <label className="flex items-center gap-3 rounded-lg bg-slate-50 p-4">
            <input
              type="checkbox"
              defaultChecked
              className="h-4 w-4 accent-orange-500"
            />

            <span className="text-sm text-slate-700">
              Alertas de sentimiento
            </span>
          </label>

          <label className="flex items-center gap-3 rounded-lg bg-slate-50 p-4">
            <input
              type="checkbox"
              defaultChecked
              className="h-4 w-4 accent-orange-500"
            />

            <span className="text-sm text-slate-700">
              Contenido pendiente
            </span>
          </label>

        </div>
      </div>

      {/* GUARDAR */}
      <div className="flex justify-end">

        <button
          disabled
          className="flex cursor-not-allowed items-center gap-2 rounded-lg bg-slate-200 px-5 py-3 text-sm font-semibold text-slate-500"
        >
          <Save size={18} />          
          Configuración de integración
        </button>

      </div>

      {/* DEMO */}
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center">
        <p className="text-xs text-slate-400">
          Configuración de demostración — posteriormente estos valores
          serán gestionados mediante FastAPI y almacenados de forma segura.
        </p>
      </div>

    </div>
  )
}

export default Settings