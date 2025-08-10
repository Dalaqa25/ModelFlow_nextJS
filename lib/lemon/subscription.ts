import { prisma } from "../db/prisma";

/**
 * Update a user's subscription plan and status.
 */
export async function updateUserSubscription(
  email: string,
  plan: string,
  status: string,
  lemonSqueezySubscriptionId?: string
): Promise<any> {
  const subscriptionData: any = {
    plan,
    status,
  };
  if (lemonSqueezySubscriptionId) {
    subscriptionData.lemonSqueezySubscriptionId = lemonSqueezySubscriptionId;
  }
  
  return prisma.user.update({
    where: { email },
    data: { subscription: subscriptionData }
  });
}

export async function getUserSubscription(email: string): Promise<any> {
  return prisma.user.findUnique({
    where: { email },
    select: { subscription: true }
  });
}

export async function cancelUserSubscription(email: string): Promise<any> {
  return prisma.user.update({
    where: { email },
    data: {
      subscription: {
        plan: "basic",
        status: "canceled"
      }
    }
  });
}
