import type { ExternalApiError as IExternalApiError } from '@/actions/shared/types.js'

export class ExternalApiError extends Error implements IExternalApiError {
  constructor(
    message: string,
    readonly status: number,
    readonly errors?: unknown[],
  ) {
    super(message)
    this.name = 'ExternalApiError'
    Object.setPrototypeOf(this, ExternalApiError.prototype)
  }
}
