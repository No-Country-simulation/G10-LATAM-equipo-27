import {
  CheckCircle,
  KeyRound,
  Lock,
  ShieldCheck,
  UserCog,
  Users,
  Pencil
} from 'lucide-react'

import { useEffect, useState } from "react";

import {
  createUser,
  getUsers,
  updateUserRole,
  updateUserStatus,
  updateUserName,
  resetUserPassword,
  deleteUser,
} from "../api/users";

import type { User } from "../api/users";
import { getUser } from "../api/session";

function Security() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const currentUser = getUser();
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);

const [editingUserName, setEditingUserName] = useState({
  first_name: "",
  last_name: "",
});

const [savingUserName, setSavingUserName] = useState(false);
const [resetPasswordUserId, setResetPasswordUserId] = useState<number | null>(null);

const [newPassword, setNewPassword] = useState("");

const [resettingPassword, setResettingPassword] = useState(false);


  const [newUser, setNewUser] = useState({
    first_name: "",
    last_name: "",
    username: "",
    password: "",
    role: "analyst",
  });
const [creatingUser, setCreatingUser] = useState(false);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const data = await getUsers();
        setUsers(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "No fue posible cargar los usuarios"
        );
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);
  
  const handleRoleChange = async (
    userId: number,
    newRole: string
  ) => {
    const confirmed = window.confirm(
      "¿Estás seguro de que deseas cambiar el rol de este usuario?"
    );

    if (!confirmed) {
      return;
    }
    try {
      setError(null);
      setSuccess(null);

      const updatedUser = await updateUserRole(
        userId,
        newRole
      );

      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          user.id === updatedUser.id
            ? updatedUser
            : user
        )
      );
      setSuccess(
      `Rol de ${updatedUser.username} actualizado correctamente`
    );
    
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No fue posible actualizar el rol"
      );
    }
  };
  
  const handleStatusChange = async (
    userId: number,
    isActive: boolean
  ) => {
    const confirmed = window.confirm(
      isActive
        ? "¿Estás seguro de que deseas activar este usuario? Podrá volver a iniciar sesión en CloudEdTech."
        : "¿Estás seguro de que deseas desactivar este usuario? No podrá iniciar sesión mientras su cuenta esté inactiva."
    );

    if (!confirmed) {
      return;
    }
    try {
      setError(null);
      setSuccess(null);

      const updatedUser = await updateUserStatus(
        userId,
        isActive
      );

      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          user.id === updatedUser.id
            ? updatedUser
            : user
        )
      );
      setSuccess(
        updatedUser.is_active
          ? `Usuario ${updatedUser.username} activado correctamente`
          : `Usuario ${updatedUser.username} desactivado correctamente`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No fue posible actualizar el estado del usuario"
      );
    }
  };
  const handleCreateUser = async () => {
    try {
      setCreatingUser(true);
      setError(null);
      setSuccess(null);

      const createdUser = await createUser(newUser);

      setUsers((currentUsers) => [
        ...currentUsers,
        createdUser,
      ]);

      setSuccess(
        `Usuario ${createdUser.username} creado correctamente`
      );

      setNewUser({
        first_name: "",
        last_name: "",
        username: "",
        password: "",
        role: "analyst",
      });


      setShowCreateUser(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No fue posible crear el usuario"
      );
    } finally {
      setCreatingUser(false);
    }
  };

  const handleSaveUserName = async (userId: number) => {
    if (
      !editingUserName.first_name.trim() ||
      !editingUserName.last_name.trim()
    ) {
      setError("El nombre y el apellido son obligatorios");
      return;
    }
    try {
      setSavingUserName(true);
      setError(null);
      setSuccess(null);

      const updatedUser = await updateUserName(
        userId,
        editingUserName.first_name.trim(),
        editingUserName.last_name.trim()
      );

      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          user.id === updatedUser.id
            ? updatedUser
            : user
        )
      );

      setSuccess(
        `Nombre de ${updatedUser.username} actualizado correctamente`
      );

      setEditingUserId(null);

      setEditingUserName({
        first_name: "",
        last_name: "",
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No fue posible actualizar el nombre"
      );
    } finally {
      setSavingUserName(false);
    }
  };

  const handleResetPassword = async (
  userId: number,
  username: string
) => {
  if (newPassword.length < 8) {
    setError("La nueva contraseña debe tener al menos 8 caracteres");
    return;
  }

  const confirmed = window.confirm(
    `¿Estás seguro de que deseas restablecer la contraseñade ${username}?`
  );

  if (!confirmed) {
    return;
  }

  try {
    setResettingPassword(true);
    setError(null);
    setSuccess(null);

    await resetUserPassword(userId, newPassword);

    setSuccess(
      `Contraseña de ${username} restablecida correctamente`
    );

    setResetPasswordUserId(null);
    setNewPassword("");
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "No fue posible restablecer la contraseña"
    );
  } finally {
    setResettingPassword(false);
  }
};

