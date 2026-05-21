import { NextResponse } from 'next/server';
import { getPublicUserById, displayNameFromUser } from '@/lib/messages/public-user';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const user = await getPublicUserById(id);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: user.id,
      display_name: displayNameFromUser(user),
      profile_image_url: user.profile_image_url || null,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
