import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FileText, Play, Download, RefreshCw, X, Plus, ClipboardList, Eye, FileDown, Copy, Info, Save } from "lucide-react";
import { parseMinuteText, validateMinuteText, formatDateForDisplay } from "../services/parser";
import { generateWordDocument } from "../services/word";
import { generatePDF } from "../services/pdf";
import { storageService } from "../services/storage";

export default function NewMinute() {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [editId, setEditId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    transcript: "",
    clientId: "",
  });

  const [aiData, setAiData] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showPromptGuide, setShowPromptGuide] = useState(false);
  const [newAttendee, setNewAttendee] = useState("");
  const [newAbsentee, setNewAbsentee] = useState("");

  const COPILOT_PROMPT = `Actúa como un asistente experto en redacción de minutas corporativas. A partir de la siguiente transcripción o notas de reunión, genera una minuta estructurada siguiendo ESTRICTAMENTE este formato:

Nombre de la reunión: [Nombre descriptivo]
Cliente: [Nombre del cliente]
Fecha: [DD/MM/AAAA]
Hora inicio: [HH:MM]
Hora fin: [HH:MM]
Lugar: [Ubicación física o enlace]
Responsable: [Nombre de quien redacta]
Consecutivo: [Número de acta]
Objetivo: [Descripción del propósito]
Asistentes: [Nombre 1, Nombre 2, Nombre 3]
Agenda: [Tema 1, Tema 2, Tema 3]

Temas Tratados:
Tema: [Título del Tema 1]
Detalle: [Explicación amplia y profesional de lo discutido en este punto]
Puntos importantes: [Punto A, Punto B, Punto C]
Decisiones: [Decisión X, Decisión Y]

Tema: [Título del Tema 2]
...

Acuerdos y compromisos:
[Descripción del acuerdo 1] | [Responsable] | [Fecha límite]
[Descripción del acuerdo 2] | [Responsable] | [Fecha límite]

Reglas de Formato OBLIGATORIAS:
1. NO hagas saltos de línea entre la etiqueta y su valor (ejemplo correcto: "Asistentes: Juan, Pedro").
2. NO uses viñetas (-) para las secciones de Asistentes, Agenda, Puntos importantes ni Decisiones. Usa siempre una lista separada por comas en la misma línea.
3. Las secciones 'Puntos importantes:' y 'Decisiones:' son opcionales dentro de cada Tema.
4. El campo 'Detalle:' debe ser un párrafo continuo con la explicación detallada.
5. Mantén un tono formal y ejecutivo.`;

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(COPILOT_PROMPT);
    alert("¡Prompt copiado al portapapeles!");
  };

  useEffect(() => {
    const data = storageService.getClients();
    setClients(data);

    // Check for edit mode
    const params = new URLSearchParams(location.search);
    const id = params.get("edit");
    if (id) {
      const minuteToEdit = storageService.getMinuteById(parseInt(id));
      if (minuteToEdit) {
        setEditId(id);
        setFormData({
          transcript: minuteToEdit.transcript || "",
          clientId: minuteToEdit.client_id || "",
        });
        setAiData(minuteToEdit);
        setStep(2); // Jump to step 2 if editing
      }
    }
  }, [location.search]);

  const handlePasteFromCopilot = async () => {
    try {
      // Check if the API is available
      if (!navigator.clipboard || !navigator.clipboard.readText) {
        throw new Error("Clipboard API not supported");
      }
      
      const text = await navigator.clipboard.readText();
      if (text) {
        setFormData({ ...formData, transcript: text });
      } else {
        alert("El portapapeles está vacío.");
      }
    } catch (err) {
      console.error("Error al acceder al portapapeles:", err);
      alert(
        "El navegador bloqueó el acceso al portapapeles por seguridad en esta vista previa.\n\n" +
        "Por favor, usa el atajo de teclado Ctrl+V (o Cmd+V) directamente en el cuadro de texto para pegar la información."
      );
    }
  };

  const handleAnalyze = async () => {
    if (!formData.transcript.trim()) {
      alert("Por favor ingresa la información de la minuta.");
      return;
    }
    if (!formData.clientId) {
      alert("Por favor selecciona un cliente.");
      return;
    }

    const validation = validateMinuteText(formData.transcript);
    if (!validation.valid) {
      alert(`Formato inválido: ${validation.error}`);
      return;
    }

    setLoading(true);
    try {
      // Use manual parser instead of AI
      const result = parseMinuteText(formData.transcript);
      const selectedClient = clients.find(c => c.id.toString() === formData.clientId);
      
      setAiData({
        ...result,
        client: selectedClient ? selectedClient.name : (result.client || "Sin nombre"),
        meeting_name: result.meeting_name || (selectedClient ? selectedClient.name : ""),
        client_id: formData.clientId,
        minute_number: selectedClient ? `MN-${selectedClient.code}-0000` : (result.minute_number || "MN-000")
      });
      setStep(2);
    } catch (error) {
      console.error(error);
      alert("Error al procesar el texto.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!aiData) return;
    setLoading(true);
    try {
      await generatePDF(aiData);
    } catch (error) {
      console.error(error);
      alert("Error al generar el PDF.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAndDownload = async () => {
    setLoading(true);
    try {
      // 1. Save to Local Storage
      const payload = {
        ...aiData,
        transcript: formData.transcript,
      };

      if (editId) {
        payload.id = parseInt(editId);
        storageService.updateMinute(payload);
      } else {
        storageService.saveMinute(payload);
      }

      // 2. Generate Word
      await generateWordDocument(new ArrayBuffer(0), payload);

      navigate("/history");
    } catch (error) {
      console.error(error);
      alert("Error al generar el documento.");
    } finally {
      setLoading(false);
    }
  };

  const addAttendee = () => {
    if (newAttendee.trim() && !aiData.attendees.includes(newAttendee.trim())) {
      setAiData((prev: any) => ({
        ...prev,
        attendees: [...prev.attendees, newAttendee.trim()],
      }));
      setNewAttendee("");
    }
  };

  const addAbsentee = () => {
    if (newAbsentee.trim() && !aiData.absentees.includes(newAbsentee.trim())) {
      setAiData((prev: any) => ({
        ...prev,
        absentees: [...prev.absentees, newAbsentee.trim()],
      }));
      setNewAbsentee("");
    }
  };

  const removeAttendee = (name: string) => {
    setAiData((prev: any) => ({
      ...prev,
      attendees: prev.attendees.filter((a: string) => a !== name),
    }));
  };

  const removeAbsentee = (name: string) => {
    setAiData((prev: any) => ({
      ...prev,
      absentees: prev.absentees.filter((a: string) => a !== name),
    }));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          Nueva Minuta
        </h1>
        <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
          <span className={step >= 1 ? "text-blue-600" : ""}>
            1. Información y Cliente
          </span>
          <span>&gt;</span>
          <span className={step >= 2 ? "text-blue-600" : ""}>
            2. Revisión
          </span>
        </div>
      </div>

      {step === 1 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <h2 className="text-xl font-semibold text-slate-800">
              Información de la Minuta
            </h2>
            <button
              onClick={() => setShowPromptGuide(true)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1.5 transition-colors"
            >
              <Info size={16} />
              ¿Cómo generar este texto? (Prompt para Copilot)
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Seleccionar Cliente
            </label>
            <select
              value={formData.clientId}
              onChange={(e) =>
                setFormData({ ...formData, clientId: e.target.value })
              }
              className="w-full rounded-lg border-slate-300 border p-3 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Selecciona un cliente...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  [{c.code}] {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-slate-700 flex items-center gap-2">
                <ClipboardList size={18} />
                Pegar Información de la Minuta
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyPrompt}
                  className="text-xs bg-slate-50 text-slate-600 px-3 py-1.5 rounded-lg font-semibold hover:bg-slate-100 transition-colors flex items-center gap-1.5 border border-slate-200"
                >
                  <Copy size={14} />
                  Copiar Prompt para Copilot
                </button>
                <button
                  onClick={handlePasteFromCopilot}
                  className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg font-semibold hover:bg-blue-100 transition-colors flex items-center gap-1.5 border border-blue-100"
                >
                  <ClipboardList size={14} />
                  Pegar desde Copilot
                </button>
              </div>
            </div>
            <textarea
              value={formData.transcript}
              onChange={(e) =>
                setFormData({ ...formData, transcript: e.target.value })
              }
              rows={12}
              placeholder="Pega aquí la información estructurada (Fecha, Hora, Objetivo, Temas, etc...)"
              className="w-full rounded-lg border-slate-300 border p-4 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
            />
            <p className="text-xs text-slate-500 mt-2">
              Tip: Si el botón de pegar no funciona, usa <strong>Ctrl+V</strong> (o <strong>Cmd+V</strong>) directamente en el cuadro de texto.
            </p>
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-end">
            <button
              onClick={handleAnalyze}
              disabled={loading || !formData.transcript.trim()}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="animate-spin" size={20} />
              ) : (
                <Play size={20} />
              )}
              {loading ? "Procesando..." : "Procesar Información"}
            </button>
          </div>
        </div>
      )}

      {step === 2 && aiData && (
        <>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-8">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <h2 className="text-xl font-semibold text-slate-800">
              Revisión de Contenido Generado
            </h2>
            <div className="flex gap-3">
              <button
                onClick={() => setShowPreview(true)}
                className="bg-slate-100 text-slate-700 px-4 py-2.5 rounded-lg font-medium hover:bg-slate-200 transition-colors flex items-center gap-2"
              >
                <Eye size={20} />
                Vista Previa
              </button>
              <button
                onClick={handleDownloadPDF}
                disabled={loading}
                className="bg-red-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <FileDown size={20} />
                Descargar PDF
              </button>
              <button
                onClick={handleSaveAndDownload}
                disabled={loading}
                className="bg-emerald-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw className="animate-spin" size={20} />
                ) : (
                  <Download size={20} />
                )}
                Guardar y Word
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-100 pb-2">
              Datos Generales
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Número de Minuta
                </label>
                <input
                  type="text"
                  value={aiData.minute_number || ""}
                  onChange={(e) =>
                    setAiData({ ...aiData, minute_number: e.target.value })
                  }
                  className="w-full rounded-lg border-slate-300 border p-2.5 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Cliente o Proyecto
                </label>
                <input
                  type="text"
                  value={aiData.client || ""}
                  onChange={(e) =>
                    setAiData({ ...aiData, client: e.target.value })
                  }
                  className="w-full rounded-lg border-slate-300 border p-2.5 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nombre de la Reunión
                </label>
                <input
                  type="text"
                  value={aiData.meeting_name || ""}
                  onChange={(e) =>
                    setAiData({ ...aiData, meeting_name: e.target.value })
                  }
                  placeholder="Ej: Revisión Semanal de Proyecto"
                  className="w-full rounded-lg border-slate-300 border p-2.5 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Fecha
                </label>
                <input
                  type="date"
                  value={aiData.date || ""}
                  onChange={(e) =>
                    setAiData({ ...aiData, date: e.target.value })
                  }
                  className="w-full rounded-lg border-slate-300 border p-2.5 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Hora Inicio
                  </label>
                  <input
                    type="time"
                    value={aiData.start_time || ""}
                    onChange={(e) =>
                      setAiData({ ...aiData, start_time: e.target.value })
                    }
                    className="w-full rounded-lg border-slate-300 border p-2.5 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Hora Fin
                  </label>
                  <input
                    type="time"
                    value={aiData.end_time || ""}
                    onChange={(e) =>
                      setAiData({ ...aiData, end_time: e.target.value })
                    }
                    className="w-full rounded-lg border-slate-300 border p-2.5 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Lugar o Plataforma
                </label>
                <input
                  type="text"
                  value={aiData.location || ""}
                  onChange={(e) =>
                    setAiData({ ...aiData, location: e.target.value })
                  }
                  className="w-full rounded-lg border-slate-300 border p-2.5 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Responsable de Minuta
                </label>
                <input
                  type="text"
                  value={aiData.responsible || ""}
                  onChange={(e) =>
                    setAiData({ ...aiData, responsible: e.target.value })
                  }
                  className="w-full rounded-lg border-slate-300 border p-2.5 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Asistentes
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newAttendee}
                    onChange={(e) => setNewAttendee(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addAttendee()}
                    placeholder="Nombre..."
                    className="flex-1 rounded-lg border-slate-300 border p-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                  <button
                    onClick={addAttendee}
                    className="bg-slate-100 p-2 rounded-lg text-slate-600 hover:bg-slate-200"
                  >
                    <Plus size={20} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(aiData.attendees || []).map((a: string) => (
                    <span
                      key={a}
                      className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm flex items-center gap-1"
                    >
                      {a}{" "}
                      <button
                        onClick={() => removeAttendee(a)}
                        className="hover:text-blue-900"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Ausentes
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newAbsentee}
                    onChange={(e) => setNewAbsentee(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addAbsentee()}
                    placeholder="Nombre..."
                    className="flex-1 rounded-lg border-slate-300 border p-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                  <button
                    onClick={addAbsentee}
                    className="bg-slate-100 p-2 rounded-lg text-slate-600 hover:bg-slate-200"
                  >
                    <Plus size={20} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(aiData.absentees || []).map((a: string) => (
                    <span
                      key={a}
                      className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm flex items-center gap-1"
                    >
                      {a}{" "}
                      <button
                        onClick={() => removeAbsentee(a)}
                        className="hover:text-slate-900"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-100 pb-2 pt-6">
              Contenido
            </h3>

            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Objetivo de la Reunión
              </label>
              <textarea
                value={aiData.objective || ""}
                onChange={(e) =>
                  setAiData({ ...aiData, objective: e.target.value })
                }
                rows={3}
                className="w-full rounded-lg border-slate-300 border p-3 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Agenda
              </label>
              <textarea
                value={(aiData.agenda || []).join("\n")}
                onChange={(e) =>
                  setAiData({ ...aiData, agenda: e.target.value.split("\n") })
                }
                rows={4}
                placeholder="Un punto por línea..."
                className="w-full rounded-lg border-slate-300 border p-3 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Resumen Ejecutivo
              </label>
              <textarea
                value={aiData.executive_summary || ""}
                onChange={(e) =>
                  setAiData({ ...aiData, executive_summary: e.target.value })
                }
                rows={4}
                className="w-full rounded-lg border-slate-300 border p-3 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-4">
                Temas Tratados
              </label>
              <div className="space-y-4">
                {(aiData.topics || []).map((topic: any, idx: number) => (
                  <div
                    key={idx}
                    className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3"
                  >
                    <input
                      type="text"
                      value={topic.title || ""}
                      onChange={(e) => {
                        const newTopics = [...aiData.topics];
                        newTopics[idx].title = e.target.value;
                        setAiData({ ...aiData, topics: newTopics });
                      }}
                      className="w-full font-semibold bg-transparent border-b border-slate-300 focus:border-blue-500 focus:ring-0 px-0 py-1"
                    />
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <span className="text-xs font-medium text-slate-500 uppercase">
                          Detalle (Explicación amplia)
                        </span>
                        <textarea
                          value={topic.description || ""}
                          onChange={(e) => {
                            const newTopics = [...aiData.topics];
                            newTopics[idx].description = e.target.value;
                            setAiData({ ...aiData, topics: newTopics });
                          }}
                          rows={4}
                          className="w-full rounded-lg border-slate-300 border p-2 text-sm mt-1"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs font-medium text-slate-500 uppercase">
                          Puntos Importantes (Opcional)
                        </span>
                        <textarea
                          value={(topic.points || []).join("\n")}
                          onChange={(e) => {
                            const newTopics = [...aiData.topics];
                            newTopics[idx].points = e.target.value.split("\n").filter(p => p.trim() !== "");
                            setAiData({ ...aiData, topics: newTopics });
                          }}
                          rows={3}
                          placeholder="Un punto por línea..."
                          className="w-full rounded-lg border-slate-300 border p-2 text-sm mt-1"
                        />
                      </div>
                      <div>
                        <span className="text-xs font-medium text-slate-500 uppercase">
                          Decisiones (Opcional)
                        </span>
                        <textarea
                          value={(topic.decisions || []).join("\n")}
                          onChange={(e) => {
                            const newTopics = [...aiData.topics];
                            newTopics[idx].decisions = e.target.value.split("\n").filter(d => d.trim() !== "");
                            setAiData({ ...aiData, topics: newTopics });
                          }}
                          rows={3}
                          placeholder="Una decisión por línea..."
                          className="w-full rounded-lg border-slate-300 border p-2 text-sm mt-1"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-4">
                Acuerdos Detectados
              </label>
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="p-3 font-medium text-slate-600">Acción</th>
                      <th className="p-3 font-medium text-slate-600 w-48">
                        Responsable
                      </th>
                      <th className="p-3 font-medium text-slate-600 w-40">
                        Fecha
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(aiData.agreements || []).map((ag: any, idx: number) => (
                      <tr key={idx}>
                        <td className="p-2">
                          <input
                            type="text"
                            value={ag.action || ""}
                            onChange={(e) => {
                              const newAg = [...aiData.agreements];
                              newAg[idx].action = e.target.value;
                              setAiData({ ...aiData, agreements: newAg });
                            }}
                            className="w-full rounded border-transparent hover:border-slate-300 focus:border-indigo-500 p-1"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={ag.responsible || ""}
                            onChange={(e) => {
                              const newAg = [...aiData.agreements];
                              newAg[idx].responsible = e.target.value;
                              setAiData({ ...aiData, agreements: newAg });
                            }}
                            className="w-full rounded border-transparent hover:border-slate-300 focus:border-indigo-500 p-1"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={ag.commitment_date || ""}
                            onChange={(e) => {
                              const newAg = [...aiData.agreements];
                              newAg[idx].commitment_date = e.target.value;
                              setAiData({ ...aiData, agreements: newAg });
                            }}
                            placeholder="DD/MM/YYYY"
                            className="w-full rounded border-transparent hover:border-slate-300 focus:border-indigo-500 p-1"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Temas Pendientes
              </label>
              <textarea
                value={(aiData.pending_topics || []).join("\n")}
                onChange={(e) =>
                  setAiData({
                    ...aiData,
                    pending_topics: e.target.value.split("\n"),
                  })
                }
                rows={3}
                className="w-full rounded-lg border-slate-300 border p-3 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-start">
            <button
              onClick={() => setStep(1)}
              className="text-slate-600 px-6 py-2.5 rounded-lg font-medium hover:bg-slate-50 transition-colors"
            >
              Volver a Información
            </button>
          </div>
        </div>

      {/* Prompt Guide Modal */}
      {showPromptGuide && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Info className="text-blue-600" size={20} />
                Prompt para Copilot / ChatGPT
              </h3>
              <button onClick={() => setShowPromptGuide(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <p className="text-sm text-slate-600">
                Copia y pega este prompt en Copilot o ChatGPT junto con tus notas o transcripción para obtener el formato exacto que este gestor puede procesar automáticamente:
              </p>
              
              <div className="bg-slate-900 text-slate-300 p-4 rounded-xl font-mono text-sm relative group">
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(COPILOT_PROMPT);
                    alert("¡Prompt copiado al portapapeles!");
                  }}
                  className="absolute top-3 right-3 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-white"
                  title="Copiar prompt"
                >
                  <Copy size={16} />
                </button>
                <pre className="whitespace-pre-wrap leading-relaxed">
                  {COPILOT_PROMPT}
                </pre>
              </div>
              
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-sm text-blue-800">
                <p className="font-bold mb-1">💡 Consejo:</p>
                <p>Una vez que Copilot te devuelva el texto, simplemente cópialo y pégalo en el cuadro de texto de "Nueva Minuta" para que el sistema lo procese automáticamente.</p>
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button onClick={() => setShowPromptGuide(false)} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

        {/* Preview Modal */}
        {showPreview && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-slate-800">Vista Previa de la Minuta</h3>
                <button onClick={() => setShowPreview(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 bg-white">
                <div className="max-w-3xl mx-auto border border-slate-200 p-12 shadow-sm">
                  <div className="flex justify-between items-start mb-8">
                    <h1 className="text-2xl font-bold text-slate-900">MINUTA DE REUNIÓN</h1>
                    <div className="text-right text-sm space-y-1">
                      <p><span className="font-bold text-blue-600">FECHA:</span> {formatDateForDisplay(aiData.date)}</p>
                      <p><span className="font-bold text-blue-600">HORA:</span> {aiData.start_time} - {aiData.end_time}</p>
                      <p><span className="font-bold text-blue-600">LUGAR:</span> {aiData.location}</p>
                      <p><span className="font-bold text-blue-600">Consecutivo:</span> {aiData.minute_number}</p>
                    </div>
                  </div>

                  <div className="space-y-4 mb-8">
                    <p><span className="font-bold text-blue-600">REUNIÓN / NOMBRE DEL PROYECTO:</span> {aiData.meeting_name || aiData.client}</p>
                    <p><span className="font-bold text-blue-600">ACTA PREPARADA POR:</span> {aiData.responsible}</p>
                  </div>

                  <div className="mb-8">
                    <h4 className="font-bold text-blue-600 mb-2">OBJETIVO DE LA REUNIÓN:</h4>
                    <p className="text-sm text-slate-700">{aiData.objective}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-8 mb-8">
                    <div>
                      <h4 className="font-bold bg-blue-600 text-white px-3 py-1 text-sm mb-2">ASISTENTES</h4>
                      <ul className="text-sm list-disc list-inside text-slate-700">
                        {aiData.attendees.map((a: string) => <li key={a}>{a}</li>)}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-bold bg-blue-600 text-white px-3 py-1 text-sm mb-2">AUSENTES</h4>
                      <ul className="text-sm list-disc list-inside text-slate-700">
                        {aiData.absentees.map((a: string) => <li key={a}>{a}</li>)}
                      </ul>
                    </div>
                  </div>

                  <div className="mb-8">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="bg-blue-600 text-white">
                          <th className="border border-blue-700 p-2 text-left w-1/3">Situación</th>
                          <th className="border border-blue-700 p-2 text-left">Comentarios/Anotaciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {aiData.topics.map((t: any, i: number) => (
                          <tr key={i}>
                            <td className="border border-slate-200 p-2 font-bold align-top">{t.title}</td>
                            <td className="border border-slate-200 p-2 align-top">
                              <p className="mb-2">{t.description}</p>
                              {t.points?.length > 0 && (
                                <div className="mb-2">
                                  <p className="font-bold text-xs uppercase text-slate-500">Puntos Importantes:</p>
                                  <ul className="list-disc list-inside pl-2">
                                    {t.points.map((p: string, pi: number) => <li key={pi}>{p}</li>)}
                                  </ul>
                                </div>
                              )}
                              {t.decisions?.length > 0 && (
                                <div>
                                  <p className="font-bold text-xs uppercase text-slate-500">Decisiones:</p>
                                  <ul className="list-disc list-inside pl-2">
                                    {t.decisions.map((d: string, di: number) => <li key={di}>{d}</li>)}
                                  </ul>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {aiData.agreements?.length > 0 && (
                    <div className="mb-8">
                      <h4 className="font-bold text-blue-600 mb-2">ACUERDOS:</h4>
                      <table className="w-full border-collapse text-sm">
                        <thead>
                          <tr className="bg-blue-600 text-white">
                            <th className="border border-blue-700 p-2 text-left">Acción</th>
                            <th className="border border-blue-700 p-2 text-left">Responsable</th>
                            <th className="border border-blue-700 p-2 text-left">Fecha</th>
                          </tr>
                        </thead>
                        <tbody>
                          {aiData.agreements.map((a: any, i: number) => (
                            <tr key={i}>
                              <td className="border border-slate-200 p-2">{a.action}</td>
                              <td className="border border-slate-200 p-2">{a.responsible}</td>
                              <td className="border border-slate-200 p-2">{a.commitment_date}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {aiData.pending_topics?.length > 0 && (
                    <div>
                      <h4 className="font-bold text-blue-600 mb-2">TEMAS PENDIENTES:</h4>
                      <ul className="text-sm list-disc list-inside text-slate-700">
                        {aiData.pending_topics.map((t: string, i: number) => <li key={i}>{t}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                <button onClick={() => setShowPreview(false)} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                  Cerrar Vista Previa
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    )}
    </div>
  );
}
