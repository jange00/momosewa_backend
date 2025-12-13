import { Order } from '../models/order.js';
import { sendSuccess, sendError } from '../utils/response.js';
import axios from 'axios';
import { env } from '../config/env.js';

/**
 * Initiate Khalti payment
 */
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

/**
 * Verify Khalti payment
 */
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

/**
 * Get payment transactions
 */
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


