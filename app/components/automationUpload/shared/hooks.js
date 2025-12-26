// Custom hooks for Automation Upload functionality

import { useState } from 'react';

export const useStepper = (maxSteps = 4) => {
    const [step, setStep] = useState(1);
    const [stepDirection, setStepDirection] = useState('forward');

    const handleNext = () => {
        setStepDirection('forward');
        setStep(s => Math.min(s + 1, maxSteps));
    };

    const handleBack = () => {
        setStepDirection('backward');
        setStep(s => Math.max(s - 1, 1));
    };

    const resetStepper = () => {
        setStep(1);
        setStepDirection('forward');
    };

    return { step, stepDirection, handleNext, handleBack, resetStepper };
};
