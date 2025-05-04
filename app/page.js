'use client';
import MainPage from 'app/components/homeComponents/mainPage'
import ResMainPage from "app/components/homeComponents/resMainPage"
import Splitter from 'app/components/homeComponents/splitter'
import {useEffect, useState} from "react";

export default function Home() {
    const [isVisible, setVisible] = useState(true);
    useEffect(() => {
        const handleResize = () => {
            setVisible(window.innerWidth > 1050);
        };
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, [])

  return (
    <>
        { isVisible ?  <MainPage/> : <ResMainPage/> }
        <Splitter/>
    </>
  );
}
