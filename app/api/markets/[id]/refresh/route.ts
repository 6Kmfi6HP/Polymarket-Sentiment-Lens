import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { JobService } from '@/lib/services/job-service';
import { RefreshService } from '@/lib/services/refresh-service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Market ID parameter is required' }, { status: 400 });
    }

    // 1. Verify that market exists
    const market = await prisma.market.findUnique({
      where: { id },
    });

    if (!market) {
      return NextResponse.json({ error: 'Market not found' }, { status: 404 });
    }

    // 2. Prevent concurrent duplicate jobs for the same market
    const activeJob = await prisma.refreshJob.findFirst({
      where: {
        targetId: id,
        status: { in: ['queued', 'running'] },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (activeJob) {
      return NextResponse.json({
        jobId: activeJob.id,
        status: activeJob.status,
        message: 'An active refresh job is already in progress for this market.',
      });
    }

    // 3. Queue a new job
    const job = await JobService.createJob('refresh_market_news', id);

    // 4. Trigger asynchronous background execution (Do NOT await!)
    RefreshService.runBackgroundRefresh(job.id, id).catch((err) => {
      console.error(`[API/Refresh] Error executing background sync task on ${id}:`, err);
    });

    return NextResponse.json({
      jobId: job.id,
      status: 'queued',
    });
  } catch (err: any) {
    console.error('Error triggering manual market refresh:', err);
    return NextResponse.json(
      { error: 'Failed to initiate refresh job', details: err.message },
      { status: 500 }
    );
  }
}
