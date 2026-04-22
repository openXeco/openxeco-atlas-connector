/** biome-ignore-all lint/suspicious/noConsole: It's a logger! */
const noop = () => {}

const isDisabled = process.env.NEXT_PUBLIC_DISABLE_CONSOLE === 'true'

export const logger = {
  log: isDisabled ? noop : console.log,
  debug: isDisabled ? noop : console.debug,
  info: isDisabled ? noop : console.info,
  warn: console.warn, // keep warnings
  error: console.error, // keep errors
}
