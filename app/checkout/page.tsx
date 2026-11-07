'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import Script from 'next/script';
import AuthGate from '../auth-gate';

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
interface UserAddress {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2: string | null;
  landmark: string | null;
  city: string;
  state: string;
  pincode: string;
  address_type: string;
  is_default: boolean;
}
interface AddressFormData {
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  address_type: string;
}
function formatAddress(address: UserAddress) {
  return [
    address.full_name,
    address.phone,
    address.address_line1,
    address.address_line2,
    address.landmark,
    `${address.city}, ${address.state} - ${address.pincode}`,
  ]
    .filter(Boolean)
    .join(', ');
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
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

const [showAddressForm, setShowAddressForm] = useState(false);
const [editingAddressId, setEditingAddressId] = useState<string | null>(null);

const [addressForm, setAddressForm] = useState<AddressFormData>({
  full_name: '',
  phone: '',
  address_line1: '',
  address_line2: '',
  landmark: '',
  city: '',
  state: '',
  pincode: '',
  address_type: 'Home',
});

const [addressLoading, setAddressLoading] = useState(false);

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
    // Load saved addresses from Supabase.
  useEffect(() => {
    const loadAddresses = async () => {
      setAddressLoading(true);

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          console.error('Unable to identify logged-in user:', userError);
          return;
        }

        const { data, error } = await supabase
          .from('user_addresses')
          .select('*')
          .eq('user_id', user.id)
          .order('is_default', { ascending: false })
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        const savedAddresses = (data || []) as UserAddress[];

        setAddresses(savedAddresses);

        const defaultAddress =
          savedAddresses.find((item) => item.is_default) ||
          savedAddresses[0];

        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id);
          setAddress(formatAddress(defaultAddress));
        }
      } catch (error) {
        console.error('Error loading addresses:', error);
        setErrorMessage('Unable to load your saved addresses.');
      } finally {
        setAddressLoading(false);
      }
    };

    loadAddresses();
  }, []);
    // Open form to add a new address.
  const openAddAddressForm = () => {
    setEditingAddressId(null);

    setAddressForm({
      full_name: '',
      phone: '',
      address_line1: '',
      address_line2: '',
      landmark: '',
      city: '',
      state: '',
      pincode: '',
      address_type: 'Home',
    });

    setShowAddressForm(true);
  };

  // Open form to edit an existing address.
  const openEditAddressForm = (item: UserAddress) => {
    setEditingAddressId(item.id);

    setAddressForm({
      full_name: item.full_name,
      phone: item.phone,
      address_line1: item.address_line1,
      address_line2: item.address_line2 || '',
      landmark: item.landmark || '',
      city: item.city,
      state: item.state,
      pincode: item.pincode,
      address_type: item.address_type,
    });

    setShowAddressForm(true);
  };

  // Save a new address or update an existing one.
  const handleSaveAddress = async () => {
    const {
      full_name,
      phone,
      address_line1,
      city,
      state,
      pincode,
    } = addressForm;

    if (
      !full_name.trim() ||
      !phone.trim() ||
      !address_line1.trim() ||
      !city.trim() ||
      !state.trim() ||
      !pincode.trim()
    ) {
      setErrorMessage('Please fill in all required address fields.');
      return;
    }

    if (!/^[6-9]\d{9}$/.test(phone.trim())) {
      setErrorMessage('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    if (!/^\d{6}$/.test(pincode.trim())) {
      setErrorMessage('Please enter a valid 6-digit PIN code.');
      return;
    }

    setAddressLoading(true);
    setErrorMessage('');

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error('Please log in to save your address.');
      }

      const addressData = {
        full_name: full_name.trim(),
        phone: phone.trim(),
        address_line1: address_line1.trim(),
        address_line2: addressForm.address_line2.trim() || null,
        landmark: addressForm.landmark.trim() || null,
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        address_type: addressForm.address_type,
      };

      let savedData: UserAddress;

      if (editingAddressId) {
        const { data, error } = await supabase
          .from('user_addresses')
          .update(addressData)
          .eq('id', editingAddressId)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;

        savedData = data as UserAddress;

        setAddresses((previous) =>
          previous.map((item) =>
            item.id === savedData.id ? savedData : item
          )
        );
      } else {
        const { data, error } = await supabase
          .from('user_addresses')
          .insert({
            ...addressData,
            user_id: user.id,
            is_default: addresses.length === 0,
          })
          .select()
          .single();

        if (error) throw error;

        savedData = data as UserAddress;

        setAddresses((previous) => [...previous, savedData]);
      }

      setSelectedAddressId(savedData.id);
      setAddress(formatAddress(savedData));
      setShowAddressForm(false);
      setEditingAddressId(null);
    } catch (error) {
      console.error('Error saving address:', error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to save address.'
      );
    } finally {
      setAddressLoading(false);
    }
  };
    // Set an address as the default delivery address.
  const handleSetDefaultAddress = async (id: string) => {
    setAddressLoading(true);
    setErrorMessage('');

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error('Please log in again.');
      }

      // Remove the default status from the user's other addresses.
      const { error: resetError } = await supabase
        .from('user_addresses')
        .update({ is_default: false })
        .eq('user_id', user.id);

      if (resetError) throw resetError;

      // Set the selected address as default.
      const { error: updateError } = await supabase
        .from('user_addresses')
        .update({ is_default: true })
        .eq('id', id)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setAddresses((previous) =>
        previous.map((item) => ({
          ...item,
          is_default: item.id === id,
        }))
      );
    } catch (error) {
      console.error('Error setting default address:', error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to set default address.'
      );
    } finally {
      setAddressLoading(false);
    }
  };

  // Delete a saved address.
  const handleDeleteAddress = async (id: string) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this address?'
    );

    if (!confirmed) return;

    setAddressLoading(true);
    setErrorMessage('');

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error('Please log in again.');
      }

      const { error } = await supabase
        .from('user_addresses')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      const remainingAddresses = addresses.filter(
        (item) => item.id !== id
      );

      setAddresses(remainingAddresses);

      if (selectedAddressId === id) {
        const nextAddress =
          remainingAddresses.find((item) => item.is_default) ||
          remainingAddresses[0];

        if (nextAddress) {
          setSelectedAddressId(nextAddress.id);
          setAddress(formatAddress(nextAddress));
        } else {
          setSelectedAddressId(null);
          setAddress('');
        }
      }
    } catch (error) {
      console.error('Error deleting address:', error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to delete address.'
      );
    } finally {
      setAddressLoading(false);
    }
  };

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
      const createResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || ''}/api/payment/create-order/`, {
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
            const verifyResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || ''}/api/payment/verify/`, {
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
    <AuthGate>
      <main className="p-8 text-center text-xs font-bold text-neutral-400">
        Loading order summary...
      </main>
    </AuthGate>
  );
}
  return (
    <AuthGate>
      <main className="min-h-screen bg-[#F5F6F8] pb-24 text-neutral-900 font-sans antialiased">

      {/* Razorpay Checkout Script */}
      <Script
  src="https://checkout.razorpay.com/v1/checkout.js"
  strategy="afterInteractive"
  onReady={() => setRazorpayLoaded(true)}
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

              {addressLoading && (
  <p className="text-xs text-neutral-500 mb-3">
    Loading your saved addresses...
  </p>
)}

<div className="space-y-3">
  {addresses.map((item) => (
    <div
      key={item.id}
      className={`rounded-xl border-2 p-4 transition-all ${
        selectedAddressId === item.id
          ? 'border-pink-500 bg-pink-50/40'
          : 'border-neutral-200 bg-white'
      }`}
    >
      <div className="flex items-start gap-3">
        <input
          type="radio"
          name="deliveryAddress"
          checked={selectedAddressId === item.id}
          onChange={() => {
            setSelectedAddressId(item.id);
            setAddress(formatAddress(item));
            setErrorMessage('');
          }}
          className="mt-1 accent-pink-500"
        />

        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-black text-neutral-900">
              {item.full_name}
            </span>

            <span className="rounded-md bg-neutral-100 px-2 py-1 text-[9px] font-bold uppercase text-neutral-500">
              {item.address_type}
            </span>

            {item.is_default && (
              <span className="text-[9px] font-black uppercase text-pink-500">
                Default
              </span>
            )}
          </div>

          <p className="mt-2 text-xs leading-relaxed text-neutral-600">
            {formatAddress(item)}
          </p>

          <div className="mt-3 flex flex-wrap gap-4">
            <button
              type="button"
              onClick={() => openEditAddressForm(item)}
              className="text-[10px] font-black uppercase text-neutral-700 underline"
            >
              Edit
            </button>

            <button
              type="button"
              onClick={() => handleDeleteAddress(item.id)}
              className="text-[10px] font-black uppercase text-red-500 underline"
            >
              Delete
            </button>

            {!item.is_default && (
              <button
                type="button"
                onClick={() => handleSetDefaultAddress(item.id)}
                className="text-[10px] font-black uppercase text-pink-500 underline"
              >
                Set as default
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  ))}
</div>

<button
  type="button"
  onClick={openAddAddressForm}
  className="mt-4 w-full rounded-xl border-2 border-dashed border-pink-300 py-3 text-xs font-black uppercase tracking-wider text-pink-500 hover:bg-pink-50"
>
  + Add a New Address
</button>
{showAddressForm && (
  <div className="mt-5 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
    <h3 className="mb-4 text-sm font-black uppercase text-neutral-800">
      {editingAddressId ? 'Edit Address' : 'Add New Address'}
    </h3>

    <div className="grid gap-3 sm:grid-cols-2">
      <input
        type="text"
        placeholder="Full Name *"
        value={addressForm.full_name}
        onChange={(e) =>
          setAddressForm((prev) => ({ ...prev, full_name: e.target.value }))
        }
        className="rounded-lg border border-neutral-200 bg-white p-3 text-xs outline-none focus:border-pink-500"
      />

      <input
        type="tel"
        placeholder="10-digit Mobile Number *"
        value={addressForm.phone}
        onChange={(e) =>
          setAddressForm((prev) => ({ ...prev, phone: e.target.value }))
        }
        maxLength={10}
        className="rounded-lg border border-neutral-200 bg-white p-3 text-xs outline-none focus:border-pink-500"
      />

      <input
        type="text"
        placeholder="Flat / House No. / Building *"
        value={addressForm.address_line1}
        onChange={(e) =>
          setAddressForm((prev) => ({ ...prev, address_line1: e.target.value }))
        }
        className="sm:col-span-2 rounded-lg border border-neutral-200 bg-white p-3 text-xs outline-none focus:border-pink-500"
      />

      <input
        type="text"
        placeholder="Area / Street (Optional)"
        value={addressForm.address_line2}
        onChange={(e) =>
          setAddressForm((prev) => ({ ...prev, address_line2: e.target.value }))
        }
        className="rounded-lg border border-neutral-200 bg-white p-3 text-xs outline-none focus:border-pink-500"
      />

      <input
        type="text"
        placeholder="Landmark (Optional)"
        value={addressForm.landmark}
        onChange={(e) =>
          setAddressForm((prev) => ({ ...prev, landmark: e.target.value }))
        }
        className="rounded-lg border border-neutral-200 bg-white p-3 text-xs outline-none focus:border-pink-500"
      />

      <input
        type="text"
        placeholder="City *"
        value={addressForm.city}
        onChange={(e) =>
          setAddressForm((prev) => ({ ...prev, city: e.target.value }))
        }
        className="rounded-lg border border-neutral-200 bg-white p-3 text-xs outline-none focus:border-pink-500"
      />

      <input
        type="text"
        placeholder="State *"
        value={addressForm.state}
        onChange={(e) =>
          setAddressForm((prev) => ({ ...prev, state: e.target.value }))
        }
        className="rounded-lg border border-neutral-200 bg-white p-3 text-xs outline-none focus:border-pink-500"
      />

      <input
        type="text"
        placeholder="6-digit PIN Code *"
        value={addressForm.pincode}
        onChange={(e) =>
          setAddressForm((prev) => ({ ...prev, pincode: e.target.value }))
        }
        maxLength={6}
        className="rounded-lg border border-neutral-200 bg-white p-3 text-xs outline-none focus:border-pink-500"
      />

      <select
        value={addressForm.address_type}
        onChange={(e) =>
          setAddressForm((prev) => ({ ...prev, address_type: e.target.value }))
        }
        className="rounded-lg border border-neutral-200 bg-white p-3 text-xs outline-none focus:border-pink-500"
      >
        <option value="Home">Home</option>
        <option value="Work">Work</option>
        <option value="Other">Other</option>
      </select>
    </div>

    <div className="mt-4 flex gap-3">
      <button
        type="button"
        onClick={handleSaveAddress}
        disabled={addressLoading}
        className="flex-1 rounded-lg bg-pink-500 py-3 text-xs font-black uppercase text-white disabled:opacity-50"
      >
        {addressLoading ? 'Saving...' : 'Save Address'}
      </button>

      <button
        type="button"
        onClick={() => {
          setShowAddressForm(false);
          setEditingAddressId(null);
          setErrorMessage('');
        }}
        disabled={addressLoading}
        className="flex-1 rounded-lg border border-neutral-300 bg-white py-3 text-xs font-black uppercase text-neutral-700"
      >
        Cancel
      </button>
    </div>
  </div>
)}
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
    </AuthGate>
  );
}