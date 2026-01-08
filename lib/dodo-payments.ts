import DodoPayments from 'dodopayments';

let instance: DodoPayments | undefined;

export const getDodoPayments = () => {
    if (!instance) {
        instance = new DodoPayments({
            bearerToken: process.env.DODO_PAYMENTS_API_KEY || "", // Allow empty string to prevent build crash, but runtime will fail if missing
            environment: "test_mode"
        });
    }
    return instance;
}