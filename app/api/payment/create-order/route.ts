import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Razorpay from "razorpay";
import { randomUUID } from "crypto";

export const runtime = "nodejs";
const allowedOrigins = [
  "https://localhost",
  "http://localhost",
  "capacitor://localhost",
  "https://twinmart-app.vercel.app",
];

function getCorsHeaders(request: NextRequest) {
  const origin = request.headers.get("origin");

  return {
    ...(origin && allowedOrigins.includes(origin)
      ? { "Access-Control-Allow-Origin": origin }
      : {}),
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}
function corsJson(
  request: NextRequest,
  body: unknown,
  init?: { status?: number }
) {
  return NextResponse.json(body, {
    ...init,
    headers: getCorsHeaders(request),
  });
}
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(request),
  });
}

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseSecret = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!supabaseUrl || !supabaseSecret || !razorpayKeyId || !razorpayKeySecret) {
      return corsJson(request,
        { error: "Payment server configuration is incomplete." },
        { status: 500 }
      );
    }

    const body = await request.json();

    const address =
      typeof body.address === "string" ? body.address.trim() : "";

    const items = body.items;

    if (!address || address.length > 500) {
      return corsJson(request,
        { error: "Please provide a valid delivery address." },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
      return corsJson(request,
        { error: "Your cart is empty or invalid." },
        { status: 400 }
      );
    }

    // Validate product IDs and quantities.
    const quantityMap = new Map<number, number>();

    for (const item of items) {
      const id = Number(item.id);
      const qty = Number(item.qty);

      if (
        !Number.isSafeInteger(id) ||
        id <= 0 ||
        !Number.isSafeInteger(qty) ||
        qty < 1 ||
        qty > 20
      ) {
        return corsJson(request,
          { error: "Invalid product or quantity." },
          { status: 400 }
        );
      }

      quantityMap.set(id, (quantityMap.get(id) || 0) + qty);
    }

    const productIds = [...quantityMap.keys()];

    // Server-side Supabase connection.
    const supabase = createClient(supabaseUrl, supabaseSecret, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Fetch genuine prices from the products table.
    const { data: products, error: productError } = await supabase
      .from("products")
      .select("id, name, price")
      .in("id", productIds);

    if (productError || !products || products.length !== productIds.length) {
      return corsJson(request,
        { error: "Some products could not be found. Please refresh your cart." },
        { status: 400 }
      );
    }

    let amountPaise = 0;

    const summary = products.map((product) => {
      const qty = quantityMap.get(Number(product.id)) || 0;
      const price = Number(product.price);

      if (!Number.isFinite(price) || price < 0 || qty <= 0) {
        throw new Error("Invalid product price.");
      }

      amountPaise += Math.round(price * 100) * qty;

      return `${product.name} x ${qty}`;
    }).join(", ");

    if (!Number.isSafeInteger(amountPaise) || amountPaise <= 0) {
      return corsJson(request,
        { error: "Invalid payment amount." },
        { status: 400 }
      );
    }

    const totalPrice = amountPaise / 100;

    // Create Razorpay order.
    const razorpay = new Razorpay({
      key_id: razorpayKeyId,
      key_secret: razorpayKeySecret,
    });

    const receipt = `tm_${randomUUID().replace(/-/g, "").slice(0, 24)}`;

    const razorpayOrder = await razorpay.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt,
    });

    // Save the pending order before payment begins.
    const { error: pendingError } = await supabase
      .from("pending_payment_orders")
      .insert({
        razorpay_order_id: razorpayOrder.id,
        total_price: totalPrice,
        amount_paise: amountPaise,
        delivery_address: address,
        items_summary: summary,
        status: "created",
      });

    if (pendingError) {
      console.error("Pending order save error:", pendingError);

      return corsJson(request,
        { error: "Could not save your pending order. Please try again." },
        { status: 500 }
      );
    }

    return corsJson(request,{
      keyId: razorpayKeyId,
      orderId: razorpayOrder.id,
      amount: amountPaise,
      currency: "INR",
    });

  } catch (error) {
    console.error("Create payment order error:", error);

    return corsJson(request,
      { error: "Unable to start payment. Please try again." },
      { status: 500 }
    );
  }
}