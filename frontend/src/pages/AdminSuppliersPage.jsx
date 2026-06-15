import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Modal } from '../components/ui/modal';
import { toast } from '../components/ui/toast';
import { Spinner } from '../components/ui/spinner';
import { Plus, Pencil, MapPin, Trash2 } from 'lucide-react';

const EMPTY = { businessName: '', contactName: '', phone: '', email: '', gstin: '', password: '' };

export default function AdminSuppliersPage() {
  const qc = useQueryClient();
  const { data: suppliers, isLoading } = useQuery({ queryKey: ['admin-suppliers'], queryFn: () => api.get('/api/admin/suppliers').then(r => r.data) });
  const [modal, setModal] = useState(false);
  const [coverageModal, setCoverageModal] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [coverage, setCoverage] = useState({ city: '', pincode: '', state: '' });

  const saveMutation = useMutation({
    mutationFn: (data) => editing ? api.patch(`/api/admin/suppliers/${editing.id}`, data) : api.post('/api/admin/suppliers', data),
    onSuccess: () => { qc.invalidateQueries(['admin-suppliers']); setModal(false); toast('Saved'); },
    onError: (e) => toast(e.response?.data?.error || 'Failed', 'error'),
  });

  const addCoverage = useMutation({
    mutationFn: (data) => api.post(`/api/admin/suppliers/${coverageModal.id}/coverage`, data),
    onSuccess: () => { qc.invalidateQueries(['admin-suppliers']); toast('Coverage area added'); setCoverage({ city: '', pincode: '', state: '' }); },
  });

  const removeCoverage = useMutation({
    mutationFn: ({ supId, covId }) => api.delete(`/api/admin/suppliers/${supId}/coverage/${covId}`),
    onSuccess: () => { qc.invalidateQueries(['admin-suppliers']); toast('Removed'); },
  });

  const openCreate = () => { setEditing(null); setForm(EMPTY); setModal(true); };
  const openEdit = (s) => { setEditing(s); setForm({ businessName: s.businessName, contactName: s.contactName, phone: s.phone, email: s.email, gstin: s.gstin || '', password: '' }); setModal(true); };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
        <Button onClick={openCreate} className="gap-2"><Plus size={16} />Add Supplier</Button>
      </div>

      {isLoading ? <div className="flex justify-center py-16"><Spinner /></div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {suppliers?.map((s) => (
            <div key={s.id} className="bg-white border rounded-xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{s.businessName}</h3>
                  <p className="text-sm text-gray-500">{s.contactName} · {s.phone}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(s)} className="p-1.5 text-gray-400 hover:text-orange-500"><Pencil size={14} /></button>
                  <button onClick={() => setCoverageModal(s)} className="p-1.5 text-gray-400 hover:text-blue-500"><MapPin size={14} /></button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {s.coverage?.map((c) => (
                  <span key={c.id} className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded">{c.city}{c.pincode ? ` (${c.pincode})` : ''}</span>
                ))}
                {!s.coverage?.length && <span className="text-xs text-gray-400">No coverage areas</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Supplier' : 'Add Supplier'}>
        <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(form); }} className="space-y-3">
          {[['businessName', 'Business Name'], ['contactName', 'Contact Name'], ['phone', 'Phone'], ['email', 'Email'], ['gstin', 'GSTIN (optional)']].map(([n, l]) => (
            <div key={n} className="space-y-1"><Label>{l}</Label><Input name={n} value={form[n]} onChange={(e) => setForm(f => ({ ...f, [n]: e.target.value }))} required={n !== 'gstin'} /></div>
          ))}
          {!editing && <div className="space-y-1"><Label>Password</Label><Input type="password" name="password" value={form.password} onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))} required /></div>}
          <Button type="submit" className="w-full" disabled={saveMutation.isPending}>{saveMutation.isPending ? 'Saving...' : 'Save'}</Button>
        </form>
      </Modal>

      <Modal open={!!coverageModal} onClose={() => setCoverageModal(null)} title={`Coverage — ${coverageModal?.businessName}`} className="max-w-lg">
        {coverageModal && (
          <div>
            <div className="space-y-2 mb-6">
              {coverageModal.coverage?.map((c) => (
                <div key={c.id} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg">
                  <span className="text-sm">{c.city}, {c.state} {c.pincode ? `— ${c.pincode}` : ''}</span>
                  <button onClick={() => removeCoverage.mutate({ supId: coverageModal.id, covId: c.id })} className="text-gray-300 hover:text-red-500"><Trash2 size={13} /></button>
                </div>
              ))}
              {!coverageModal.coverage?.length && <p className="text-sm text-gray-400">No areas assigned yet.</p>}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); addCoverage.mutate(coverage); }} className="space-y-3 border-t pt-4">
              <h3 className="font-medium text-sm">Add Coverage Area</h3>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1"><Label className="text-xs">City</Label><Input value={coverage.city} onChange={(e) => setCoverage(c => ({ ...c, city: e.target.value }))} placeholder="City" required /></div>
                <div className="space-y-1"><Label className="text-xs">State</Label><Input value={coverage.state} onChange={(e) => setCoverage(c => ({ ...c, state: e.target.value }))} placeholder="State" required /></div>
                <div className="space-y-1"><Label className="text-xs">Pincode</Label><Input value={coverage.pincode} onChange={(e) => setCoverage(c => ({ ...c, pincode: e.target.value }))} placeholder="Optional" /></div>
              </div>
              <Button type="submit" className="w-full" size="sm" disabled={addCoverage.isPending}>Add Area</Button>
            </form>
          </div>
        )}
      </Modal>
    </div>
  );
}
