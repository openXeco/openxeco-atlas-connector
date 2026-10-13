import { ExternalApiError } from '@/actions/shared/api-error.js'
import { fetch } from 'undici'
import type { Logger } from '@/types.js'
import { RETRYABLE_METHODS, RETRYABLE_STATUSES } from '@/actions/shared/constants.js'
import type { ExternalApiRequestOptions } from '@/actions/shared/types.js'

export const request = async <R = unknown>(
  url: URL,
  { fetchOptions, logger, maxRetries = 1, timeout = 30000, parseResponse }: ExternalApiRequestOptions<R>,
): Promise<R> => {
  const options = {
    method: 'GET',
    ...fetchOptions,
  }
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    logger.debug(`API Call attempt ${attempt}/${maxRetries}. Url: ${url.toString()}`)
    try {
      return await _executeRequest(url, {
        fetchOptions: {
          ...options,
          signal: AbortSignal.timeout(timeout),
        },
        parseResponse,
      })
    } catch (e) {
      const canRetry = attempt < maxRetries && _isRetrySafeMethod(options.method)

      if (e instanceof ExternalApiError) {
        const retryable = canRetry && RETRYABLE_STATUSES.includes(e.status)

        if (retryable) {
          await _logRetry(e, attempt, maxRetries, logger)
          continue
        }

        logger.error(
          {
            err: e,
            status: e.status,
            errors: e.errors,
            method: options.method,
            url: url.toString(),
          },
          'API request failed',
        )

        throw e
      }

      // We don't retry explicit cancellation
      if (e instanceof DOMException && e.name === 'AbortError') {
        logger.info({ method: options.method, url: url.toString() }, 'API request aborted')

        throw e
      }

      if (e instanceof DOMException && e.name === 'TimeoutError') {
        if (canRetry) {
          await _logRetry(e, attempt, maxRetries, logger)
          continue
        }

        throw new Error('API request timed out', {
          cause: e,
        })
      }

      if (e instanceof SyntaxError) {
        throw new Error('API returned an invalid JSON response', {
          cause: e,
        })
      }

      if (e instanceof TypeError) {
        if (canRetry && _isTransientNetworkError(e)) {
          await _logRetry(e, attempt, maxRetries, logger)
          continue
        }

        throw new Error('API transport error', {
          cause: e,
        })
      }

      if (e instanceof Error) {
        logger.error(
          {
            err: e,
            method: options.method,
            url: url.toString(),
          },
          'Unexpected API error',
        )

        throw e
      }

      throw new Error('Unknown API failure', {
        cause: e,
      })
    }
  }

  throw new Error('API unexpected error after retries.')
}

const _executeRequest = async <R = unknown>(
  url: URL,
  { fetchOptions, parseResponse }: Pick<ExternalApiRequestOptions<R>, 'fetchOptions' | 'parseResponse'>,
): Promise<R> => {
  const response = await fetch(url.toString(), fetchOptions)

  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => ({}))
    throw new ExternalApiError('API Error', response.status, _getErrors(payload))
  }

  if (parseResponse) {
    return await parseResponse(response)
  }

  const payload: unknown = await response.json()
  const errors = _getErrors(payload)

  if (errors.length > 0) {
    throw new ExternalApiError('API Error', response.status, errors)
  }

  return payload as R
}

const _isRetrySafeMethod = (method: string): boolean => {
  return RETRYABLE_METHODS.includes(method.toUpperCase())
}

const _getErrors = (payload: unknown): unknown[] => {
  if (typeof payload !== 'object' || payload === null || !('errors' in payload) || !Array.isArray(payload.errors)) {
    return []
  }

  return payload.errors
}

const _logRetry = async (error: Error, attempt: number, maxAttempts: number, logger: Logger): Promise<void> => {
  const delay = Math.min(1000 * 2 ** (attempt - 1), 10_000)

  logger.warn(
    {
      err: error,
      attempt,
      maxAttempts,
      delay,
    },
    'Retrying API request',
  )

  await new Promise((resolve) => setTimeout(resolve, delay))
}

const _isTransientNetworkError = (error: TypeError): boolean => {
  const cause = error.cause

  if (!(cause instanceof Error) || !('code' in cause)) {
    return false
  }

  const code = String(cause.code)

  return [
    'ECONNRESET',
    'ECONNREFUSED',
    'EPIPE',
    'ETIMEDOUT',
    'ENETUNREACH',
    'EAI_AGAIN',
    'UND_ERR_CONNECT_TIMEOUT',
    'UND_ERR_HEADERS_TIMEOUT',
    'UND_ERR_BODY_TIMEOUT',
    'UND_ERR_SOCKET',
  ].includes(code)
}
