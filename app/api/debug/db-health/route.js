import { NextResponse } from 'next/server';
import { getConnectionStatus } from '@/lib/db/connection-utils';
import { prisma } from '@/lib/db/prisma';

export async function GET(request) {
    try {
        console.log('Debug: Checking database health...');
        
        // Get connection status
        const connectionStatus = await getConnectionStatus();
        
        // Get additional database info
        let dbInfo = {};
        if (connectionStatus.status === 'healthy') {
            try {
                // Get database version
                const versionResult = await prisma.$queryRaw`SELECT version()`;
                dbInfo.version = versionResult[0]?.version || 'Unknown';
                
                // Get connection count
                const connectionCountResult = await prisma.$queryRaw`
                    SELECT count(*) as active_connections 
                    FROM pg_stat_activity 
                    WHERE state = 'active'
                `;
                dbInfo.activeConnections = Number(connectionCountResult[0]?.active_connections) || 0;
                
                // Get prepared statements count
                const preparedStatementsResult = await prisma.$queryRaw`
                    SELECT count(*) as prepared_statements 
                    FROM pg_prepared_statements
                `;
                dbInfo.preparedStatements = Number(preparedStatementsResult[0]?.prepared_statements) || 0;
                
            } catch (error) {
                dbInfo.error = error.message;
            }
        }
        
        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            connection: connectionStatus,
            database: dbInfo,
            environment: {
                nodeEnv: process.env.NODE_ENV,
                hasDatabaseUrl: !!process.env.DATABASE_URL,
                hasSupabaseUrl: !!process.env.SUPABASE_DATABASE_URL,
            }
        });
    } catch (error) {
        console.error('Error in db-health endpoint:', error);
        return NextResponse.json(
            { 
                success: false, 
                error: 'Failed to check database health',
                details: error.message,
                timestamp: new Date().toISOString()
            }, 
            { status: 500 }
        );
    }
}
