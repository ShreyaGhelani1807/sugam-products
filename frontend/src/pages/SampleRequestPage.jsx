import { useState } from 'react';
import { useProducts } from '../hooks/useProducts';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { toast } from '../components/ui/toast';
import { FlaskConical, CheckCircle } from 'lucide-react';
import api from '../lib/api';

export default function SampleRequestPage() {
  const { data: products } = useProducts();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    customerName: '', email: '', phone: '', productId: '', quantity: 1,
    address: { line1: '', city: '', state: '', pincode: '' },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('addr_')) {
      const key = name.replace('addr_', '');
      setForm((f) => ({ ...f, address: { ...f.address, [key]: value } }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/samples', form);
      setSubmitted(true);
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to submit. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) return (
    <div className="max-w-lg mx-auto px-4 py-32 text-center">
      <CheckCircle className="text-green-500 mx-auto mb-4" size={64} />
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Submitted!</h2>
      <p className="text-gray-500">Our team will review your request and dispatch the sample within 2–3 business days.</p>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16">
      <div className="text-center mb-10">
        <FlaskConical className="text-orange-500 mx-auto mb-3" size={40} />
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Request a Free Sample</h1>
        <p className="text-gray-500">Try before you buy. We'll send a sample to your address.</p>
      </div>
      <div className="bg-white border rounded-2xl p-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1"><Label>Full Name</Label><Input name="customerName" value={form.customerName} onChange={handleChange} placeholder="Your name" required /></div>
            <div className="space-y-1"><Label>Phone</Label><Input name="phone" value={form.phone} onChange={handleChange} placeholder="+91 98765 43210" required /></div>
          </div>
          <div className="space-y-1"><Label>Email</Label><Input type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@company.com" required /></div>
          <div className="space-y-1">
            <Label>Product</Label>
            <Select name="productId" value={form.productId} onChange={handleChange} required>
              <option value="">{products?.length ? 'Select a product' : 'No products available'}</option>
              {(products || []).map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-1"><Label>Quantity (kg)</Label><Input type="number" name="quantity" value={form.quantity} onChange={handleChange} min={1} max={5} required /></div>
          <div className="border-t pt-4 mt-2">
            <h3 className="font-medium text-gray-900 mb-3">Shipping Address</h3>
            <div className="space-y-3">
              <div className="space-y-1"><Label>Address Line</Label><Input name="addr_line1" value={form.address.line1} onChange={handleChange} placeholder="House/Plot No., Street, Area" required /></div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1"><Label>City</Label><Input name="addr_city" value={form.address.city} onChange={handleChange} placeholder="City" required /></div>
                <div className="space-y-1"><Label>State</Label><Input name="addr_state" value={form.address.state} onChange={handleChange} placeholder="State" required /></div>
                <div className="space-y-1"><Label>Pincode</Label><Input name="addr_pincode" value={form.address.pincode} onChange={handleChange} placeholder="400001" required /></div>
              </div>
            </div>
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Sample Request'}
          </Button>
        </form>
      </div>
    </div>
  );
}
