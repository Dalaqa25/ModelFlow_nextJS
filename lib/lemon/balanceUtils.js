import User from "@/lib/db/User";
import connect from "@/lib/db/connect";

/**
 * Updates user balance after a successful sale
 * @param {string} userEmail - Email of the seller
 * @param {Object} saleData - Sale information
 * @param {string} saleData.modelId - ID of the sold model
 * @param {string} saleData.modelName - Name of the sold model
 * @param {string} saleData.buyerEmail - Email of the buyer
 * @param {number} saleData.amount - Sale amount in cents (seller's cut)
 * @param {string} saleData.lemonSqueezyOrderId - LemonSqueezy order ID
 * @param {Date} [saleData.earnedAt] - Date of the sale (defaults to now)
 * @returns {Promise<Object>} Updated user object with balance information
 */
export async function updateUserBalance(userEmail, saleData) {
  await connect();
  
  const {
    modelId,
    modelName,
    buyerEmail,
    amount,
    lemonSqueezyOrderId,
    earnedAt = new Date()
  } = saleData;

  // Validate required fields
  if (!userEmail || !modelId || !buyerEmail || !amount || !lemonSqueezyOrderId) {
    throw new Error('Missing required fields for balance update');
  }

  // Find the seller
  const seller = await User.findOne({ email: userEmail });
  if (!seller) {
    throw new Error(`Seller not found: ${userEmail}`);
  }

  // Create new earning entry
  const newEarning = {
    modelId,
    modelName,
    buyerEmail,
    amount,
    lemonSqueezyOrderId,
    earnedAt,
    releaseAt: new Date(earnedAt.getTime() + 5 * 60 * 1000) // earnedAt + 5 minutes
  };

  // Add to earnings history
  seller.earningsHistory.push(newEarning);

  // Recalculate total earnings from earnings history (ensures accuracy)
  seller.totalEarnings = seller.earningsHistory.reduce((total, earning) => total + earning.amount, 0);

  // Save the updated seller
  await seller.save();

  return {
    userId: seller._id,
    email: seller.email,
    totalEarnings: seller.totalEarnings,
    withdrawnAmount: seller.withdrawnAmount,
    newEarning
  };
}

/**
 * Recalculates user balance from earnings history
 * Useful for fixing inconsistencies or after withdrawals
 * @param {string} userEmail - Email of the user
 * @returns {Promise<Object>} Updated balance information
 */
export async function recalculateUserBalance(userEmail) {
  await connect();
  
  const user = await User.findOne({ email: userEmail });
  if (!user) {
    throw new Error(`User not found: ${userEmail}`);
  }

  // Recalculate total earnings from earnings history
  user.totalEarnings = user.earningsHistory.reduce((total, earning) => total + earning.amount, 0);

  await user.save();

  return {
    userId: user._id,
    email: user.email,
    totalEarnings: user.totalEarnings,
    withdrawnAmount: user.withdrawnAmount
  };
}

/**
 * Calculates seller's cut from total sale amount
 * @param {number} totalAmount - Total sale amount in cents
 * @param {number} [platformFeePercent=0.2] - Platform fee percentage (default 20%)
 * @returns {number} Seller's cut in cents
 */
export function calculateSellerCut(totalAmount, platformFeePercent = 0.2) {
  if (typeof totalAmount !== 'number' || totalAmount < 0) {
    throw new Error('Total amount must be a positive number');
  }
  
  const sellerPercent = 1 - platformFeePercent;
  return Math.floor(totalAmount * sellerPercent);
}

/**
 * Formats amount from cents to dollars for display
 * @param {number} amountInCents - Amount in cents
 * @returns {string} Formatted amount (e.g., "$5.00")
 */
export function formatCurrency(amountInCents) {
  if (typeof amountInCents !== 'number') {
    return '$0.00';
  }
  return `$${(amountInCents / 100).toFixed(2)}`;
}

/**
 * Validates webhook sale data
 * @param {Object} webhookBody - LemonSqueezy webhook body
 * @returns {Object} Validated sale data
 */
export function validateWebhookSaleData(webhookBody) {
  const buyerEmail = webhookBody.data?.attributes?.user_email;
  const customData = webhookBody.meta?.custom_data || webhookBody.data?.attributes?.custom_data;
  const orderId = webhookBody.data?.id;
  const totalAmount = webhookBody.data?.attributes?.total;

  const modelId = customData?.model_id;
  const modelName = customData?.model_name;
  const authorEmail = customData?.author_email;

  // Validate required fields
  if (!buyerEmail) {
    throw new Error('Missing buyer email in webhook data');
  }
  if (!modelId) {
    throw new Error('Missing model ID in webhook data');
  }
  if (!authorEmail) {
    throw new Error('Missing author email in webhook data');
  }
  if (!orderId) {
    throw new Error('Missing order ID in webhook data');
  }
  if (!totalAmount || totalAmount <= 0) {
    throw new Error('Invalid total amount in webhook data');
  }

  return {
    buyerEmail,
    modelId,
    modelName,
    authorEmail,
    orderId,
    totalAmount
  };
}