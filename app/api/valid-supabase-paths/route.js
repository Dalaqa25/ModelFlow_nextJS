// app/api/valid-supabase-paths/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  const models = await prisma.archivedModel.findMany({});
  const validPaths = models
    .map(m => m.fileStorage?.supabasePath)
    .filter(Boolean);
  return NextResponse.json(validPaths);
}