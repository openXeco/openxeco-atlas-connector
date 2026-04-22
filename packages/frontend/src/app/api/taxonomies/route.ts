'use server'

import { NextResponse, type NextRequest } from 'next/server'
import { getTaxonomies } from '@/app/actions/taxonomies'

export async function GET(_req: NextRequest) {
  try {
    const taxonomies = await getTaxonomies()

    return NextResponse.json({ data: taxonomies })
  } catch (e) {
    return NextResponse.json(`Unable to get the taxonomies. Reason: ${(e as Error).message}`, { status: 500 })
  }
}
