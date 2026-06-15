import { Link } from 'react-router-dom';
import { Award, Globe, Users, Factory } from 'lucide-react';
import { Button } from '../components/ui/button';

export default function AboutPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-orange-50 to-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">About Sugam Products</h1>
          <p className="text-xl text-gray-600 leading-relaxed">
            A decade of crafting premium flavouring agents trusted by beverage manufacturers across India and beyond.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-16 px-4 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Story</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Sugam Products Pvt. Ltd. was founded with a single mission: to provide soft drink manufacturers with consistent, high-quality flavouring essences at competitive prices. What started as a small operation supplying local beverage makers has grown into a company serving hundreds of clients across India and 20+ countries.
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              Our manufacturing facility uses state-of-the-art equipment and follows strict quality control protocols to ensure every batch meets the same high standards our customers have come to rely on.
            </p>
            <p className="text-gray-600 leading-relaxed">
              We specialise in both powdered and liquid flavouring agents — from classic cola bases to exotic fruit essences — each formulated for easy mixing and consistent results.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[['500+', 'Happy Clients', 'orange'], ['20+', 'Countries Served', 'blue'], ['50+', 'Flavour Variants', 'green'], ['10+', 'Years Experience', 'purple']].map(([num, label, color]) => (
              <div key={label} className={`p-6 rounded-xl bg-${color}-50 border border-${color}-100 text-center`}>
                <div className={`text-3xl font-bold text-${color}-600`}>{num}</div>
                <div className="text-sm text-gray-600 mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Manufacturing */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Our Manufacturing Process</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { step: '01', title: 'Raw Material Sourcing', desc: 'We source only the finest food-grade raw materials from certified suppliers.' },
              { step: '02', title: 'Quality Testing', desc: 'Every raw material undergoes rigorous testing before entering production.' },
              { step: '03', title: 'Precision Blending', desc: 'Our automated blending systems ensure consistent formulations every batch.' },
              { step: '04', title: 'Quality Certification', desc: 'Final products are tested and certified before dispatch to customers.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="text-center">
                <div className="w-14 h-14 bg-orange-500 text-white rounded-2xl flex items-center justify-center text-xl font-bold mx-auto mb-4">{step}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className="py-16 px-4 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-10">Certifications & Standards</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { icon: Award, title: 'ISO 9001:2015', desc: 'Quality Management System certification ensuring consistent product quality.' },
            { icon: Factory, title: 'FSSAI Licensed', desc: 'Food Safety and Standards Authority of India licensed manufacturer.' },
            { icon: Globe, title: 'Export Approved', desc: 'Approved for export to international markets with phytosanitary compliance.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="p-6 border rounded-xl text-center">
              <Icon className="text-orange-500 mx-auto mb-3" size={32} />
              <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
              <p className="text-sm text-gray-500">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-orange-500 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Partner With Us</h2>
          <p className="text-orange-100 mb-8">Join 500+ beverage manufacturers who trust Sugam Products for their flavouring needs.</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link to="/products"><Button size="lg" className="bg-white text-orange-600 hover:bg-orange-50">Browse Products</Button></Link>
            <Link to="/contact"><Button size="lg" variant="outline" className="border-white text-white hover:bg-orange-600">Get in Touch</Button></Link>
          </div>
        </div>
      </section>
    </div>
  );
}
