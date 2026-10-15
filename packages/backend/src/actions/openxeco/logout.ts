import type { BaseActionArgs, ActionResult } from '@/types.js'
import type { OxeActionDependencies } from '@/actions/openxeco/types.js'

export const oxeLogout = async ({
  dependencies: { oxeSessionManager },
  id,
}: BaseActionArgs<undefined, OxeActionDependencies>): Promise<ActionResult> => {
  if (!id) {
    return {
      success: false,
      code: 'validation',
      message: 'Please provide a user ID.',
    }
  }

  try {
    oxeSessionManager.logout(id)
    return {
      success: true,
      message: 'User logged out.',
    }
  } catch (e) {
    return {
      success: false,
      code: 'unexpected',
      message: (e as Error).message,
      error: e as Error,
    }
  }
}
