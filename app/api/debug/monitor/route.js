import { NextResponse } from 'next/server';
import { databaseMonitor } from '@/lib/db/monitor';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action');
        const limit = parseInt(searchParams.get('limit')) || 10;

        switch (action) {
            case 'stats':
                return NextResponse.json({
                    success: true,
                    stats: databaseMonitor.getStats(),
                    timestamp: new Date().toISOString()
                });

            case 'health':
                const healthStatus = await databaseMonitor.performHealthCheck();
                return NextResponse.json({
                    success: true,
                    health: healthStatus,
                    timestamp: new Date().toISOString()
                });

            case 'history':
                return NextResponse.json({
                    success: true,
                    history: databaseMonitor.getRecentHealthChecks(limit),
                    timestamp: new Date().toISOString()
                });

            case 'reset':
                await databaseMonitor.resetConnections();
                return NextResponse.json({
                    success: true,
                    message: 'Database connections reset successfully',
                    timestamp: new Date().toISOString()
                });

            default:
                return NextResponse.json({
                    success: true,
                    stats: databaseMonitor.getStats(),
                    recentHealth: databaseMonitor.getRecentHealthChecks(5),
                    timestamp: new Date().toISOString(),
                    availableActions: ['stats', 'health', 'history', 'reset']
                });
        }
    } catch (error) {
        console.error('Error in monitor endpoint:', error);
        return NextResponse.json(
            { 
                success: false, 
                error: 'Failed to get monitoring data',
                details: error.message 
            }, 
            { status: 500 }
        );
    }
}

export async function POST(request) {
    try {
        const { action } = await request.json();

        switch (action) {
            case 'start':
                databaseMonitor.startMonitoring();
                return NextResponse.json({
                    success: true,
                    message: 'Database monitoring started',
                    timestamp: new Date().toISOString()
                });

            case 'stop':
                databaseMonitor.stopMonitoring();
                return NextResponse.json({
                    success: true,
                    message: 'Database monitoring stopped',
                    timestamp: new Date().toISOString()
                });

            case 'clear':
                databaseMonitor.clearHistory();
                return NextResponse.json({
                    success: true,
                    message: 'Monitoring history cleared',
                    timestamp: new Date().toISOString()
                });

            default:
                return NextResponse.json(
                    { 
                        success: false, 
                        error: 'Invalid action',
                        availableActions: ['start', 'stop', 'clear']
                    }, 
                    { status: 400 }
                );
        }
    } catch (error) {
        console.error('Error in monitor POST endpoint:', error);
        return NextResponse.json(
            { 
                success: false, 
                error: 'Failed to execute monitoring action',
                details: error.message 
            }, 
            { status: 500 }
        );
    }
}
