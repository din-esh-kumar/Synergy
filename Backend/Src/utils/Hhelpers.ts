export function extractBearerToken(header?: string): string | null {
  if (!header) return null;
  if (header.startsWith('Bearer ')) {
    return header.slice(7);
  }
  return null;
}

export function hasRole(user: any, roles: string[]): boolean {
  return user && roles.includes(user.role);
}

export function isValidEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// More helpers as needed