const handleDeleteUser = async (
  userId: number,
  username: string
) => {
  const confirmed = window.confirm(
    `¿Estás seguro de que deseas eliminar al usuario ${username}?\n\nEsta acción eliminará su cuenta, pero conservará el historial de Auditoría.`
  );

  if (!confirmed) {
    return;
  }

  try {
    setError(null);
    setSuccess(null);

    await deleteUser(userId);

    setUsers((currentUsers) =>
      currentUsers.filter((user) => user.id !== userId)
    );

    setSuccess(
      `Usuario ${username} eliminado correctamente`
    );

    if (resetPasswordUserId === userId) {
      setResetPasswordUserId(null);
      setNewPassword("");
    }
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "No fue posible eliminar el usuario"
    );
  }
};


  return (
    <div>
      {/* Encabezado */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-500">
          <ShieldCheck size={21} />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Seguridad
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Control de acceso y permisos de CloudEdTech
          </p>
        </div>
      </div>

      {/* Estado */}
      <div className="mt-8 rounded-2xl border border-green-200 bg-green-50 p-5">
        <div className="flex items-start gap-3">
          <CheckCircle
            size={21}
            className="mt-0.5 text-green-600"
          />

          <div>
            <p className="font-semibold text-green-800">
              Sistema de seguridad activo
            </p>

            <p className="mt-1 text-sm text-green-700">
              El acceso al sistema requiere autenticación.
              Las acciones administrativas se registran automáticamente en Auditoría.
            </p>
          </div>
        </div>
      </div>

      {/* Seguridad general */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* Autenticación */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <Lock size={19} />
            </div>

            <div>
              <h3 className="font-bold text-slate-900">
                Autenticación
              </h3>

              <p className="text-sm text-slate-500">
                Protección de acceso
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700">
                  Inicio de sesión
                </p>

                <p className="text-xs text-slate-400">
                  Usuario y contraseña
                </p>
              </div>

              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                Activo
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700">
                  Sesiones protegidas
                </p>

                <p className="text-xs text-slate-400">
                  Control mediante autenticación
                </p>
              </div>

              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                Activo
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700">
                  Registro de actividad
                </p>

                <p className="text-xs text-slate-400">
                  Acciones almacenadas en auditoría
                </p>
              </div>

              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                Activo
              </span>
            </div>

          </div>
        </div>

        {/* Contraseña */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
              <KeyRound size={19} />
            </div>

            <div>
              <h3 className="font-bold text-slate-900">
                Seguridad de credenciales
              </h3>

              <p className="text-sm text-slate-500">
                Protección de cuentas
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-700">
                Contraseñas
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Las contraseñas se almacenan de forma segura
                mediante hashing Argon2 en el backend.
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-700">
                Sesiones
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Las sesiones se gestionan mediante tokens
                de autenticación JWT.
              </p>
            </div>

          </div>
        </div>
      </div>

      {/* Roles */}
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        <div className="flex items-center gap-3">

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-500">
            <Users size={19} />
          </div>

          <div>
            <h3 className="font-bold text-slate-900">
              Roles y permisos
            </h3>

            <p className="text-sm text-slate-500">
              Control de las acciones disponibles para cada usuario
            </p>
          </div>

        </div>

        <div className="mt-6 overflow-x-auto">

          <table className="w-full min-w-[700px] text-left">

            <thead>
              <tr className="border-b border-slate-200">

                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Permiso
                </th>

                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Administrador
                </th>

                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Revisor
                </th>

                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Analista
                </th>

              </tr>
            </thead>

            <tbody>

              <tr className="border-b border-slate-100">
                <td className="px-4 py-4 text-sm font-medium text-slate-700">
                  Ver dashboard
                </td>

                <td className="px-4 py-4 text-green-600">
                  ✓
                </td>

                <td className="px-4 py-4 text-green-600">
                  ✓
                </td>

                <td className="px-4 py-4 text-green-600">
                  ✓
                </td>
              </tr>

              <tr className="border-b border-slate-100">
                <td className="px-4 py-4 text-sm font-medium text-slate-700">
                  Analizar comunidad
                </td>

                <td className="px-4 py-4 text-green-600">
                  ✓
                </td>

                <td className="px-4 py-4 text-green-600">
                  ✓
                </td>

                <td className="px-4 py-4 text-green-600">
                  ✓
                </td>
              </tr>

              <tr className="border-b border-slate-100">
                <td className="px-4 py-4 text-sm font-medium text-slate-700">
                  Generar contenido
                </td>

                <td className="px-4 py-4 text-green-600">
                  ✓
                </td>

                <td className="px-4 py-4 text-green-600">
                  ✓
                </td>

                <td className="px-4 py-4 text-slate-300">
                —
                </td>
              </tr>

              <tr className="border-b border-slate-100">
                <td className="px-4 py-4 text-sm font-medium text-slate-700">
                  Aprobar contenido
                </td>

                <td className="px-4 py-4 text-green-600">
                  ✓
                </td>

                <td className="px-4 py-4 text-green-600">
                  ✓
                </td>

                <td className="px-4 py-4 text-slate-300">
                  —
                </td>
              </tr>

              <tr className="border-b border-slate-100">
                <td className="px-4 py-4 text-sm font-medium text-slate-700">
                  Configuración
                </td>

                <td className="px-4 py-4 text-green-600">
                  ✓
                </td>

                <td className="px-4 py-4 text-slate-300">
                  —
                </td>

                <td className="px-4 py-4 text-slate-300">
                  —
                </td>
              </tr>

              <tr>
                <td className="px-4 py-4 text-sm font-medium text-slate-700">
                  Gestión de usuarios
                </td>

                <td className="px-4 py-4 text-green-600">
                  ✓
                </td>

                <td className="px-4 py-4 text-slate-300">
                  —
                </td>

                <td className="px-4 py-4 text-slate-300">
                  —
                </td>
              </tr>

            </tbody>
          </table>

        </div>
      </div>

      {/* Usuarios */}
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        <div className="flex items-center justify-between gap-4">

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <UserCog size={19} />
            </div>

            <div>
              <h3 className="font-bold text-slate-900">
                Usuarios del sistema
              </h3>

              <p className="text-sm text-slate-500">
                Usuarios autorizados actualmente
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowCreateUser(true)}
            className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
          >
            + Nuevo usuario
          </button>
          
          {showCreateUser && (
            <div className="rounded-xl border border-orange-200 bg-orange-50/40 p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Crear nuevo usuario
                  </h4>
                  <p className="text-xs text-slate-500">
                    Ingresa los datos de la nueva cuenta
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowCreateUser(false)}
                  className="text-sm font-medium text-slate-500 transition hover:text-slate-800"
                >
                  Cancelar
                </button>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <input
                  type="text"
                  placeholder="Nombre"
                  value={newUser.first_name}
                  onChange={(event) =>
                    setNewUser({
                      ...newUser,
                      first_name: event.target.value,
                    })
                  }
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-orange-400"
                />

                <input
                  type="text"
                  placeholder="Apellido"
                  value={newUser.last_name}
                  onChange={(event) =>
                    setNewUser({
                      ...newUser,
                      last_name: event.target.value,
                    })
                  }
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-orange-400"
                />

                <input
                  type="text"
                  placeholder="Usuario"
                  value={newUser.username}
                  onChange={(event) =>
                    setNewUser({
                      ...newUser,
                      username: event.target.value,
                    })
                  }
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-orange-400"
                />

                <input
                  type="password"
                  placeholder="Contraseña"
                  value={newUser.password}
                  onChange={(event) =>
                    setNewUser({
                      ...newUser,
                      password: event.target.value,
                    })
                  }
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-orange-400"
                />
              </div>
              <select
                value={newUser.role}
                onChange={(event) =>
                  setNewUser({
                    ...newUser,
                    role: event.target.value,
                  })
                }
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 outline-none focus:border-orange-400"
              >
                <option value="analyst">
                  Analista
                </option>

                <option value="reviewer">
                  Revisor
                </option>
              </select>

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleCreateUser}
                  disabled={
                    creatingUser ||
                    !newUser.first_name.trim() ||
                    !newUser.last_name.trim() ||
                    !newUser.username.trim() ||
                    !newUser.password
                  }
                  className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creatingUser ? "Creando..." : "Crear usuario"}
                </button>
              </div>
            </div>
          )}

        </div>
        <div className="mt-6 space-y-3">
          {loading && (
            <p className="text-sm text-slate-500">
              Cargando usuarios...
            </p>
          )}

          {error && (
            <div className="rounded-xl bg-red-50 p-4">
              <p className="text-sm font-medium text-red-700">
                {error}
              </p>
            </div>
          )}
          {success && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-4">
              <div className="flex items-center gap-2">
                <CheckCircle size={18} className="text-green-600" />

                <p className="text-sm font-medium text-green-700">
                  {success}
                </p>
              </div>
            </div>
          )}

          {!loading && !error && users.length === 0 && (
            <p className="text-sm text-slate-500">
              No hay usuarios registrados.
            </p>
          )}

          {!loading &&
            
            users.map((user) => (
              <div
                key={user.id}
                className={`flex items-center justify-between rounded-xl p-4 transition ${user.is_active
                    ? "bg-slate-50"
                    : "border border-red-100 bg-red-50/40 opacity-70"
                  }`}
              >
                <div>
                  {editingUserId === user.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editingUserName.first_name}
                        onChange={(event) =>
                          setEditingUserName({
                            ...editingUserName,
                            first_name: event.target.value,
                          })
                        }
                        className="w-28 rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm outline-none focus:border-orange-400"
                        placeholder="Nombre"
                      />

                      <input
                        type="text"
                        value={editingUserName.last_name}
                        onChange={(event) =>
                          setEditingUserName({
                            ...editingUserName,
                            last_name: event.target.value,
                          })
                        }
                        className="w-28 rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm outline-none focus:border-orange-400"
                        placeholder="Apellido"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveUserName(user.id)}
                        disabled={savingUserName}
                        className="rounded-lg bg-orange-500 px-3 py-1 text-xs font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {savingUserName ? "Guardando..." : "Guardar"}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingUserId(null);

                          setEditingUserName({
                            first_name: "",
                            last_name: "",
                          });
                          setError(null);
                        }}
                        disabled={savingUserName}
                        className="rounded-lg px-2 py-1 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-800">
                        {user.first_name} {user.last_name}
                      </p>

                      <button
                        type="button"
                        onClick={() => {
                          setError(null);
                          setEditingUserId(user.id);

                          setEditingUserName({
                            first_name: user.first_name,
                            last_name: user.last_name,
                            
                          });
                        }}
                        className="rounded-lg p-1 text-slate-400 transition hover:bg-orange-50 hover:text-orange-500"
                        title="Editar nombre"
                      >
                        <Pencil size={14} />
                      </button>
                    </div>
                  )}

                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs text-slate-400">
                      {user.username}
                    </span>

                    <span className="text-xs text-slate-300">
                      ·
                    </span>

                    <select
                      value={user.role ?? ""}
                      disabled={currentUser?.id === user.id}
                      onChange={(event) =>
                        handleRoleChange(
                          user.id,
                          event.target.value
                        )
                      }
                      className={`rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium outline-none ${currentUser?.id === user.id
                          ? "cursor-not-allowed bg-slate-100 text-slate-400"
                          : "text-slate-600 focus:border-orange-400"
                        }`}
                    >
                      <option value="" disabled>
                        Sin rol
                      </option>
                      <option value="admin">
                        Administrador
                      </option>

                      <option value="analyst">
                        Analista
                      </option>

                      <option value="reviewer">
                        Revisor
                      </option>
                    </select>

                    
                    
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setSuccess(null);
                    setNewPassword("");
                    setResetPasswordUserId(user.id);
                  }}
                  className="mr-2 rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-purple-200 hover:bg-purple-50 hover:text-purple-700"
                >
                  Restablecer contraseña
                </button>

                <button
                  type="button"
                  disabled={currentUser?.id === user.id}
                  onClick={() =>
                    handleDeleteUser(user.id, user.username)
                  }
                  className={`mr-2 rounded-lg border px-3 py-1 text-xs font-semibold transition ${currentUser?.id === user.id
                      ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                      : "border-red-200 bg-white text-red-600 hover:bg-red-50 hover:text-red-700"
                    }`}
                  title={
                    currentUser?.id === user.id
                      ? "No puedes eliminar tu propia cuenta"
                      : "Eliminar usuario"
                  }
                >
                  Eliminar
                </button>

                <button
                  type="button"
                  disabled={currentUser?.id === user.id}
                  onClick={() =>
                    handleStatusChange(
                      user.id,
                      !user.is_active
                    )
                  }
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${currentUser?.id === user.id
                      ? "cursor-not-allowed bg-slate-100 text-slate-400"
                      : user.is_active
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-red-100 text-red-700 hover:bg-red-200"
                    }`}
                >
                  {user.is_active ? "Activo" : "Inactivo"}
                </button>

                {resetPasswordUserId === user.id && (
                  <div className="mt-3 w-full rounded-xl border border-purple-200 bg-purple-50/50 p-3">
                    <p className="mb-2 text-xs font-semibold text-slate-700">
                      Nueva contraseña para {user.username}
                    </p>

                    <div className="flex items-center gap-2">
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(event) => setNewPassword(event.target.value)}
                        placeholder="Mínimo 8 caracteres"
                        className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-purple-400"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          handleResetPassword(user.id, user.username)
                        }
                        disabled={resettingPassword || newPassword.length < 8}
                        className="rounded-lg bg-purple-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {resettingPassword ? "Guardando..." : "Restablecer"}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setResetPasswordUserId(null);
                          setNewPassword("");
                          setError(null);
                        }}
                        disabled={resettingPassword}
                        className="rounded-lg px-3 py-2 text-xs font-medium text-slate-500 transition hover:bg-slate-100"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}


              </div>
            ))}          
                
        </div>
      </div>
    </div>
  )
}

export default Security