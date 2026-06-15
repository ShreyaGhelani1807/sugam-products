import { useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import { formatCurrency } from '../utils/formatters';
import { Input } from '../components/ui/input';
import { Spinner } from '../components/ui/spinner';

const categories = ['All', 'Liquid Essence', 'Powder Essence', 'Cold Drink Syrup', 'Cola Base'];

export default function ProductsPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [searchInput, setSearchInput] = useState('');

  const params = {};
  if (search) params.search = search;
  if (category !== 'All') params.category = category;

  const { data: products, isLoading, isError } = useProducts(params);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Our Products</h1>
        <p className="text-gray-500 mt-1">Premium flavouring agents and essences for beverage manufacturers</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <Input
            placeholder="Search products..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && setSearch(searchInput)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${category === cat ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'}`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner className="h-10 w-10" /></div>
      ) : isError ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-4">⚠️</div>
          <p className="text-lg font-medium">Couldn't load products</p>
          <p className="text-sm mt-1">Please check your connection and try again.</p>
        </div>
      ) : !products?.length ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-4">🔍</div>
          <p className="text-lg font-medium">No products found</p>
          <p className="text-sm mt-1">Try a different search term or category</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((p) => (
            <Link key={p.id || p.slug} to={`/products/${p.slug}`}
              className="bg-white rounded-xl border overflow-hidden hover:shadow-md transition-all group">
              <div className="h-44 bg-gradient-to-br from-orange-50 to-amber-50 overflow-hidden flex items-center justify-center">
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt={p.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <span className="text-4xl">{p.emoji || '🍊'}</span>
                )}
              </div>
              <div className="p-4">
                <span className="text-xs text-orange-500 font-medium uppercase tracking-wide">{p.category}</span>
                <h3 className="font-semibold text-gray-900 mt-0.5 text-sm group-hover:text-orange-500 transition-colors">{p.name}</h3>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{p.description}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="font-bold text-orange-500 text-sm">{formatCurrency(p.price)}<span className="text-xs font-normal text-gray-400">/{p.unit || 'kg'}</span></span>
                  <span className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded font-medium">Add to Cart</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
