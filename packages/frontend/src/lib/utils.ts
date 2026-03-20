import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-UK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

type FieldKeys<T> = Extract<keyof T, string>

export type ParseOptions<T extends Record<string, unknown>> = {
  arrays?: FieldKeys<T>[]
  booleans?: FieldKeys<T>[]
  numbers?: FieldKeys<T>[]
}

export function parseFormData<T extends Record<string, unknown>>(formData: FormData, options: ParseOptions<T> = {}): T {
  const data: Record<string, unknown> = {}

  for (const [key, raw] of formData.entries()) {
    const value = parseValue(key, raw, options)

    setDeep(data, key, value, options)
  }

  return data as T
}

function parseValue<T extends Record<string, unknown>>(
  key: string,
  value: FormDataEntryValue,
  options: ParseOptions<T>,
) {
  if (value instanceof File) return value

  if (options.booleans?.includes(key as FieldKeys<T>)) {
    return value === 'true' || value === 'on'
  }

  if (options.numbers?.includes(key as FieldKeys<T>)) {
    return Number(value)
  }

  return value
}

function setDeep<T extends Record<string, unknown>>(
  obj: Record<string, unknown>,
  path: string,
  value: unknown,
  options: ParseOptions<T>,
) {
  const keys = path.split('.')
  let current: Record<string, unknown> = obj

  keys.forEach((key, index) => {
    const isLast = index === keys.length - 1

    if (isLast) {
      const shouldBeArray = options.arrays?.includes(key as FieldKeys<T>)

      if (shouldBeArray) {
        if (!current[key]) {
          current[key] = [value]
        } else {
          current[key] = Array.isArray(current[key]) ? [...(current[key] as unknown[]), value] : [current[key], value]
        }
      } else {
        if (current[key] !== undefined) {
          current[key] = Array.isArray(current[key]) ? [...(current[key] as unknown[]), value] : [current[key], value]
        } else {
          current[key] = value
        }
      }
    } else {
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {}
      }

      current = current[key] as Record<string, unknown>
    }
  })
}
