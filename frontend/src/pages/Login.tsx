import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/auth";
import { saveSession } from "../api/session";

export default function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        setError("");
        setLoading(true);

        try {
            const response = await login({
                username,
                password,
            });

            saveSession(
                response.access_token,
                response.user
            );

            navigate("/");
        }
        catch (err) {
            console.error("Error de inicio de sesión:", err);

            setError(
                "Usuario o contraseña incorrectos. Verifica tus credenciales e inténtalo nuevamente."
            );
        }
        finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8">

                    {/* Identidad */}
                    <div className="text-center mb-6">
                        <div className="mx-auto mb-2 flex h-24 w-28 items-center justify-center">
                            <img
                                src="/brand/cloudedtech-icon.svg"
                                alt="CloudEdTech"
                                className="h-full w-full object-contain"
                            />
                        </div>

                        <h1 className="text-3xl font-bold tracking-tight">
                            <span className="text-white">Cloud</span>
                            <span className="text-[#FF7400]">Ed</span>
                            <span className="text-white">Tech</span>
                        </h1>

                        <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                            Education &amp; Technology
                        </p>

                        <p className="mt-3 text-sm text-slate-400">
                            Inteligencia para comunidades digitales
                        </p>
                    </div>

                    {/* Encabezado */}
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold text-white">
                            Iniciar sesión
                        </h2>

                        <p className="mt-1 text-sm text-slate-400">
                            Ingresa tus credenciales para acceder a la plataforma.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label
                                htmlFor="username"
                                className="block text-sm font-medium text-slate-300 mb-2"
                            >
                                Usuario
                            </label>

                            <input
                                id="username"
                                type="text"
                                placeholder="Ingresa tu usuario"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-600 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                            />
                        </div>

                        <div className="relative">
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Ingresa tu contraseña"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 pr-12 text-white placeholder:text-slate-600 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                            />

                            <button
                                type="button"
                                onClick={() => setShowPassword((value) => !value)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-orange-500"
                                aria-label={
                                    showPassword
                                        ? "Ocultar contraseña"
                                        : "Mostrar contraseña"
                                }
                            >
                                {showPassword ? (
                                    <EyeOff size={20} />
                                ) : (
                                    <Eye size={20} />
                                )}
                            </button>
                        </div>

                        {error && (
                            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
                                <p className="text-sm text-red-400">
                                    {error}
                                </p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !username.trim() || !password}
                            className="w-full rounded-xl bg-[#FF7400] px-4 py-3 font-semibold text-white transition hover:bg-[#E96800] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {loading ? "Ingresando..." : "Iniciar sesión"}
                        </button>
                    </form>

                    <div className="mt-8 border-t border-slate-800 pt-5 text-center">
                        <p className="text-xs text-slate-500">
                            Acceso restringido · CloudedTech
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
}