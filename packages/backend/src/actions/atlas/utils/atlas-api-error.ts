import type { AtlasJsonApiError } from '@/actions/atlas/types.js'
import { ExternalApiError } from '@/actions/shared/api-error.js'
import type { AtlasApiError as IAtlasApiError } from '@/actions/atlas/types.js'

export class AtlasApiError extends ExternalApiError implements IAtlasApiError {
  constructor(
    message: string,
    readonly status: number,
    readonly errors?: AtlasJsonApiError[],
  ) {
    super(message, status, errors)
    this.name = 'AtlasApiError'
    Object.setPrototypeOf(this, AtlasApiError.prototype)
  }
}
