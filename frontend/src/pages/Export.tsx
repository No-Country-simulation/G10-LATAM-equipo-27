import { Download } from "lucide-react";
import { mockCommunityData } from "../data/mockCommunityData";

function Export() {

    const exportData = mockCommunityData;
    
    const handleExportJSON = () => {
        const json = JSON.stringify(exportData, null, 2);
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = "cloudedtech-community-data.json";

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);
    };

    return (
        <div>
            {/* Encabezado */}
            <div>
                <h2 className="text-2xl font-bold text-slate-900">
                    Export
                </h2>

                <p className="mt-1 text-slate-500">
                    Exporta análisis y datos de tu comunidad.
                </p>
            </div>

            {/* Contenido */}
            <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                        <Download size={20} />
                    </div>

                    <div>
                        <h3 className="font-bold text-slate-900">
                            Exportar información
                        </h3>

                        <p className="text-sm text-slate-500">
                            Genera reportes y exporta los resultados de tus análisis.
                        </p>
                    </div>
                </div>

                <div className="mt-6 rounded-xl bg-slate-50 p-6">
                    <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h4 className="font-semibold text-slate-900">
                                Datos de la comunidad
                            </h4>

                            <p className="mt-1 text-sm text-slate-500">
                                Exporta los datos actuales de CloudEdTech en formato JSON.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={handleExportJSON}
                            className="flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600"
                        >
                            <Download size={17} />
                            Exportar JSON
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Export;