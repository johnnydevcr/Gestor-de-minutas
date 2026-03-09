import { useState, useEffect } from "react";
import { Download, LayoutTemplate } from "lucide-react";

export default function Designs() {
  const [designs, setDesigns] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/designs")
      .then((res) => res.json())
      .then((data) => setDesigns(data));
  }, []);

  const downloadDesign = (id: string, name: string) => {
    window.open(`/api/designs/${id}/download`, "_blank");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          Diseños de Minutas
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {designs.map((design) => (
          <div
            key={design.id}
            className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col"
          >
            <div
              className={`h-40 rounded-xl border mb-4 flex items-center justify-center ${
                design.id === "classic"
                  ? "bg-slate-50 border-slate-200 text-slate-400"
                  : design.id === "modern"
                    ? "bg-indigo-50 border-indigo-100 text-indigo-400"
                    : "bg-emerald-50 border-emerald-100 text-emerald-400"
              }`}
            >
              <LayoutTemplate size={48} />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              {design.name}
            </h3>
            <p className="text-sm text-slate-500 flex-1 mb-6">
              {design.description}
            </p>
            <button
              onClick={() => downloadDesign(design.id, design.name)}
              className="w-full flex items-center justify-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-200 transition-colors"
            >
              <Download size={18} />
              Descargar Ejemplo
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
