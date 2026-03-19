'use server'

import { NextRequest, NextResponse } from 'next/server'
import { getApiClient } from '@/lib/api-client'
import { deleteEntity } from '@/app/actions/entities'

export async function DELETE(_req: NextRequest, ctx: RouteContext<'/api/entities/[id]'>) {
  const { id } = await ctx.params

  // Delete should be idempotent. We don't need to return an error (@TODO double-check UX implications)
  await deleteEntity(id)

  return NextResponse.json({ message: `Deleted ${id}` })
}

export async function GET(_req: NextRequest, ctx: RouteContext<'/api/entities/[id]'>) {
  const { id } = await ctx.params
  const apiClient = await getApiClient()

  try {
    await apiClient.get(`/entities/${id}`, { credentials: 'include' })
  } catch (e) {
    return NextResponse.json({ message: `Unable to get the entity ${id}. Reason: ${(e as Error).message}` })
  }
}
