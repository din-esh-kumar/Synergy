export const safeDate = (value: string | Date | undefined | null): Date | null => {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
};

export const isPast = (value: string | Date | undefined | null): boolean => {
  const d = safeDate(value);
  if (!d) return false;
  return d.getTime() < Date.now();
};

export const isFuture = (value: string | Date | undefined | null): boolean => {
  const d = safeDate(value);
  if (!d) return false;
  return d.getTime() > Date.now();
};
