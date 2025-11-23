import express from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

router.post("/create-order", async (req, res) => {
  try {
    const { amount, currency = "INR", receipt = "receipt#1" } = req.body;
    if (!amount) return res.status(400).json({ error: "Amount is required" });

    const options = {
      amount: Math.round(amount * 100),
      currency,
      receipt,
      payment_capture: 1,
    };

    const order = await razorpay.orders.create(options);

    console.log("🟦 ORDER CREATED:", {
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
    });

    return res.json(order);
  } catch (err) {
    console.error("❌ Error creating order:", err);
    return res.status(500).json({ error: "Failed to create order", details: err.message });
  }
});

router.post("/verify-payment", async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    console.log("🟨 VERIFY PAYMENT ATTEMPT:", {
      razorpay_order_id,
      razorpay_payment_id,
    });

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      console.log("❌ Verification failed: Missing fields");
      return res.status(400).json({ error: "Missing payment fields" });
    }

    const signString = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(signString)
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      console.log("🟩 PAYMENT VERIFIED SUCCESSFULLY:", {
        razorpay_order_id,
        razorpay_payment_id,
      });

      return res.json({ success: true, message: "Payment verified successfully" });
    } else {
      console.log("🟥 INVALID SIGNATURE for:", {
        razorpay_order_id,
        razorpay_payment_id,
      });

      return res.status(400).json({ success: false, message: "Invalid signature" });
    }
  } catch (err) {
    console.error("❌ Error verifying payment:", err);
    return res.status(500).json({ error: "Payment verification failed", details: err.message });
  }
});

export default router;
