/** Shared SWR cache key for notification lists (header bell + notifications page). */
export function notificationsSwrKey(userId: string | undefined) {
  return userId ? (["notifications", userId] as const) : null
}
