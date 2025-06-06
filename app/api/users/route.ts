// app/api/users/route.ts
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  const client = await clientPromise;
  const db = client.db('test'); 
  const users = await db.collection('users').find({}).toArray();

  return NextResponse.json(users);
}