import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">SP</span>
              </div>
              <span className="font-bold text-white text-lg">Sugam Products</span>
            </div>
            <p className="text-sm leading-relaxed text-gray-400 mb-4">
              Premium flavouring agents and essences for soft drink manufacturers across India and worldwide. Trusted by leading beverage brands since inception.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              {[['/', 'Home'], ['/products', 'Products'], ['/about', 'About Us'], ['/contact', 'Contact'], ['/request-sample', 'Request Sample']].map(([to, label]) => (
                <li key={to}><Link to={to} className="hover:text-orange-400 transition-colors">{label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">Contact</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2"><MapPin size={14} className="mt-0.5 text-orange-400 flex-shrink-0" /><span>Sugam Products Pvt. Ltd., India</span></li>
              <li className="flex items-center gap-2"><Phone size={14} className="text-orange-400" /><a href="tel:+919999999999" className="hover:text-orange-400">+91 99999 99999</a></li>
              <li className="flex items-center gap-2"><Mail size={14} className="text-orange-400" /><a href="mailto:info@sugamproducts.com" className="hover:text-orange-400">info@sugamproducts.com</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-6 border-t border-gray-700 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} Sugam Products Pvt. Ltd. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
