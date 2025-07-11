import User from "../db/User";
import connect from "../db/connect";

/**
 * Update a user's subscription plan and status.
 */
export async function updateUserSubscription(
  email: string,
  plan: string,
  status: string,
  lemonSqueezySubscriptionId?: string
): Promise<any> {
  await connect();
  const update: any = {
    "subscription.plan": plan,
    "subscription.status": status,
  };
  if (lemonSqueezySubscriptionId) {
    update["subscription.lemonSqueezySubscriptionId"] = lemonSqueezySubscriptionId;
  }
  // @ts-ignore
  return User.findOneAndUpdate(
    { email },
    { $set: update },
    { new: true }
  );
}

export async function getUserSubscription(email: string): Promise<any> {
  await connect();
  // @ts-ignore
  return User.findOne({ email }, { subscription: 1 });
}

export async function cancelUserSubscription(email: string): Promise<any> {
  await connect();
  // @ts-ignore
  return User.findOneAndUpdate(
    { email },
    { $set: { "subscription.plan": "basic", "subscription.status": "canceled" } },
    { new: true }
  );
}
