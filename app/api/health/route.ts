import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  try {
    // Perform simple query to verify database is active and reachable
    const count = await prisma.market.count();
    
    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      marketsCount: count,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Health Check failed:', err);
    return NextResponse.json(
      {
        status: 'unhealthy',
        database: 'disconnected',
        error: err.message || 'SQLite connection failed',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
