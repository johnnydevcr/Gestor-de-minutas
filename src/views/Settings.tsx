import React, { useState, useRef, useEffect } from "react";
import {
  Settings as SettingsIcon,
  Upload,
  Image as ImageIcon,
} from "lucide-react";
import { storageService } from "../services/storage";

export default function Settings() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const logo = storageService.getLogo();
    if (logo) {
      setLogoUrl(logo);
    }
  }, []);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      storageService.saveSettings("logo", base64String);
      setLogoUrl(base64String);
      alert("Logo actualizado correctamente.");
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          Configuración
        </h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 max-w-2xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-slate-100 text-slate-600 rounded-xl">
            <SettingsIcon size={24} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-800">
              Preferencias Generales
            </h2>
            <p className="text-sm text-slate-500">
              Ajustes de la aplicación y generación de minutas.
            </p>
          </div>
        </div>

        <form className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Logo de la Empresa
            </label>
            <div className="flex items-center gap-6">
              <div className="w-32 h-32 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center overflow-hidden">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Logo"
                    className="w-full h-full object-contain p-2"
                  />
                ) : (
                  <ImageIcon className="text-slate-300" size={32} />
                )}
              </div>
              <div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleLogoUpload}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                >
                  <Upload size={18} />
                  Subir Logo
                </button>
                <p className="text-xs text-slate-500 mt-2">
                  Recomendado: PNG o JPG, máx 2MB.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Formato de Fecha
            </label>
            <select className="w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 border">
              <option>DD/MM/YYYY</option>
              <option>MM/DD/YYYY</option>
              <option>YYYY-MM-DD</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Idioma de Análisis IA
            </label>
            <select className="w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 border">
              <option>Español</option>
              <option>Inglés</option>
              <option>Automático</option>
            </select>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button
              type="button"
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
