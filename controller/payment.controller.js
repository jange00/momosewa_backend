import { Order } from '../models/order.js';
import { Vendor } from '../models/vendor.js';
import { sendSuccess, sendError } from '../utils/response.js';
import axios from 'axios';
import { env } from '../config/env.js';
import mongoose from 'mongoose';
import {
  generateEsewaTransactionId,
  generateEsewaPaymentUrl,
  verifyEsewaSignature,
  verifyPaymentWithEsewa,
} from '../utils/esewa.js';
import {
  createCustomerPaymentNotification,
  createVendorPaymentNotification,
} from '../services/notification.service.js';

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
    order.paymentDate = new Date();
    await order.save();

    // Create payment notifications for customer and vendor
    try {
      // Notify customer
      await createCustomerPaymentNotification(
        order.customerId,
        order._id,
        'paid',
        order.total
      );

      // Notify vendor
      const vendor = await Vendor.findById(order.vendorId);
      if (vendor) {
        await createVendorPaymentNotification(
          vendor.userId,
          order._id,
          'paid',
          order.total
        );
      }
    } catch (error) {
      console.error('Error creating payment notifications:', error);
    }

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
      paymentMethod: { $in: ['khalti', 'esewa'] },
    })
      .select('orderId total paymentStatus khaltiTransactionId esewaTransactionId createdAt')
      .sort({ createdAt: -1 });

    return sendSuccess(res, { data: { transactions: orders } });
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch transactions', error.message);
  }
};

// ==================== eSewa Payment Functions ====================

// Initiate eSewa payment
export const initiateEsewaPayment = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return sendError(res, 400, 'Order ID is required');
    }

    // Verify order exists and belongs to user
    // Search by both orderId field and _id (in case frontend sends either)
    let order;
    
    // If orderId looks like MongoDB ObjectId, search both orderId field and _id
    if (mongoose.Types.ObjectId.isValid(orderId) && orderId.length === 24) {
      order = await Order.findOne({
        $or: [
          { orderId: orderId },
          { _id: new mongoose.Types.ObjectId(orderId) }
        ]
      });
    } else {
      // Just search by orderId field (e.g., "ORD-XXXXX-XXXXX")
      order = await Order.findOne({ orderId });
    }

    if (!order) {
      console.error('Order not found for orderId:', orderId);
      return sendError(res, 404, `Order not found with ID: ${orderId}`);
    }

    if (order.customerId.toString() !== req.user._id.toString()) {
      return sendError(res, 403, 'Access denied');
    }

    if (order.paymentMethod !== 'esewa') {
      return sendError(res, 400, 'Order payment method is not eSewa');
    }

    if (order.paymentStatus === 'paid') {
      return sendError(res, 400, 'Order is already paid');
    }

    // Generate transaction ID
    const transactionId = generateEsewaTransactionId(order.orderId);

    // Generate payment URL
    const { paymentUrl, params } = generateEsewaPaymentUrl({
      transactionId,
      amount: order.total,
      productName: `Order ${order.orderId}`,
    });

    // Store transaction ID in order
    order.esewaTransactionId = transactionId;
    order.paymentStatus = 'processing';
    await order.save();

    return sendSuccess(res, {
      data: {
        paymentUrl,
        transactionId,
        orderId: order.orderId,
      },
      message: 'eSewa payment initiated successfully',
    });
  } catch (error) {
    console.error('eSewa payment initiation error:', error);
    return sendError(res, 500, 'Failed to initiate eSewa payment', error.message);
  }
};

