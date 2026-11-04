// 'use client';

// import { useEffect, useState } from 'react';
// import Link from 'next/link';
// import { useRouter } from 'next/navigation';
// import { createClient } from '@supabase/supabase-js';

// const supabaseUrl = "https://vuudksvnfuffkapxfhsf.supabase.co";
// const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1dWRrc3ZuZnVmZmthcHhmaHNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM2MTA5NjUsImV4cCI6MjEwOTE4Njk2NX0.md1RKkLbgwZSubheCtouw06rgIeX7YdwE3Kd6aKZkxM";
// const supabase = createClient(supabaseUrl, supabaseAnonKey);

// interface Product {
//   id: number;
//   name: string;
//   price: number;
//   category: string;
//   image_url: string;
// }

// interface CartItem extends Product {
//   qty: number;
// }

// export default function CheckoutPage() {
//   const router = useRouter();
//   const [cart, setCart] = useState<CartItem[]>([]);
//   const [address, setAddress] = useState('');
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [loaded, setLoaded] = useState(false);
//   const [errorMessage, setErrorMessage] = useState('');

//   useEffect(() => {
//     try {
//       const savedCart = localStorage.getItem('twinmart-cart');
//       if (savedCart) setCart(JSON.parse(savedCart));
//     } catch {
//       localStorage.removeItem('twinmart-cart');
//     }
//     setLoaded(true);
//   }, []);

//   const total = cart.reduce((sum, item) => sum + Number(item.price || 0) * item.qty, 0);

//   const placeOrder = async () => {
//     if (cart.length === 0) return;
//     if (!address.trim()) { setErrorMessage('Please enter your full delivery address.'); return; }
//     setIsSubmitting(true);
//     const summary = cart.map((item) => `${item.name} x ${item.qty}`).join(', ');

//     try {
//       const { error } = await supabase.from('orders').insert([
//         { total_price: total, delivery_address: address.trim(), items_summary: summary },
//       ]);
//       if (error) { setErrorMessage(error.message); return; }
//       localStorage.removeItem('twinmart-cart');
//       router.push('/order-success');
//     } catch (err: any) {
//       setErrorMessage(err.message);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   if (!loaded) return <main className="p-8 text-center text-xs font-bold text-neutral-400">Loading order summary...</main>;

//   return (
//     <main className="min-h-screen bg-[#F5F6F8] pb-24 text-neutral-900 font-sans antialiased">
//       {/* Sticky Header */}
//       <header className="border-b bg-white px-4 py-4 sm:px-8 sticky top-0 z-40 shadow-xs">
//         <div className="mx-auto flex max-w-4xl items-center justify-between">
//           <Link href="/" className="text-xl font-black uppercase">Twin<span className="text-pink-500 font-extrabold">Mart</span></Link>
//           <Link href="/cart" className="text-xs font-bold text-neutral-400 hover:text-neutral-900 transition-colors">← Back to bag</Link>
//         </div>
//       </header>

//       <div className="mx-auto max-w-4xl px-4 py-6 sm:py-10">
//         <h1 className="text-xl sm:text-2xl font-black uppercase mb-6 tracking-tight">Secure Checkout</h1>
        
//         {/* Responsive Side-by-Side Flex Columns */}
//         <div className="grid gap-6 md:grid-cols-[1fr_360px] items-start">
//           <div className="space-y-4">
//             {/* Address Input Section */}
//             <section className="rounded-2xl border border-neutral-200/40 bg-white p-5 shadow-sm">
//               <h2 className="text-xs font-black uppercase text-neutral-400 mb-2.5 tracking-wider">Delivery address</h2>
//               <textarea 
//                 value={address} 
//                 onChange={(e) => setAddress(e.target.value)} 
//                 placeholder="Enter Flat/House no., Building Name, Street address, Pincode details..." 
//                 rows={4} 
//                 className="w-full rounded-xl border border-neutral-200 p-3 text-xs sm:text-sm outline-none focus:border-pink-500 text-neutral-800 transition-all placeholder:text-neutral-400" 
//               />
//             </section>
//           </div>

//           {/* Action Order Sidebar Section */}
//           <aside className="space-y-4 sticky top-24">
//             <section className="rounded-2xl border border-neutral-200/40 bg-white p-5 shadow-sm">
//               <h2 className="text-xs font-black uppercase text-neutral-400 mb-3 tracking-wider">Order summary</h2>
//               <div className="space-y-2.5 border-b pb-3 text-xs text-neutral-600 max-h-48 overflow-y-auto">
//                 {cart.map((item) => (
//                   <div key={item.id} className="flex justify-between gap-4">
//                     <span className="line-clamp-1 text-neutral-700 font-medium">{item.name} × {item.qty}</span>
//                     <span className="font-bold text-neutral-900">₹{(Number(item.price) * item.qty).toLocaleString('en-IN')}</span>
//                   </div>
//                 ))}
//               </div>
//               <div className="mt-3 flex justify-between font-black text-sm text-neutral-950 tracking-tight">
//                 <span>Total Due</span>
//                 <span className="text-pink-500 font-black text-base">₹{total.toLocaleString('en-IN')}</span>
//               </div>
//             </section>

