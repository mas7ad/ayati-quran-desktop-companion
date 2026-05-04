import type { PrayerDay, PrayerName, PrayerTimeEntry } from './ayah-types';

export interface FetchPrayerTimesInput {
  city: string;
  country: string;
  method: number;
  school: 0 | 1;
  date: Date;
  timezone: string;
  fetchImpl?: typeof fetch;
}

const PRAYER_FIELDS: Array<{ name: PrayerName; label: string; source: string; isReminderEnabled: boolean }> = [
  { name: 'fajr', label: 'Fajr', source: 'Fajr', isReminderEnabled: true },
  { name: 'sunrise', label: 'Sunrise', source: 'Sunrise', isReminderEnabled: false },
  { name: 'dhuhr', label: 'Dhuhr', source: 'Dhuhr', isReminderEnabled: true },
  { name: 'asr', label: 'Asr', source: 'Asr', isReminderEnabled: true },
  { name: 'maghrib', label: 'Maghrib', source: 'Maghrib', isReminderEnabled: true },
  { name: 'isha', label: 'Isha', source: 'Isha', isReminderEnabled: true },
];

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function formatRequestDate(date: Date): string {
  return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()}`;
}

function formatDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function normalizeTime(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const match = value.match(/\b([0-2]\d):([0-5]\d)\b/);
  if (!match) return null;
  return `${match[1]}:${match[2]}`;
}

function resolveLocalPrayerTime(date: Date, time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes, 0, 0).getTime();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseTimings(payload: unknown): Record<string, unknown> {
  if (!isRecord(payload) || !isRecord(payload.data) || !isRecord(payload.data.timings)) {
    throw new Error('Prayer times response was missing required timings.');
  }
  return payload.data.timings;
}

export async function fetchPrayerTimesByCity(input: FetchPrayerTimesInput): Promise<PrayerDay> {
  const city = input.city.trim();
  const country = input.country.trim();
  if (!city || !country) {
    throw new Error('City and country are required for prayer times.');
  }

  const url = new URL(`https://api.aladhan.com/v1/timingsByCity/${formatRequestDate(input.date)}`);
  url.searchParams.set('city', city);
  url.searchParams.set('country', country);
  url.searchParams.set('method', String(input.method));
  url.searchParams.set('school', String(input.school));

  const fetchImpl = input.fetchImpl ?? fetch;
  const response = await fetchImpl(url.toString());
  if (!response.ok) {
    throw new Error('Prayer times are unavailable right now.');
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error('Prayer times response could not be read.');
  }

  const timings = parseTimings(payload);
  const prayers: PrayerTimeEntry[] = PRAYER_FIELDS.map((field) => {
    const time = normalizeTime(timings[field.source]);
    if (!time) {
      throw new Error('Prayer times response was missing required timings.');
    }
    return {
      name: field.name,
      label: field.label,
      time,
      at: resolveLocalPrayerTime(input.date, time),
      isReminderEnabled: field.isReminderEnabled,
    };
  });

  return {
    date: formatDateKey(input.date),
    city,
    country,
    method: input.method,
    school: input.school,
    timezone: input.timezone,
    source: 'aladhan',
    fetchedAt: Date.now(),
    prayers,
  };
}
