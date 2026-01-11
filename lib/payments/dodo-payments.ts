import DodoPayments from 'dodopayments';

let instance: DodoPayments | undefined;

export const getDodoPayments = () => {
  if (!instance) {
    instance = new DodoPayments({
      bearerToken: process.env.DODO_PAYMENTS_API_KEY || "",
      environment: "test_mode"
    });
  }
  return instance;
}
