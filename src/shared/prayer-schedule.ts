import type { PrayerDay, PrayerTimeEntry } from '../main/ayah-types';

/** Next prayer time after `now`: today's upcoming slot, or the first slot on `tomorrow` when today's schedule has ended (e.g. after Isha → next Fajr). */
export function getNextPrayer(
  day: PrayerDay,
  now: number,
  tomorrow: PrayerDay | null = null,
): PrayerTimeEntry | null {
  const fromToday = day.prayers
    .filter((prayer) => prayer.at > now)
    .sort((left, right) => left.at - right.at)[0];
  if (fromToday) return fromToday;
  if (!tomorrow) return null;
  return tomorrow.prayers
    .filter((prayer) => prayer.at > now)
    .sort((left, right) => left.at - right.at)[0] ?? null;
}
