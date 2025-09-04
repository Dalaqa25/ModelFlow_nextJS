import { NextResponse } from 'next/server';
import { requestDB } from '@/lib/db/supabase-db';


export async function GET() {
  try {
    const requests = await requestDB.getAllRequests();
    return NextResponse.json(requests);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();

    const newRequest = await requestDB.createRequest(body);

    return NextResponse.json(newRequest, { status: 201 });
  } catch (error) {
    console.error('[API] Error creating request:', error);
    console.error('[API] Error message:', error.message);
    console.error('[API] Error stack:', error.stack);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(_, { params }) {
  const { id } = await params;

  try {
    const deletedRequest = await requestDB.deleteRequest(id);
    if (!deletedRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    // Related comments will be deleted automatically due to cascade delete

    return NextResponse.json({ message: 'Request and related comments deleted' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}