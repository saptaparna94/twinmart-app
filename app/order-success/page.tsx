'use client';

import Link from 'next/link';

export default function OrderSuccessPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F5F6F8] px-4 font-sans antialiased">
      {/* Premium Centered Card that auto-scales on mobile and desktop viewports */}
      <section className="w-full max-w-md rounded-3xl border border-neutral-200/40 bg-white p-8 text-center shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        <div className="w-16 h-16 bg-pink-50 rounded-full flex items-center justify-center mx-auto text-3xl animate-bounce">
          🎉
        </div>
        
        <h1 className="mt-5 text-xl font-black uppercase tracking-tight text-neutral-900">
          Order Confirmed!
        </h1>
        
        <p className="mt-3 text-xs sm:text-sm leading-relaxed text-neutral-500 font-medium px-2">
          Thank you for shopping with TwinMart. Your order details and delivery metrics have been securely saved to our database dashboard.
        </p>

        <div className="mt-6 p-3 bg-neutral-50 rounded-xl border border-neutral-100 text-left">
          <p className="text-[10px] font-black uppercase tracking-wider text-pink-500">Delivery Status</p>
          <p className="text-xs font-bold text-neutral-800 mt-0.5">🚀 Out for Express Delivery within 10 Mins</p>
        </div>

        <Link
          href="/"
          className="mt-6 inline-block w-full rounded-xl bg-neutral-950 hover:bg-neutral-800 text-center py-4 text-xs font-black uppercase tracking-wider text-white shadow-md transition-all active:scale-[0.99] duration-150"
        >
          Continue Shopping
        </Link>
      </section>
    </main>
  );
}