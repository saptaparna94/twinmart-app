'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://vuudksvnfuffkapxfhsf.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1dWRrc3ZuZnVmZmthcHhmaHNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM2MTA5NjUsImV4cCI6MjEwOTE4Njk2NX0.md1RKkLbgwZSubheCtouw06rgIeX7YdwE3Kd6aKZkxM";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  image_url: string;
}

interface CartItem extends Product {
  qty: number;
}

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [address, setAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('twinmart-cart');
      if (savedCart) setCart(JSON.parse(savedCart));
    } catch {
      localStorage.removeItem('twinmart-cart');
    }
    setLoaded(true);
  }, []);

  const total = cart.reduce((sum, item) => sum + Number(item.price || 0) * item.qty, 0);

  const placeOrder = async () => {
    if (cart.length === 0) return;
    if (!address.trim()) { setErrorMessage('Please enter your full delivery address.'); return; }
    setIsSubmitting(true);
    const summary = cart.map((item) => `${item.name} x ${item.qty}`).join(', ');

    try {
      const { error } = await supabase.from('orders').insert([
        { total_price: total, delivery_address: address.trim(), items_summary: summary },
      ]);
      if (error) { setErrorMessage(error.message); return; }
      localStorage.removeItem('twinmart-cart');
      router.push('/order-success');
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!loaded) return <main className="p-8 text-center text-xs font-bold text-neutral-400">Loading order summary...</main>;

  return (
    <main className="min-h-screen bg-[#F5F6F8] pb-24 text-neutral-900 font-sans antialiased">
      {/* Sticky Header */}
      <header className="border-b bg-white px-4 py-4 sm:px-8 sticky top-0 z-40 shadow-xs">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link href="/" className="text-xl font-black uppercase">Twin<span className="text-pink-500 font-extrabold">Mart</span></Link>
          <Link href="/cart" className="text-xs font-bold text-neutral-400 hover:text-neutral-900 transition-colors">← Back to bag</Link>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-6 sm:py-10">
        <h1 className="text-xl sm:text-2xl font-black uppercase mb-6 tracking-tight">Secure Checkout</h1>
        
        {/* Responsive Side-by-Side Flex Columns */}
        <div className="grid gap-6 md:grid-cols-[1fr_360px] items-start">
          <div className="space-y-4">
            {/* Address Input Section */}
            <section className="rounded-2xl border border-neutral-200/40 bg-white p-5 shadow-sm">
              <h2 className="text-xs font-black uppercase text-neutral-400 mb-2.5 tracking-wider">Delivery address</h2>
              <textarea 
                value={address} 
                onChange={(e) => setAddress(e.target.value)} 
                placeholder="Enter Flat/House no., Building Name, Street address, Pincode details..." 
                rows={4} 
                className="w-full rounded-xl border border-neutral-200 p-3 text-xs sm:text-sm outline-none focus:border-pink-500 text-neutral-800 transition-all placeholder:text-neutral-400" 
              />
            </section>
          </div>

          {/* Action Order Sidebar Section */}
          <aside className="space-y-4 sticky top-24">
            <section className="rounded-2xl border border-neutral-200/40 bg-white p-5 shadow-sm">
              <h2 className="text-xs font-black uppercase text-neutral-400 mb-3 tracking-wider">Order summary</h2>
              <div className="space-y-2.5 border-b pb-3 text-xs text-neutral-600 max-h-48 overflow-y-auto">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between gap-4">
                    <span className="line-clamp-1 text-neutral-700 font-medium">{item.name} × {item.qty}</span>
                    <span className="font-bold text-neutral-900">₹{(Number(item.price) * item.qty).toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex justify-between font-black text-sm text-neutral-950 tracking-tight">
                <span>Total Due</span>
                <span className="text-pink-500 font-black text-base">₹{total.toLocaleString('en-IN')}</span>
              </div>
            </section>

            {errorMessage && <p className="p-3 bg-red-50 border border-red-100 text-red-700 text-xs rounded-xl font-semibold shadow-inner">{errorMessage}</p>}
            <button 
              onClick={placeOrder} 
              disabled={isSubmitting} 
              className="w-full rounded-xl bg-neutral-950 hover:bg-neutral-800 py-4 text-xs font-black tracking-wider uppercase text-white shadow-md transition-all active:scale-95"
            >
              {isSubmitting ? 'Placing Order...' : 'CONFIRM ORDER'}
            </button>
            <p className="text-center text-[10px] text-neutral-400 font-medium">Cash on Delivery available. Online payment options arriving soon.</p>
          </aside>
        </div>
      </div>
    </main>
  );
}