import { prisma } from './prisma.js';
import { getConnectionStatus } from './connection-utils.js';

class DatabaseMonitor {
    constructor() {
        this.healthChecks = [];
        this.errorCount = 0;
        this.lastErrorTime = null;
        this.isMonitoring = false;
    }

    /**
     * Start monitoring database health
     */
    startMonitoring(intervalMs = 30000) { // Check every 30 seconds
        if (this.isMonitoring) {
            console.log('Database monitoring is already running');
            return;
        }

        this.isMonitoring = true;
        console.log('Starting database health monitoring...');

        this.monitorInterval = setInterval(async () => {
            await this.performHealthCheck();
        }, intervalMs);

        // Perform initial health check
        this.performHealthCheck();
    }

    /**
     * Stop monitoring
     */
    stopMonitoring() {
        if (this.monitorInterval) {
            clearInterval(this.monitorInterval);
            this.monitorInterval = null;
        }
        this.isMonitoring = false;
        console.log('Database monitoring stopped');
    }

    /**
     * Perform a health check
     */
    async performHealthCheck() {
        try {
            const status = await getConnectionStatus();
            const timestamp = new Date();

            this.healthChecks.push({
                timestamp,
                status,
                errorCount: this.errorCount
            });

            // Keep only last 10 health checks to prevent memory leaks
            if (this.healthChecks.length > 10) {
                this.healthChecks = this.healthChecks.slice(-10);
            }

            if (status.status === 'unhealthy') {
                this.errorCount++;
                this.lastErrorTime = timestamp;
                console.error(`Database health check failed: ${status.error}`);
                
                // If we have multiple consecutive errors, try to reset connections
                if (this.errorCount >= 3) {
                    console.warn('Multiple database errors detected, attempting connection reset...');
                    await this.resetConnections();
                }
            } else {
                // Reset error count on successful health check
                if (this.errorCount > 0) {
                    console.log(`Database recovered after ${this.errorCount} errors`);
                    this.errorCount = 0;
                    this.lastErrorTime = null;
                }
            }

            return status;
        } catch (error) {
            console.error('Error during health check:', error);
            this.errorCount++;
            this.lastErrorTime = new Date();
            return { status: 'unhealthy', error: error.message };
        }
    }

    /**
     * Reset database connections
     */
    async resetConnections() {
        try {
            console.log('Attempting to reset database connections...');
            await prisma.$disconnect();
            await new Promise(resolve => setTimeout(resolve, 2000));
            await prisma.$connect();
            console.log('Database connections reset successfully');
            this.errorCount = 0;
        } catch (error) {
            console.error('Failed to reset database connections:', error);
        }
    }

    /**
     * Get monitoring statistics
     */
    getStats() {
        const now = new Date();
        const last24Hours = this.healthChecks.filter(
            check => now - check.timestamp < 24 * 60 * 60 * 1000
        );

        const healthyChecks = last24Hours.filter(check => check.status.status === 'healthy');
        const unhealthyChecks = last24Hours.filter(check => check.status.status === 'unhealthy');

        return {
            isMonitoring: this.isMonitoring,
            totalChecks: this.healthChecks.length,
            checksLast24Hours: last24Hours.length,
            healthyChecksLast24Hours: healthyChecks.length,
            unhealthyChecksLast24Hours: unhealthyChecks.length,
            currentErrorCount: this.errorCount,
            lastErrorTime: this.lastErrorTime,
            uptimePercentage: last24Hours.length > 0 
                ? ((healthyChecks.length / last24Hours.length) * 100).toFixed(2)
                : 100,
            averageResponseTime: healthyChecks.length > 0
                ? (healthyChecks.reduce((sum, check) => sum + (check.status.responseTime || 0), 0) / healthyChecks.length).toFixed(2)
                : 0
        };
    }

    /**
     * Get recent health checks
     */
    getRecentHealthChecks(limit = 10) {
        return this.healthChecks.slice(-limit);
    }

    /**
     * Clear health check history
     */
    clearHistory() {
        this.healthChecks = [];
        this.errorCount = 0;
        this.lastErrorTime = null;
        console.log('Database monitoring history cleared');
    }
}

// Create a singleton instance
const databaseMonitor = new DatabaseMonitor();

// Disable auto-start monitoring to prevent memory leaks
// databaseMonitor.startMonitoring();

export { databaseMonitor, DatabaseMonitor };
