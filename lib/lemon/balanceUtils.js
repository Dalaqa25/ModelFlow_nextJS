import { prisma } from "@/lib/db/prisma";

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
  const seller = await prisma.user.findUnique({
    where: { email: userEmail },
    include: { earningsHistory: true }
  });
  
  if (!seller) {
    throw new Error(`Seller not found: ${userEmail}`);
  }

  // Create new earning entry
  const newEarning = await prisma.earningsHistory.create({
    data: {
      modelId,
      modelName,
      buyerEmail,
      amount,
      lemonSqueezyOrderId,
      earnedAt,
      releaseAt: new Date(earnedAt.getTime() + 5 * 60 * 1000), // earnedAt + 5 minutes
      userId: seller.id
    }
  });

  // Recalculate total earnings from earnings history (ensures accuracy)
  const totalEarnings = await prisma.earningsHistory.aggregate({
    where: { userId: seller.id },
    _sum: { amount: true }
  });

  // Update user's total earnings
  const updatedSeller = await prisma.user.update({
    where: { id: seller.id },
    data: {
      totalEarnings: totalEarnings._sum.amount || 0
    }
  });

  return {
    userId: seller.id,
    email: seller.email,
    totalEarnings: updatedSeller.totalEarnings,
    withdrawnAmount: updatedSeller.withdrawnAmount,
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
  const user = await prisma.user.findUnique({
    where: { email: userEmail }
  });
  
  if (!user) {
    throw new Error(`User not found: ${userEmail}`);
  }

  // Recalculate total earnings from earnings history
  const totalEarnings = await prisma.earningsHistory.aggregate({
    where: { userId: user.id },
    _sum: { amount: true }
  });

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      totalEarnings: totalEarnings._sum.amount || 0
    }
  });

  return {
    userId: user.id,
    email: user.email,
    totalEarnings: updatedUser.totalEarnings,
    withdrawnAmount: updatedUser.withdrawnAmount
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