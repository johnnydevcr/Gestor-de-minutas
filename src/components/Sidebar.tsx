import { Link, useLocation } from "react-router-dom";
import { FileText, History, CheckSquare, File, Settings, LayoutDashboard, Users } from "lucide-react";
import { clsx } from "clsx";

export default function Sidebar() {
  const location = useLocation();

  const navItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "Nueva minuta", path: "/new", icon: FileText },
    { name: "Historial de minutas", path: "/history", icon: History },
    { name: "Seguimiento de acuerdos", path: "/agreements", icon: CheckSquare },
    { name: "Clientes", path: "/clients", icon: Users },
    { name: "Diseños", path: "/designs", icon: File },
    { name: "Configuración", path: "/settings", icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen fixed left-0 top-0">
      <div className="p-6">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <FileText className="text-indigo-500" />
          AI Meeting
        </h1>
        <p className="text-xs text-slate-500 mt-1">Intelligence</p>
      </div>
      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={clsx(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium",
                isActive
                  ? "bg-indigo-600 text-white"
                  : "hover:bg-slate-800 hover:text-white"
              )}
            >
              <Icon size={18} />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-slate-800 text-xs text-slate-500 text-center">
        &copy; 2026 AI Meeting Intelligence
      </div>
    </aside>
  );
}
