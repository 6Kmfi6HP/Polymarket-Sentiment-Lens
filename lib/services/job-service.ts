import { prisma } from '../db/prisma';

export class JobService {
  static async createJob(type: string, targetId?: string) {
    return prisma.refreshJob.create({
      data: {
        type,
        status: 'queued',
        targetId,
        createdAt: new Date(),
      },
    });
  }

  static async startJob(id: string, meta?: any) {
    return prisma.refreshJob.update({
      where: { id },
      data: {
        status: 'running',
        startedAt: new Date(),
        metaJson: meta ? JSON.stringify(meta) : undefined,
      },
    });
  }

  static async completeJob(id: string, meta?: any) {
    return prisma.refreshJob.update({
      where: { id },
      data: {
        status: 'success',
        finishedAt: new Date(),
        metaJson: meta ? JSON.stringify(meta) : undefined,
      },
    });
  }

  static async failJob(id: string, errorMessage: string, meta?: any) {
    return prisma.refreshJob.update({
      where: { id },
      data: {
        status: 'failed',
        finishedAt: new Date(),
        error: errorMessage,
        metaJson: meta ? JSON.stringify(meta) : undefined,
      },
    });
  }

  static async getJob(id: string) {
    return prisma.refreshJob.findUnique({
      where: { id },
    });
  }
}
