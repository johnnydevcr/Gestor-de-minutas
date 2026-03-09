import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FileText, CheckSquare, Clock, Users } from "lucide-react";
import { storageService } from "../services/storage";

export default function Dashboard() {
  const [stats, setStats] = useState({ minutes: 0, pendingAgreements: 0 });

  useEffect(() => {
    // Fetch stats from storage
    const minutes = storageService.getMinutes();
    const agreements = storageService.getAgreements();
    
    setStats({
      minutes: minutes.length,
      pendingAgreements: agreements.filter((a: any) => a.status === 'pendiente').length
    });
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <FileText size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Minutas Generadas</p>
            <p className="text-2xl font-bold text-slate-900">{stats.minutes}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Acuerdos Pendientes</p>
            <p className="text-2xl font-bold text-slate-900">{stats.pendingAgreements}</p>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Acciones Rápidas</h2>
        <div className="flex gap-4">
          <Link to="/new" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2 shadow-sm">
            <FileText size={20} />
            Crear Nueva Minuta
          </Link>
          <Link to="/agreements" className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2 shadow-sm">
            <CheckSquare size={20} />
            Ver Acuerdos
          </Link>
        </div>
      </div>
    </div>
  );
}
