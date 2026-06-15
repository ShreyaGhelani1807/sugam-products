import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Menu, X, User, LogOut, LayoutDashboard } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '../hooks/useCart';
import { useAuthStore } from '../store/authStore';
import { Button } from './ui/button';
import { cn } from '../utils/cn';
import AuthModal from '../features/auth/AuthModal';

export default function Navbar() {
  const { count } = useCart();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); };
  const portalLink = user?.role === 'admin' ? '/admin' : user?.role === 'supplier' ? '/supplier' : '/portal';

  return (
    <>
      <nav className="sticky top-0 z-40 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">SP</span>
              </div>
              <span className="font-bold text-gray-900 text-lg">Sugam Products</span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              {[['/', 'Home'], ['/products', 'Products'], ['/about', 'About'], ['/contact', 'Contact']].map(([to, label]) => (
                <Link key={to} to={to} className="text-sm text-gray-600 hover:text-orange-500 font-medium transition-colors">{label}</Link>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <Link to="/cart" className="relative p-2 text-gray-600 hover:text-orange-500">
                <ShoppingCart size={22} />
                {count > 0 && <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">{count}</span>}
              </Link>
              {user ? (
                <div className="flex items-center gap-2">
                  <Link to={portalLink}>
                    <Button variant="outline" size="sm" className="hidden sm:flex gap-1.5">
                      <LayoutDashboard size={14} /> {user.role === 'admin' ? 'Admin' : user.role === 'supplier' ? 'Portal' : 'My Orders'}
                    </Button>
                  </Link>
                  <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-500"><LogOut size={18} /></button>
                </div>
              ) : (
                <Button size="sm" onClick={() => setAuthOpen(true)} className="hidden sm:flex">Sign In</Button>
              )}
              <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
                {menuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t bg-white px-4 py-4 space-y-3">
            {[['/', 'Home'], ['/products', 'Products'], ['/about', 'About'], ['/contact', 'Contact'], ['/request-sample', 'Request Sample']].map(([to, label]) => (
              <Link key={to} to={to} onClick={() => setMenuOpen(false)} className="block text-sm text-gray-700 py-1 hover:text-orange-500">{label}</Link>
            ))}
            {!user && <Button size="sm" className="w-full" onClick={() => { setMenuOpen(false); setAuthOpen(true); }}>Sign In</Button>}
            {user && <Link to={portalLink} onClick={() => setMenuOpen(false)} className="block text-sm text-gray-700 py-1 hover:text-orange-500">My Portal</Link>}
          </div>
        )}
      </nav>
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
