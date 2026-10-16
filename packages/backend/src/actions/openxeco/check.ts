import type { BaseActionArgs, ActionResult } from '@/types.js'
import type { OxeActionDependencies } from '@/actions/openxeco/types.js'

export const oxeCheck = async ({
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

  const isLogged = oxeSessionManager.isLogged(id)

  if (!isLogged) {
    return {
      success: false,
      code: 'unauthorized',
      message: 'User not logged.',
    }
  }

  return {
    success: true,
    message: 'User logged.',
  }
}
