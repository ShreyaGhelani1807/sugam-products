import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select } from '../components/ui/select';
import { Modal } from '../components/ui/modal';
import { toast } from '../components/ui/toast';
import { Spinner } from '../components/ui/spinner';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

const EMPTY = { name: '', slug: '', description: '', category: 'Liquid Essence', price: '', unit: 'kg', isActive: true };

export default function AdminProductsPage() {
  const qc = useQueryClient();
  const { data: products, isLoading } = useQuery({ queryKey: ['admin-products'], queryFn: () => api.get('/api/admin/products').then(r => r.data) });
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [imageFile, setImageFile] = useState(null);

  const saveMutation = useMutation({
    mutationFn: (fd) => editing ? api.patch(`/api/admin/products/${editing.id}`, fd) : api.post('/api/admin/products', fd),
    onSuccess: () => { qc.invalidateQueries(['admin-products']); setModal(false); toast(editing ? 'Product updated' : 'Product created'); },
    onError: (e) => toast(e.response?.data?.error || 'Failed to save', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/api/admin/products/${id}`),
    onSuccess: () => { qc.invalidateQueries(['admin-products']); toast('Product deleted'); },
  });

  const openCreate = () => { setEditing(null); setForm(EMPTY); setImageFile(null); setModal(true); };
  const openEdit = (p) => { setEditing(p); setForm({ ...p, price: String(p.price) }); setImageFile(null); setModal(true); };

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (imageFile) fd.append('image', imageFile);
    saveMutation.mutate(fd);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <Button onClick={openCreate} className="gap-2"><Plus size={16} />Add Product</Button>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['Product', 'Category', 'Price', 'Status', 'Actions'].map((h) => (
                <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? <tr><td colSpan={5} className="text-center py-12"><Spinner className="mx-auto" /></td></tr>
              : products?.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center overflow-hidden">
                        {p.imageUrl ? <img src={p.imageUrl} className="w-full h-full object-cover" alt={p.name} /> : <span>🍊</span>}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{p.name}</div>
                        <div className="text-xs text-gray-400">{p.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{p.category}</td>
                  <td className="px-4 py-3 font-semibold">{formatCurrency(p.price)}/{p.unit}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{p.isActive ? 'Active' : 'Inactive'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(p)} className="p-1.5 text-gray-400 hover:text-orange-500"><Pencil size={14} /></button>
                      <button onClick={() => { if (confirm('Delete?')) deleteMutation.mutate(p.id); }} className="p-1.5 text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Product' : 'Add Product'} className="max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1 col-span-2"><Label>Name</Label><Input name="name" value={form.name} onChange={handleChange} required /></div>
            <div className="space-y-1 col-span-2"><Label>Slug</Label><Input name="slug" value={form.slug} onChange={handleChange} required /></div>
            <div className="space-y-1 col-span-2"><Label>Description</Label><Textarea name="description" value={form.description} onChange={handleChange} rows={3} /></div>
            <div className="space-y-1">
              <Label>Category</Label>
              <Select name="category" value={form.category} onChange={handleChange}>
                {['Liquid Essence', 'Powder Essence', 'Cola Base', 'Cold Drink Syrup'].map((c) => <option key={c}>{c}</option>)}
              </Select>
            </div>
            <div className="space-y-1"><Label>Unit</Label><Input name="unit" value={form.unit} onChange={handleChange} /></div>
            <div className="space-y-1"><Label>Price (₹)</Label><Input type="number" name="price" value={form.price} onChange={handleChange} required /></div>
            <div className="space-y-1"><Label>Image</Label><input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} className="text-sm" /></div>
          </div>
          <Button type="submit" className="w-full" disabled={saveMutation.isPending}>{saveMutation.isPending ? 'Saving...' : 'Save Product'}</Button>
        </form>
      </Modal>
    </div>
  );
}
