
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Razorpay from "razorpay";
import { createHmac, timingSafeEqual } from "crypto";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseSecret = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

    if (
      !supabaseUrl ||
      !supabaseSecret ||
      !razorpayKeyId ||
      !razorpayKeySecret
    ) {
      return NextResponse.json(
        { error: "Payment server configuration is incomplete." },
        { status: 500 }
      );
    }

    const body = await request.json();

    const paymentId = body.razorpay_payment_id;
    const orderId = body.razorpay_order_id;
    const signature = body.razorpay_signature;

    if (
      typeof paymentId !== "string" ||
      typeof orderId !== "string" ||
      typeof signature !== "string" ||
      !/^pay_[a-zA-Z0-9]+$/.test(paymentId) ||
      !/^order_[a-zA-Z0-9]+$/.test(orderId) ||
      !/^[a-fA-F0-9]{64}$/.test(signature)
    ) {
      return NextResponse.json(
        { error: "Invalid payment verification details." },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseSecret, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Find the pending order created by our server.
    const { data: pending, error: pendingError } = await supabase
      .from("pending_payment_orders")
      .select("*")
      .eq("razorpay_order_id", orderId)
      .single();

    if (pendingError || !pending) {
      return NextResponse.json(
        { error: "Pending order not found." },
        { status: 404 }
      );
    }

    // Handle repeated verification requests.
    if (pending.status === "paid") {
      const { data: existingOrder } = await supabase
        .from("orders")
        .select("id")
        .eq("razorpay_order_id", orderId)
        .maybeSingle();

      if (existingOrder) {
        return NextResponse.json({
          success: true,
          message: "Payment was already verified.",
          orderId: existingOrder.id,
        });
      }

      return NextResponse.json(
        { error: "This payment has already been processed." },
        { status: 409 }
      );
    }

    // Verify Razorpay signature.
    const expectedSignature = createHmac(
      "sha256",
      razorpayKeySecret
    )
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    const receivedBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expectedSignature, "hex");

    if (
      receivedBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(receivedBuffer, expectedBuffer)
    ) {
      return NextResponse.json(
        { error: "Payment signature verification failed." },
        { status: 400 }
      );
    }

    // Fetch actual payment details from Razorpay.
    const razorpay = new Razorpay({
      key_id: razorpayKeyId,
      key_secret: razorpayKeySecret,
    });

    const payment = await razorpay.payments.fetch(paymentId);

    if (
      payment.order_id !== orderId ||
      payment.amount !== Number(pending.amount_paise) ||
      payment.currency !== "INR"
    ) {
      return NextResponse.json(
        { error: "Payment details do not match your order." },
        { status: 400 }
      );
    }

    // Only captured payments are accepted.
    if (payment.status !== "captured") {
      return NextResponse.json(
        {
          error:
            "Payment has not been captured yet. Please contact support if money was deducted.",
        },
        { status: 400 }
      );
    }

    // Save the verified order.
    const { data: savedOrder, error: insertError } = await supabase
      .from("orders")
      .insert({
        total_price: pending.total_price,
        delivery_address: pending.delivery_address,
        items_summary: pending.items_summary,
        payment_method: "ONLINE",
        payment_id: paymentId,
        razorpay_order_id: orderId,
        status: "Paid",
      })
      .select("id")
      .single();

    if (insertError) {
      // Check whether this order was already saved.
      if (insertError.code === "23505") {
        const { data: existingOrder } = await supabase
          .from("orders")
          .select("id")
          .eq("razorpay_order_id", orderId)
          .maybeSingle();

        if (existingOrder) {
          return NextResponse.json({
            success: true,
            message: "Payment was already verified.",
            orderId: existingOrder.id,
          });
        }
      }

      console.error("Order insert error:", insertError);

      return NextResponse.json(
        {
          error:
            "Payment succeeded, but saving the order failed. Please contact support with your payment ID.",
        },
        { status: 500 }
      );
    }

    // Mark pending record as paid.
    const { error: updateError } = await supabase
      .from("pending_payment_orders")
      .update({
        status: "paid",
        payment_id: paymentId,
        updated_at: new Date().toISOString(),
      })
      .eq("razorpay_order_id", orderId);

    if (updateError) {
      console.error("Pending payment update error:", updateError);
    }

    return NextResponse.json({
      success: true,
      message: "Payment verified and order saved.",
      orderId: savedOrder.id,
    });
  } catch (error) {
    console.error("Payment verification error:", error);

    return NextResponse.json(
      {
        error:
          "Unable to verify payment. Please contact support if money was deducted.",
      },
      { status: 500 }
    );
  }
}
