'use client';

import { useThemeAdaptive } from '@/lib/contexts/theme-adaptive-context';
import { useState } from 'react';
import { FcGoogle } from 'react-icons/fc';
import { FaTiktok } from 'react-icons/fa';

export default function ConnectButton({ provider, automationId, onConnect }) {
  const [isConnecting, setIsConnecting] = useState(false);

  const providerConfig = {
    google: {
      name: 'Google',
      icon: <FcGoogle size={20} />,
      color: 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:shadow-sm',
    },
    tiktok: {
      name: 'TikTok',
      icon: <FaTiktok size={20} />,
      color: 'bg-black text-white hover:bg-gray-800 border border-transparent shadow-sm',
    },
    // Add more providers as needed
  };

  const config = providerConfig[provider] || providerConfig.google;

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      // Trigger OAuth flow with automation_id if provided
      const width = 500;
      const height = 600;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const url = automationId
        ? `/api/auth/${provider}?automation_id=${automationId}`
        : `/api/auth/${provider}`;

      const popup = window.open(
        url,
        'oauth',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      // Listen for OAuth completion message from popup
      const handleMessage = (event) => {
        if (event.data?.type === `${provider}_connected` || event.data?.type === 'google_connected' || event.data?.type === 'tiktok_connected') {
          window.removeEventListener('message', handleMessage);
          setIsConnecting(false);
          if (event.data.success) {
            onConnect?.(provider);
          }
        }
      };
      window.addEventListener('message', handleMessage);

      // Also check if popup was closed manually (fallback)
      const checkPopup = setInterval(() => {
        if (popup && popup.closed) {
          clearInterval(checkPopup);
          // Give a moment for message to arrive
          setTimeout(() => {
            window.removeEventListener('message', handleMessage);
            setIsConnecting(false);
          }, 500);
        }
      }, 500);
    } catch (error) {
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
