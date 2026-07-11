export type BiweekBounds = {
  biweek_period: string;
  startDate: string;
  endDate: string;
};

export function parseBiweekPeriod(period: string): BiweekBounds | null {
  const m = String(period || "").trim().match(/^BW(\d{1,2})-(\d{4})$/i);
  if (!m) return null;
  const index = parseInt(m[1], 10) - 1;
  const year = parseInt(m[2], 10);
  if (index < 0 || index > 25) return null;
  const start = new Date(Date.UTC(year, 0, 1 + index * 14));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 14);
  return {
    biweek_period: `BW${String(index + 1).padStart(2, "0")}-${year}`,
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  };
}

export function currentBiweekPeriod(date = new Date()): BiweekBounds {
  const year = date.getUTCFullYear();
  const startOfYear = Date.UTC(year, 0, 1);
  const dayIndex = Math.floor(
    (Date.UTC(year, date.getUTCMonth(), date.getUTCDate()) - startOfYear) / 86400000,
  );
  const bwIndex = Math.floor(dayIndex / 14) + 1;
  return parseBiweekPeriod(`BW${String(bwIndex).padStart(2, "0")}-${year}`)!;
}