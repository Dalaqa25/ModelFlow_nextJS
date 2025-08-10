import { NextResponse } from 'next/server';
import { resetDatabaseConnections, clearPreparedStatements } from '@/lib/db/reset-connections';

export async function POST(request) {
    try {
        console.log('Debug: Resetting database connections...');
        
        // First try to clear prepared statements
        const statementsCleared = await clearPreparedStatements();
        
        // Then reset connections
        const connectionsReset = await resetDatabaseConnections();
        
        return NextResponse.json({
            success: true,
            message: 'Database connections reset successfully',
            details: {
                statementsCleared,
                connectionsReset
            }
        });
    } catch (error) {
        console.error('Error in reset-db endpoint:', error);
        return NextResponse.json(
            { 
                success: false, 
                error: 'Failed to reset database connections',
                details: error.message 
            }, 
            { status: 500 }
        );
    }
}

export async function GET(request) {
    return NextResponse.json({
        message: 'Use POST method to reset database connections',
        usage: 'POST /api/debug/reset-db'
    });
}