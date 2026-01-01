import crypto from 'crypto';
import { env } from '../config/env.js';

/**
 * Generate unique transaction ID for eSewa payment
 * Format: ORDER-{orderId}-{timestamp}-{random}
 */
export function generateEsewaTransactionId(orderId) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `ORDER-${orderId}-${timestamp}-${random}`;
}

/**
 * Generate eSewa payment signature
 * eSewa uses MD5 hash of: amt,pid,scd,su,fu
 */
export function generateEsewaSignature(data) {
  const { amt, pid, scd, su, fu } = data;
  const message = `total_amount=${data.tAmt},transaction_uuid=${pid},product_code=${scd}`;
  
  // For Epay-v2, we use HMAC-SHA256 with secret key
  const hmac = crypto.createHmac('sha256', env.ESEWA_SECRET_KEY);
  hmac.update(message);
  return hmac.digest('base64');
}

/**
 * Verify esewa signature from webhook/callback
 */
export function verifyEsewaSignature(data, signature) {
  try {
    const message = `total_amount=${data.tAmt},transaction_uuid=${data.oid},product_code=${env.ESEWA_MERCHANT_ID}`;
    const hmac = crypto.createHmac('sha256', env.ESEWA_SECRET_KEY);
    hmac.update(message);
    const calculatedSignature = hmac.digest('base64');
    
    return calculatedSignature === signature;
  } catch (error) {
    console.error('Error verifying eSewa signature:', error);
    return false;
  }
}

/**
 * Generate eSewa payment URL with parameters
 */
export function generateEsewaPaymentUrl(orderData) {
  const {
    transactionId,
    amount,
    productName,
  } = orderData;

  const merchantId = env.ESEWA_MERCHANT_ID;
  const successUrl = env.ESEWA_SUCCESS_URL;
  const failureUrl = env.ESEWA_FAILURE_URL;

  // Calculate amounts (eSewa format)
  const amt = amount.toFixed(2); // Product/service charge
  const psc = '0'; // Service charge
  const pdc = '0'; // Delivery charge
  const txAmt = amount.toFixed(2); // Tax amount
  const tAmt = (parseFloat(amt) + parseFloat(psc) + parseFloat(pdc) + parseFloat(txAmt)).toFixed(2); // Total amount

  // Generate signature
  const signatureData = {
    amt,
    pid: transactionId,
    scd: merchantId,
    su: successUrl,
    fu: failureUrl,
    tAmt,
  };
  const signature = generateEsewaSignature(signatureData);

  // Build payment URL
  const baseUrl = env.ESEWA_API_URL;
  const params = new URLSearchParams({
    amt,
    psc,
    pdc,
    txAmt,
    tAmt,
    pid: transactionId,
    scd: merchantId,
    su: successUrl,
    fu: failureUrl,
  });

  // For Epay-v2, we need to include signature
  params.append('signature', signature);

  const paymentUrl = `${baseUrl}/epay/main?${params.toString()}`;

  return {
    paymentUrl,
    params: {
      amt,
      psc,
      pdc,
      txAmt,
      tAmt,
      pid: transactionId,
      scd: merchantId,
      su: successUrl,
      fu: failureUrl,
      signature,
    },
  };
}

/**
 * Verify payment with eSewa API (for webhook/callback verification)
 */
export async function verifyPaymentWithEsewa(transactionId, amount) {
  try {
    const axios = (await import('axios')).default;
    const merchantId = env.ESEWA_MERCHANT_ID;
    const message = `total_amount=${amount.toFixed(2)},transaction_uuid=${transactionId},product_code=${merchantId}`;
    
    // Generate signature for verification
    const hmac = crypto.createHmac('sha256', env.ESEWA_SECRET_KEY);
    hmac.update(message);
    const signature = hmac.digest('base64');

    // Call eSewa verification API
    const verifyUrl = `${env.ESEWA_API_URL}/epay/transrec`;
    const response = await axios.post(
      verifyUrl,
      new URLSearchParams({
        amt: amount.toFixed(2),
        rid: transactionId, // Reference ID from eSewa
        pid: transactionId, // Transaction ID
        scd: merchantId,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    // eSewa returns XML response, parse it
    const responseText = response.data;
    const successMatch = responseText.match(/<response_code>([^<]+)<\/response_code>/);
    const success = successMatch && successMatch[1] === 'Success';

    return {
      success,
      response: responseText,
    };
  } catch (error) {
    console.error('Error verifying payment with eSewa:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}







