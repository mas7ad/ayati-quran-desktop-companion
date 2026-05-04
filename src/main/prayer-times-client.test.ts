import { describe, expect, it, vi } from 'vitest';

import { fetchPrayerTimesByCity } from './prayer-times-client';

const apiResponse = {
  code: 200,
  status: 'OK',
  data: {
    timings: {
      Fajr: '04:11 (BST)',
      Sunrise: '05:44 (BST)',
      Dhuhr: '13:02 (BST)',
      Asr: '17:07 (BST)',
      Maghrib: '20:17 (BST)',
      Isha: '21:43 (BST)',
    },
  },
};

describe('fetchPrayerTimesByCity', () => {
  it('builds the AlAdhan city URL and normalizes prayer times', async () => {
    const fetchImpl = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>(async () => new Response(JSON.stringify(apiResponse), { status: 200 }));

    const day = await fetchPrayerTimesByCity({
      city: 'London',
      country: 'United Kingdom',
      method: 3,
      school: 0,
      date: new Date('2026-05-02T08:00:00Z'),
      timezone: 'Europe/London',
      fetchImpl,
    });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const calledUrl = String(fetchImpl.mock.calls[0]?.[0] ?? '');
    expect(calledUrl).toContain('/v1/timingsByCity/02-05-2026?');
    expect(calledUrl).toContain('city=London');
    expect(calledUrl).toContain('country=United+Kingdom');
    expect(calledUrl).toContain('method=3');
    expect(calledUrl).toContain('school=0');
    expect(day).toMatchObject({
      date: '2026-05-02',
      city: 'London',
      country: 'United Kingdom',
      method: 3,
      school: 0,
      timezone: 'Europe/London',
      source: 'aladhan',
    });
    expect(day.prayers.map((prayer) => prayer.name)).toEqual(['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']);
    expect(day.prayers.find((prayer) => prayer.name === 'sunrise')?.isReminderEnabled).toBe(false);
    expect(day.prayers.find((prayer) => prayer.name === 'fajr')?.time).toBe('04:11');
  });

  it('returns a readable error when AlAdhan fails', async () => {
    const fetchImpl = vi.fn(async () => new Response('Service unavailable', { status: 503 }));

    await expect(fetchPrayerTimesByCity({
      city: 'London',
      country: 'United Kingdom',
      method: 3,
      school: 0,
      date: new Date('2026-05-02T08:00:00Z'),
      timezone: 'Europe/London',
      fetchImpl,
    })).rejects.toThrow('Prayer times are unavailable right now.');
  });

  it('rejects incomplete timing payloads', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({
      code: 200,
      data: { timings: { Fajr: '04:11' } },
    }), { status: 200 }));

    await expect(fetchPrayerTimesByCity({
      city: 'London',
      country: 'United Kingdom',
      method: 3,
      school: 0,
      date: new Date('2026-05-02T08:00:00Z'),
      timezone: 'Europe/London',
      fetchImpl,
    })).rejects.toThrow('Prayer times response was missing required timings.');
  });
});
