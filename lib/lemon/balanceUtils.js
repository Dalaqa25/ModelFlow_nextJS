import { userDB } from "@/lib/db/supabase-db";

export async function getUserBalance(email) {
  try {
    const user = await userDB.getUserByEmail(email);
    return user?.subscription?.balance || 0;
  } catch (error) {
    console.error('Error getting user balance:', error);
    return 0;
  }
}

export async function updateUserBalance(email, newBalance) {
  try {
    const user = await userDB.getUserByEmail(email);
    const currentSubscription = user?.subscription || {};
    
    const updatedUser = await userDB.updateUserSubscription(email, {
      ...currentSubscription,
      balance: newBalance
    });
    
    return updatedUser?.subscription?.balance || 0;
  } catch (error) {
    console.error('Error updating user balance:', error);
    throw error;
  }
}

export async function addToUserBalance(email, amount) {
  try {
    const currentBalance = await getUserBalance(email);
    const newBalance = currentBalance + amount;
    return await updateUserBalance(email, newBalance);
  } catch (error) {
    console.error('Error adding to user balance:', error);
    throw error;
  }
}

export async function deductFromUserBalance(email, amount) {
  try {
    const currentBalance = await getUserBalance(email);
    if (currentBalance < amount) {
      throw new Error('Insufficient balance');
    }
    const newBalance = currentBalance - amount;
    return await updateUserBalance(email, newBalance);
  } catch (error) {
    console.error('Error deducting from user balance:', error);
    throw error;
  }
}

/**
 * Recalculates user balance from earnings history
 * Useful for fixing inconsistencies or after withdrawals
 * @param {string} userEmail - Email of the user
 * @returns {Promise<Object>} Updated balance information
 */
export async function recalculateUserBalance(userEmail) {
  const user = await userDB.getUserByEmail(userEmail);
  
  if (!user) {
    throw new Error(`User not found: ${userEmail}`);
  }

  // Recalculate total earnings from earnings history
  const totalEarnings = user?.subscription?.balance || 0;

  const updatedUser = await userDB.updateUserSubscription(userEmail, {
    ...user?.subscription,
    balance: totalEarnings
  });

  return {
    userId: user.id,
    email: user.email,
    totalEarnings: updatedUser?.subscription?.balance || 0,
    withdrawnAmount: updatedUser?.subscription?.withdrawnAmount || 0
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