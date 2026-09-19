import type { ActionError as TActionError, ActionResult } from '../types.js'

export class ActionError extends Error {
  readonly details: TActionError

  constructor(details: TActionError) {
    super(details.message)
    this.name = 'ActionError'
    this.details = details
  }

  get code(): TActionError['code'] {
    return this.details.code
  }
}

export const handleActionResult = <T>(result: ActionResult<T>) => {
  if (result.success) {
    return { message: result.message, data: result.data }
  }

  throw new ActionError(result)
}
