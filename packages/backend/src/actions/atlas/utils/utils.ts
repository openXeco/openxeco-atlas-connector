export const wait = async (delayMs: number) => await new Promise((resolve) => setTimeout(resolve, delayMs))

export const normalizeField = (value: unknown): unknown => {
  if (value === undefined || value === null) {
    return null
  }

  if (Array.isArray(value)) {
    return value.map(normalizeField).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)))
  }

  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
        .map(([key, nestedValue]) => [key, normalizeField(nestedValue)]),
    )
  }

  return value
}

export const fieldValuesAreEqual = (local: unknown, remote: unknown): boolean =>
  JSON.stringify(normalizeField(local)) === JSON.stringify(normalizeField(remote))

type ValueNormalizer<K extends string> = (key: K, value: unknown) => unknown

export const findChangedKeys = <K extends string>(
  local: Partial<Record<K, unknown>>,
  remote: Partial<Record<K, unknown>>,
  keys: readonly K[],
  normalize: ValueNormalizer<K> = (_, value) => normalizeField(value),
): K[] =>
  keys.filter((key) => {
    const localValue = normalize(key, local[key])
    const remoteValue = normalize(key, remote[key])

    return !fieldValuesAreEqual(localValue, remoteValue)
  })
