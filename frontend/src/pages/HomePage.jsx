import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Globe, Award, Truck, ChevronRight, Star } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useProducts } from '../hooks/useProducts';
import { formatCurrency } from '../utils/formatters';

const USPs = [
  { icon: Zap, title: 'Instant Mixing', desc: 'Pre-measured formulations for quick and consistent beverage preparation' },
  { icon: Globe, title: 'Global Supply', desc: 'Supplying flavour essences to manufacturers across India and 20+ countries' },
  { icon: Award, title: 'Premium Quality', desc: 'ISO-certified production facility with strict quality control processes' },
  { icon: Truck, title: 'Fast Dispatch', desc: 'Same-day dispatch for orders placed before 2 PM with nationwide logistics' },
];

const testimonials = [
  { name: 'Rajesh Sharma', company: 'Sharma Beverages, Delhi', text: 'The mango essence is superb — consistent batch after batch. Our customers love the taste.', rating: 5 },
  { name: 'Priya Patel', company: 'Cool Drinks Ltd., Ahmedabad', text: 'We switched from a competitor 2 years ago and never looked back. Quality and pricing are unmatched.', rating: 5 },
  { name: 'Mohammed Faiz', company: 'Star Soda Works, Mumbai', text: 'Excellent product range. The mixing instructions are clear and the results are perfect every time.', rating: 5 },
];

export default function HomePage() {
  const { data: products } = useProducts({ limit: 6 });

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-orange-50 via-amber-50 to-white py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <span className="inline-block bg-orange-100 text-orange-700 text-xs font-semibold px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
            B2B Flavour Essences Supplier
          </span>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Premium Flavouring Agents<br />
            <span className="text-orange-500">for Soft Drink Makers</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Powdered and liquid essences trusted by beverage manufacturers across India. Order online, get assigned to your nearest supplier, and track every step.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/products">
              <Button size="lg" className="gap-2 text-base px-8">Browse Products <ArrowRight size={18} /></Button>
            </Link>
            <Link to="/request-sample">
              <Button size="lg" variant="outline" className="gap-2 text-base px-8">Request Free Sample</Button>
            </Link>
          </div>
          <p className="mt-6 text-sm text-gray-400">Trusted by 500+ manufacturers across India</p>
        </div>
      </section>

      {/* USPs */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {USPs.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="text-center p-6 rounded-xl border border-orange-100 hover:border-orange-300 hover:shadow-sm transition-all">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Icon className="text-orange-500" size={24} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Our Products</h2>
              <p className="text-gray-500 mt-1">Premium flavour essences for every beverage</p>
            </div>
            <Link to="/products" className="flex items-center gap-1 text-orange-500 hover:text-orange-600 font-medium text-sm">
              View All <ChevronRight size={16} />
            </Link>
          </div>
          {products?.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.slice(0, 6).map((p) => (
                <Link key={p.id} to={`/products/${p.slug}`}
                  className="bg-white rounded-xl border overflow-hidden hover:shadow-md transition-shadow group">
                  <div className="h-48 bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center overflow-hidden">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                    ) : (
                      <div className="text-5xl">🍊</div>
                    )}
                  </div>
                  <div className="p-5">
                    <span className="text-xs font-medium text-orange-500 uppercase tracking-wide">{p.category}</span>
                    <h3 className="font-semibold text-gray-900 mt-1 group-hover:text-orange-500 transition-colors">{p.name}</h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{p.description}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="font-bold text-orange-500">{formatCurrency(p.price)}<span className="text-xs font-normal text-gray-400">/{p.unit}</span></span>
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">View Details →</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400 bg-white rounded-xl border">
              <div className="text-5xl mb-4">📦</div>
              <p className="text-lg font-medium text-gray-600">Our catalogue is coming soon</p>
              <p className="text-sm mt-1">Products will appear here once they're added.</p>
            </div>
          )}
        </div>
      </section>

      {/* Stats Banner */}
      <section className="py-14 bg-orange-500 text-white px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[['500+', 'Happy Clients'], ['20+', 'Countries Served'], ['50+', 'Flavour Variants'], ['10+', 'Years Experience']].map(([num, label]) => (
              <div key={label}>
                <div className="text-4xl font-bold">{num}</div>
                <div className="text-orange-100 text-sm mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-2">What Our Clients Say</h2>
          <p className="text-gray-500 text-center mb-10">Trusted by beverage manufacturers across India</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map(({ name, company, text, rating }) => (
              <div key={name} className="bg-gray-50 rounded-xl p-6 border">
                <div className="flex gap-0.5 mb-3">
                  {[...Array(rating)].map((_, i) => <Star key={i} size={16} className="fill-orange-400 text-orange-400" />)}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-4">"{text}"</p>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">{name}</div>
                  <div className="text-gray-400 text-xs">{company}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Order?</h2>
          <p className="text-orange-100 mb-8 text-lg">Browse our full catalogue and place your order online. Get automatically assigned to the nearest supplier in your city.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/products">
              <Button size="lg" className="bg-white text-orange-600 hover:bg-orange-50 gap-2">Shop Now <ArrowRight size={18} /></Button>
            </Link>
            <Link to="/contact">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-orange-600">Contact Us</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
