import type { AtlasApiError as IAtlasApiError, AtlasJsonApiError } from '@/actions/atlas/types.js'

export class AtlasApiError extends Error implements IAtlasApiError {
  constructor(
    message: string,
    readonly status: number,
    readonly errors?: AtlasJsonApiError[],
  ) {
    super(message)
    this.name = 'AtlasApiError'
    Object.setPrototypeOf(this, AtlasApiError.prototype)
  }
}