//             {errorMessage && <p className="p-3 bg-red-50 border border-red-100 text-red-700 text-xs rounded-xl font-semibold shadow-inner">{errorMessage}</p>}
//             <button 
//               onClick={placeOrder} 
//               disabled={isSubmitting} 
//               className="w-full rounded-xl bg-neutral-950 hover:bg-neutral-800 py-4 text-xs font-black tracking-wider uppercase text-white shadow-md transition-all active:scale-95"
//             >
//               {isSubmitting ? 'Placing Order...' : 'CONFIRM ORDER'}
//             </button>
//             <p className="text-center text-[10px] text-neutral-400 font-medium">Cash on Delivery available. Online payment options arriving soon.</p>
//           </aside>
//         </div>
//       </div>
//     </main>
//   );
// }

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import Script from 'next/script';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

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

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => Promise<void>;
  modal?: {
    ondismiss?: () => void;
  };
  theme?: {
    color: string;
  };
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, callback: (response: any) => void) => void;
}


export default function CheckoutPage() {
  const router = useRouter();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [address, setAddress] = useState('');
  const [savedAddress, setSavedAddress] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'ONLINE' | 'COD'>('ONLINE');
  const [checkoutStep, setCheckoutStep] = useState<1 | 2>(1);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  // Load existing cart and saved address.
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('twinmart-cart');

      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }

      const existingAddress = localStorage.getItem('twinmart-saved-address');

      if (existingAddress) {
        setSavedAddress(existingAddress);
        setAddress(existingAddress);
      }
    } catch (error) {
      console.error('Unable to load checkout data:', error);
      localStorage.removeItem('twinmart-cart');
    }

    setLoaded(true);
  }, []);

  const total = cart.reduce(
    (sum, item) => sum + Number(item.price || 0) * item.qty,
    0
  );

  // Step 1: Validate address and proceed.
  const proceedToPayment = () => {
    if (!address.trim()) {
      setErrorMessage('Please enter or select a delivery address to proceed.');
      return;
    }

    if (cart.length === 0) {
      setErrorMessage('Your cart is empty.');
      return;
    }

    setErrorMessage('');

    localStorage.setItem('twinmart-saved-address', address.trim());

    setCheckoutStep(2);
  };

  // Online payment using actual Razorpay order and server verification.
  const handleOnlinePayment = async () => {
    if (!address.trim() || cart.length === 0) {
      setErrorMessage('Please check your address and cart.');
      return;
    }

   const RazorpayCheckout = window.Razorpay;

if (!RazorpayCheckout) {
  setErrorMessage('Payment gateway is still loading. Please try again.');
  return;
}

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      // Ask our backend to calculate the total and create a Razorpay order.
      const createResponse = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: cart.map((item) => ({
            id: item.id,
            qty: item.qty,
          })),
          address: address.trim(),
        }),
      });

      const orderData = await createResponse.json();

      if (!createResponse.ok) {
        throw new Error(orderData.error || 'Could not create payment order.');
      }

      const options: RazorpayOptions = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'TwinMart',
        description: 'Secure TwinMart Order Payment',
        order_id: orderData.orderId,

        // Razorpay calls this after successful checkout.
        handler: async (paymentResponse: RazorpayResponse) => {
          setIsSubmitting(true);

          try {
            // Verify payment on our server.
            const verifyResponse = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(paymentResponse),
            });

            const verifyData = await verifyResponse.json();

            if (!verifyResponse.ok || !verifyData.success) {
              throw new Error(
                verifyData.error || 'Payment verification failed.'
              );
            }

            // Only clear the cart after server verification succeeds.
            localStorage.removeItem('twinmart-cart');

            router.push('/order-success');
          } catch (error) {
            console.error('Payment verification error:', error);

            setErrorMessage(
              error instanceof Error
                ? error.message
                : 'Unable to verify payment. Please contact support if money was deducted.'
            );
          } finally {
            setIsSubmitting(false);
          }
        },

        modal: {
          ondismiss: () => {
            setIsSubmitting(false);
          },
        },

        theme: {
          color: '#EC4899',
        },
      };

    //   const razorpay = new window.Razorpay(options);
    const razorpay = new RazorpayCheckout(options);

      razorpay.on('payment.failed', (response: any) => {
        setErrorMessage(
          response?.error?.description || 'Payment failed. Please try again.'
        );

        setIsSubmitting(false);
      });

      razorpay.open();

    } catch (error) {
      console.error('Online payment error:', error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to start payment. Please try again.'
      );

      setIsSubmitting(false);
    }
  };

  // Cash on Delivery.
  const handleCODOrder = async () => {
    if (!address.trim() || cart.length === 0) {
      setErrorMessage('Please check your address and cart.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    const summary = cart
      .map((item) => `${item.name} x ${item.qty}`)
      .join(', ');

    try {
      const { error } = await supabase.from('orders').insert([
        {
          total_price: total,
          delivery_address: address.trim(),
          items_summary: summary,
          payment_method: 'COD',
          payment_id: null,
          razorpay_order_id: null,
          status: 'Pending Cash Collection',
        },
      ]);

      if (error) {
        throw new Error(error.message);
      }

      localStorage.removeItem('twinmart-cart');

      router.push('/order-success');

    } catch (error) {
      console.error('COD order error:', error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to place your order.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!loaded) {
    return (
      <main className="p-8 text-center text-xs font-bold text-neutral-400">
        Loading order summary...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F6F8] pb-24 text-neutral-900 font-sans antialiased">

      {/* Razorpay Checkout Script */}
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={() => setRazorpayLoaded(true)}
        onError={() => {
          setRazorpayLoaded(false);
          setErrorMessage('Unable to load payment gateway. Please refresh.');
        }}
      />

      {/* Premium Original Sticky Header */}
      <header className="border-b bg-white px-4 py-4 sm:px-8 sticky top-0 z-40 shadow-xs">
        <div className="mx-auto flex max-w-4xl items-center justify-between">

          <Link href="/" className="text-xl font-black uppercase">
            Twin<span className="text-pink-500 font-extrabold">Mart</span>
          </Link>

          {checkoutStep === 2 ? (
            <button
              type="button"
              onClick={() => setCheckoutStep(1)}
              className="text-xs font-black uppercase text-neutral-400 hover:text-neutral-900 transition-colors"
            >
              ← Back to Address
            </button>
          ) : (
            <Link
              href="/cart"
              className="text-xs font-bold text-neutral-400 hover:text-neutral-900 transition-colors"
            >
              ← Back to bag
            </Link>
          )}

        </div>
      </header>

      {/* Premium Multi-step Active tracker */}
      <div className="mx-auto max-w-4xl px-4 mt-6">

        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-neutral-400">

          <span className={checkoutStep === 1 ? "text-pink-500" : "text-neutral-400"}>
            1. Delivery Address
          </span>

          <span className="text-neutral-300">➔</span>

          <span className={checkoutStep === 2 ? "text-pink-500" : "text-neutral-400"}>
            2. Payment Method
          </span>

        </div>

      </div>

      <div className="mx-auto max-w-4xl px-4 py-4 sm:py-6">

        <div className="grid gap-6 md:grid-cols-[1fr_360px] items-start">

          <div className="space-y-4">

            {/* STEP 1: DELIVERY ADDRESS */}
            {checkoutStep === 1 && (
              <section className="rounded-2xl border border-neutral-200/40 bg-white p-5 shadow-sm animate-in fade-in duration-200">

                <h2 className="text-xs font-black uppercase text-neutral-400 mb-2.5 tracking-wider">
                  Delivery address
                </h2>

                {savedAddress && (
                  <div className="mb-4 p-3.5 rounded-xl border-2 border-pink-500/20 bg-pink-50/30 text-left">

                    <p className="text-[10px] font-black uppercase tracking-wider text-pink-500">
                      📍 Saved Address Found
                    </p>

                    <p className="text-xs font-bold text-neutral-700 mt-1 line-clamp-2">
                      {savedAddress}
                    </p>

                    <button
                      type="button"
                      onClick={() => setAddress(savedAddress)}
                      className="mt-2 text-[10px] font-black uppercase tracking-wider text-neutral-950 underline hover:text-pink-500"
                    >
                      Select This Saved Address
                    </button>

                  </div>
                )}

                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter Flat/House no., Building Name, Street address, Pincode details..."
                  rows={4}
                  className="w-full rounded-xl border border-neutral-200 p-3 text-xs sm:text-sm outline-none focus:border-pink-500 text-neutral-800 transition-all placeholder:text-neutral-400"
                />

              </section>
            )}

            {/* STEP 2: PAYMENT METHOD */}
            {checkoutStep === 2 && (
              <section className="rounded-2xl border border-neutral-200/40 bg-white p-5 shadow-sm animate-in fade-in duration-200">

                <h2 className="text-xs font-black uppercase text-neutral-400 mb-3 tracking-wider">
                  Choose Payment Method
                </h2>

                <div className="flex flex-col sm:flex-row gap-3">

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('ONLINE')}
                    className={`flex-1 rounded-xl py-4 text-xs font-black tracking-wider uppercase border-2 transition-all active:scale-[0.98] ${
                      paymentMethod === 'ONLINE'
                        ? 'bg-neutral-950 border-neutral-950 text-white shadow-md'
                        : 'bg-white border-neutral-200 text-neutral-800 hover:border-neutral-400'
                    }`}
                  >
                    💳 Pay Online (UPI/Card)
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('COD')}
                    className={`flex-1 rounded-xl py-4 text-xs font-black tracking-wider uppercase border-2 transition-all active:scale-[0.98] ${
                      paymentMethod === 'COD'
                        ? 'bg-neutral-950 border-neutral-950 text-white shadow-md'
                        : 'bg-white border-neutral-200 text-neutral-800 hover:border-neutral-400'
                    }`}
                  >
                    📦 Cash on Delivery
                  </button>

                </div>

                <p className="mt-3 text-[11px] font-medium text-neutral-500 leading-relaxed">
                  {paymentMethod === 'ONLINE'
                    ? "⚡ Secure Gateway: Check out instantly using Google Pay, PhonePe, Paytm, Net Banking, or Cards."
                    : "⚡ Cash at Doorstep: Pay your delivery partner with cash when your clothing parcel arrives."}
                </p>

                <div className="mt-4 p-3 bg-neutral-50 rounded-xl border border-dashed border-neutral-200">

                  <span className="text-[9px] font-black uppercase tracking-wider text-neutral-400 block">
                    Shipping to:
                  </span>

                  <span className="text-xs font-bold text-neutral-600 line-clamp-1 mt-0.5">
                    {address}
                  </span>

                </div>

              </section>
            )}

          </div>

          {/* Original Order Summary Sidebar */}
          <aside className="space-y-4 sticky top-24">

            <section className="rounded-2xl border border-neutral-200/40 bg-white p-5 shadow-sm">

              <h2 className="text-xs font-black uppercase text-neutral-400 mb-3 tracking-wider">
                Order summary
              </h2>

              <div className="space-y-2.5 border-b pb-3 text-xs text-neutral-600 max-h-48 overflow-y-auto">

                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between gap-4">

                    <span className="line-clamp-1 text-neutral-700 font-medium">
                      {item.name} × {item.qty}
                    </span>

                    <span className="font-bold text-neutral-900">
                      ₹{(Number(item.price) * item.qty).toLocaleString('en-IN')}
                    </span>

                  </div>
                ))}

              </div>

              <div className="mt-3 flex justify-between font-black text-sm text-neutral-950 tracking-tight">

                <span>Total Due</span>

                <span className="text-pink-500 font-black text-base">
                  ₹{total.toLocaleString('en-IN')}
                </span>

              </div>

            </section>

            {errorMessage && (
              <p className="p-3 bg-red-50 border border-red-100 text-red-700 text-xs rounded-xl font-semibold shadow-inner">
                {errorMessage}
              </p>
            )}

            {checkoutStep === 1 ? (

              <button
                type="button"
                onClick={proceedToPayment}
                disabled={cart.length === 0}
                className="w-full rounded-xl bg-neutral-950 hover:bg-neutral-800 py-4 text-xs font-black tracking-wider uppercase text-white shadow-md transition-all active:scale-95 disabled:opacity-40"
              >
                PROCEED TO PAYMENT ➔
              </button>

            ) : (

              <button
                type="button"
                onClick={
                  paymentMethod === 'ONLINE'
                    ? handleOnlinePayment
                    : handleCODOrder
                }
                disabled={
                  isSubmitting ||
                  cart.length === 0 ||
                  (paymentMethod === 'ONLINE' && !razorpayLoaded)
                }
                className="w-full rounded-xl bg-pink-500 hover:bg-pink-600 py-4 text-xs font-black tracking-wider uppercase text-white shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                {isSubmitting
                  ? 'Processing Payment...'
                  : paymentMethod === 'ONLINE'
                    ? !razorpayLoaded
                      ? 'LOADING PAYMENT GATEWAY...'
                      : 'OPEN SECURITY PAY GATEWAY ➔'
                    : 'PLACE COD ORDER NOW ➔'}
              </button>

            )}

          </aside>

        </div>

      </div>

    </main>
  );
}