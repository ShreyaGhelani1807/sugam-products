import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { LayoutDashboard, ShoppingCart, LogOut } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Toaster } from '../ui/toast';

export default function SupplierLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-60 bg-gray-900 text-white min-h-screen flex flex-col">
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-lg font-bold text-orange-400">Supplier Portal</h1>
          <p className="text-xs text-gray-400 mt-1">{user?.name}</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {[
            { to: '/supplier', label: 'Dashboard', icon: LayoutDashboard, end: true },
            { to: '/supplier/orders', label: 'Orders', icon: ShoppingCart },
          ].map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) => cn('flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm', isActive ? 'bg-orange-500 text-white' : 'text-gray-300 hover:bg-gray-800')}>
              <Icon size={18} />{label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-700">
          <button onClick={() => { logout(); navigate('/'); }} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white w-full px-3 py-2">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 p-6"><Outlet /></main>
      <Toaster />
    </div>
  );
}
