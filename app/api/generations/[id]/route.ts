import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const generation = await prisma.generation.findUnique({ where: { id: params.id }, include: { upscales: true } })
  if (!generation) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(generation)
}
