// app/page.tsx (or page.js, just without 'use client')
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { redirect } from 'next/navigation';
import LandingPage from './components/homeComponents/LandingPage';

export default async function Home() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (user) {
    redirect('/profile');
  }

  return <LandingPage />;
}
