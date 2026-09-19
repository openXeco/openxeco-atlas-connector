import { z } from 'zod'

export const idParamSchema = z.object({ id: z.string().uuid() })

export const getIdFromRequest = <T>(request: T) => {
  const { id } = idParamSchema.parse(request)

  return id
}
