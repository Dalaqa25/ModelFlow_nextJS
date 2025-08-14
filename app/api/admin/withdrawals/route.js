import { NextResponse } from 'next/server';
import { getSupabaseUser } from '@/lib/auth-utils';
import { withdrawalDB } from '@/lib/db/supabase-db';

export async function GET() {
  try {
    // Check authentication
    const supabaseUser = await getSupabaseUser();
    if (!supabaseUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get the user from our database to check admin status
    const user = await prisma.user.findFirst({
      where: { email: supabaseUser.email }
    });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Check if user is admin (using email-based check for simplicity)
    if (supabaseUser.email !== 'g.dalaqishvili01@gmail.com') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Fetch all withdrawal requests with user information
    const withdrawalRequests = await prisma.withdrawalRequest.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        submittedAt: 'desc'
      }
    });

    return NextResponse.json(withdrawalRequests);

  } catch (error) {
    console.error('Error fetching withdrawal requests:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    // Check authentication
    const supabaseUser = await getSupabaseUser();
    if (!supabaseUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get the user from our database to check admin status
    const user = await prisma.user.findFirst({
      where: { email: supabaseUser.email }
    });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Check if user is admin (using email-based check for simplicity)
    if (supabaseUser.email !== 'g.dalaqishvili01@gmail.com') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { requestId, status, rejectedReason } = body;

    // Validate required fields
    if (!requestId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: requestId and status are required' },
        { status: 400 }
      );
    }

    // Validate status
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be pending, approved, or rejected' },
        { status: 400 }
      );
    }

    // Update the withdrawal request
    const updateData = { status };
    
    if (status === 'approved') {
      updateData.approvedAt = new Date();
    } else if (status === 'rejected' && rejectedReason) {
      updateData.rejectedReason = rejectedReason;
    }

    const updatedRequest = await prisma.withdrawalRequest.update({
      where: { id: requestId },
      data: updateData,
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    if (!updatedRequest) {
      return NextResponse.json(
        { error: 'Withdrawal request not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedRequest);

  } catch (error) {
    console.error('Error updating withdrawal request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}