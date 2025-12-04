'use client';

import { useState } from 'react';
import AdaptiveBackground from '@/app/components/shared/AdaptiveBackground';
import MainInput from '@/app/components/mainComponents/MainInput';
import Greetings from '@/app/components/mainComponents/Greetings';

export default function Home() {
    const [hasStartedChat, setHasStartedChat] = useState(false);

    const handleMessageSent = () => {
        setHasStartedChat(true);
    };

    return (
        <AdaptiveBackground variant="content" className="pt-16">
            <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center px-6 -mt-16">
                {!hasStartedChat && (
                    <div className="w-full flex flex-col items-center gap-3 -mt-15">
                        <Greetings />
                    </div>
                )}
            </div>
            <MainInput onMessageSent={handleMessageSent} />
        </AdaptiveBackground>
    );
}