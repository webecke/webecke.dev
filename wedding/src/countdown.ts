/** "62 days to go", counting calendar days in the viewer's time zone. */
export function countdownText(target: Date, now: Date = new Date()): string {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round((target.getTime() - today.getTime()) / 86_400_000);
  if (days > 1) return `${days} days to go`;
  if (days === 1) return 'Tomorrow!';
  if (days === 0) return 'Today’s the day!';
  return 'Happily married';
}
