export const OWNER_EMAIL = (process.env.OWNER_EMAIL ?? 'info@fortune-lifeup.com').toLowerCase()

export function isOwnerEmail(email?: string | null): boolean {
  return !!email && email.toLowerCase() === OWNER_EMAIL
}
