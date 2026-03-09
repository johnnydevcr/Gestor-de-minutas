import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function Layout() {
  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 overflow-y-auto h-screen">
        <Outlet />
      </main>
    </div>
  );
}
