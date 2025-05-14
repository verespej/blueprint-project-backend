export function startOfDate(date: Date, dayOffset: number = 0): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() + dayOffset,
  );
}
