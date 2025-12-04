'use client';

import { useState, useEffect, useRef } from 'react';
import AdaptiveBackground from '@/app/components/shared/AdaptiveBackground';
import MainInput from '@/app/components/mainComponents/MainInput';
import Greetings from '@/app/components/mainComponents/Greetings';
import AiChat from '@/app/components/mainComponents/ai-chat';

export default function Home() {
    const [hasStartedChat, setHasStartedChat] = useState(false);
    const [pendingMessage, setPendingMessage] = useState(null);
    const chatRef = useRef(null);

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

    return (
        <AdaptiveBackground variant="content" className="pt-16">
            <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center px-6 -mt-16">
                {!hasStartedChat ? (
                    <div className="w-full flex flex-col items-center gap-3 -mt-15">
                        <Greetings />
                    </div>
                ) : (
                    <div className="w-full h-full flex items-start justify-center pt-8">
                        <div className="w-full max-w-4xl">
                            <AiChat ref={chatRef} />
                        </div>
                    </div>
                )}
            </div>
            <MainInput onMessageSent={handleMessageSent} />
        </AdaptiveBackground>
    );
}