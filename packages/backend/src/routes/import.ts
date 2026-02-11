import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticate } from '../middleware/auth.js'
import { openXecoClient, openXecoFormTransformer } from '../services/openxeco/index.js'

const ECCC_FORM_ID = 11

const importCredentialsSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
})

export async function importRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * Import form data from cybersecurity.lu
   *
   * POST /api/import/openxeco
   */
  fastify.post('/openxeco', { preHandler: authenticate }, async (request, reply) => {
    try {
      // Validate request body
      const parseResult = importCredentialsSchema.safeParse(request.body)
      if (!parseResult.success) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: 'Invalid credentials format',
          details: parseResult.error.flatten(),
        })
      }

      const { email, password } = parseResult.data

      // Login to OpenXeco
      let session
      try {
        session = await openXecoClient.login({ email, password })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Login failed'
        return reply.status(401).send({
          error: 'Authentication Failed',
          message: message.includes('Invalid credentials') ? 'Invalid email or password for cybersecurity.lu' : message,
        })
      }

      // Fetch form questions and answers
      let questions
      let answers
      try {
        ;[questions, answers] = await Promise.all([
          openXecoClient.getFormQuestions(ECCC_FORM_ID, session),
          openXecoClient.getFormAnswers(ECCC_FORM_ID, session),
        ])
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch form data'
        return reply.status(502).send({
          error: 'External API Error',
          message: `Failed to fetch data from cybersecurity.lu: ${message}`,
        })
      }

      // Check if user has answers
      if (!answers || answers.length === 0) {
        return reply.status(404).send({
          error: 'No Data Found',
          message:
            'No form answers found for this account. Please complete the ECCC registration form on cybersecurity.lu first.',
        })
      }

      // Transform answers to entity format
      const result = await openXecoFormTransformer.transform(answers, questions)

      return reply.send({
        data: {
          entity: result.entity,
          questionsCount: questions.length,
          answersCount: answers.length,
        },
        warnings: result.warnings,
        errors: result.errors,
        unmappedAnswers: result.unmappedAnswers,
        message: result.errors.length === 0 ? 'Form data imported successfully' : 'Form data imported with some errors',
      })
    } catch (error) {
      fastify.log.error(error, 'Import from OpenXeco failed')
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to import form data',
      })
    }
  })

  /**
   * Get import status/info (for debugging)
   *
   * GET /api/import/openxeco/info
   */
  fastify.get('/openxeco/info', { preHandler: authenticate }, async (_request, reply) => {
    return reply.send({
      formId: ECCC_FORM_ID,
      apiBaseUrl: 'https://api.cybersecurity.lu',
      description: 'Import ECCC registration form data from cybersecurity.lu',
    })
  })
}
