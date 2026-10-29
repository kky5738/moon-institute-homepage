export function inquiryRetentionCutoff(now: Date) {
  const cutoff = new Date(now);
  const month = cutoff.getUTCMonth();
  cutoff.setUTCFullYear(cutoff.getUTCFullYear() - 1);
  if (cutoff.getUTCMonth() !== month) cutoff.setUTCDate(0);
  return cutoff;
}
