import React, { useState, useEffect } from "react";
import { Users, Plus, Edit2, Trash2, RefreshCw, Search } from "lucide-react";

interface Client {
  id: number;
  name: string;
  code: string;
  created_at: string;
}

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({ name: "", code: "" });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/clients");
      const data = await res.json();
      setClients(data);
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingClient ? `/api/clients/${editingClient.id}` : "/api/clients";
    const method = editingClient ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        fetchClients();
        closeModal();
      } else {
        const data = await res.json();
        alert(data.error || "Error al guardar el cliente");
      }
    } catch (error) {
      console.error("Error saving client:", error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar este cliente?")) return;

    try {
      const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchClients();
      }
    } catch (error) {
      console.error("Error deleting client:", error);
    }
  };

  const openModal = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setFormData({ name: client.name, code: client.code });
    } else {
      setEditingClient(null);
      setFormData({ name: "", code: "" });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingClient(null);
    setFormData({ name: "", code: "" });
  };

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Clientes</h1>
          <p className="text-slate-500 mt-1">Gestiona el listado de clientes y sus códigos.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          Nuevo Cliente
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por nombre o código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
            />
          </div>
          {loading && <RefreshCw className="animate-spin text-slate-400" size={20} />}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Código</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Fecha Registro</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.length > 0 ? (
                filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                        {client.code}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-700">{client.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(client.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => openModal(client)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(client.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    {loading ? "Cargando clientes..." : "No se encontraron clientes."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">
                {editingClient ? "Editar Cliente" : "Nuevo Cliente"}
              </h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                <Plus className="rotate-45" size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del Cliente</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  placeholder="Ej: Corporación ABC"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Código de Cliente</label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-mono"
                  placeholder="Ej: ABC"
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                >
                  {editingClient ? "Actualizar" : "Crear Cliente"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
