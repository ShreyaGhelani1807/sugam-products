import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { formatDate, statusColor, statusLabel } from '../utils/formatters';
import { Spinner } from '../components/ui/spinner';
import { Button } from '../components/ui/button';
import { toast } from '../components/ui/toast';

export default function AdminSamplesPage() {
  const qc = useQueryClient();
  const { data: samples, isLoading } = useQuery({ queryKey: ['admin-samples'], queryFn: () => api.get('/api/admin/sample-requests').then(r => r.data) });
  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/api/admin/sample-requests/${id}`, { status }),
    onSuccess: () => { qc.invalidateQueries(['admin-samples']); toast('Updated'); },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Sample Requests</h1>
      <div className="bg-white border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>{['Customer', 'Product', 'Qty', 'City', 'Status', 'Date', 'Actions'].map((h) => <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? <tr><td colSpan={7} className="text-center py-12"><Spinner className="mx-auto" /></td></tr>
              : samples?.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{s.customerName}</div>
                    <div className="text-xs text-gray-400">{s.email}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{s.product?.name}</td>
                  <td className="px-4 py-3">{s.quantity} kg</td>
                  <td className="px-4 py-3 text-gray-500">{s.address?.city}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(s.status)}`}>{statusLabel(s.status)}</span></td>
                  <td className="px-4 py-3 text-gray-400">{formatDate(s.createdAt)}</td>
                  <td className="px-4 py-3">
                    {s.status === 'PENDING' && (
                      <Button size="sm" variant="outline" onClick={() => updateMutation.mutate({ id: s.id, status: 'SENT' })}>Mark Sent</Button>
                    )}
                    {s.status === 'SENT' && (
                      <Button size="sm" variant="ghost" onClick={() => updateMutation.mutate({ id: s.id, status: 'CLOSED' })}>Close</Button>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
