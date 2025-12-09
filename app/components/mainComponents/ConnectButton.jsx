'use client';

import { useThemeAdaptive } from '@/lib/theme-adaptive-context';
import { useState } from 'react';

export default function ConnectButton({ provider, onConnect }) {
  const [isConnecting, setIsConnecting] = useState(false);

  const providerConfig = {
    google: {
      name: 'Google',
      icon: '🔗',
      color: 'bg-blue-600 hover:bg-blue-700',
    },
    // Add more providers as needed
  };

  const config = providerConfig[provider] || providerConfig.google;

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      // Trigger OAuth flow
      const width = 500;
      const height = 600;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      
      const popup = window.open(
        `/api/auth/${provider}`,
        'oauth',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      // Listen for OAuth completion
      const checkPopup = setInterval(() => {
        if (popup && popup.closed) {
          clearInterval(checkPopup);
          setIsConnecting(false);
          // Check if connection was successful
          onConnect?.(provider);
        }
      }, 500);
    } catch (error) {
      console.error('Connection error:', error);
      setIsConnecting(false);
    }
  };

  return (
    <button
      onClick={handleConnect}
      disabled={isConnecting}
      className={`
        inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium
        transition-all duration-200 shadow-md
        ${config.color}
        text-white
        ${isConnecting ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'}
      `}
    >
      <span className="text-xl">{config.icon}</span>
      <span>
        {isConnecting ? `Connecting to ${config.name}...` : `Connect ${config.name}`}
      </span>
    </button>
  );
}
