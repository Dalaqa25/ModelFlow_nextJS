import { userDB } from "../db/supabase-db";

export async function updateUserSubscription(email: string, subscriptionData: any) {
  try {
    const updatedUser = await userDB.updateUserSubscription(email, subscriptionData);
    return { success: true, user: updatedUser };
  } catch (error) {
    console.error('Error updating user subscription:', error);
    return { success: false, error };
  }
}

export async function getUserByEmail(email: string) {
  try {
    const user = await userDB.getUserByEmail(email);
    return { success: true, user };
  } catch (error) {
    console.error('Error getting user by email:', error);
    return { success: false, error };
  }
}

export async function updateUserBalance(email: string, balance: number) {
  try {
    const updatedUser = await userDB.updateUserSubscription(email, { balance });
    return { success: true, user: updatedUser };
  } catch (error) {
    console.error('Error updating user balance:', error);
    return { success: false, error };
  }
}
