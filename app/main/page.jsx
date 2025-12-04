'use client';

import AdaptiveBackground from '@/app/components/shared/AdaptiveBackground';
import MainInput from '@/app/components/mainComponents/MainInput';
import Greetings from '@/app/components/mainComponents/Greetings';

export default function Home() {
    return (
        <AdaptiveBackground variant="content" className="pt-16">
            <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center px-6 -mt-16">
                <div className="w-full flex flex-col items-center gap-3">
                    <Greetings />
                </div>
            </div>
            <MainInput />
        </AdaptiveBackground>
    );
}