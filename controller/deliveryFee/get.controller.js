import { calculateDeliveryFee } from '../../utils/calculateDeliveryFee.js';
import { sendSuccess, sendError } from '../../utils/response.js';

// Get delivery fee for a given order total
export const getDeliveryFee = async (req, res) => {
  try {
    const { orderTotal } = req.query;

    if (!orderTotal) {
      return sendError(res, 400, 'Order total is required');
    }

    const total = parseFloat(orderTotal);
    
    if (isNaN(total) || total < 0) {
      return sendError(res, 400, 'Invalid order total');
    }

    const deliveryFee = calculateDeliveryFee(total);

    return sendSuccess(res, {
      data: {
        orderTotal: total,
        deliveryFee,
        freeDeliveryThreshold: 500,
        isFreeDelivery: deliveryFee === 0,
      },
      message: 'Delivery fee calculated successfully',
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to calculate delivery fee', error.message);
  }
};




