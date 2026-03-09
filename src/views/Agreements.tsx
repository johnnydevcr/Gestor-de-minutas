import { useEffect, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CheckCircle, Clock, AlertCircle } from "lucide-react";
import { clsx } from "clsx";

export default function Agreements() {
  const [agreements, setAgreements] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetch("/api/agreements")
      .then(res => res.json())
      .then(data => setAgreements(data));
  }, []);

  const updateStatus = async (id: number, status: string) => {
    await fetch(`/api/agreements/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    setAgreements(agreements.map(a => a.id === id ? { ...a, status } : a));
  };

  const filteredAgreements = agreements.filter(a => filter === "all" || a.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Seguimiento de Acuerdos</h1>
        <div className="flex gap-2">
          {["all", "pendiente", "en progreso", "completado"].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={clsx(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors border",
                filter === f
                  ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
            >
              {f === "all" ? "Todos" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
              <th className="p-4 font-semibold">Acción</th>
              <th className="p-4 font-semibold">Responsable</th>
              <th className="p-4 font-semibold">Fecha Compromiso</th>
              <th className="p-4 font-semibold">Minuta/Cliente</th>
              <th className="p-4 font-semibold">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredAgreements.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500">No hay acuerdos para mostrar.</td>
              </tr>
            ) : (
              filteredAgreements.map((agreement) => (
                <tr key={agreement.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-medium text-slate-900 max-w-xs truncate">{agreement.action}</td>
                  <td className="p-4 text-slate-600">{agreement.responsible}</td>
                  <td className="p-4 text-slate-600">
                    {agreement.commitment_date ? format(new Date(agreement.commitment_date), "dd MMM yyyy", { locale: es }) : '-'}
                  </td>
                  <td className="p-4 text-slate-600">
                    <div className="text-sm font-medium text-slate-900">{agreement.minute_number}</div>
                    <div className="text-xs text-slate-500">{agreement.client}</div>
                  </td>
                  <td className="p-4">
                    <select
                      value={agreement.status}
                      onChange={(e) => updateStatus(agreement.id, e.target.value)}
                      className={clsx(
                        "text-sm font-medium rounded-full px-3 py-1 border-0 ring-1 ring-inset focus:ring-2 focus:ring-inset",
                        agreement.status === "completado" && "bg-emerald-50 text-emerald-700 ring-emerald-600/20 focus:ring-emerald-600",
                        agreement.status === "en progreso" && "bg-amber-50 text-amber-700 ring-amber-600/20 focus:ring-amber-600",
                        agreement.status === "pendiente" && "bg-slate-50 text-slate-700 ring-slate-600/20 focus:ring-slate-600"
                      )}
                    >
                      <option value="pendiente">Pendiente</option>
                      <option value="en progreso">En Progreso</option>
                      <option value="completado">Completado</option>
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
