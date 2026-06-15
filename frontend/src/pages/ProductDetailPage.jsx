import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProduct } from '../hooks/useProducts';
import { useCart } from '../hooks/useCart';
import { formatCurrency } from '../utils/formatters';
import { Button } from '../components/ui/button';
import { Spinner } from '../components/ui/spinner';
import { toast } from '../components/ui/toast';
import { ShoppingCart, Download, ArrowLeft, Plus, Minus, CheckCircle } from 'lucide-react';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const { data: product, isLoading, isError } = useProduct(slug);
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const handleAddToCart = () => {
    if (!product) return;
    addItem({ id: product.id, name: product.name, price: product.price, unit: product.unit || 'kg', slug: product.slug, imageUrl: product.imageUrl }, qty);
    setAdded(true);
    toast(`${product.name} added to cart!`);
    setTimeout(() => setAdded(false), 2000);
  };

  if (isLoading) return <div className="flex justify-center py-32"><Spinner className="h-12 w-12" /></div>;

  if (isError || !product) return (
    <div className="max-w-lg mx-auto px-4 py-32 text-center">
      <div className="text-6xl mb-4">🔍</div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Product not available</h2>
      <p className="text-gray-500 mb-6">This product may have been removed or is no longer in stock.</p>
      <Link to="/products">
        <Button className="gap-2"><ArrowLeft size={16} /> Back to Products</Button>
      </Link>
    </div>
  );

  const p = product;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link to="/products" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-orange-500 mb-8">
        <ArrowLeft size={16} /> Back to Products
      </Link>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Image */}
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl overflow-hidden h-80 lg:h-full flex items-center justify-center min-h-64">
          {p.imageUrl ? (
            <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-8xl">🍊</span>
          )}
        </div>

        {/* Info */}
        <div>
          <span className="text-xs font-semibold text-orange-500 uppercase tracking-wider bg-orange-50 px-3 py-1 rounded-full">{p.category}</span>
          <h1 className="text-3xl font-bold text-gray-900 mt-3 mb-2">{p.name}</h1>
          <div className="text-3xl font-bold text-orange-500 mb-4">
            {formatCurrency(p.price)} <span className="text-base font-normal text-gray-400">per {p.unit || 'kg'}</span>
          </div>
          <p className="text-gray-600 leading-relaxed mb-6">{p.description || 'Premium quality flavouring essence suitable for cold drink and soda manufacturing. Consistent taste, easy to mix.'}</p>

          {/* Mixing Instructions */}
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-5 mb-6">
            <h3 className="font-semibold text-orange-800 mb-3">Mixing Instructions</h3>
            <ul className="space-y-2 text-sm text-orange-700">
              <li>• Mix 2–3 ml of essence per litre of water</li>
              <li>• Add sugar syrup to taste (approx. 100g per litre)</li>
              <li>• For carbonated drinks: add chilled carbonated water</li>
              <li>• Store essence at room temperature away from direct sunlight</li>
            </ul>
            {p.mixingPdfUrl && (
              <a href={p.mixingPdfUrl} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-2 mt-3 text-sm text-orange-600 hover:text-orange-700 font-medium">
                <Download size={14} /> Download Full Mixing Guide (PDF)
              </a>
            )}
          </div>

          {/* Quantity & Cart */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center border rounded-lg">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-2 hover:bg-gray-50 rounded-l-lg"><Minus size={16} /></button>
              <span className="px-4 py-2 font-semibold min-w-[3rem] text-center">{qty}</span>
              <button onClick={() => setQty(qty + 1)} className="px-3 py-2 hover:bg-gray-50 rounded-r-lg"><Plus size={16} /></button>
            </div>
            <span className="text-gray-500 text-sm">{qty} {p.unit || 'kg'}</span>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleAddToCart} className="flex-1 gap-2" size="lg" disabled={added}>
              {added ? <><CheckCircle size={18} /> Added!</> : <><ShoppingCart size={18} /> Add to Cart</>}
            </Button>
            <Link to="/request-sample">
              <Button variant="outline" size="lg">Request Sample</Button>
            </Link>
          </div>

          {/* Tags */}
          <div className="flex gap-2 mt-6 flex-wrap">
            {['B2B Bulk Orders', 'ISO Certified', 'Pan India Delivery', 'COD Available'].map((tag) => (
              <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">{tag}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
