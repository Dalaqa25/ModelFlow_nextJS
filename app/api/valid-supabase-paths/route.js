// app/api/valid-supabase-paths/route.js
import { NextResponse } from 'next/server';
import ArchivedModel from '@/lib/db/ArchivedModel';
import connect from '@/lib/db/connect';

export async function GET() {
  await connect();
  const models = await ArchivedModel.find({});
  const validPaths = models
    .map(m => m.fileStorage?.supabasePath)
    .filter(Boolean);
  return NextResponse.json(validPaths);
}