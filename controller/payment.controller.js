import { Order } from '../models/order.js';
import { sendSuccess, sendError } from '../utils/response.js';
import axios from 'axios';
import { env } from '../config/env.js';
import crypto from 'crypto';

// Initiate Khalti payment
export const initiateKhaltiPayment = async (req, res) => {
  try {
    const { orderId, amount, purchase_order_id, purchase_order_name } = req.body;

    if (!orderId || !amount) {
      return sendError(res, 400, 'Order ID and amount are required');
    }

    // Verify order exists
    const order = await Order.findOne({ orderId });

    if (!order) {
      return sendError(res, 404, 'Order not found');
    }

    if (order.customerId.toString() !== req.user._id.toString()) {
      return sendError(res, 403, 'Access denied');
    }

    // Prepare Khalti payment request
    const payload = {
      return_url: `${env.CLIENT_ORIGIN}/payment/verify`,
      website_url: env.CLIENT_ORIGIN,
      amount: amount * 100, // Convert to paisa
      purchase_order_id: purchase_order_id || order.orderId,
      purchase_order_name: purchase_order_name || `Order ${order.orderId}`,
    };

    // Call Khalti API
    const response = await axios.post('https://khalti.com/api/v2/epayment/initiate/', payload, {
      headers: {
        Authorization: `Key ${env.KHALTI_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    // Store transaction ID in order
    order.khaltiTransactionId = response.data.pidx;
    await order.save();

    return sendSuccess(res, {
      data: {
        payment_url: response.data.payment_url,
        pidx: response.data.pidx,
      },
      message: 'Payment initiated successfully',
    });
  } catch (error) {
    console.error('Khalti payment error:', error.response?.data || error.message);
    return sendError(res, 500, 'Failed to initiate payment', error.message);
  }
};

// Verify Khalti payment
export const verifyKhaltiPayment = async (req, res) => {
  try {
    const { pidx } = req.body;

    if (!pidx) {
      return sendError(res, 400, 'Payment ID is required');
    }

    // Verify with Khalti
    const response = await axios.post(
      'https://khalti.com/api/v2/epayment/lookup/',
      { pidx },
      {
        headers: {
          Authorization: `Key ${env.KHALTI_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const paymentData = response.data;

    if (paymentData.status !== 'Completed') {
      return sendError(res, 400, 'Payment not completed');
    }

    // Find and update order
    const order = await Order.findOne({ khaltiTransactionId: pidx });

    if (!order) {
      return sendError(res, 404, 'Order not found');
    }

    order.paymentStatus = 'paid';
    await order.save();

    return sendSuccess(res, {
      data: { order, payment: paymentData },
      message: 'Payment verified successfully',
    });
  } catch (error) {
    console.error('Khalti verification error:', error.response?.data || error.message);
    return sendError(res, 500, 'Failed to verify payment', error.message);
  }
};

// Get payment transactions
export const getTransactions = async (req, res) => {
  try {
    const orders = await Order.find({
      customerId: req.user._id,
      paymentMethod: 'khalti',
    })
      .select('orderId total paymentStatus khaltiTransactionId createdAt')
      .sort({ createdAt: -1 });

    return sendSuccess(res, { data: { transactions: orders } });
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch transactions', error.message);
  }
};

// Initiate Esewa payment
export const initiateEsewaPayment = async (req, res) => {
  try {
    const { orderId, amount } = req.body;

    // Additional validation (validation middleware should catch this, but just in case)
    if (!orderId) {
      return sendError(res, 400, 'Order ID is required');
    }

    const amountNum = typeof amount === 'string' ? parseFloat(amount) : parseFloat(amount);
    if (amountNum === null || amountNum === undefined || isNaN(amountNum) || amountNum < 0) {
      return sendError(res, 400, 'Valid amount is required (must be a number >= 0)');
    }

    // Verify order exists
    const order = await Order.findOne({ orderId });

    if (!order) {
      return sendError(res, 404, 'Order not found');
    }

    if (order.customerId.toString() !== req.user._id.toString()) {
      return sendError(res, 403, 'Access denied');
    }

    if (order.paymentMethod !== 'esewa') {
      return sendError(res, 400, 'Order payment method is not esewa');
    }

    // Esewa payment parameters
    const merchantId = env.ESEWA_MERCHANT_ID || 'EPAYTEST';
    const successUrl = `${env.CLIENT_ORIGIN}/payment/verify?status=success`;
    const failureUrl = `${env.CLIENT_ORIGIN}/payment/verify?status=failure`;

    // Determine if we're in test mode
    const isTestMode = 
      env.NODE_ENV === 'development' || 
      merchantId === 'EPAYTEST' || 
      env.ESEWA_ENV === 'test' ||
      process.env.ESEWA_ENV === 'test';

    // Use appropriate eSewa URL based on environment
    const paymentUrl = isTestMode
      ? 'https://uat.esewa.com.np/epay/main'  // UAT (test) environment
      : 'https://esewa.com.np/epay/main';     // Production environment

    console.log(`🌐 eSewa Environment: ${isTestMode ? 'TEST (UAT)' : 'PRODUCTION'}`);
    console.log(`🔗 Payment URL: ${paymentUrl}`);

    // Calculate amounts for eSewa
    // eSewa expects: amt (product amount), psc (product service charge), 
    // pdc (product delivery charge), txAmt (tax), tAmt (total = amt + psc + pdc + txAmt)
    const productServiceCharge = 0;
    const deliveryCharge = order.deliveryFee || 0;
    const taxAmount = 0;
    
    // Calculate product amount (subtotal after discount)
    const productAmount = order.subtotal - (order.discount || 0);
    
    // Calculate total amount (must equal amt + psc + pdc + txAmt)
    const totalAmount = productAmount + productServiceCharge + deliveryCharge + taxAmount;
    
    // Verify calculation matches order total
    if (Math.abs(totalAmount - order.total) > 0.01) {
      console.warn(`Amount mismatch: calculated ${totalAmount}, order total ${order.total}`);
    }
    
    // Generate hash for eSewa payment verification
    // eSewa uses MD5 hash of: totalAmount,transactionUUID,productCode,secretKey
    // For form-based payment, we'll generate it when verifying
    const transactionId = `ESEWA_${order.orderId}_${Date.now()}`;
    order.esewaTransactionId = transactionId;
    await order.save();

    // Prepare form data - eSewa requires all values to be strings
    // CRITICAL: Ensure amt is always present and is a valid number
    const formData = {
      amt: String(productAmount.toFixed(2)), // Product amount - MUST be present
      psc: String(productServiceCharge.toFixed(2)), // Product service charge
      pdc: String(deliveryCharge.toFixed(2)), // Delivery charge
      txAmt: String(taxAmount.toFixed(2)), // Tax amount
      tAmt: String(totalAmount.toFixed(2)), // Total = amt + psc + pdc + txAmt
      pid: String(order.orderId), // Product ID (order ID)
      scd: String(merchantId), // Service code (merchant ID)
      su: String(successUrl), // Success URL
      fu: String(failureUrl), // Failure URL
    };

    // Log for debugging
    console.log('📤 eSewa Payment Data:', {
      orderId: order.orderId,
      formData,
      totalAmount,
      orderTotal: order.total
    });

    // Return payment URL and form data for frontend to submit
    return sendSuccess(res, {
      data: {
        payment_url: paymentUrl,
        transactionId: transactionId,
        formData: formData,
      },
      message: 'Esewa payment initiated successfully',
    });
  } catch (error) {
    console.error('Esewa payment error:', error.response?.data || error.message);
    return sendError(res, 500, 'Failed to initiate payment', error.message);
  }
};

// Verify Esewa payment
export const verifyEsewaPayment = async (req, res) => {
  try {
    const { orderId, amount, refId, signature } = req.body;

    if (!orderId || !amount || !refId) {
      return sendError(res, 400, 'Order ID, amount, and reference ID are required');
    }

    // Find order
    const order = await Order.findOne({ orderId });

    if (!order) {
      return sendError(res, 404, 'Order not found');
    }

    if (order.customerId.toString() !== req.user._id.toString()) {
      return sendError(res, 403, 'Access denied');
    }

    // Verify amount matches
    const amountNum = typeof amount === 'string' ? parseFloat(amount) : parseFloat(amount);
    if (Math.abs(parseFloat(order.total) - amountNum) > 0.01) {
      return sendError(res, 400, 'Amount mismatch');
    }

    // Verify signature if provided (eSewa sends signature in callback)
    // eSewa signature format: MD5(totalAmount + transactionUUID + productCode + secretKey)
    if (signature) {
      const secretKey = env.ESEWA_SECRET_KEY || '8gBm/:&EnhH.1/q';
      const merchantId = env.ESEWA_MERCHANT_ID || 'EPAYTEST';
      const expectedHash = crypto
        .createHash('md5')
        .update(`${amountNum}${refId}${order.orderId}${secretKey}`)
        .digest('hex');

      if (signature.toLowerCase() !== expectedHash.toLowerCase()) {
        console.error('Esewa signature mismatch:', { received: signature, expected: expectedHash });
        return sendError(res, 400, 'Invalid payment signature');
      }
    }

    // Update order payment status
    order.paymentStatus = 'paid';
    order.esewaTransactionId = refId;
    await order.save();

    return sendSuccess(res, {
      data: { order },
      message: 'Payment verified successfully',
    });
  } catch (error) {
    console.error('Esewa verification error:', error.response?.data || error.message);
    return sendError(res, 500, 'Failed to verify payment', error.message);
  }
};


