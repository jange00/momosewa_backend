/**
 * Calculate delivery fee based on order total
 * Free delivery if order total > Rs. 500
 * Otherwise, Rs. 50 delivery fee
 */
export function calculateDeliveryFee(orderTotal) {
  const FREE_DELIVERY_THRESHOLD = 500;
  const DELIVERY_FEE = 50;
  
  return orderTotal > FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
}


