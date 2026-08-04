import type { DB, ActionArgs, JwtPayload } from '@/types.js'
import { handleActionResult } from '@/utils/action-helpers.js'
import { login } from '@/actions/auth/login.js'
import type fastifyJwt from '@fastify/jwt'
import { refresh } from '@/actions/auth/refresh.js'
import { getCurrentUser } from '@/actions/auth/get-current-user.js'
import { getUsers } from '@/actions/auth/get-users.js'
import { createUser } from '@/actions/auth/create-user.js'
import { updateUser } from '@/actions/auth/update-user.js'
import { setPassword } from '@/actions/auth/set-password.js'
import { deleteUser } from '@/actions/auth/delete-user.js'

export const authActions = (db: DB, logger: ActionArgs['logger'], jwt: fastifyJwt.JWT) => {
  return {
    login: async (data: unknown) => handleActionResult(await login({ data, logger, db, dependencies: { jwt } })),
    refresh: async (data: unknown) => handleActionResult(await refresh({ data, logger, db, dependencies: { jwt } })),
    currentUser: async (data: { currentUser?: JwtPayload }) =>
      handleActionResult(await getCurrentUser({ data, db, logger })),
    list: async () => handleActionResult(await getUsers({ db, logger })),
    create: async (data: unknown) => handleActionResult(await createUser({ data, logger, db })),
    update: async (data: unknown) => handleActionResult(await updateUser({ data, logger, db })),
    setPassword: async (data: unknown) => handleActionResult(await setPassword({ data, logger, db })),
    delete: async (id: string, data: { currentUser?: JwtPayload }) =>
      handleActionResult(await deleteUser({ data, logger, db, id })),
  }
}
