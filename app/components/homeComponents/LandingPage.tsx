'use client';
import MainPage from 'app/components/homeComponents/mainPage'
import ResMainPage from "app/components/homeComponents/resMainPage"
import { useEffect, useState } from 'react';

export default function LandingPage() {
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const updateSize = () => setIsDesktop(window.innerWidth > 1050);
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  return isDesktop ? <MainPage /> : <ResMainPage />;
}