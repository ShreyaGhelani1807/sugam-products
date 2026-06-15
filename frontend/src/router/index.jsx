import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

// Public pages
import HomePage from '../pages/HomePage';
import ProductsPage from '../pages/ProductsPage';
import ProductDetailPage from '../pages/ProductDetailPage';
import CartPage from '../pages/CartPage';
import CheckoutPage from '../pages/CheckoutPage';
import OrderSuccessPage from '../pages/OrderSuccessPage';
import SampleRequestPage from '../pages/SampleRequestPage';
import AboutPage from '../pages/AboutPage';
import ContactPage from '../pages/ContactPage';

// Customer portal
import CustomerPortalPage from '../pages/CustomerPortalPage';
import CustomerOrderDetailPage from '../pages/CustomerOrderDetailPage';

// Supplier portal
import SupplierDashboardPage from '../pages/SupplierDashboardPage';
import SupplierOrderDetailPage from '../pages/SupplierOrderDetailPage';

// Admin
import AdminDashboardPage from '../pages/AdminDashboardPage';
import AdminOrdersPage from '../pages/AdminOrdersPage';
import AdminProductsPage from '../pages/AdminProductsPage';
import AdminSuppliersPage from '../pages/AdminSuppliersPage';
import AdminCustomersPage from '../pages/AdminCustomersPage';
import AdminSamplesPage from '../pages/AdminSamplesPage';
import AdminAnalyticsPage from '../pages/AdminAnalyticsPage';

// Layout
import PublicLayout from '../components/layouts/PublicLayout';
import AdminLayout from '../components/layouts/AdminLayout';
import SupplierLayout from '../components/layouts/SupplierLayout';

function ProtectedRoute({ children, role }) {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'products', element: <ProductsPage /> },
      { path: 'products/:slug', element: <ProductDetailPage /> },
      { path: 'cart', element: <CartPage /> },
      { path: 'checkout', element: <CheckoutPage /> },
      { path: 'order-success', element: <OrderSuccessPage /> },
      { path: 'request-sample', element: <SampleRequestPage /> },
      { path: 'about', element: <AboutPage /> },
      { path: 'contact', element: <ContactPage /> },
      {
        path: 'portal',
        element: <ProtectedRoute role="customer"><CustomerPortalPage /></ProtectedRoute>,
      },
      {
        path: 'portal/orders/:id',
        element: <ProtectedRoute role="customer"><CustomerOrderDetailPage /></ProtectedRoute>,
      },
    ],
  },
  {
    path: '/supplier',
    element: <ProtectedRoute role="supplier"><SupplierLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <SupplierDashboardPage /> },
      { path: 'orders/:id', element: <SupplierOrderDetailPage /> },
    ],
  },
  {
    path: '/admin',
    element: <ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <AdminDashboardPage /> },
      { path: 'orders', element: <AdminOrdersPage /> },
      { path: 'products', element: <AdminProductsPage /> },
      { path: 'suppliers', element: <AdminSuppliersPage /> },
      { path: 'customers', element: <AdminCustomersPage /> },
      { path: 'samples', element: <AdminSamplesPage /> },
      { path: 'analytics', element: <AdminAnalyticsPage /> },
    ],
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
