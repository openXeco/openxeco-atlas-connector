'use server'

import { type NextRequest, NextResponse } from 'next/server'
import { getApiClient } from '@/lib/api-client'
import type { EntityVersion } from '@/types'

export async function GET(_req: NextRequest, ctx: RouteContext<'/api/entities/[id]/versions'>) {
  const { id } = await ctx.params
  const apiClient = getApiClient()

  try {
    const versionsRes = await apiClient.get<{ data: EntityVersion[] }>(`/entities/${id}/versions`, {
      credentials: 'include',
    })

    return NextResponse.json({ data: { versions: versionsRes.data } })
  } catch (e) {
    return NextResponse.json({ message: `Unable to get the entity ${id}. Reason: ${(e as Error).message}` })
  }
}
