import { NextResponse } from 'next/server';
import { prisma } from "@/lib/db/prisma";


export async function GET() {
  try {
    const requests = await prisma.request.findMany({
      include: {
        comments: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return NextResponse.json(requests);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const newRequest = await prisma.request.create({
      data: body,
      include: {
        comments: true
      }
    });
    return NextResponse.json(newRequest, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(_, { params }) {
  const { id } = params;

  try {
    const deletedRequest = await prisma.request.delete({
      where: { id }
    });
    if (!deletedRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    // Related comments will be deleted automatically due to cascade delete

    return NextResponse.json({ message: 'Request and related comments deleted' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}