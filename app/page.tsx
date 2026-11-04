
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Script from 'next/script';

// declare global {
//   interface Window {
//     Razorpay: any;
//   }
// }

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

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeScreen, setActiveScreen] = useState<'home' | 'cart' | 'checkout' | 'success' | 'orders'>('home');
  const [address, setAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cartLoaded, setCartLoaded] = useState(false);

  // 1. Safe Isolated Load Hook
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('twinmart-cart');

      if (savedCart) {
        setTimeout(() => {
          setCart(JSON.parse(savedCart));
          setCartLoaded(true);
        }, 0);
      } else {
        setTimeout(() => {
          setCartLoaded(true);
        }, 0);
      }
    } catch (error) {
      console.error('Basket memory recovery failed:', error);

      setTimeout(() => {
        setCartLoaded(true);
      }, 0);
    }
  }, []);

  // 2. State-Gated Save Hook
  useEffect(() => {
    if (cartLoaded) {
      localStorage.setItem('twinmart-cart', JSON.stringify(cart));
    }
  }, [cart, cartLoaded]);

  // Live Products Database Pull Pipeline
  useEffect(() => {
    let isMounted = true;

    async function fetchProducts() {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*');

        if (!isMounted) return;

        if (error) {
          setApiError(error.message);
        } else {
          setProducts((data ?? []) as Product[]);
        }
      } catch (error) {
        if (!isMounted) return;

        setApiError(
          error instanceof Error
            ? error.message
            : 'Could not load products'
        );
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  // Live Orders Tracker Fetching Hook
  useEffect(() => {
    if (activeScreen !== 'orders') return;

    let isMounted = true;

    async function fetchOrders() {
      setOrdersLoading(true);

      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .order('id', { ascending: false });

        if (!isMounted) return;

        if (!error) {
          setUserOrders(data ?? []);
        } else {
          console.error('Orders fetching error:', error.message);
        }
      } catch (err) {
        console.error('Orders fetching engine crash:', err);
      } finally {
        if (isMounted) setOrdersLoading(false);
      }
    }

    fetchOrders();

    return () => {
      isMounted = false;
    };
  }, [activeScreen]);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);

      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, qty: item.qty + 1 }
            : item
        );
      }

      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQuantity = (id: number, change: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === id
            ? { ...item, qty: item.qty + change }
            : item
        )
        .filter((item) => item.qty > 0)
    );
  };

  const removeItem = (id: number) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const cartItemCount = cart.reduce(
    (sum, item) => sum + item.qty,
    0
  );

  const cartTotal = cart.reduce(
    (sum, item) =>
      sum + Number(item.price || 0) * item.qty,
    0
  );

  // Integrated Online Payment and Verification Handler
  const handlePlaceOrder = async () => {
    if (!address.trim()) {
      alert('Please enter delivery address!');
      return;
    }

    if (cart.length === 0) {
      alert('Your cart is empty!');
      return;
    }

    if (!window.Razorpay) {
      alert('Payment gateway is loading. Please try again.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Step 1: Create Razorpay order through our backend.
      // The backend calculates the actual total using Supabase prices.

      const orderApiResponse = await fetch(
        '/api/payment/create-order',
        {
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
        }
      );

      const orderData = await orderApiResponse.json();

      if (!orderApiResponse.ok || !orderData.orderId) {
        throw new Error(
          orderData.error ||
          'Failed to initialize payment.'
        );
      }

      // Step 2: Configure Razorpay checkout.

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'TwinMart',
        description: 'Secure Order Payment Checkout',
        order_id: orderData.orderId,

        handler: async function (paymentResponse: any) {
          try {
            setIsSubmitting(true);

            // Step 3: Verify payment on the backend.

            const verifyResponse = await fetch(
              '/api/payment/verify',
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  razorpay_order_id:
                    paymentResponse.razorpay_order_id,

                  razorpay_payment_id:
                    paymentResponse.razorpay_payment_id,

                  razorpay_signature:
                    paymentResponse.razorpay_signature,
                }),
              }
            );

            const verifyData = await verifyResponse.json();

            if (verifyResponse.ok && verifyData.success) {
              // Clear cart only after successful verification.

              setCart([]);
              setAddress('');
              localStorage.removeItem('twinmart-cart');

              setActiveScreen('success');
            } else {
              alert(
                verifyData.error ||
                verifyData.message ||
                'Payment verification failed.'
              );
            }
          } catch (err: any) {
            alert(
              'Verification execution halted: ' +
              err.message
            );
          } finally {
            setIsSubmitting(false);
          }
        },

        prefill: {
          name: 'Customer Profile',
          email: 'shopper@twinmart.com',
        },

        theme: {
          color: '#ff3f6c',
        },

        modal: {
          ondismiss: function () {
            setIsSubmitting(false);
          },
        },
      };

      const razorpayInstance = new window.Razorpay(options);

      razorpayInstance.on('payment.failed', function (response: any) {
        alert(
          response?.error?.description ||
          'Payment failed. Please try again.'
        );

        setIsSubmitting(false);
      });

      razorpayInstance.open();

    } catch (err: any) {
      alert(
        err.message ||
        'An unexpected error occurred while processing your order.'
      );

      setIsSubmitting(false);
    }
  };

  const categories = [
    'All',
    ...Array.from(
      new Set(
        products
          .map((p) => p.category)
          .filter(Boolean)
      )
    ),
  ];

  const filteredProducts = products.filter((product) => {
    const productName = (product.name || '').toLowerCase();
    const productCategory = (product.category || '').toLowerCase();
    const searchText = search.toLowerCase();

    return (
      (productName.includes(searchText) ||
        productCategory.includes(searchText)) &&
      (selectedCategory === 'All' ||
        product.category === selectedCategory)
    );
  });

  return (
    <main
      style={{
        minHeight: '100vh',
        backgroundColor: '#F5F6F8',
        color: '#282C3F',
        fontFamily: 'sans-serif',
        margin: 0,
        paddingBottom: '120px',
      }}
    >

      {/* Razorpay Checkout Script */}
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
      />

      <style>{`
        .store-header { display: flex; justify-content: space-between; align-items: center; background: #ffffff; padding: 12px 24px; border-bottom: 1px solid #f5f5f6; position: sticky; top: 0; z-index: 100; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
        .logo-box { cursor: pointer; }
        .logo-title { font-size: 22px; font-weight: 900; color: #282c3f; margin: 0; letter-spacing: -0.5px; text-transform: uppercase; }
        .pink-brand { color: #ff3f6c; }
        .logo-sub { text-transform: uppercase; font-size: 8px; font-weight: 700; color: #9496a2; letter-spacing: 1px; margin: 2px 0 0 0; }
        .search-wrapper { flex: 1; max-width: 450px; margin: 0 16px; display: flex; align-items: center; background: #f5f5f6; border-radius: 6px; padding: 8px 12px; }
        .search-icon { color: #7e818c; font-size: 16px; margin-right: 8px; font-weight: bold; }
        .search-input { width: 100%; border: none; background: transparent; outline: none; font-size: 13px; color: #282c3f; }
        .cart-pill-btn { position: relative; background: #ffffff; border: 1px solid #d4d5d9; padding: 10px 14px; border-radius: 8px; font-size: 14px; display: flex; align-items: center; gap: 6px; cursor: pointer; color: #282c3f; font-weight: 700; }
        .cart-count-badge { position: absolute; top: -6px; right: -6px; background: #ff3f6c; color: #ffffff; font-size: 9px; font-weight: 900; width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 1px 3px rgba(0,0,0,0.15); }
        .main-content { max-width: 1200px; margin: 0 auto; padding: 20px 16px; }
        .promo-banner { background: linear-gradient(135deg, #282c3f 0%, #1a1c24 60%, #44111c 100%); border-radius: 12px; padding: 24px; color: #ffffff; margin-bottom: 24px; }
        .banner-tag { font-size: 9px; font-weight: 700; text-transform: uppercase; color: #ff905a; letter-spacing: 1.5px; margin: 0; }
        .banner-title { font-size: 26px; font-weight: 900; margin: 4px 0 0 0; }
        .banner-desc { font-size: 12px; color: #d4d5d9; margin: 6px 0 0 0; }
        .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding: 0 4px; }
        .section-title { font-size: 12px; font-weight: 700; color: #7e818c; text-transform: uppercase; margin: 0; letter-spacing: 0.5px; }
        .category-slider { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 10px; margin-bottom: 24px; }
        .category-slider::-webkit-scrollbar { display: none; }
        .cat-btn { shrink: 0; background: #ffffff; border: 1px solid #eaeaec; padding: 8px 18px; font-size: 12px; font-weight: 700; border-radius: 20px; cursor: pointer; text-transform: uppercase; color: #696b79; }
        .cat-btn.active { background: #ff3f6c; border-color: #ff3f6c; color: #ffffff; }
        .product-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
        @media (min-width: 768px) { .product-grid { grid-template-columns: repeat(4, 1fr); gap: 16px; } }
        .product-card { background: #ffffff; border: 1px solid #eaeaec; border-radius: 8px; overflow: hidden; display: flex; flex-direction: column; justify-content: space-between; }
        .image-wrapper { width: 100%; height: 180px; position: relative; overflow: hidden; }
        .image-wrapper img { width: 100%; height: 100%; object-fit: cover; }
        .card-cat-badge { position: absolute; top: 8px; left: 8px; background: rgba(255,255,255,0.9); padding: 3px 6px; border-radius: 4px; font-size: 8px; font-weight: 900; text-transform: uppercase; color: #282c3f; }
        .card-details { padding: 10px; flex-grow: 1; display: flex; flex-direction: column; justify-content: space-between; }
        .prod-name { font-size: 12px; font-weight: 700; color: #282c3f; margin: 0; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; min-height: 34px; }
        .card-footer { display: flex; align-items: center; justify-content: space-between; margin-top: 10px; }
        .prod-price { font-size: 13px; font-weight: 900; color: #282c3f; }
        .add-btn { background: #ffffff; border: 1px solid #ff3f6c; color: #ff3f6c; padding: 5px 12px; font-size: 11px; font-weight: 900; border-radius: 6px; cursor: pointer; text-transform: uppercase; }
        .add-btn:hover { background: #ff3f6c; color: #ffffff; }
        .floating-bottom-bar { position: fixed; bottom: 20px; left: 16px; right: 16px; z-index: 99; max-width: 450px; margin: 0 auto; background: #282c3f; border-radius: 12px; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 8px 24px rgba(0,0,0,0.25); color: #ffffff; }
        .view-bag-btn { background: #ff3f6c; color: #ffffff; border: none; padding: 10px 16px; font-size: 12px; font-weight: 700; border-radius: 6px; text-transform: uppercase; cursor: pointer; text-decoration: none; }
        .cart-layout { max-width: 900px; margin: 0 auto; padding: 20px 16px; display: grid; gap: 20px; grid-template-columns: 1fr; }
        @media (min-width: 768px) { .cart-layout { grid-template-columns: 1fr 340px; } }
        .cart-card { background: #ffffff; border: 1px solid #eaeaec; border-radius: 4px; padding: 12px; display: flex; gap: 16px; margin-bottom: 12px; }
        .qty-pill { display: flex; align-items: center; background: #f5f5f6; border-radius: 4px; border: 1px solid #eaeaec; padding: 2px; }
        .qty-btn { width: 26px; height: 26px; border: none; background: transparent; font-weight: 700; color: #696b79; cursor: pointer; }
        .sidebar-card { background: #ffffff; border: 1px solid #eaeaec; border-radius: 4px; padding: 16px; }
        .receipt-row { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 12px; }
        .place-order-btn { display: block; width: 100%; background: #ff3f6c; color: white; border: none; text-align: center; padding: 14px 0; font-size: 14px; font-weight: 700; text-transform: uppercase; border-radius: 4px; cursor: pointer; text-decoration: none; }
        .place-order-btn:disabled { background: #d4d5d9; cursor: not-allowed; }
      `}</style>

      <header className="store-header">
        <div onClick={() => setActiveScreen('home')} className="logo-box">
          <h1 className="logo-title">
            Twin<span className="pink-brand">Mart</span>
          </h1>
          <p className="logo-sub">Shop Smart, Live Better</p>
        </div>

        <div style={{ display: 'flex', gap: '16px', fontSize: '12px', fontWeight: 'bold' }}>
          <span
            onClick={() => setActiveScreen('home')}
            style={{
              cursor: 'pointer',
              color: activeScreen === 'home' ? '#ff3f6c' : '#282c3f',
            }}
          >
            Home
          </span>

          <span
            onClick={() => setActiveScreen('orders')}
            style={{
              cursor: 'pointer',
              color: activeScreen === 'orders' ? '#ff3f6c' : '#282c3f',
            }}
          >
            My Orders
          </span>
        </div>

        <div
          onClick={() => setActiveScreen('cart')}
          className="cart-pill-btn"
        >
          <span>🛒</span>
          <span style={{ fontSize: '12px' }}>Bag</span>

          {cartItemCount > 0 && (
            <span className="cart-count-badge">
              {cartItemCount}
            </span>
          )}
        </div>
      </header>

      <div className="main-content">

        {/* HOME SCREEN */}
        {activeScreen === 'home' && (
          <>
            <div
              className="search-wrapper"
              style={{ margin: '0 auto 20px auto' }}
            >
              <span className="search-icon">⌕</span>

              <input
                id="product-search"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search for clothes, apparel..."
                className="search-input"
              />
            </div>

            <section className="promo-banner">
              <p className="banner-tag">Trending Offer</p>
              <h2 className="banner-title">FLAT 50% OFF</h2>
              <p className="banner-desc">
                Upgrade your wardrobe with top styles and daily essentials.
              </p>
            </section>

            <section>
              <div className="category-slider">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`cat-btn ${
                      selectedCategory === category ? 'active' : ''
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </section>

            <div className="product-grid">
              {filteredProducts.map((product) => (
                <article key={product.id} className="product-card">
                  <div className="image-wrapper">
                    <img
                      src={product.image_url || 'https://unsplash.com'}
                      alt={product.name}
                    />

                    <div className="card-cat-badge">
                      {product.category}
                    </div>
                  </div>

                  <div className="card-details">
                    <h3 className="prod-name">{product.name}</h3>

                    <div className="card-footer">
                      <span className="prod-price">
                        ₹{Number(product.price).toLocaleString('en-IN')}
                      </span>

                      <button
                        onClick={() => addToCart(product)}
                        className="add-btn"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {cartItemCount > 0 && (
              <div className="floating-bottom-bar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '22px' }}>🛍️</span>

                  <div>
                    <p className="bar-items-label">
                      {cartItemCount} Items Selected
                    </p>

                    <p style={{ margin: '2px 0 0 0', fontWeight: '900' }}>
                      ₹{cartTotal.toLocaleString('en-IN')}
                    </p>
                  </div>

                  <button
                    onClick={() => setActiveScreen('cart')}
                    className="view-bag-btn"
                  >
                    View Bag
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* CART SCREEN */}
        {activeScreen === 'cart' && (
          <div className="cart-layout">
            <section>
              <button
                onClick={() => setActiveScreen('home')}
                style={{
                  background: '#f5f5f6',
                  border: 'none',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  marginBottom: '14px',
                  cursor: 'pointer',
                }}
              >
                ← Back to Dashboard
              </button>

              {cart.length === 0 ? (
                <div
                  style={{
                    background: 'white',
                    padding: '40px',
                    borderRadius: '8px',
                    textAlign: 'center',
                    border: '1px solid #eaeaec',
                  }}
                >
                  <h3>Your shopping bag is empty</h3>

                  <button
                    onClick={() => setActiveScreen('home')}
                    className="place-order-btn"
                    style={{
                      maxWidth: '160px',
                      margin: '12px auto 0 auto',
                      padding: '10px',
                    }}
                  >
                    Shop Now
                  </button>
                </div>
              ) : (
                cart.map((item) => (
                  <article key={item.id} className="cart-card">
                    <img
                      src={item.image_url || 'https://unsplash.com'}
                      style={{
                        width: '80px',
                        height: '95px',
                        objectFit: 'cover',
                        borderRadius: '4px',
                      }}
                      alt={item.name}
                    />

                    <div
                      style={{
                        flexGrow: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <h4
                          style={{
                            margin: 0,
                            fontSize: '13px',
                            fontWeight: 'bold',
                          }}
                        >
                          {item.name}
                        </h4>

                        <p
                          style={{
                            margin: '4px 0 0 0',
                            fontSize: '13px',
                            fontWeight: '900',
                            color: '#ff3f6c',
                          }}
                        >
                          ₹{Number(item.price).toLocaleString('en-IN')}
                        </p>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginTop: '10px',
                        }}
                      >
                        <div className="qty-pill">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="qty-btn"
                          >
                            −
                          </button>

                          <span style={{ fontSize: '12px', fontWeight: 'bold' }}>
                            {item.qty}
                          </span>

                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="qty-btn"
                          >
                            +
                          </button>
                        </div>

                        <button
                          onClick={() => removeItem(item.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#7e818c',
                            fontSize: '12px',
                            cursor: 'pointer',
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </section>

            {cart.length > 0 && (
              <aside className="sidebar-card">
                <h3
                  style={{
                    margin: '0 0 12px 0',
                    fontSize: '12px',
                    color: '#7e818c',
                  }}
                >
                  PRICE DETAILS
                </h3>

                <div className="receipt-row">
                  <span>Total MRP</span>
                  <span>
                    ₹{(cartTotal * 2).toLocaleString('en-IN')}
                  </span>
                </div>

                <div
                  className="receipt-row"
                  style={{ color: '#03a685' }}
                >
                  <span>Discount</span>
                  <span>
                    −₹{cartTotal.toLocaleString('en-IN')}
                  </span>
                </div>

                <div
                  className="receipt-total"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontWeight: 'bold',
                    borderTop: '1px dashed #eaeaec',
                    paddingTop: '12px',
                  }}
                >
                  <span>Total Amount</span>

                  <span style={{ color: '#ff3f6c' }}>
                    ₹{cartTotal.toLocaleString('en-IN')}
                  </span>
                </div>

                <button
                  onClick={() => setActiveScreen('checkout')}
                  className="place-order-btn"
                  style={{ marginTop: '16px' }}
                >
                  Proceed to Checkout
                </button>
              </aside>
            )}
          </div>
        )}

        {/* CHECKOUT SCREEN */}
        {activeScreen === 'checkout' && (
          <div
            style={{
              maxWidth: '500px',
              margin: '0 auto',
              background: 'white',
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid #eaeaec',
            }}
          >
            <button
              onClick={() => setActiveScreen('cart')}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ff3f6c',
                fontSize: '12px',
                fontWeight: 'bold',
                padding: 0,
                marginBottom: '12px',
                cursor: 'pointer',
              }}
            >
              ← Back to Bag
            </button>

            <h2
              style={{
                fontSize: '18px',
                fontWeight: '900',
                margin: '0 0 16px 0',
              }}
            >
              Delivery Address
            </h2>

            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter flat/house number, building, street, pincode details..."
              rows={4}
              style={{
                width: '100%',
                borderRadius: '8px',
                border: '1px solid #d4d5d9',
                padding: '12px',
                fontSize: '13px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />

            <button
              onClick={handlePlaceOrder}
              disabled={isSubmitting}
              className="place-order-btn"
              style={{ marginTop: '20px' }}
            >
              {isSubmitting
                ? 'Processing Payment Overlay...'
                : 'PAY VIA RAZORPAY'}
            </button>
          </div>
        )}

        {/* SUCCESS SCREEN */}
        {activeScreen === 'success' && (
          <div
            style={{
              maxWidth: '400px',
              margin: '60px auto 0 auto',
              background: 'white',
              padding: '32px',
              borderRadius: '16px',
              textAlign: 'center',
              boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
            }}
          >
            <div style={{ fontSize: '40px' }}>🎉</div>

            <h2
              style={{
                fontSize: '18px',
                fontWeight: '900',
                margin: '12px 0 0 0',
              }}
            >
              PAYMENT RECEIVED!
            </h2>

            <p
              style={{
                fontSize: '12px',
                color: '#7e818c',
                margin: '6px 0 20px 0',
                lineHeight: '1.5',
              }}
            >
              Your online order signature has been securely verified.
              10 Mins Express shipping initialized.
            </p>

            <button
              onClick={() => setActiveScreen('orders')}
              className="place-order-btn"
            >
              View My Orders
            </button>
          </div>
        )}

        {/* ORDERS SCREEN */}
        {activeScreen === 'orders' && (
          <div
            style={{
              maxWidth: '700px',
              margin: '0 auto',
              paddingBottom: '40px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
              }}
            >
              <button
                onClick={() => setActiveScreen('home')}
                style={{
                  background: '#f5f5f6',
                  border: 'none',
                  padding: '8px 14px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                ← Back to Shop
              </button>

              <h2
                style={{
                  fontSize: '18px',
                  fontWeight: '900',
                  margin: 0,
                }}
              >
                My Orders History
              </h2>
            </div>

            {ordersLoading ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: '#9496a2',
                  fontSize: '13px',
                  fontWeight: 'bold',
                }}
              >
                Fetching fresh database updates...
              </div>
            ) : userOrders.length === 0 ? (
              <div
                style={{
                  background: 'white',
                  padding: '40px',
                  borderRadius: '12px',
                  textAlign: 'center',
                  border: '1px solid #eaeaec',
                }}
              >
                <p style={{ fontSize: '28px', margin: 0 }}>📦</p>

                <h3
                  style={{
                    fontSize: '14px',
                    margin: '8px 0 0 0',
                  }}
                >
                  No purchase history found
                </h3>

                <p
                  style={{
                    fontSize: '12px',
                    color: '#7e818c',
                    margin: '4px 0 0 0',
                  }}
                >
                  Place your first express storefront order to view it live here.
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                {userOrders.map((order) => (
                  <div
                    key={order.id}
                    style={{
                      background: 'white',
                      borderRadius: '12px',
                      border: '1px solid #eaeaec',
                      padding: '20px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderBottom: '1px solid #f5f5f6',
                        paddingBottom: '12px',
                        marginBottom: '12px',
                      }}
                    >
                      <div>
                        <p
                          style={{
                            margin: 0,
                            fontSize: '11px',
                            fontWeight: 'bold',
                            color: '#a9abb2',
                            textTransform: 'uppercase',
                          }}
                        >
                          Order ID: #TM-{order.id}
                        </p>

                        <p
                          style={{
                            margin: '2px 0 0 0',
                            fontSize: '11px',
                            color: '#7e818c',
                          }}
                        >
                          Method: {order.payment_method || 'ONLINE'}
                        </p>
                      </div>

                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: '900',
                          color:
                            order.status === 'Paid'
                              ? '#03a685'
                              : '#ff905a',
                          background:
                            order.status === 'Paid'
                              ? '#e6f6f2'
                              : '#fff3ec',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          textTransform: 'uppercase',
                        }}
                      >
                        {order.status || 'Paid'}
                      </span>
                    </div>

                    <p
                      style={{
                        margin: '0 0 4px 0',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        color: '#282c3f',
                      }}
                    >
                      Items summary:
                    </p>

                    <p
                      style={{
                        margin: '0 0 12px 0',
                        fontSize: '13px',
                        color: '#535766',
                        lineHeight: '1.4',
                      }}
                    >
                      {order.items_summary}
                    </p>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderTop: '1px solid #f5f5f6',
                        paddingTop: '12px',
                      }}
                    >
                      <div>
                        <p
                          style={{
                            margin: 0,
                            fontSize: '11px',
                            fontWeight: 'bold',
                            color: '#a9abb2',
                            textTransform: 'uppercase',
                          }}
                        >
                          Amount Total
                        </p>

                        <p
                          style={{
                            margin: '2px 0 0 0',
                            fontSize: '16px',
                            fontWeight: '900',
                            color: '#ff3f6c',
                          }}
                        >
                          ₹{Number(order.total_price || 0).toLocaleString('en-IN')}
                        </p>
                      </div>

                      <button
                        onClick={() =>
                          alert('Express tracking tracker link live!')
                        }
                        style={{
                          background: '#282c3f',
                          color: '#ffffff',
                          border: 'none',
                          padding: '10px 16px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '700',
                          textTransform: 'uppercase',
                          cursor: 'pointer',
                        }}
                      >
                        Track Order
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </main>
  );
}
