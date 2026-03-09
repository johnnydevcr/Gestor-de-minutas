import { useEffect, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { FileText, Download, Edit, Search, Filter } from "lucide-react";
import { Link } from "react-router-dom";
import { generateWordDocument } from "../services/word";
import { storageService } from "../services/storage";

export default function History() {
  const [minutes, setMinutes] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClients();
    fetchMinutes();
  }, []);

  useEffect(() => {
    fetchMinutes();
  }, [selectedClientId]);

  const fetchClients = async () => {
    try {
      const data = storageService.getClients();
      setClients(data);
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  };

  const fetchMinutes = async () => {
    setLoading(true);
    try {
      const data = storageService.getMinutes(selectedClientId);
      setMinutes(data);
    } catch (error) {
      console.error("Error fetching minutes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (id: number) => {
    try {
      const minuteData = storageService.getMinuteById(id);
      if (!minuteData) throw new Error("Minute not found");
      
      await generateWordDocument(new ArrayBuffer(0), minuteData);
    } catch (error) {
      console.error(error);
      alert("Error al descargar la minuta.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Historial de Minutas</h1>
          <p className="text-slate-500 mt-1">Consulta y descarga las minutas generadas anteriormente.</p>
        </div>
        <Link to="/new" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm shadow-sm flex items-center gap-2">
          <FileText size={18} />
          Nueva Minuta
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <Filter size={18} className="text-slate-400" />
            Filtrar por Cliente:
          </div>
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white min-w-[200px]"
          >
            <option value="">Todos los clientes</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                [{c.code}] {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                <th className="px-6 py-4 font-semibold">Nº Minuta</th>
                <th className="px-6 py-4 font-semibold">Cliente/Proyecto</th>
                <th className="px-6 py-4 font-semibold">Fecha</th>
                <th className="px-6 py-4 font-semibold">Responsable</th>
                <th className="px-6 py-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    Cargando minutas...
                  </td>
                </tr>
              ) : minutes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No se encontraron minutas.
                  </td>
                </tr>
              ) : (
                minutes.map((minute) => (
                  <tr key={minute.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 font-medium text-slate-900">{minute.minute_number}</td>
                    <td className="px-6 py-4 text-slate-600">{minute.client}</td>
                    <td className="px-6 py-4 text-slate-600">
                      {minute.date ? format(new Date(minute.date), "dd MMM yyyy", { locale: es }) : '-'}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{minute.responsible}</td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button 
                        onClick={() => handleDownload(minute.id)} 
                        className="inline-flex items-center justify-center p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" 
                        title="Descargar Word"
                      >
                        <Download size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