// eSewa webhook handler
export const esewaWebhook = async (req, res) => {
  try {
    const { oid, amt, refId, signature } = req.body;

    if (!oid || !amt || !refId) {
      return sendError(res, 400, 'Missing required parameters');
    }

    // Find order by transaction ID
    const order = await Order.findOne({ esewaTransactionId: oid });

    if (!order) {
      console.error('Order not found for transaction:', oid);
      return sendError(res, 404, 'Order not found');
    }

    // Verify signature
    const tAmt = parseFloat(amt).toFixed(2);
    const isValidSignature = verifyEsewaSignature(
      { oid, tAmt },
      signature
    );

    if (!isValidSignature) {
      console.error('Invalid signature for transaction:', oid);
      order.paymentStatus = 'failed';
      order.esewaResponse = { error: 'Invalid signature', ...req.body };
      await order.save();

      // Notify about payment failure
      try {
        await createCustomerPaymentNotification(order.customerId, order._id, 'failed', order.total);
        const vendor = await Vendor.findById(order.vendorId);
        if (vendor) {
          await createVendorPaymentNotification(vendor.userId, order._id, 'failed', order.total);
        }
      } catch (error) {
        console.error('Error creating payment failure notifications:', error);
      }

      return sendError(res, 400, 'Invalid signature');
    }

    // Verify amount matches
    if (Math.abs(parseFloat(amt) - order.total) > 0.01) {
      console.error('Amount mismatch for transaction:', oid, 'Expected:', order.total, 'Received:', amt);
      order.paymentStatus = 'failed';
      order.esewaResponse = { error: 'Amount mismatch', ...req.body };
      await order.save();

      // Notify about payment failure
      try {
        await createCustomerPaymentNotification(order.customerId, order._id, 'failed', order.total);
        const vendor = await Vendor.findById(order.vendorId);
        if (vendor) {
          await createVendorPaymentNotification(vendor.userId, order._id, 'failed', order.total);
        }
      } catch (error) {
        console.error('Error creating payment failure notifications:', error);
      }

      return sendError(res, 400, 'Amount mismatch');
    }

    // Verify payment with eSewa API (additional verification)
    const verification = await verifyPaymentWithEsewa(oid, parseFloat(amt));

    if (!verification.success) {
      console.error('eSewa verification failed for transaction:', oid);
      order.paymentStatus = 'failed';
      order.esewaResponse = { error: 'Verification failed', verification, ...req.body };
      await order.save();

      // Notify customer and vendor about payment failure
      try {
        await createCustomerPaymentNotification(order.customerId, order._id, 'failed', order.total);
        const vendor = await Vendor.findById(order.vendorId);
        if (vendor) {
          await createVendorPaymentNotification(vendor.userId, order._id, 'failed', order.total);
        }
      } catch (error) {
        console.error('Error creating payment failure notifications:', error);
      }

      return sendError(res, 400, 'Payment verification failed');
    }

    // Check if already processed (idempotency)
    if (order.paymentStatus === 'paid') {
      return sendSuccess(res, {
        message: 'Payment already processed',
        data: { orderId: order.orderId },
      });
    }

    // Update order payment status
    order.paymentStatus = 'paid';
    order.esewaRefId = refId;
    order.paymentDate = new Date();
    order.esewaResponse = { ...req.body, verified: true };
    order.status = 'preparing'; // Move order to next status
    await order.save();

    // Create payment notifications for customer and vendor
    try {
      // Notify customer
      await createCustomerPaymentNotification(
        order.customerId,
        order._id,
        'paid',
        order.total
      );

      // Notify vendor
      const vendor = await Vendor.findById(order.vendorId);
      if (vendor) {
        await createVendorPaymentNotification(
          vendor.userId,
          order._id,
          'paid',
          order.total
        );
      }
    } catch (error) {
      console.error('Error creating payment notifications:', error);
    }

    // TODO: Emit socket event for real-time update
    // TODO: Send notification to customer

    return sendSuccess(res, {
      message: 'Payment verified successfully',
      data: {
        orderId: order.orderId,
        transactionId: oid,
        refId,
      },
    });
  } catch (error) {
    console.error('eSewa webhook error:', error);
    return sendError(res, 500, 'Failed to process webhook', error.message);
  }
};

// Verify eSewa payment status
export const verifyEsewaPayment = async (req, res) => {
  try {
    const { transactionId } = req.params;

    if (!transactionId) {
      return sendError(res, 400, 'Transaction ID is required');
    }

    const order = await Order.findOne({ esewaTransactionId: transactionId });

    if (!order) {
      return sendError(res, 404, 'Order not found');
    }

    // Verify user owns this order
    if (order.customerId.toString() !== req.user._id.toString()) {
      return sendError(res, 403, 'Access denied');
    }

    return sendSuccess(res, {
      data: {
        paymentStatus: order.paymentStatus,
        orderId: order.orderId,
        transactionId: order.esewaTransactionId,
        esewaRefId: order.esewaRefId,
        paidAt: order.paymentDate,
      },
    });
  } catch (error) {
    console.error('eSewa verification error:', error);
    return sendError(res, 500, 'Failed to verify payment', error.message);
  }
};

// eSewa success redirect handler
export const esewaSuccess = async (req, res) => {
  try {
    const { oid, amt, refId } = req.query;

    if (!oid) {
      return res.redirect(`${env.FRONTEND_URL}/checkout/failure?error=missing_parameters`);
    }

    const order = await Order.findOne({ esewaTransactionId: oid });

    if (!order) {
      return res.redirect(`${env.FRONTEND_URL}/checkout/failure?error=order_not_found`);
    }

    // If payment is already verified, redirect to success
    if (order.paymentStatus === 'paid') {
      return res.redirect(`${env.FRONTEND_URL}/checkout/success?orderId=${order.orderId}`);
    }

    // Payment might still be processing, redirect to success page
    // Frontend can poll or webhook will handle verification
    return res.redirect(`${env.FRONTEND_URL}/checkout/success?orderId=${order.orderId}&transactionId=${oid}`);
  } catch (error) {
    console.error('eSewa success redirect error:', error);
    return res.redirect(`${env.FRONTEND_URL}/checkout/failure?error=server_error`);
  }
};

// eSewa failure redirect handler
export const esewaFailure = async (req, res) => {
  try {
    const { oid, amt } = req.query;

    if (oid) {
      const order = await Order.findOne({ esewaTransactionId: oid });
      if (order && order.paymentStatus !== 'paid') {
        order.paymentStatus = 'failed';
        order.esewaResponse = { failure: true, ...req.query };
        await order.save();
      }
    }

    const orderId = oid ? (await Order.findOne({ esewaTransactionId: oid }))?.orderId : null;
    const redirectUrl = orderId
      ? `${env.FRONTEND_URL}/checkout/failure?orderId=${orderId}&error=payment_failed`
      : `${env.FRONTEND_URL}/checkout/failure?error=payment_failed`;

    return res.redirect(redirectUrl);
  } catch (error) {
    console.error('eSewa failure redirect error:', error);
    return res.redirect(`${env.FRONTEND_URL}/checkout/failure?error=server_error`);
  }
};


