export const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

export const formatDate = (dateStr) =>
  new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(dateStr));

export const formatDateTime = (dateStr) =>
  new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(dateStr));

export const statusColor = (status) => {
  const map = {
    PLACED: 'bg-blue-100 text-blue-700',
    ASSIGNED: 'bg-yellow-100 text-yellow-700',
    ACCEPTED: 'bg-orange-100 text-orange-700',
    DISPATCHED: 'bg-purple-100 text-purple-700',
    DELIVERED: 'bg-green-100 text-green-700',
    PENDING: 'bg-gray-100 text-gray-700',
    SENT: 'bg-green-100 text-green-700',
    CLOSED: 'bg-gray-100 text-gray-500',
  };
  return map[status] || 'bg-gray-100 text-gray-700';
};

export const statusLabel = (status) => {
  const map = {
    PLACED: 'Order Placed',
    ASSIGNED: 'Assigned to Supplier',
    ACCEPTED: 'Accepted by Supplier',
    DISPATCHED: 'Dispatched',
    DELIVERED: 'Delivered',
    PENDING: 'Pending',
    SENT: 'Sample Sent',
    CLOSED: 'Closed',
  };
  return map[status] || status;
};
