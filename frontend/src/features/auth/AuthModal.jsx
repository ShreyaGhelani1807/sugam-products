import { useState } from 'react';
import { Modal } from '../../components/ui/modal';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';
import { useAuth } from '../../hooks/useAuth';
import { toast } from '../../components/ui/toast';
import { useNavigate } from 'react-router-dom';

export default function AuthModal({ open, onClose }) {
  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = mode === 'login' ? await login(form.email, form.password) : await register(form);
      toast(`Welcome, ${data.user.name}!`);
      onClose();
      if (data.user.role === 'admin') navigate('/admin');
      else if (data.user.role === 'supplier') navigate('/supplier');
    } catch (err) {
      toast(err.response?.data?.message || 'Authentication failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={mode === 'login' ? 'Sign In' : 'Create Account'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'register' && (
          <div className="space-y-1">
            <Label>Full Name</Label>
            <Input name="name" value={form.name} onChange={handleChange} placeholder="Your full name" required />
          </div>
        )}
        <div className="space-y-1">
          <Label>Email</Label>
          <Input type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@example.com" required />
        </div>
        {mode === 'register' && (
          <div className="space-y-1">
            <Label>Phone</Label>
            <Input name="phone" value={form.phone} onChange={handleChange} placeholder="+91 98765 43210" required />
          </div>
        )}
        <div className="space-y-1">
          <Label>Password</Label>
          <Input type="password" name="password" value={form.password} onChange={handleChange} placeholder="••••••••" required />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
        </Button>
      </form>
      <p className="text-center text-sm text-gray-500 mt-4">
        {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
        <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="text-orange-500 font-medium hover:underline">
          {mode === 'login' ? 'Register' : 'Sign In'}
        </button>
      </p>
    </Modal>
  );
}
