import {  
  FileText,  
} from 'lucide-react'

import { useEffect, useState } from "react";
import { getAuditLogs } from "../api/audit";
import type { AuditLog } from "../api/audit";
import { getUsers } from "../api/users";
import type { User as ApiUser } from "../api/users";


function Audit() {

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [userFilter, setUserFilter] = useState("all");
  const [daysFilter, setDaysFilter] = useState(7);
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [actionFilter, setActionFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  

  useEffect(() => {
    const loadAuditLogs = async () => {
      try {
        setLoading(true);
        setError(null);

        const [auditData, usersData] = await Promise.all([
          getAuditLogs(
            100,
            0,
            daysFilter,
            actionFilter === "all" ? undefined : actionFilter,
            userFilter === "all" ? undefined : Number(userFilter)
          ),
          getUsers(),
        ]);

        setAuditLogs(auditData);
        setUsers(usersData);

        console.log("AUDIT LOGS:", auditData);
        console.log("USERS:", usersData);


      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "No fue posible cargar la auditoría"
        );
      } finally {
        setLoading(false);
      }
    };

    loadAuditLogs();
  }, [daysFilter, actionFilter, userFilter]);




  return (
    <div>
      {/* Encabezado */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-500">
          <FileText size={21} />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Auditoría
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Historial de acciones realizadas en CommunityLab
          </p>
        </div>
      </div>

      {/* Resumen */}
      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Acciones registradas
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-900">
            {auditLogs.length}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Según los filtros seleccionados
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Contenidos aprobados
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-900">
            {
              auditLogs.filter(
                (log) => log.action === "CONTENT_APPROVED"
              ).length
            }
          </p>

          <p className="mt-1 text-xs text-slate-400">
            En el período seleccionado
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Usuarios activos
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-900">
            {users.filter((user) => user.is_active).length}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Cuentas habilitadas
          </p>
        </div>

      </div>

      {/* Filtros */}
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

        <div className="flex flex-wrap gap-3">

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
          >
            <option value="all">
              Todas las acciones
            </option>

            <option value="USER_CREATED">
              Usuario creado
            </option>

            <option value="USER_NAME_UPDATED">
              Nombre de usuario actualizado
            </option>

            <option value="USER_ROLE_CHANGED">
              Rol de usuario actualizado
            </option>

            <option value="USER_ENABLED">
              Usuario activado
            </option>

            <option value="USER_DISABLED">
              Usuario desactivado
            </option>
          </select>

          <select
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
          >
            <option value="all">
              Todos los usuarios
            </option>

            {users
              .filter((user) =>
                auditLogs.some((log) => log.user_id === user.id)
              )
              .map((user) => (
                <option
                  key={user.id}
                  value={String(user.id)}
                >
                  {user.first_name} {user.last_name} ({user.username})
                </option>
              ))}

          </select>

          <select
            value={daysFilter}
            onChange={(e) => setDaysFilter(Number(e.target.value))}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
          >
            <option value={7}>Últimos 7 días</option>
            <option value={30}>Últimos 30 días</option>
            <option value={90}>Últimos 90 días</option>
            <option value={365}>Último año</option>
          </select>

        </div>

      </div>
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="font-bold text-slate-900">
          Registros de auditoría
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          Mostrando {auditLogs.length} registros con los filtros seleccionados.
        </p>

        <div className="mt-5 space-y-3">
          {loading && (
            <p className="text-sm text-slate-500">
              Cargando registros...
            </p>
          )}

          {!loading && error && (
            <p className="text-sm text-red-500">
              {error}
            </p>
          )}

          {!loading && !error && auditLogs.length === 0 && (
            <p className="text-sm text-slate-500">
              No hay registros que coincidan con los filtros seleccionados.
            </p>
          )}

          {!loading &&
            !error &&
            auditLogs.map((log) => (
              <div
                key={log.id}
                className="rounded-xl border border-slate-100 bg-slate-50 p-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <p className="font-semibold text-slate-800">
                    {getAuditActionLabel(log.action)}
                  </p>

                  <span className="text-xs text-slate-400">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>

                <p className="mt-2 text-sm text-slate-600">
                  {log.details ?? "Sin detalles"}
                </p>

                <p className="mt-2 text-xs text-slate-400">
                  Recurso: {log.resource_type}
                  {log.resource_id
                    ? ` #${log.resource_id}`
                    : ""}
                  {" · "}
                  Usuario: {log.username ?? "Sistema"}
                </p>
              </div>
            ))}
        </div>
      </div>

      {/* Historial */}
      
      {/* Nota */}
      <div className="mt-5 rounded-xl border border-orange-100 bg-orange-50 p-4">
        <p className="text-sm text-orange-800">
          <strong>Auditoría:</strong> las acciones administrativas se registran
          automáticamente con el usuario responsable, fecha, tipo de acción
          y recurso afectado.
        </p>
      </div>
    </div>
  )
}
function getAuditActionLabel(action: string): string {
  const labels: Record<string, string> = {
    USER_CREATED: "Usuario creado",
    USER_NAME_UPDATED: "Nombre de usuario actualizado",
    USER_ROLE_CHANGED: "Rol de usuario actualizado",
    USER_ENABLED: "Usuario activado",
    USER_DISABLED: "Usuario desactivado",
  };
  
  return labels[action] ?? action;
}

export default Audit