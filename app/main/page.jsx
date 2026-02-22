'use client';

import { useState, useEffect, useRef } from 'react';
import AdaptiveBackground from '@/app/components/shared/AdaptiveBackground';
import MainInput from '@/app/components/mainComponents/MainInput';
import Greetings from '@/app/components/mainComponents/Greetings';
import AiChat from '@/app/components/mainComponents/aiChat';
import WelcomeModal from '@/app/components/WelcomeModal';
import AutomationsList from '@/app/components/mainComponents/AutomationsList';

export default function Home() {
    const [hasStartedChat, setHasStartedChat] = useState(false);
    const [pendingMessage, setPendingMessage] = useState(null);
    const chatRef = useRef(null);
    const [isScoped, setIsScoped] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploadActive, setIsUploadActive] = useState(false);

    const handleUploadStatusChange = (isActive) => {
        setIsUploadActive(isActive);
    };

    const handleFileUpload = (file) => {
        if (chatRef.current) {
            chatRef.current.handleFileUpload(file);
        }
    };
    const handleMessageSent = (message) => {
        if (!hasStartedChat) {
            setHasStartedChat(true);
            setPendingMessage(message);
        } else {
            // Chat already exists, send directly
            if (chatRef.current) {
                chatRef.current.handleNewMessage(message);
            }
        }
    };

    // Send pending message once chat component is mounted
    useEffect(() => {
        if (hasStartedChat && pendingMessage && chatRef.current) {
            chatRef.current.handleNewMessage(pendingMessage);
            setPendingMessage(null);
        }
    }, [hasStartedChat, pendingMessage]);

    const handleLoadingChange = (loading) => {
        setIsLoading(loading);
    };

    const handleStopGeneration = () => {
        if (chatRef.current) {
            chatRef.current.stopGeneration();
        }
    };

    return (
        <AdaptiveBackground variant="content" className="" showFloatingElements={false}>
            {/* Full-page sniper-scope style overlay */}
            <div
                className={`
                    fixed inset-0 z-40 pointer-events-none
                    transition-opacity duration-300
                    ${isScoped ? 'opacity-62' : 'opacity-0'}
                `}
            >
                {/* Radial vignette: big clear center, extra soft dark corners */}
                <div className="w-full h-full bg-[radial-gradient(circle_at_center,transparent_0%,transparent_82%,rgba(0,0,0,0.22)_100%)] backdrop-blur-[1px]" />
            </div>

            <div className={`flex flex-col items-center px-6 ${!hasStartedChat ? 'min-h-[calc(100vh-4rem)] justify-center -mt-16' : ''}`}>
                {!hasStartedChat ? (
                    <div className="w-full flex flex-col items-center gap-8 -mt-44">
                        <Greetings />
                    </div>
                ) : (
                    <div className="w-full h-full flex items-start justify-center pt-2">
                        <div className="w-full max-w-4xl">
                            <AiChat
                                ref={chatRef}
                                onLoadingChange={handleLoadingChange}
                                onAwaitFileUploadChange={handleUploadStatusChange}
                            />
                        </div>
                    </div>
                )}
            </div>
            <MainInput
                onMessageSent={handleMessageSent}
                onScopeChange={setIsScoped}
                isLoading={isLoading}
                onStopGeneration={handleStopGeneration}
                isUploadActive={isUploadActive}
                onFileUpload={handleFileUpload}
            />
            <AutomationsList isVisible={!hasStartedChat} />
            <WelcomeModal />
        </AdaptiveBackground>
    );
}