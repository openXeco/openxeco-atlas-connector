import type { OxeApiError as IOxeApiError } from '@/actions/openxeco/types.js'
import { ExternalApiError } from '@/actions/shared/api-error.js'

export class OxeApiError extends ExternalApiError implements IOxeApiError {
  constructor(
    message: string,
    readonly status: number,
    readonly errors?: unknown[],
  ) {
    super(message, status, errors)
    this.name = 'OxeApiError'
    Object.setPrototypeOf(this, OxeApiError.prototype)
  }
}

export class OxeAuthenticationError extends OxeApiError {
  constructor() {
    super('Invalid OpenXeco credentials', 401)
    this.name = 'OxeAuthenticationError'
  }
}
