import type { PrayerDay, PrayerSettings, PrayerTimeEntry } from './ayah-types';

export { getNextPrayer } from '../shared/prayer-schedule';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function localDateKey(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function localTomorrowDateKey(timestamp: number): string {
  const date = new Date(timestamp);
  date.setDate(date.getDate() + 1);
  return localDateKey(date.getTime());
}

function reminderKey(day: PrayerDay, prayer: PrayerTimeEntry): string {
  return `${day.date}:${prayer.name}`;
}

function settingsMatchDay(day: PrayerDay, settings: PrayerSettings): boolean {
  return day.city.trim().toLowerCase() === settings.city.trim().toLowerCase()
    && day.country.trim().toLowerCase() === settings.country.trim().toLowerCase()
    && day.method === settings.method
    && day.school === settings.school;
}

function hasUpcomingPrayer(day: PrayerDay, now: number): boolean {
  return day.prayers.some((prayer) => prayer.at > now);
}

export function shouldRefreshPrayerDay(
  day: PrayerDay | null,
  tomorrow: PrayerDay | null,
  settings: PrayerSettings,
  now: number,
): boolean {
  if (!settings.enabled || !settings.city.trim() || !settings.country.trim()) return false;
  if (!day) return true;
  if (day.date !== localDateKey(now)) return true;
  if (!settingsMatchDay(day, settings)) return true;
  if (now - day.fetchedAt > ONE_DAY_MS) return true;
  if (
    day.date === localDateKey(now)
    && !hasUpcomingPrayer(day, now)
    && (!tomorrow
      || tomorrow.date !== localTomorrowDateKey(now)
      || !settingsMatchDay(tomorrow, settings))
  ) {
    return true;
  }
  return false;
}

export function shouldSendPrayerReminder(input: {
  day: PrayerDay;
  tomorrow?: PrayerDay | null;
  settings: PrayerSettings;
  sentReminderKeys: string[];
  now: number;
}): { shouldSend: boolean; prayer?: PrayerTimeEntry; reminderKey?: string } {
  if (!input.settings.enabled) return { shouldSend: false };
  const leadMs = Math.max(0, input.settings.reminderLeadMinutes) * 60 * 1000;
  const tomorrow = input.tomorrow ?? null;

  const scan = (day: PrayerDay): { prayer: PrayerTimeEntry; reminderKey: string } | null => {
    const prayer = day.prayers.find((item) => {
      if (!item.isReminderEnabled) return false;
      const key = reminderKey(day, item);
      if (input.sentReminderKeys.includes(key)) return false;
      return input.now >= item.at - leadMs && input.now < item.at;
    });
    if (!prayer) return null;
    return { prayer, reminderKey: reminderKey(day, prayer) };
  };

  const todayHit = scan(input.day);
  if (todayHit) {
    return { shouldSend: true, prayer: todayHit.prayer, reminderKey: todayHit.reminderKey };
  }
  if (tomorrow) {
    const tomorrowHit = scan(tomorrow);
    if (tomorrowHit) {
      return { shouldSend: true, prayer: tomorrowHit.prayer, reminderKey: tomorrowHit.reminderKey };
    }
  }
  return { shouldSend: false };
}

export function isInsidePrayerQuietWindow(input: {
  day: PrayerDay | null;
  settings: PrayerSettings;
  now: number;
}): boolean {
  if (!input.day || !input.settings.enabled) return false;
  const quietMs = Math.max(0, input.settings.quietMinutesAfterPrayer) * 60 * 1000;
  if (quietMs === 0) return false;
  return input.day.prayers.some((prayer) => (
    prayer.isReminderEnabled && input.now >= prayer.at && input.now < prayer.at + quietMs
  ));
}
