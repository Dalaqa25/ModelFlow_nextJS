import { NextResponse } from 'next/server';
import connect from "@/lib/db/connect";
import Request from '@/lib/db/Request';
import Comment from '@/lib/db/Comment';


export async function GET() {
  try {
    console.log('Attempting to connect to database...');
    await connect();
    console.log('Database connection successful');

    console.log('Fetching requests...');
    const requests = await Request.find()
      .sort({ createdAt: -1 })
      .populate('comments')
      .populate('commentsCount');
    console.log('Requests fetched successfully:', requests.length);
    
    return NextResponse.json(requests);
  } catch (error) {
    console.error('Detailed error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  await connect();

  try {
    const body = await req.json();
    const newRequest = await Request.create(body);
    return NextResponse.json(newRequest, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(_, { params }) {
  await connect();
  const { id } = params;

  try {
    const deletedRequest = await Request.findByIdAndDelete(id);
    if (!deletedRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    // Optionally delete related comments
    await Comment.deleteMany({ requestId: id });

    return NextResponse.json({ message: 'Request and related comments deleted' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}