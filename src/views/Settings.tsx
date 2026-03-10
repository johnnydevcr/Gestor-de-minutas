import React, { useState, useRef, useEffect } from "react";
import {
  Settings as SettingsIcon,
  Upload,
  Image as ImageIcon,
} from "lucide-react";
import { storageService } from "../services/storage";

export default function Settings() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [headerUrl, setHeaderUrl] = useState<string | null>(null);
  const [footerUrl, setFooterUrl] = useState<string | null>(null);
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const headerInputRef = useRef<HTMLInputElement>(null);
  const footerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLogoUrl(storageService.getLogo());
    setHeaderUrl(storageService.getHeader());
    setFooterUrl(storageService.getFooter());
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, key: string, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      storageService.saveSettings(key, base64String);
      setter(base64String);
      alert(`${key.charAt(0).toUpperCase() + key.slice(1)} actualizado correctamente.`);
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

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 max-w-3xl">
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

        <div className="space-y-8">
          {/* Logo Section */}
          <div className="border-b border-slate-100 pb-6">
            <label className="block text-sm font-bold text-slate-700 mb-3">
              Logo de la Empresa (Para el acta)
            </label>
            <div className="flex items-center gap-6">
              <div className="w-32 h-16 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center overflow-hidden">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Logo"
                    className="w-full h-full object-contain p-1"
                  />
                ) : (
                  <ImageIcon className="text-slate-300" size={24} />
                )}
              </div>
              <div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={logoInputRef}
                  onChange={(e) => handleImageUpload(e, "logo", setLogoUrl)}
                />
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                >
                  <Upload size={18} />
                  Subir Logo
                </button>
                <p className="text-xs text-slate-500 mt-2">
                  Recomendado: 3.45cm x 0.64cm.
                </p>
              </div>
            </div>
          </div>

          {/* Header Section */}
          <div className="border-b border-slate-100 pb-6">
            <label className="block text-sm font-bold text-slate-700 mb-3">
              Imagen de Encabezado (Header)
            </label>
            <div className="space-y-4">
              <div className="w-full h-24 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center overflow-hidden">
                {headerUrl ? (
                  <img
                    src={headerUrl}
                    alt="Header"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <ImageIcon className="text-slate-300" size={32} />
                )}
              </div>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={headerInputRef}
                  onChange={(e) => handleImageUpload(e, "header", setHeaderUrl)}
                />
                <button
                  type="button"
                  onClick={() => headerInputRef.current?.click()}
                  className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                >
                  <Upload size={18} />
                  Subir Header
                </button>
                <p className="text-xs text-slate-500">
                  Tamaño requerido: 21.66 cm x 4.06 cm.
                </p>
              </div>
            </div>
          </div>

          {/* Footer Section */}
          <div className="border-b border-slate-100 pb-6">
            <label className="block text-sm font-bold text-slate-700 mb-3">
              Imagen de Pie de Página (Footer)
            </label>
            <div className="space-y-4">
              <div className="w-full h-24 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center overflow-hidden">
                {footerUrl ? (
                  <img
                    src={footerUrl}
                    alt="Footer"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <ImageIcon className="text-slate-300" size={32} />
                )}
              </div>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={footerInputRef}
                  onChange={(e) => handleImageUpload(e, "footer", setFooterUrl)}
                />
                <button
                  type="button"
                  onClick={() => footerInputRef.current?.click()}
                  className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                >
                  <Upload size={18} />
                  Subir Footer
                </button>
                <p className="text-xs text-slate-500">
                  Tamaño requerido: 21.66 cm x 27.94 cm.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
