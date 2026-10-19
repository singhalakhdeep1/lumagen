// List + filter generation history (used by the media library and dashboards).
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { apiLimiter } from '@/lib/services/rate-limiting/rate-limiting.service'

export async function GET(request: NextRequest) {
  const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1'
  if (!(await apiLimiter.isAllowed(ipAddress))) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  const { searchParams } = new URL(request.url)
  const limit = Math.min(100, Number(searchParams.get('limit') ?? 20) || 20)
  const offset = Math.max(0, Number(searchParams.get('offset') ?? 0) || 0)
  const status = searchParams.get('status')

  const [items, total] = await Promise.all([
    prisma.generation.findMany({
      where: status ? { status: status as 'pending' | 'processing' | 'completed' | 'failed' } : undefined,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.generation.count({ where: status ? { status: status as 'pending' | 'processing' | 'completed' | 'failed' } : undefined }),
  ])

  return NextResponse.json({ items, total, limit, offset })
}
