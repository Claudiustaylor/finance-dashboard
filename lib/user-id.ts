import { v5 as uuidv5, validate as validateUuid } from 'uuid';

// Fixed namespace for deterministic UUID generation from string user ids.
const USER_ID_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

/**
 * Normalize a user id to a UUID.
 * - If it is already a valid UUID, return as-is.
 * - Otherwise generate a deterministic UUIDv5 from the string.
 * This keeps the existing Postgres uuid-typed user_id columns working
 * while allowing the frontend to send any string (localStorage id, email hash, etc.).
 */
export function normalizeUserId(userId: string | null): string | null {
  if (!userId) return null;
  const trimmed = userId.trim();
  if (validateUuid(trimmed)) return trimmed;
  return uuidv5(trimmed, USER_ID_NAMESPACE);
}
