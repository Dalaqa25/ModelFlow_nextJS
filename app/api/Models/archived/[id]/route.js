import { NextResponse } from 'next/server';
import ArchivedModel from '@/lib/db/ArchivedModel';
import connect from '@/lib/db/connect';

export async function DELETE(req, { params }) {
  try {
    await connect();
    const { id } = params;
    const deleted = await ArchivedModel.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Archived model not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Archived model deleted successfully' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 