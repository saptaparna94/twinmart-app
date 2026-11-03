'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

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

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('twinmart-cart');
      if (savedCart) setCart(JSON.parse(savedCart));
    } catch {
      localStorage.removeItem('twinmart-cart');
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) {
      localStorage.setItem('twinmart-cart', JSON.stringify(cart));
    }
  }, [cart, loaded]);

  const updateQuantity = (id: number, change: number) => {
    setCart((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, qty: item.qty + change } : item))
        .filter((item) => item.qty > 0)
    );
  };

  const removeItem = (id: number) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const total = cart.reduce((sum, item) => sum + Number(item.price || 0) * item.qty, 0);
  const itemCount = cart.reduce((sum, item) => sum + item.qty, 0);

  if (!loaded) {
    return <div style={{ textAlign: 'center', padding: '40px', fontFamily: 'sans-serif' }}>Loading bag...</div>;
  }

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#F5F6F8', color: '#282C3F', fontFamily: 'sans-serif', margin: 0, paddingBottom: '100px' }}>
      {/* Self-contained styling system to bypass build layer glitches */}
      <style>{`
        .myntra-header { display: flex; justify-content: space-between; align-items: center; background: #ffffff; padding: 12px 20px; border-bottom: 1px solid #f5f5f6; sticky: top; }
        .brand-logo { font-size: 20px; font-weight: 900; color: #282c3f; text-decoration: none; text-transform: uppercase; letter-spacing: -0.5px; }
        .pink-text { color: #ff3f6c; font-weight: 900; }
        .step-map { font-size: 11px; font-weight: 700; color: #a9abb2; letter-spacing: 1px; }
        .step-active { color: #20bd99; border-bottom: 2px solid #20bd99; padding-bottom: 4px; }
        .cart-container { max-width: 900px; margin: 0 auto; padding: 20px 16px; display: grid; gap: 20px; grid-template-columns: 1fr; }
        @media (min-width: 768px) { .cart-container { grid-template-columns: 1fr 340px; } }
        .pincode-bar { background: #ffffff; border: 1px solid #eaeaec; border-radius: 4px; padding: 12px; display: flex; justify-content: space-between; align-items: center; font-size: 13px; font-weight: 700; margin-bottom: 16px; }
        .cart-card { background: #ffffff; border: 1px solid #eaeaec; border-radius: 4px; padding: 12px; display: flex; gap: 16px; position: relative; margin-bottom: 12px; }
        .image-box { width: 96px; height: 115px; flex-shrink: 0; background: #f5f5f6; border-radius: 4px; overflow: hidden; }
        .image-box img { width: 100%; height: 100%; object-cover: cover; object-position: top; }
        .details-box { flex-1: 1; display: flex; flex-direction: column; justify-content: space-between; }
        .item-brand { font-size: 14px; font-weight: 700; color: #282c3f; margin: 0; text-transform: uppercase; }
        .item-title { font-size: 13px; color: #535766; margin: 2px 0 0 0; font-weight: 400; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
        .price-row { display: flex; align-items: center; gap: 8px; margin-top: 8px; }
        .item-price { font-size: 14px; font-weight: 700; color: #282c3f; }
        .item-strike { font-size: 12px; text-decoration: line-through; color: #7e818c; }
        .item-discount { font-size: 12px; color: #ff905a; font-weight: 700; }
        .action-row { display: flex; items-center: center; justify-content: space-between; margin-top: 12px; border-t: 1px solid #f5f5f6; padding-top: 8px; }
        .qty-pill { display: flex; align-items: center; background: #f5f5f6; border-radius: 4px; border: 1px solid #eaeaec; padding: 2px; }
        .qty-btn { width: 28px; height: 28px; border: none; background: transparent; font-weight: 700; font-size: 16px; color: #696b79; cursor: pointer; }
        .qty-num { font-size: 12px; font-weight: 700; min-width: 24px; text-align: center; }
        .remove-btn { border: none; background: transparent; font-size: 12px; font-weight: 700; color: #696b79; cursor: pointer; text-transform: uppercase; }
        .remove-btn:hover { color: #ff3f6c; }
        .sidebar-card { background: #ffffff; border: 1px solid #eaeaec; border-radius: 4px; padding: 16px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
        .sidebar-title { font-size: 12px; font-weight: 700; color: #7e818c; text-transform: uppercase; margin: 0 0 16px 0; letter-spacing: 0.5px; border-bottom: 1px solid #f5f5f6; padding-bottom: 8px; }
        .receipt-row { display: flex; justify-content: space-between; font-size: 13px; color: #282c3f; margin-bottom: 12px; }
        .receipt-row.green { color: #03a685; font-weight: 700; }
        .receipt-total { display: flex; justify-content: space-between; font-size: 15px; font-weight: 700; color: #282c3f; border-top: 1px solid #f5f5f6; padding-top: 12px; margin-top: 12px; }
        .place-order-btn { display: block; width: 100%; background: #ff3f6c; border: none; color: #ffffff; text-align: center; padding: 14px 0; font-size: 14px; font-weight: 700; text-transform: uppercase; border-radius: 4px; cursor: pointer; margin-top: 16px; text-decoration: none; tracking-spacing: 0.5px; }
        .place-order-btn:hover { background: #e63962; }
      `}</style>

      {/* Header */}
      <header className="myntra-header">
        <Link href="/" className="brand-logo">
          Twin<span className="pink-text">Mart</span>
        </Link>
        <div className="step-map">
          <span className="step-active">BAG</span>
          <span> --------- </span>
          <span>CHECKOUT</span>
        </div>
      </header>

      {/* Main Grid View */}
      <div className="cart-container">
        
        {/* Products Column */}
        <section>
          <div className="pincode-bar">
            <span>Check delivery time & services</span>
            <span style={{ color: '#ff3f6c', textTransform: 'uppercase', cursor: 'pointer' }}>Enter Pin Code</span>
          </div>

          {cart.map((item) => (
            <article key={item.id} className="cart-card">
              <div className="image-box">
                <img src={item.image_url || "https://unsplash.com"} alt={item.name} />
              </div>

              <div className="details-box">
                <div>
                  <h2 className="item-brand">{item.category || 'Apparel'}</h2>
                  <h3 className="item-title">{item.name}</h3>
                  <div className="price-row">
                    <span className="item-price">₹{Number(item.price).toLocaleString('en-IN')}</span>
                    <span className="item-strike">₹{(Number(item.price) * 2).toLocaleString('en-IN')}</span>
                    <span className="item-discount">(50% OFF)</span>
                  </div>
                </div>

                <div className="action-row">
                  <div className="qty-pill">
                    <button onClick={() => updateQuantity(item.id, -1)} className="qty-btn">−</button>
                    <span className="qty-num">{item.qty}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="qty-btn">+</button>
                  </div>
                  <button onClick={() => removeItem(item.id)} className="remove-btn">Remove</button>
                </div>
              </div>
            </article>
          ))}
        </section>

        {/* Price Breakdown Sidebar Receipt */}
        <aside className="sidebar-card">
          <h2 className="sidebar-title">Price Details ({itemCount} Items)</h2>
          
          <div className="receipt-row">
            <span>Total MRP</span>
            <span>₹{(total * 2).toLocaleString('en-IN')}</span>
          </div>
          <div className="receipt-row green">
            <span>Discount on MRP</span>
            <span>−₹{total.toLocaleString('en-IN')}</span>
          </div>
          <div className="receipt-row">
            <span>Convenience Fee</span>
            <span style={{ color: '#03a685', fontWeight: 'bold' }}>FREE</span>
          </div>

          <div className="receipt-total">
            <span>Total Amount</span>
            <span style={{ color: '#ff3f6c', fontSize: '18px' }}>₹{total.toLocaleString('en-IN')}</span>
          </div>

          <Link href="/checkout" className="place-order-btn">
            Place Order
          </Link>
        </aside>

      </div>
    </main>
  );
}