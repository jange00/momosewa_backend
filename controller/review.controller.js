import { Review } from '../models/review.js';
import { Order } from '../models/order.js';
import { Product } from '../models/product.js';
import { Vendor } from '../models/vendor.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { uploadMultipleToCloudinary } from '../middlewares/upload.middleware.js';

// Create review (Customer, after order delivered)
export const createReview = async (req, res) => {
  try {
    const { orderId, productId, rating, comment } = req.body;

    // Verify order exists and is delivered
    const order = await Order.findById(orderId);

    if (!order) {
      return sendError(res, 404, 'Order not found');
    }

    if (order.customerId.toString() !== req.user._id.toString()) {
      return sendError(res, 403, 'Access denied');
    }

    if (order.status !== 'delivered') {
      return sendError(res, 400, 'Order must be delivered before reviewing');
    }

    // Check if review already exists
    const existingReview = await Review.findOne({ orderId });
    if (existingReview) {
      return sendError(res, 400, 'Review already exists for this order');
    }

    // Upload images if provided
    let images = [];
    if (req.files && req.files.length > 0) {
      images = await uploadMultipleToCloudinary(req.files);
    }

    const review = await Review.create({
      orderId,
      customerId: req.user._id,
      vendorId: order.vendorId,
      productId: productId || null,
      rating,
      comment: comment || null,
      images,
    });

    // Update product rating if productId provided
    if (productId) {
      await updateProductRating(productId);
    }

    // Update vendor rating
    await updateVendorRating(order.vendorId);

    return sendSuccess(res, {
      data: { review },
      message: 'Review created successfully',
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to create review', error.message);
  }
};

// Get reviews (with filters)
export const getReviews = async (req, res) => {
  try {
    const { product, vendor, customer, page = 1, limit = 20 } = req.query;
    const query = {};

    if (product) query.productId = product;
    if (vendor) query.vendorId = vendor;
    if (customer) query.customerId = customer;

    const skip = (Number(page) - 1) * Number(limit);

    const reviews = await Review.find(query)
      .populate('customerId', 'name profilePicture')
      .populate('productId', 'name image')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Review.countDocuments(query);

    return sendSuccess(res, {
      data: {
        reviews,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch reviews', error.message);
  }
};

// Get review details
export const getReviewById = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate('customerId', 'name profilePicture')
      .populate('productId', 'name image')
      .populate('vendorId', 'storeName');

    if (!review) {
      return sendError(res, 404, 'Review not found');
    }

    return sendSuccess(res, { data: { review } });
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch review', error.message);
  }
};

// Update review (Owner only)
export const updateReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return sendError(res, 404, 'Review not found');
    }

    if (review.customerId.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      return sendError(res, 403, 'Access denied');
    }

    const { rating, comment } = req.body;
    if (rating) review.rating = rating;
    if (comment !== undefined) review.comment = comment;

    await review.save();

    // Update ratings
    if (review.productId) {
      await updateProductRating(review.productId);
    }
    await updateVendorRating(review.vendorId);

    return sendSuccess(res, {
      data: { review },
      message: 'Review updated successfully',
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to update review', error.message);
  }
};

// Delete review (Owner/Admin)
export const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return sendError(res, 404, 'Review not found');
    }

    if (review.customerId.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      return sendError(res, 403, 'Access denied');
    }

    const productId = review.productId;
    const vendorId = review.vendorId;

    await Review.findByIdAndDelete(req.params.id);

    // Update ratings
    if (productId) {
      await updateProductRating(productId);
    }
    await updateVendorRating(vendorId);

    return sendSuccess(res, { message: 'Review deleted successfully' });
  } catch (error) {
    return sendError(res, 500, 'Failed to delete review', error.message);
  }
};

// Helper functions
async function updateProductRating(productId) {
  const reviews = await Review.find({ productId });
  if (reviews.length === 0) return;

  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  await Product.findByIdAndUpdate(productId, {
    rating: avgRating,
    reviewCount: reviews.length,
  });
}

async function updateVendorRating(vendorId) {
  const reviews = await Review.find({ vendorId });
  if (reviews.length === 0) return;

  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  await Vendor.findByIdAndUpdate(vendorId, { rating: avgRating });
}


