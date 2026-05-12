/**
 * Paddle Integration Utility
 * Handles Paddle.js initialization and checkout
 */

export const PADDLE_CONFIG = {
  environment: process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT || 'sandbox',
  token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN,
};

/**
 * Initialize Paddle.js
 * Call this once when the app loads
 */
export const initializePaddle = () => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Paddle can only be initialized in the browser'));
      return;
    }

    // Check if Paddle is already loaded
    if (window.Paddle) {
      resolve(window.Paddle);
      return;
    }

    // Load Paddle.js script
    const script = document.createElement('script');
    script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
    script.async = true;

    script.onload = () => {
      if (window.Paddle) {
        // Initialize Paddle with environment and token
        window.Paddle.Environment.set(PADDLE_CONFIG.environment);
        window.Paddle.Initialize({
          token: PADDLE_CONFIG.token,
          eventCallback: function(data) {
            console.log('[Paddle Event]', data);
          }
        });
        resolve(window.Paddle);
      } else {
        reject(new Error('Paddle failed to load'));
      }
    };

    script.onerror = () => {
      reject(new Error('Failed to load Paddle.js script'));
    };

    document.head.appendChild(script);
  });
};

/**
 * Open Paddle Checkout
 * @param {Object} options - Checkout options
 * @param {string} options.priceId - Paddle Price ID
 * @param {string} options.customerId - Optional customer ID
 * @param {string} options.customerEmail - Optional customer email
 * @param {Object} options.customData - Optional custom data
 * @param {Function} options.onSuccess - Success callback
 * @param {Function} options.onError - Error callback
 */
export const openPaddleCheckout = async ({
  priceId,
  customerId,
  customerEmail,
  customData = {},
  onSuccess,
  onError
}) => {
  try {
    // Ensure Paddle is initialized
    if (!window.Paddle) {
      await initializePaddle();
    }

    // Build customer object
    const customer = {};
    if (customerId) {
      customer.id = customerId;
    }
    if (customerEmail) {
      customer.email = customerEmail;
    }

    // Build checkout config
    const checkoutConfig = {
      items: [
        {
          priceId: priceId,
          quantity: 1
        }
      ],
      customer: Object.keys(customer).length > 0 ? customer : undefined,
      customData: customData,
      settings: {
        displayMode: 'overlay',
        theme: 'light',
        locale: 'en',
        successUrl: `${window.location.origin}/pricing?success=true`,
      },
      // Event callback for checkout events
      eventCallback: function(event) {
        console.log('[Paddle Checkout Event]', event);
        
        if (event.name === 'checkout.completed') {
          console.log('[Paddle] Checkout completed:', event.data);
          if (onSuccess) onSuccess(event.data);
        }
        
        if (event.name === 'checkout.error') {
          console.error('[Paddle] Checkout error:', event.data);
          if (onError) onError(event.data);
        }
        
        if (event.name === 'checkout.payment.failed') {
          console.error('[Paddle] Payment failed:', event.data);
          if (onError) onError(event.data);
        }
      }
    };

    // DEBUG: Log the entire checkout configuration
    console.log('=== PADDLE CHECKOUT DEBUG ===');
    console.log('Price ID:', priceId);
    console.log('Customer Email:', customerEmail);
    console.log('Customer ID:', customerId);
    console.log('Custom Data:', customData);
    console.log('Full Checkout Config:', JSON.stringify(checkoutConfig, null, 2));
    console.log('Paddle Environment:', PADDLE_CONFIG.environment);
    console.log('Paddle Token:', PADDLE_CONFIG.token ? 'SET' : 'NOT SET');
    console.log('============================');

    // Open checkout
    window.Paddle.Checkout.open(checkoutConfig);

  } catch (error) {
    console.error('[Paddle] Failed to open checkout:', error);
    console.error('[Paddle] Error stack:', error.stack);
    if (onError) onError(error);
  }
};

/**
 * Get Paddle instance
 * Useful for accessing Paddle methods directly
 */
export const getPaddle = async () => {
  if (typeof window === 'undefined') {
    throw new Error('Paddle is only available in the browser');
  }

  if (!window.Paddle) {
    await initializePaddle();
  }

  return window.Paddle;
};
