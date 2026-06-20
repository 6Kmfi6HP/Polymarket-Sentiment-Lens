import { NextRequest, NextResponse } from 'next/server';
import { JobService } from '@/lib/services/job-service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Job ID parameter is required' }, { status: 400 });
    }

    const job = await JobService.getJob(id);
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    let meta = null;
    if (job.metaJson) {
      try {
        meta = JSON.parse(job.metaJson);
      } catch {
        meta = job.metaJson;
      }
    }

    return NextResponse.json({
      id: job.id,
      type: job.type,
      status: job.status,
      startedAt: job.startedAt,
      finishedAt: job.finishedAt,
      error: job.error,
      meta,
    });
  } catch (err: any) {
    console.error('Error fetching job details:', err);
    return NextResponse.json(
      { error: 'Failed to retrieve job information', details: err.message },
      { status: 500 }
    );
  }
}
