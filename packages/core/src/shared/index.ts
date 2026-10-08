/**
 * This file re-exports the public functions
 */
export { createBasicAuthHeader } from "@/shared/utils.ts"
export { createSyslogMessage } from "@/config/logger/create-logger.ts"
export { fetchAsync } from "@/shared/http/fetch-async.ts"
export { isAuraAuthError, AuraAuthError, type AuraErrorOptions } from "@/errors/aura-error.ts"
