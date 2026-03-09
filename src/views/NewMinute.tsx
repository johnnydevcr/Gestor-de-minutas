import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Play, Download, RefreshCw, X, Plus, ClipboardList } from "lucide-react";
import { parseMinuteText } from "../services/parser";
import { generateWordDocument } from "../services/word";

export default function NewMinute() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    transcript: "",
    clientId: "",
  });

  const [aiData, setAiData] = useState<any>(null);
  const [newAttendee, setNewAttendee] = useState("");
  const [newAbsentee, setNewAbsentee] = useState("");

  useEffect(() => {
    fetch("/api/clients")
      .then((res) => res.json())
      .then((data) => setClients(data));
  }, []);

  const handleAnalyze = async () => {
    if (!formData.transcript.trim()) {
      alert("Por favor ingresa la información de la minuta.");
      return;
    }
    if (!formData.clientId) {
      alert("Por favor selecciona un cliente.");
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

  const handleSaveAndDownload = async () => {
    setLoading(true);
    try {
      // 1. Save to DB
      const payload = {
        ...aiData,
        transcript: formData.transcript,
      };

      const res = await fetch("/api/minutes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Error saving minute");

      // 2. Generate Word (templateBuffer is no longer used but kept for compatibility)
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
          <span className={step >= 1 ? "text-indigo-600" : ""}>
            1. Información y Cliente
          </span>
          <span>&gt;</span>
          <span className={step >= 2 ? "text-indigo-600" : ""}>
            2. Revisión
          </span>
        </div>
      </div>

      {step === 1 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-6">
          <h2 className="text-xl font-semibold text-slate-800 border-b border-slate-100 pb-4">
            Información de la Minuta
          </h2>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Seleccionar Cliente
            </label>
            <select
              value={formData.clientId}
              onChange={(e) =>
                setFormData({ ...formData, clientId: e.target.value })
              }
              className="w-full rounded-lg border-slate-300 border p-3 focus:ring-indigo-500 focus:border-indigo-500"
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
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
              <ClipboardList size={18} />
              Pegar Información de la Minuta
            </label>
            <textarea
              value={formData.transcript}
              onChange={(e) =>
                setFormData({ ...formData, transcript: e.target.value })
              }
              rows={12}
              placeholder="Pega aquí la información estructurada (Fecha, Hora, Objetivo, Temas, etc...)"
              className="w-full rounded-lg border-slate-300 border p-4 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
            />
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-end">
            <button
              onClick={handleAnalyze}
              disabled={loading || !formData.transcript.trim()}
              className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50"
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
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-8">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <h2 className="text-xl font-semibold text-slate-800">
              Revisión de Contenido Generado
            </h2>
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
              Guardar y Descargar Word
            </button>
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
                  className="w-full rounded-lg border-slate-300 border p-2.5 focus:ring-indigo-500 focus:border-indigo-500"
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
                  className="w-full rounded-lg border-slate-300 border p-2.5 focus:ring-indigo-500 focus:border-indigo-500"
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
                    className="flex-1 rounded-lg border-slate-300 border p-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
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
                      className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm flex items-center gap-1"
                    >
                      {a}{" "}
                      <button
                        onClick={() => removeAttendee(a)}
                        className="hover:text-indigo-900"
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
                    className="flex-1 rounded-lg border-slate-300 border p-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
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
                      className="w-full font-semibold bg-transparent border-b border-slate-300 focus:border-indigo-500 focus:ring-0 px-0 py-1"
                    />
                    <textarea
                      value={topic.description || ""}
                      onChange={(e) => {
                        const newTopics = [...aiData.topics];
                        newTopics[idx].description = e.target.value;
                        setAiData({ ...aiData, topics: newTopics });
                      }}
                      rows={2}
                      className="w-full rounded-lg border-slate-300 border p-2 text-sm"
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs font-medium text-slate-500 uppercase">
                          Puntos Importantes
                        </span>
                        <textarea
                          value={(topic.points || []).join("\n")}
                          onChange={(e) => {
                            const newTopics = [...aiData.topics];
                            newTopics[idx].points = e.target.value.split("\n");
                            setAiData({ ...aiData, topics: newTopics });
                          }}
                          rows={3}
                          className="w-full rounded-lg border-slate-300 border p-2 text-sm mt-1"
                        />
                      </div>
                      <div>
                        <span className="text-xs font-medium text-slate-500 uppercase">
                          Decisiones
                        </span>
                        <textarea
                          value={(topic.decisions || []).join("\n")}
                          onChange={(e) => {
                            const newTopics = [...aiData.topics];
                            newTopics[idx].decisions =
                              e.target.value.split("\n");
                            setAiData({ ...aiData, topics: newTopics });
                          }}
                          rows={3}
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
      )}
    </div>
  );
}
