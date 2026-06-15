import { useState } from 'react';
import { Phone, Mail, MapPin, Clock, Send } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { toast } from '../components/ui/toast';
import api from '../lib/api';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/samples/contact', form);
      toast('Message sent! We will get back to you within 24 hours.');
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to send message. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Contact Us</h1>
        <p className="text-gray-500">We'd love to hear from you. Send us a message and we'll respond within 24 hours.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Form */}
        <div className="bg-white rounded-2xl border p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Send a Message</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Your Name</Label>
                <Input name="name" value={form.name} onChange={handleChange} placeholder="Rajesh Kumar" required />
              </div>
              <div className="space-y-1">
                <Label>Phone</Label>
                <Input name="phone" value={form.phone} onChange={handleChange} placeholder="+91 98765 43210" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@company.com" required />
            </div>
            <div className="space-y-1">
              <Label>Subject</Label>
              <Input name="subject" value={form.subject} onChange={handleChange} placeholder="Product inquiry / Bulk order" required />
            </div>
            <div className="space-y-1">
              <Label>Message</Label>
              <Textarea name="message" value={form.message} onChange={handleChange} rows={5} placeholder="Tell us about your requirements..." required />
            </div>
            <Button type="submit" className="w-full gap-2" disabled={loading}>
              <Send size={16} /> {loading ? 'Sending...' : 'Send Message'}
            </Button>
          </form>
        </div>

        {/* Contact Info */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Get In Touch</h2>
            <div className="space-y-5">
              {[
                { icon: MapPin, label: 'Address', value: 'Sugam Products Pvt. Ltd., Industrial Area, India' },
                { icon: Phone, label: 'Phone', value: '+91 99999 99999' },
                { icon: Mail, label: 'Email', value: 'info@sugamproducts.com' },
                { icon: Clock, label: 'Business Hours', value: 'Mon–Sat: 9:00 AM – 6:00 PM IST' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex gap-4">
                  <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon size={18} className="text-orange-500" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</div>
                    <div className="text-gray-700 text-sm mt-0.5">{value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
