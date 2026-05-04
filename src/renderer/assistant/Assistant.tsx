import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Icon } from '@iconify/react';
import { LinkifyText } from '../components/LinkifyText';
import { MarkdownMessage } from '../components/MarkdownMessage';
import { QulArabicText } from '../components/QulArabicText';
import { HotkeyInput } from '../components/HotkeyInput';
import { AiProviderSettingsFields } from '../components/AiProviderSettingsFields';
import {
  DEFAULT_AI_PROVIDER,
  getAiProviderConfig,
  type ClawBotProvider,
} from '../aiProviderDefaults';
import {
  PET_APPEARANCE_IDS,
  PET_APPEARANCE_LABELS,
  type PetAppearanceId,
} from '../../shared/pet-appearance';
import { getClientPomodoroRemainingMs } from '../../shared/pomodoro-client';
import { getNextPrayer } from '../../shared/prayer-schedule';
import { filterAvailableRecitationResources } from '../../shared/quran-reciter-preferences';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

type Tab = 'prayers' | 'todos' | 'focus' | 'reflections' | 'settings';
type UpdateAction = 'check' | 'download' | 'install';

const isDevEnvironment = import.meta.env.DEV;
const SCROLL_TO_BOTTOM_THRESHOLD = 140;
const QURAN_GUIDANCE_PROMPT = 'What Quranic guidance should I keep in mind for what I do next?';
const DAY_REFLECTION_PROMPT = 'Summarize my day through Quranic reminders and practical next steps.';
const QUL_SCRIPT_OPTIONS = [
  { value: 'madani1421', label: 'Madani 1421 (page glyph)' },
  { value: 'madaniV4Tajweed', label: 'Madani V4 Tajweed (glyph)' },
  { value: 'indoPakNastaleeq', label: 'Indo-Pak Nastaleeq' },
  { value: 'qpcNastaleeq', label: 'QPC Nastaleeq' },
] as const;

function isQulFontPackMissing(
  packs: Record<string, boolean> | null | undefined,
  mushafValue: string,
): boolean {
  if (!packs) return false;
  return packs[mushafValue] === false;
}

function isPrayerTimesBundle(payload: PrayerTimesBundle | PrayerDay | null): payload is PrayerTimesBundle {
  return payload !== null && typeof payload === 'object' && 'today' in payload;
}

function applyPrayerTimesPayload(
  payload: PrayerTimesBundle | PrayerDay | null,
  setToday: (day: PrayerDay | null) => void,
  setTomorrow: (day: PrayerDay | null) => void,
): void {
  if (!payload) {
    setToday(null);
    setTomorrow(null);
    return;
  }
  if (isPrayerTimesBundle(payload)) {
    setToday(payload.today);
    setTomorrow(payload.tomorrow ?? null);
    return;
  }
  setToday(payload);
  setTomorrow(null);
}

/** Formats milliseconds until next prayer as -H:MM:SS or -M:SS (leading minus marks countdown). */
function formatNextPrayerCountdown(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return '-0:00';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) {
    return `-${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `-${m}:${String(s).padStart(2, '0')}`;
}

const DEFAULT_PRAYER_DRAFT: PrayerSettings = {
  enabled: false,
  city: '',
  country: '',
  method: 15,
  school: 0,
  reminderLeadMinutes: 10,
  quietMinutesAfterPrayer: 15,
  hasSavedSettings: false,
};

const PRAYER_LOCATION_PRESETS = [
  { country: 'United Kingdom', cities: ['London', 'Birmingham', 'Manchester', 'Glasgow', 'Leeds', 'Liverpool', 'Newcastle upon Tyne', 'Sheffield', 'Bristol', 'Belfast', 'Leicester', 'Edinburgh', 'Brighton', 'Bournemouth', 'Cardiff', 'Nottingham', 'Southampton', 'Portsmouth', 'Coventry', 'Bradford'] },
  { country: 'United States', cities: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'Jacksonville', 'Austin', 'Fort Worth', 'San Jose', 'Columbus', 'Charlotte', 'Indianapolis', 'San Francisco', 'Seattle', 'Denver', 'Oklahoma City'] },
  { country: 'Canada', cities: ['Toronto', 'Montreal', 'Calgary', 'Ottawa', 'Edmonton', 'Winnipeg', 'Mississauga', 'Vancouver', 'Brampton', 'Hamilton', 'Surrey', 'Quebec City', 'Halifax', 'Laval', 'London', 'Markham', 'Vaughan', 'Gatineau', 'Saskatoon', 'Longueuil'] },
  { country: 'United Arab Emirates', cities: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Al Ain', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain', 'Khor Fakkan', 'Dibba Al-Fujairah', 'Kalba', 'Jebel Ali', 'Ruwais', 'Madinat Zayed', 'Ghayathi', 'Liwa Oasis', 'Al Dhaid', 'Hatta', 'Ar-Rams', 'Diba Al-Hisn'] },
  { country: 'Saudi Arabia', cities: ['Riyadh', 'Jeddah', 'Makkah', 'Madinah', 'Dammam', 'Taif', 'Tabuk', 'Buraidah', 'Khamis Mushait', 'Al Khobar', 'Hail', 'Najran', 'Al Jubail', 'Abha', 'Yanbu', 'Al Qatif', 'Al Hofuf', 'Al Mubarraz', 'Sakaka', 'Arar'] },
  { country: 'Turkey', cities: ['Istanbul', 'Ankara', 'Izmir', 'Bursa', 'Antalya', 'Adana', 'Konya', 'Gaziantep', 'Sanliurfa', 'Kocaeli', 'Mersin', 'Diyarbakir', 'Hatay', 'Manisa', 'Kayseri', 'Samsun', 'Balikesir', 'Kahramanmaras', 'Van', 'Aydin'] },
  { country: 'Malaysia', cities: ['Kuala Lumpur', 'Seberang Perai', 'Kajang', 'Klang', 'Subang Jaya', 'George Town', 'Ipoh', 'Shah Alam', 'Petaling Jaya', 'Iskandar Puteri', 'Johor Bahru', 'Seremban', 'Kuala Terengganu', 'Kota Kinabalu', 'Kuantan', 'Alor Setar', 'Malacca City', 'Kota Bharu', 'Miri', 'Sandakan'] },
  { country: 'Indonesia', cities: ['Jakarta', 'Surabaya', 'Bekasi', 'Bandung', 'Medan', 'Depok', 'Tangerang', 'Palembang', 'Semarang', 'Makassar', 'South Tangerang', 'Batam', 'Pekanbaru', 'Bogor', 'Bandar Lampung', 'Padang', 'Malang', 'Denpasar', 'Samarinda', 'Tasikmalaya'] },
  { country: 'Pakistan', cities: ['Karachi', 'Lahore', 'Faisalabad', 'Rawalpindi', 'Gujranwala', 'Peshawar', 'Multan', 'Hyderabad', 'Islamabad', 'Quetta', 'Bahawalpur', 'Sargodha', 'Sialkot', 'Sukkur', 'Larkana', 'Sheikhupura', 'Rahim Yar Khan', 'Jhang', 'Dera Ghazi Khan', 'Gujrat'] },
  { country: 'India', cities: ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Ahmedabad', 'Chennai', 'Kolkata', 'Surat', 'Pune', 'Jaipur', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Pimpri-Chinchwad', 'Patna', 'Vadodara'] },
] as const;

/** AlAdhan method IDs from api.aladhan.com/v1/methods — excludes 0 (Shia/Jafari) and 99 (custom angles; not supported here). */
const PRAYER_CALCULATION_METHODS = [
  { id: 19, label: 'Algeria' },
  { id: 22, label: 'Comunidade Islamica de Lisboa (Portugal)' },
  { id: 13, label: 'Diyanet İşleri Başkanlığı, Turkey (experimental)' },
  { id: 16, label: 'Dubai (experimental)' },
  { id: 5, label: 'Egyptian General Authority of Survey' },
  { id: 8, label: 'Gulf Region' },
  { id: 7, label: 'Institute of Geophysics, University of Tehran' },
  { id: 2, label: 'Islamic Society of North America (ISNA)' },
  { id: 17, label: 'Jabatan Kemajuan Islam Malaysia (JAKIM)' },
  { id: 20, label: 'Kementerian Agama Republik Indonesia' },
  { id: 9, label: 'Kuwait' },
  { id: 11, label: 'Majlis Ugama Islam Singapura, Singapore' },
  { id: 23, label: 'Ministry of Awqaf, Islamic Affairs and Holy Places, Jordan' },
  { id: 15, label: 'Moonsighting Committee Worldwide (Moonsighting.com)' },
  { id: 21, label: 'Morocco' },
  { id: 3, label: 'Muslim World League' },
  { id: 10, label: 'Qatar' },
  { id: 14, label: 'Spiritual Administration of Muslims of Russia' },
  { id: 18, label: 'Tunisia' },
  { id: 4, label: 'Umm Al-Qura University, Makkah' },
  { id: 12, label: 'Union Organization Islamic de France' },
  { id: 1, label: 'University of Islamic Sciences, Karachi' },
] as const;

const PRAYER_CALCULATION_METHOD_UK_NOTE =
  'AlAdhan does not define a UK-only method. Muslim World League or Moonsighting Committee Worldwide are commonly used in the UK when matched to your mosque.';

const PRAYER_JURISTIC_SCHOOLS = [
  { id: 0, label: 'Shafi, Maliki, Hanbali' },
  { id: 1, label: 'Hanafi' },
] as const;

function getPrayerCountryOptions(currentCountry: string): string[] {
  const countries = PRAYER_LOCATION_PRESETS.map((preset) => preset.country);
  return currentCountry && !countries.includes(currentCountry)
    ? [currentCountry, ...countries]
    : countries;
}

function getPrayerCityOptions(country: string, currentCity: string): string[] {
  const preset = PRAYER_LOCATION_PRESETS.find((entry) => entry.country === country);
  const cities = preset?.cities ? [...preset.cities] : [];
  return currentCity && !cities.includes(currentCity)
    ? [currentCity, ...cities]
    : cities;
}

function getUpdateAction(state: DesktopUpdateState | null): UpdateAction {
  if (state?.status === 'available') return 'download';
  if (state?.status === 'downloaded') return 'install';
  return 'check';
}

function getUpdateStatusLabel(state: DesktopUpdateState | null): string {
  if (!state) return 'Loading update status...';
  if (!state.enabled) return 'Updates unavailable';
  if (state.status === 'idle') return 'Ready to check';
  if (state.status === 'checking') return 'Checking for updates...';
  if (state.status === 'up-to-date') return 'Up to date';
  if (state.status === 'available') return `Version ${state.availableVersion ?? 'new'} is available`;
  if (state.status === 'downloading') {
    const percent = typeof state.downloadPercent === 'number'
      ? ` (${Math.floor(state.downloadPercent)}%)`
      : '';
    return `Downloading update${percent}`;
  }
  if (state.status === 'downloaded') return `Version ${state.downloadedVersion ?? 'new'} is ready`;
  return 'Update check failed';
}

function getUpdateButtonLabel(state: DesktopUpdateState | null): string {
  const action = getUpdateAction(state);
  if (action === 'download') return 'Download Update';
  if (action === 'install') return 'Restart and Install';
  if (state?.status === 'checking') return 'Checking...';
  return 'Check for Updates';
}

function isUpdateButtonDisabled(state: DesktopUpdateState | null): boolean {
  if (!state || !state.enabled) return true;
  return state.status === 'checking' || state.status === 'downloading';
}

function shouldShowUpdateBadge(state: DesktopUpdateState | null): boolean {
  return state?.status === 'available' || state?.status === 'downloaded' || state?.status === 'downloading';
}

export const Assistant: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('prayers');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeStreamMessageId, setActiveStreamMessageId] = useState<string | null>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [settings, setSettings] = useState<Record<string, unknown>>({});
  const [ayahSettings, setAyahSettings] = useState<AyahLensSettings | null>(null);
  const [quranAuthStatus, setQuranAuthStatus] = useState<QuranAuthStatus>({ isConnected: false, scopes: [] });
  const [reflections, setReflections] = useState<AyahReflection[]>([]);
  const [collections, setCollections] = useState<AyahCollection[]>([]);
  const [streakSummary, setStreakSummary] = useState<QuranStreakSummary | null>(null);
  const [daySummary, setDaySummary] = useState<AyahDaySummary | null>(null);
  const [reflectionSearch, setReflectionSearch] = useState('');
  const [reflectionStatusFilter, setReflectionStatusFilter] = useState<'all' | 'saved' | 'pending'>('all');
  const [reflectionThemeFilter, setReflectionThemeFilter] = useState<'all' | AyahTheme>('all');
  const [reflectionFeedbackFilter, setReflectionFeedbackFilter] = useState<'all' | 'relevant' | 'not_relevant'>('all');
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [prayerSettings, setPrayerSettings] = useState<PrayerSettings | null>(null);
  const [prayerDay, setPrayerDay] = useState<PrayerDay | null>(null);
  const [prayerTomorrow, setPrayerTomorrow] = useState<PrayerDay | null>(null);
  const [prayerDraft, setPrayerDraft] = useState<PrayerSettings | null>(null);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [todoTitle, setTodoTitle] = useState('');
  const [todoNotes, setTodoNotes] = useState('');
  const [todoPriority, setTodoPriority] = useState<TodoPriority>('none');
  const [todoDueAt, setTodoDueAt] = useState('');
  const [todoReminderAt, setTodoReminderAt] = useState('');
  const [todoAddDropdownOpen, setTodoAddDropdownOpen] = useState(false);
  const [pomodoroState, setPomodoroState] = useState<PomodoroState | null>(null);
  /** Bumps once per second while a session is running so `Date.now()`-based remaining time re-renders. */
  const [pomodoroUiTick, setPomodoroUiTick] = useState(0);
  const [selectedFocusTodoId, setSelectedFocusTodoId] = useState('');
  const [updateState, setUpdateState] = useState<DesktopUpdateState | null>(null);
  const [updateStatusMessage, setUpdateStatusMessage] = useState('');
  const [oauthCallbackUrl, setOauthCallbackUrl] = useState('');
  const [quranStatusMessage, setQuranStatusMessage] = useState('');
  const [qulFontPacks, setQulFontPacks] = useState<Record<string, boolean> | null>(null);
  const [recitationResources, setRecitationResources] = useState<QuranRecitationResource[]>([]);
  const todoAddDropdownRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const activeStreamRequestIdRef = useRef<string | null>(null);
  const activeStreamMessageIdRef = useRef<string | null>(null);
  const chatScrollTopRef = useRef(0);
  const chatShouldAutoScrollRef = useRef(true);
  const hasInitializedChatScrollRef = useRef(false);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (typeof messagesEndRef.current?.scrollIntoView !== 'function') return;
    messagesEndRef.current.scrollIntoView({ behavior });
  }, []);

  const updateScrollState = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    const isAboveThreshold = distanceFromBottom > SCROLL_TO_BOTTOM_THRESHOLD;

    chatScrollTopRef.current = container.scrollTop;
    chatShouldAutoScrollRef.current = !isAboveThreshold;
    setShowScrollToBottom(isAboveThreshold);
  }, []);

  const persistChatScrollPosition = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    chatScrollTopRef.current = container.scrollTop;
    chatShouldAutoScrollRef.current = distanceFromBottom <= SCROLL_TO_BOTTOM_THRESHOLD;
  }, []);

  const switchTab = useCallback((nextTab: Tab) => {
    setActiveTab((currentTab) => {
      if (currentTab === nextTab) return currentTab;
      if (currentTab === 'chat') {
        persistChatScrollPosition();
      }
      return nextTab;
    });
  }, [persistChatScrollPosition]);

  const handleMessagesScroll = useCallback(() => {
    updateScrollState();
  }, [updateScrollState]);

  const handleScrollToBottomClick = useCallback(() => {
    scrollToBottom('smooth');
    setShowScrollToBottom(false);
    setTimeout(() => {
      updateScrollState();
    }, 0);
  }, [scrollToBottom, updateScrollState]);

  const ayahQulSettingsKey = useMemo(() => {
    if (!ayahSettings) return '';
    return `${ayahSettings.qulMushafKey ?? ''}:${Boolean(ayahSettings.qulTajweedEnabled)}:${ayahSettings.qulArabicEnabled !== false}`;
  }, [ayahSettings]);

  useEffect(() => {
    void window.ayati.getQulFontPacks().then(setQulFontPacks).catch(() => setQulFontPacks(null));
  }, []);

  useEffect(() => {
    const pomodoroRunning = pomodoroState?.activeSession?.status === 'running';
    const prayersTabNeedsClock = activeTab === 'prayers';
    if (!pomodoroRunning && !prayersTabNeedsClock) return;
    const id = window.setInterval(() => setPomodoroUiTick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, [activeTab, pomodoroState?.activeSession?.id, pomodoroState?.activeSession?.status]);

  // Initialize
  useEffect(() => {
    window.ayati.getSettings().then((s) => {
      setSettings(s as Record<string, unknown>);
    });
    window.ayati.getAyahLensSettings().then(setAyahSettings);
    window.ayati.getAyahRecitationResources?.()
      .then((resources) => setRecitationResources(filterAvailableRecitationResources(resources)))
      .catch(() => setRecitationResources([]));
    window.ayati.getQuranAuthStatus().then(setQuranAuthStatus);
    window.ayati.getAyahReflectionHistory().then(setReflections);
    window.ayati.getAyahCollections?.().then(setCollections);
    window.ayati.getQuranStreakSummary?.().then(setStreakSummary);
    window.ayati.getAyahDaySummary?.().then(setDaySummary);
    window.ayati.getPrayerSettings?.().then((settings) => {
      setPrayerSettings(settings);
      setPrayerDraft(settings);
    });
    window.ayati.getPrayerTimes?.().then((payload) => {
      applyPrayerTimesPayload(payload ?? null, setPrayerDay, setPrayerTomorrow);
    });
    window.ayati.getTodos?.().then(setTodos);
    window.ayati.getPomodoroState?.().then(setPomodoroState);
    window.ayati.getUpdateState().then(setUpdateState);

    window.ayati.getChatHistory().then((history) => {
      if (Array.isArray(history) && history.length > 0) {
        setMessages(history as Message[]);
        // Scroll to bottom immediately after loading history
        setTimeout(() => {
          scrollToBottom('auto');
          updateScrollState();
        }, 0);
      }
    });

    window.ayati.onUpdateState(setUpdateState);
    window.ayati.onAyahOAuthCallback((callbackUrl) => {
      window.ayati.completeQuranOAuthCallback(callbackUrl).then((status) => {
        setQuranAuthStatus(status);
        setQuranStatusMessage(status.error ?? 'Quran Foundation account connected.');
      });
    });

    window.ayati.onClawbotSuggestion((data: unknown) => {
      const suggestion = data as { text: string };
      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: suggestion.text,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    });

    window.ayati.onCronResult((data) => {
      const cronMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `[${data.jobName}] ${data.summary}`,
        timestamp: data.timestamp,
      };
      setMessages((prev) => [...prev, cronMsg]);
    });

    window.ayati.onCronError((data) => {
      const errorMsg: Message = {
        id: crypto.randomUUID(),
        role: 'system',
        content: `[Cron Error: ${data.jobName}] ${data.error}`,
        timestamp: data.timestamp,
      };
      setMessages((prev) => [...prev, errorMsg]);
    });

    window.ayati.onClawbotStreamChunk((data) => {
      if (data.requestId !== activeStreamRequestIdRef.current) return;
      const messageId = activeStreamMessageIdRef.current;
      if (!messageId) return;

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, content: data.text }
            : msg
        )
      );
    });

    window.ayati.onClawbotStreamEnd((data) => {
      if (data.requestId !== activeStreamRequestIdRef.current) return;
      const response = data.response as {
        text?: string;
        action?: { type: string; payload: unknown };
      };

      const messageId = activeStreamMessageIdRef.current;
      if (messageId) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? { ...msg, content: response.text || msg.content || 'No response' }
              : msg
          )
        );
      }

      if (response.action?.type === 'open_url' && response.action.payload) {
        window.ayati.openExternal(response.action.payload as string);
      }

      activeStreamRequestIdRef.current = null;
      activeStreamMessageIdRef.current = null;
      setActiveStreamMessageId(null);
      setIsLoading(false);
    });

    window.ayati.onClawbotStreamError((data) => {
      if (data.requestId !== activeStreamRequestIdRef.current) return;
      const messageId = activeStreamMessageIdRef.current;
      if (messageId) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? { ...msg, content: `Failed to stream response: ${data.error}` }
              : msg
          )
        );
      }

      activeStreamRequestIdRef.current = null;
      activeStreamMessageIdRef.current = null;
      setActiveStreamMessageId(null);
      setIsLoading(false);
    });

    window.ayati.onChatSync(() => {
      const shouldAutoScroll = chatShouldAutoScrollRef.current;
      const savedScrollTop = chatScrollTopRef.current;
      window.ayati.getChatHistory().then((history) => {
        if (Array.isArray(history)) {
          setMessages(history as Message[]);
          setTimeout(() => {
            const container = messagesContainerRef.current;
            if (!container) return;

            if (shouldAutoScroll) {
              scrollToBottom('auto');
            } else {
              const maxScrollTop = Math.max(0, container.scrollHeight - container.clientHeight);
              container.scrollTop = Math.min(savedScrollTop, maxScrollTop);
            }
            updateScrollState();
          }, 0);
        }
      });
    });

    window.ayati.onSwitchToChat(() => {
      switchTab('prayers');
    });

    window.ayati.onSwitchToSettings(() => {
      switchTab('settings');
    });

    window.ayati.onSwitchToPrayers?.(() => {
      switchTab('prayers');
    });

    window.ayati.onSwitchToTodos?.(() => {
      switchTab('todos');
    });

    window.ayati.onSwitchToFocus?.(() => {
      switchTab('focus');
    });

    return () => {
      window.ayati.removeAllListeners();
    };
  }, [scrollToBottom, switchTab, updateScrollState]);

  useEffect(() => {
    if (messages.length > 0) {
      window.ayati.saveChatHistory(messages);
    }
  }, [messages]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;
    const prompt = input.trim();

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: prompt,
      timestamp: Date.now(),
    };

    const streamingAssistantMessageId = crypto.randomUUID();
    const assistantPlaceholder: Message = {
      id: streamingAssistantMessageId,
      role: 'assistant',
      content: '...',
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage, assistantPlaceholder]);
    setInput('');
    setIsLoading(true);
    setActiveStreamMessageId(streamingAssistantMessageId);
    activeStreamMessageIdRef.current = streamingAssistantMessageId;

    try {
      const started = await window.ayati.startClawbotStream(prompt);
      if (!started.requestId || started.error) {
        throw new Error(started.error || 'Failed to start stream');
      }

      activeStreamRequestIdRef.current = started.requestId;
      return;
    } catch {
      try {
        const response = (await window.ayati.sendToClawbot(prompt)) as {
          text?: string;
          action?: { type: string; payload: unknown };
        };

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === streamingAssistantMessageId
              ? { ...msg, content: response.text || 'No response' }
              : msg
          )
        );

        if (response.action?.type === 'open_url' && response.action.payload) {
          window.ayati.openExternal(response.action.payload as string);
        }
      } catch {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === streamingAssistantMessageId
              ? { ...msg, content: 'Failed to get response from ClawBot' }
              : msg
          )
        );
      } finally {
        activeStreamRequestIdRef.current = null;
        activeStreamMessageIdRef.current = null;
        setActiveStreamMessageId(null);
        setIsLoading(false);
      }
    }
  }, [input, isLoading]);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  const captureScreen = useCallback(async () => {
    // Check permission first - if denied, show message
    const permissionStatus = await window.ayati.getScreenCapturePermission();
    if (permissionStatus === 'denied' || permissionStatus === 'restricted') {
      alert('Screen recording permission required. Please enable in System Settings > Privacy & Security > Screen Recording');
      return;
    }

    setIsLoading(true);
    try {
      const screenshot = await window.ayati.captureScreen();
      if (screenshot) {
        const userMessage: Message = {
          id: crypto.randomUUID(),
          role: 'user',
          content: '[Screen captured - analyzing...]',
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, userMessage]);

        const response = (await window.ayati.askAboutScreen(
          'What is on my screen right now? Give me a short, practical summary and one helpful next step.',
          screenshot
        )) as { text?: string; response?: string; error?: string };

        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: response.response || response.text || response.error || 'Could not analyze screen',
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateSetting = useCallback(async (key: string, value: unknown) => {
    const newSettings = await window.ayati.updateSettings(key, value);
    setSettings(newSettings as Record<string, unknown>);
  }, []);

  const updateAyahSetting = useCallback(async (key: string, value: unknown) => {
    const nextSettings = await window.ayati.updateAyahLensSetting(key, value);
    setAyahSettings(nextSettings);
  }, []);

  const updateReminderListenReciter = useCallback(async (rawRecitationId: string) => {
    const recitationId = Number(rawRecitationId);
    const resource = recitationResources.find((item) => item.id === recitationId);
    if (!resource) return;
    const nextSettings = await window.ayati.updateAyahLensSetting('recitationId', resource.id);
    setAyahSettings(nextSettings);
    const namedSettings = await window.ayati.updateAyahLensSetting('reciterName', resource.name);
    setAyahSettings(namedSettings);
  }, [recitationResources]);

  const handleUpdateAction = useCallback(async () => {
    if (isUpdateButtonDisabled(updateState)) return;

    const action = getUpdateAction(updateState);
    try {
      if (action === 'download') {
        const result = await window.ayati.downloadUpdate();
        setUpdateState(result.state);
        setUpdateStatusMessage(
          result.completed
            ? 'Update downloaded. Restart Ayati - Quran Desktop Companion to install it.'
            : result.state.message ?? 'Could not start the update download.',
        );
        return;
      }

      if (action === 'install') {
        const confirmed = confirm('Restart Ayati - Quran Desktop Companion now to install the downloaded update?');
        if (!confirmed) return;
        const result = await window.ayati.installUpdate();
        setUpdateState(result.state);
        if (!result.accepted && result.state.message) {
          setUpdateStatusMessage(result.state.message);
        }
        return;
      }

      const result = await window.ayati.checkForUpdate();
      setUpdateState(result.state);
      setUpdateStatusMessage(
        result.checked
          ? getUpdateStatusLabel(result.state)
          : result.state.message ?? 'Automatic updates are not available in this build.',
      );
    } catch (error) {
      setUpdateStatusMessage(error instanceof Error ? error.message : 'Update action failed.');
    }
  }, [updateState]);

  const refreshReflections = useCallback(async () => {
    const [nextReflections, nextSummary, nextStreak] = await Promise.all([
      window.ayati.getAyahReflectionHistory(),
      window.ayati.getAyahDaySummary(),
      window.ayati.getQuranStreakSummary(),
    ]);
    setReflections(nextReflections);
    setDaySummary(nextSummary);
    setStreakSummary(nextStreak);
  }, []);

  const reflectOnScreen = useCallback(async () => {
    const permissionStatus = await window.ayati.getScreenCapturePermission();
    if (permissionStatus === 'denied' || permissionStatus === 'restricted') {
      alert('Screen recording permission required. Please enable in System Settings > Privacy & Security > Screen Recording');
      return;
    }

    setIsLoading(true);
    try {
      const nextReflection = await window.ayati.captureAyahReflection();
      await refreshReflections();
      switchTab('reflections');
      setQuranStatusMessage(`New reflection: ${nextReflection.surahName} ${nextReflection.verseKey}`);
    } finally {
      setIsLoading(false);
    }
  }, [refreshReflections, switchTab]);

  const saveReflectionFromPanel = useCallback(async (reflectionId: string) => {
    const savedReflection = await window.ayati.saveAyahReflection(reflectionId);
    if (savedReflection) {
      await refreshReflections();
      setQuranStatusMessage(
        savedReflection.syncState === 'synced'
          ? 'Bookmark synced with Quran Foundation.'
          : 'Reflection saved locally. Sign in to sync bookmarks.',
      );
    }
  }, [refreshReflections]);

  const loadReflectionTafsir = useCallback(async (reflectionId: string) => {
    await window.ayati.getAyahTafsir(reflectionId);
    await refreshReflections();
  }, [refreshReflections]);

  const loadReflectionAudio = useCallback(async (reflectionId: string) => {
    await window.ayati.getAyahAudio(reflectionId);
    await refreshReflections();
  }, [refreshReflections]);

  const saveReflectionNoteFromPanel = useCallback(async (reflectionId: string) => {
    const body = noteDrafts[reflectionId]?.trim() ?? '';
    if (body.length < 6) return;
    await window.ayati.saveAyahReflectionNote(reflectionId, body);
    await refreshReflections();
    setQuranStatusMessage('Reflection note saved.');
  }, [noteDrafts, refreshReflections]);

  const addReflectionToCollectionFromPanel = useCallback(async (reflectionId: string, collectionId: string) => {
    await window.ayati.addReflectionToCollection(reflectionId, collectionId);
    await refreshReflections();
    setQuranStatusMessage('Collection updated.');
  }, [refreshReflections]);

  const createCollectionFromPanel = useCallback(async () => {
    const collection = await window.ayati.createAyahCollection('Ayati Reflections');
    setCollections(await window.ayati.getAyahCollections());
    setQuranStatusMessage(`Collection ready: ${collection.name}`);
  }, []);

  const setReflectionFeedbackFromPanel = useCallback(async (
    reflectionId: string,
    value: 'relevant' | 'not_relevant',
  ) => {
    await window.ayati.setReflectionFeedback(reflectionId, value);
    await refreshReflections();
  }, [refreshReflections]);

  const showAlternateFromPanel = useCallback(async (reflectionId: string) => {
    const alternate = await window.ayati.showAlternateAyah(reflectionId);
    await refreshReflections();
    setQuranStatusMessage(
      alternate
        ? `Another ayah: ${alternate.surahName} ${alternate.verseKey}`
        : 'No stronger alternate ayah is available for this reflection.',
    );
  }, [refreshReflections]);

  const copyShareCardFromPanel = useCallback(async (reflectionId: string) => {
    const copied = await window.ayati.copyReflectionShareCard(reflectionId);
    setQuranStatusMessage(copied ? 'Share card copied.' : 'Could not copy this reflection.');
  }, []);

  const savePrayerSettings = useCallback(async () => {
    if (!prayerDraft) return;
    const nextSettings = await window.ayati.updatePrayerSettings({
      ...prayerDraft,
      hasSavedSettings: true,
    });
    setPrayerSettings(nextSettings);
    setPrayerDraft(nextSettings);
    const bundle = await window.ayati.refreshPrayerTimes().catch(() => null);
    applyPrayerTimesPayload(bundle, setPrayerDay, setPrayerTomorrow);
  }, [prayerDraft]);

  const updatePrayerSettingsFromSettings = useCallback(async (patch: Partial<PrayerSettings>) => {
    const nextSettings = await window.ayati.updatePrayerSettings(patch);
    setPrayerSettings(nextSettings);
    setPrayerDraft(nextSettings);
    const affectsPrayerSchedule =
      ('method' in patch || 'school' in patch || 'city' in patch || 'country' in patch);
    if (affectsPrayerSchedule) {
      const bundle = await window.ayati.refreshPrayerTimes().catch(() => null);
      applyPrayerTimesPayload(bundle, setPrayerDay, setPrayerTomorrow);
    }
  }, []);

  /** Saves calculation fields to the main process and refreshes displayed times without replacing unsaved draft fields (city/country until Save). */
  const persistPrayerCalculationFromDraft = useCallback((partial: Pick<PrayerSettings, 'method' | 'school'>) => {
    void (async () => {
      const nextSettings = await window.ayati.updatePrayerSettings(partial);
      setPrayerSettings(nextSettings);
      const bundle = await window.ayati.refreshPrayerTimes().catch(() => null);
      applyPrayerTimesPayload(bundle, setPrayerDay, setPrayerTomorrow);
    })();
  }, []);

  const refreshPrayerPanel = useCallback(async () => {
    const bundle = await window.ayati.refreshPrayerTimes();
    applyPrayerTimesPayload(bundle, setPrayerDay, setPrayerTomorrow);
  }, []);

  const createTodoFromPanel = useCallback(async () => {
    const title = todoTitle.trim();
    if (!title) return;
    const toTimestamp = (value: string) => (value ? new Date(value).getTime() : null);
    const nextTodos = await window.ayati.createTodo({
      title,
      notes: todoNotes,
      priority: todoPriority,
      dueAt: toTimestamp(todoDueAt),
      reminderAt: toTimestamp(todoReminderAt),
    });
    setTodos(nextTodos);
    setTodoTitle('');
    setTodoNotes('');
    setTodoPriority('none');
    setTodoDueAt('');
    setTodoReminderAt('');
    setTodoAddDropdownOpen(false);
  }, [todoDueAt, todoNotes, todoPriority, todoReminderAt, todoTitle]);

  useEffect(() => {
    if (activeTab !== 'todos') {
      setTodoAddDropdownOpen(false);
    }
  }, [activeTab]);

  useEffect(() => {
    if (!todoAddDropdownOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      const root = todoAddDropdownRef.current;
      if (!root || root.contains(event.target as Node)) return;
      setTodoAddDropdownOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setTodoAddDropdownOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [todoAddDropdownOpen]);

  const completeTodoFromPanel = useCallback(async (todoId: string, completed: boolean) => {
    setTodos(await window.ayati.completeTodo(todoId, completed));
  }, []);

  const deleteTodoFromPanel = useCallback(async (todoId: string) => {
    if (!confirm('Delete this task?')) return;
    setTodos(await window.ayati.deleteTodo(todoId));
  }, []);

  const updateTodoSettingsFromSettings = useCallback(async (patch: Partial<TodoSettings>) => {
    setTodos(await window.ayati.updateTodoSettings(patch));
  }, []);

  const updatePomodoroSettingsFromPanel = useCallback(async (patch: Partial<PomodoroSettings>) => {
    setPomodoroState(await window.ayati.updatePomodoroSettings(patch));
  }, []);

  const startPomodoroFromPanel = useCallback(async (kind: PomodoroSessionKind) => {
    const duration = kind === 'focus'
      ? pomodoroState?.settings.focusMinutes
      : kind === 'shortBreak'
        ? pomodoroState?.settings.shortBreakMinutes
        : pomodoroState?.settings.longBreakMinutes;
    setPomodoroState(await window.ayati.startPomodoro({
      kind,
      durationMinutes: duration,
      todoId: kind === 'focus' && selectedFocusTodoId ? selectedFocusTodoId : null,
    }));
  }, [pomodoroState?.settings.focusMinutes, pomodoroState?.settings.longBreakMinutes, pomodoroState?.settings.shortBreakMinutes, selectedFocusTodoId]);

  const startQuranSignIn = useCallback(async () => {
    try {
      const { authorizeUrl } = await window.ayati.startQuranOAuth();
      window.ayati.openExternal(authorizeUrl);
      setQuranStatusMessage('Complete sign-in in your browser, then paste the callback URL if the app does not finish automatically.');
    } catch {
      setQuranStatusMessage('Quran Foundation client ID is not configured.');
    }
  }, []);

  const completeQuranSignIn = useCallback(async () => {
    if (!oauthCallbackUrl.trim()) return;
    const status = await window.ayati.completeQuranOAuthCallback(oauthCallbackUrl.trim());
    setQuranAuthStatus(status);
    setOauthCallbackUrl('');
    setQuranStatusMessage(status.error ?? 'Quran Foundation account connected.');
  }, [oauthCallbackUrl]);

  const disconnectQuran = useCallback(async () => {
    await window.ayati.disconnectQuranAccount();
    setQuranAuthStatus(await window.ayati.getQuranAuthStatus());
    setQuranStatusMessage('Quran Foundation account disconnected. Local reflections remain on this device.');
  }, []);

  const triggerTestReminderComment = useCallback(async () => {
    try {
      const didSendReminder = await window.ayati.forceTimedReminderComment();
      if (didSendReminder) {
        window.ayati.closeAssistant();
        return;
      }
      setQuranStatusMessage('Could not send a test reminder right now.');
    } catch (error) {
      setQuranStatusMessage(error instanceof Error ? error.message : 'Could not send a test reminder right now.');
    }
  }, []);

  const triggerTestPrayerReminderComment = useCallback(async () => {
    try {
      const didSend = await window.ayati.forcePrayerReminderComment();
      if (didSend) {
        window.ayati.closeAssistant();
        return;
      }
      setQuranStatusMessage('Could not send a test prayer reminder right now.');
    } catch (error) {
      setQuranStatusMessage(error instanceof Error ? error.message : 'Could not send a test prayer reminder right now.');
    }
  }, []);

  const triggerTestTodoReminderComment = useCallback(async () => {
    try {
      const didSend = await window.ayati.forceTodoReminderComment();
      if (didSend) {
        window.ayati.closeAssistant();
        return;
      }
      setQuranStatusMessage('Could not send a test to do reminder right now.');
    } catch (error) {
      setQuranStatusMessage(error instanceof Error ? error.message : 'Could not send a test to do reminder right now.');
    }
  }, []);

  const closeWindow = useCallback(() => {
    window.ayati.closeAssistant();
  }, []);

  const clawbotSettings = settings.clawbot as {
    url?: string;
    token?: string;
    provider?: ClawBotProvider;
    model?: string;
  } | undefined;
  const aiProvider = clawbotSettings?.provider ?? DEFAULT_AI_PROVIDER;
  const handleAiProviderChange = (nextProvider: ClawBotProvider) => {
    const nextConfig = getAiProviderConfig(nextProvider);
    updateSetting('clawbot.provider', nextProvider);
    updateSetting('clawbot.url', nextConfig.baseUrl);
    updateSetting('clawbot.model', nextConfig.defaultModel);
    updateSetting('clawbot.token', '');
  };

  const availableThemes = Array.from(
    new Set(reflections.flatMap((reflection) => reflection.themes.map((theme) => theme.id))),
  );
  const filteredReflections = reflections.filter((reflection) => {
    const query = reflectionSearch.trim().toLowerCase();
    const matchesQuery = !query || [
      reflection.verseKey,
      reflection.surahName,
      reflection.translation,
      reflection.reflection,
      reflection.note?.body ?? '',
    ].join(' ').toLowerCase().includes(query);
    const matchesStatus = reflectionStatusFilter === 'all'
      || (reflectionStatusFilter === 'saved' && Boolean(reflection.savedAt))
      || (reflectionStatusFilter === 'pending' && (reflection.syncState === 'pending' || reflection.note?.syncState === 'pending'));
    const matchesTheme = reflectionThemeFilter === 'all'
      || reflection.themes.some((theme) => theme.id === reflectionThemeFilter);
    const matchesFeedback = reflectionFeedbackFilter === 'all'
      || reflection.feedback?.value === reflectionFeedbackFilter;
    return matchesQuery && matchesStatus && matchesTheme && matchesFeedback;
  });
  const now = Date.now();
  const nextPrayer = prayerDay ? getNextPrayer(prayerDay, now, prayerTomorrow) : null;
  const nextPrayerIsTomorrow = Boolean(
    nextPrayer && prayerTomorrow?.prayers.some((p) => p === nextPrayer),
  );
  const currentPrayerDraft = prayerDraft ?? prayerSettings ?? DEFAULT_PRAYER_DRAFT;
  const prayerCountryOptions = getPrayerCountryOptions(currentPrayerDraft.country);
  const prayerCityOptions = getPrayerCityOptions(currentPrayerDraft.country, currentPrayerDraft.city);
  const incompleteTodos = todos.filter((todo) => !todo.completedAt);
  const completedTodos = todos.filter((todo) => todo.completedAt);
  void pomodoroUiTick;
  const pomodoroRemainingMs = getClientPomodoroRemainingMs(pomodoroState, Date.now());
  const pomodoroMinutes = pomodoroRemainingMs === null || pomodoroRemainingMs === undefined
    ? pomodoroState?.settings.focusMinutes ?? 25
    : Math.floor(pomodoroRemainingMs / 60000);
  const pomodoroSeconds = pomodoroRemainingMs === null || pomodoroRemainingMs === undefined
    ? 0
    : Math.floor((pomodoroRemainingMs % 60000) / 1000);
  const pomodoroDisplay = `${String(pomodoroMinutes).padStart(2, '0')}:${String(pomodoroSeconds).padStart(2, '0')}`;

  return (
    <div className="flex flex-col h-screen bg-[#0f0f0f] text-neutral-200 overflow-hidden">
      {/* Header */}
      <div className="h-12 border-b border-white/5 flex items-center justify-between px-4 select-none shrink-0 bg-[#0f0f0f] drag-region">
        <div className="flex items-center min-w-0">
          <span className="min-w-0 truncate text-sm font-medium tracking-tight text-white" title="Ayati - Quran Desktop Companion">
            Ayati - Quran Desktop Companion
          </span>
        </div>
        <button
          className="no-drag text-neutral-500 hover:text-white transition-colors flex items-center justify-center w-6 h-6"
          onClick={closeWindow}
        >
          <Icon icon="solar:close-circle-linear" className="text-lg" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex px-2 border-b border-white/5 shrink-0 bg-[#0f0f0f] overflow-x-auto scrollbar-hide">
        <button
          onClick={() => switchTab('prayers')}
          className={`px-3 py-2.5 text-xs font-medium border-b-2 transition-colors ${
            activeTab === 'prayers'
              ? 'text-[#67E0A3] border-[#67E0A3]'
              : 'text-neutral-500 border-transparent hover:text-neutral-300'
          }`}
        >
          Prayers
        </button>
        <button
          onClick={() => switchTab('todos')}
          className={`px-3 py-2.5 text-xs font-medium border-b-2 transition-colors ${
            activeTab === 'todos'
              ? 'text-[#67E0A3] border-[#67E0A3]'
              : 'text-neutral-500 border-transparent hover:text-neutral-300'
          }`}
        >
          To Do
        </button>
        <button
          onClick={() => switchTab('focus')}
          className={`px-3 py-2.5 text-xs font-medium border-b-2 transition-colors ${
            activeTab === 'focus'
              ? 'text-[#67E0A3] border-[#67E0A3]'
              : 'text-neutral-500 border-transparent hover:text-neutral-300'
          }`}
        >
          Focus
        </button>
        <button
          onClick={() => switchTab('reflections')}
          className={`px-3 py-2.5 text-xs font-medium border-b-2 transition-colors ${
            activeTab === 'reflections'
              ? 'text-[#67E0A3] border-[#67E0A3]'
              : 'text-neutral-500 border-transparent hover:text-neutral-300'
          }`}
        >
          Reflections
        </button>
        <button
          onClick={() => switchTab('settings')}
          className={`px-3 py-2.5 text-xs font-medium border-b-2 transition-colors inline-flex items-center gap-1.5 ${
            activeTab === 'settings'
              ? 'text-[#67E0A3] border-[#67E0A3]'
              : 'text-neutral-500 border-transparent hover:text-neutral-300'
          }`}
        >
          Settings
          {shouldShowUpdateBadge(updateState) && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#67E0A3]" aria-hidden="true" />
          )}
        </button>
      </div>

      {activeTab === 'prayers' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-white">Prayer Times</h2>
              <p className="text-xs text-neutral-500 mt-1">
                {prayerDay ? `${prayerDay.city}, ${prayerDay.country}` : 'Set your city and country to load today\'s prayer schedule.'}
              </p>
            </div>
            <button
              type="button"
              onClick={refreshPrayerPanel}
              className="px-3 py-2 border border-white/10 rounded-md text-xs text-neutral-300 hover:border-[#67E0A3]/70"
            >
              Refresh
            </button>
          </div>

          {!currentPrayerDraft.hasSavedSettings && (
            <section className="border border-white/10 rounded-md p-3 bg-white/[0.03]">
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="block text-xs font-medium text-neutral-300 mb-1.5">Country</span>
                  <select
                    aria-label="Prayer country"
                    value={currentPrayerDraft.country}
                    onChange={(event) => {
                      const country = event.target.value;
                      const firstCity = PRAYER_LOCATION_PRESETS.find((preset) => preset.country === country)?.cities[0] ?? '';
                      setPrayerDraft((current) => ({ ...(current ?? currentPrayerDraft), country, city: firstCity }));
                    }}
                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2 text-sm text-neutral-200 outline-none focus:border-[#67E0A3]"
                  >
                    <option value="">Select country</option>
                    {prayerCountryOptions.map((country) => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="block text-xs font-medium text-neutral-300 mb-1.5">City</span>
                  <select
                    aria-label="Prayer city"
                    value={currentPrayerDraft.city}
                    onChange={(event) => setPrayerDraft((current) => ({ ...(current ?? currentPrayerDraft), city: event.target.value }))}
                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2 text-sm text-neutral-200 outline-none focus:border-[#67E0A3]"
                  >
                    <option value="">Select city</option>
                    {prayerCityOptions.map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-2 text-sm text-neutral-300">
                  <input
                    type="checkbox"
                    checked={currentPrayerDraft.enabled}
                    onChange={(event) => setPrayerDraft((current) => ({ ...(current ?? currentPrayerDraft), enabled: event.target.checked }))}
                  />
                  Enable Prayer Awareness
                </label>
                <label className="block">
                  <span className="block text-xs font-medium text-neutral-300 mb-1.5">Reminder Lead Minutes</span>
                  <input
                    type="number"
                    min={0}
                    max={120}
                    value={currentPrayerDraft.reminderLeadMinutes}
                    onChange={(event) => setPrayerDraft((current) => ({ ...(current ?? currentPrayerDraft), reminderLeadMinutes: Number(event.target.value) }))}
                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2 text-sm text-neutral-200 outline-none focus:border-[#67E0A3]"
                  />
                </label>
                <label className="block">
                  <span className="block text-xs font-medium text-neutral-300 mb-1.5">Calculation Method</span>
                  <select
                    aria-label="Prayer calculation method"
                    value={currentPrayerDraft.method}
                    onChange={(event) => {
                      const method = Number(event.target.value);
                      setPrayerDraft((current) => ({ ...(current ?? currentPrayerDraft), method }));
                      persistPrayerCalculationFromDraft({ method });
                    }}
                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2 text-sm text-neutral-200 outline-none focus:border-[#67E0A3]"
                  >
                    {PRAYER_CALCULATION_METHODS.map((method) => (
                      <option key={method.id} value={method.id}>{method.label}</option>
                    ))}
                  </select>
                  <p className="text-[11px] text-neutral-500 mt-1.5 leading-snug" role="note">{PRAYER_CALCULATION_METHOD_UK_NOTE}</p>
                </label>
                <label className="block">
                  <span className="block text-xs font-medium text-neutral-300 mb-1.5">Juristic School</span>
                  <select
                    aria-label="Prayer juristic school"
                    value={currentPrayerDraft.school}
                    onChange={(event) => {
                      const school = Number(event.target.value) as 0 | 1;
                      setPrayerDraft((current) => ({ ...(current ?? currentPrayerDraft), school }));
                      persistPrayerCalculationFromDraft({ school });
                    }}
                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2 text-sm text-neutral-200 outline-none focus:border-[#67E0A3]"
                  >
                    {PRAYER_JURISTIC_SCHOOLS.map((school) => (
                      <option key={school.id} value={school.id}>{school.label}</option>
                    ))}
                  </select>
                </label>
              </div>
              <button
                type="button"
                onClick={savePrayerSettings}
                className="mt-3 w-full px-3 py-2 bg-[#67E0A3] text-[#07120f] rounded-md text-xs font-semibold"
              >
                Save Prayer Settings
              </button>
            </section>
          )}

          <section className="border border-white/10 rounded-md p-3 bg-white/[0.03]">
            <p className="text-xs text-neutral-500">Next Prayer</p>
            <h3 className="mt-1 text-xl font-semibold text-white">
              {nextPrayer
                ? `${nextPrayer.label}${nextPrayerIsTomorrow ? ' (tomorrow)' : ''}`
                : 'No upcoming prayer loaded'}
            </h3>
            {nextPrayer && (
              <p
                className="mt-1 text-sm text-neutral-400 tabular-nums"
                aria-label={`${formatNextPrayerCountdown(nextPrayer.at - now)} until ${nextPrayer.label}`}
              >
                {formatNextPrayerCountdown(nextPrayer.at - now)}
              </p>
            )}
            {prayerDay?.error && <p className="mt-2 text-xs text-amber-300">{prayerDay.error}</p>}
          </section>

          <div className="space-y-2">
            {(prayerDay?.prayers ?? []).map((prayer) => (
              <div key={prayer.name} className="flex items-center justify-between border border-white/10 rounded-md px-3 py-2">
                <span className="text-sm text-neutral-200">{prayer.label}</span>
                <span className="text-sm text-[#67E0A3] tabular-nums">{prayer.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'todos' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
          <div>
            <h2 className="text-sm font-semibold text-white">To Do</h2>
            <p className="text-xs text-neutral-500 mt-1">Local tasks with optional pet reminders.</p>
          </div>
          <div className="relative" ref={todoAddDropdownRef}>
            {!todoAddDropdownOpen ? (
              <button
                type="button"
                aria-expanded={false}
                aria-controls="todo-add-form-panel"
                aria-haspopup="dialog"
                onClick={() => setTodoAddDropdownOpen(true)}
                className="w-full px-3 py-2 bg-[#67E0A3] text-[#07120f] rounded-md text-xs font-semibold"
              >
                Add Task
              </button>
            ) : (
              <section
                id="todo-add-form-panel"
                role="dialog"
                aria-label="Add task"
                className="rounded-md bg-[#67E0A3] p-3 space-y-2 shadow-[0_18px_40px_-12px_rgba(0,0,0,0.45)] border border-[#07120f]/15"
              >
                <input
                  aria-label="Task title"
                  value={todoTitle}
                  onChange={(event) => setTodoTitle(event.target.value)}
                  placeholder="Task title"
                  className="w-full bg-[#0a0a0a] border border-[#07120f]/25 rounded-md px-3 py-2 text-sm text-neutral-200 placeholder:text-neutral-500 outline-none focus:border-[#07120f]/50 focus:ring-1 focus:ring-[#07120f]/30"
                />
                <textarea
                  aria-label="Task notes"
                  value={todoNotes}
                  onChange={(event) => setTodoNotes(event.target.value)}
                  placeholder="Notes"
                  rows={2}
                  className="w-full bg-[#0a0a0a] border border-[#07120f]/25 rounded-md px-3 py-2 text-sm text-neutral-200 placeholder:text-neutral-500 outline-none focus:border-[#07120f]/50 focus:ring-1 focus:ring-[#07120f]/30"
                />
                <div className="grid grid-cols-3 gap-2">
                  <select
                    aria-label="Task priority"
                    value={todoPriority}
                    onChange={(event) => setTodoPriority(event.target.value as TodoPriority)}
                    className="bg-[#0a0a0a] border border-[#07120f]/25 rounded-md px-2 py-2 text-xs text-neutral-300 outline-none focus:border-[#07120f]/50"
                  >
                    <option value="none">No Priority</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                  <input aria-label="Task due date" type="datetime-local" value={todoDueAt} onChange={(event) => setTodoDueAt(event.target.value)} className="bg-[#0a0a0a] border border-[#07120f]/25 rounded-md px-2 py-2 text-xs text-neutral-300 outline-none focus:border-[#07120f]/50" />
                  <input aria-label="Task reminder date" type="datetime-local" value={todoReminderAt} onChange={(event) => setTodoReminderAt(event.target.value)} className="bg-[#0a0a0a] border border-[#07120f]/25 rounded-md px-2 py-2 text-xs text-neutral-300 outline-none focus:border-[#07120f]/50" />
                </div>
                <button type="button" onClick={createTodoFromPanel} className="w-full px-3 py-2 bg-[#07120f] text-[#67E0A3] rounded-md text-xs font-semibold">
                  Add Task
                </button>
              </section>
            )}
          </div>

          <section className="space-y-2">
            <h3 className="text-xs font-semibold text-neutral-400">Active</h3>
            {incompleteTodos.length === 0 && <p className="text-sm text-neutral-500 border border-white/10 rounded-md p-4">No tasks yet.</p>}
            {incompleteTodos.map((todo) => (
              <article key={todo.id} className="border border-white/10 rounded-md p-3 bg-white/[0.02]">
                <div className="flex items-center justify-between gap-3">
                  <label className="flex min-w-0 items-center gap-2 text-sm text-neutral-200">
                    <input
                      type="checkbox"
                      className="h-4 w-4 shrink-0 accent-[#67E0A3]"
                      checked={false}
                      onChange={() => completeTodoFromPanel(todo.id, true)}
                    />
                    <span className="leading-snug">{todo.title}</span>
                  </label>
                  <button type="button" onClick={() => deleteTodoFromPanel(todo.id)} className="text-xs text-neutral-500 hover:text-neutral-300">Delete</button>
                </div>
                {todo.notes && <p className="mt-2 text-xs text-neutral-500">{todo.notes}</p>}
              </article>
            ))}
          </section>

          {completedTodos.length > 0 && (
            <section className="space-y-2">
              <h3 className="text-xs font-semibold text-neutral-400">Completed</h3>
              {completedTodos.map((todo) => (
                <article key={todo.id} className="border border-white/10 rounded-md p-3 bg-white/[0.02]">
                  <label className="flex min-w-0 items-center gap-2 text-sm text-neutral-500">
                    <input
                      type="checkbox"
                      className="h-4 w-4 shrink-0 accent-[#67E0A3]"
                      checked
                      onChange={() => completeTodoFromPanel(todo.id, false)}
                    />
                    <span className="leading-snug">{todo.title}</span>
                  </label>
                </article>
              ))}
            </section>
          )}
        </div>
      )}

      {activeTab === 'focus' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
          <div>
            <h2 className="text-sm font-semibold text-white">Focus</h2>
            <p className="text-xs text-neutral-500 mt-1">Pomodoro sessions with optional task links.</p>
          </div>
          <section className="text-center border border-white/10 rounded-md p-5 bg-white/[0.03]">
            <p className="text-xs text-neutral-500">{pomodoroState?.activeSession?.kind ?? 'focus'}</p>
            <h3 className="text-5xl font-semibold tabular-nums text-white mt-2">{pomodoroDisplay}</h3>
            <p className="mt-2 text-xs text-neutral-500">{pomodoroState?.activeSession?.status ?? 'idle'}</p>
            {(pomodoroState?.activeSession?.status === 'running' || pomodoroState?.activeSession?.status === 'paused') && (
              <p className="mt-2 text-xs text-neutral-600 max-w-xs mx-auto">
                A small timer window appears above your companion. You can also hover the Ayati tray icon for the same countdown.
              </p>
            )}
          </section>
          <select
            aria-label="Focus task"
            value={selectedFocusTodoId}
            onChange={(event) => setSelectedFocusTodoId(event.target.value)}
            className="w-full bg-[#0a0a0a] border border-white/10 rounded-md px-3 py-2 text-sm text-neutral-300"
          >
            <option value="">No linked task</option>
            {incompleteTodos.map((todo) => <option key={todo.id} value={todo.id}>{todo.title}</option>)}
          </select>
          <div className="grid grid-cols-3 gap-2">
            <label className="block text-xs text-neutral-400">
              Focus
              <input type="number" min={1} value={pomodoroState?.settings.focusMinutes ?? 25} onChange={(event) => updatePomodoroSettingsFromPanel({ focusMinutes: Number(event.target.value) })} className="mt-1 w-full bg-[#0a0a0a] border border-white/10 rounded-md px-2 py-2 text-sm text-neutral-200" />
            </label>
            <label className="block text-xs text-neutral-400">
              Short Break
              <input type="number" min={1} value={pomodoroState?.settings.shortBreakMinutes ?? 5} onChange={(event) => updatePomodoroSettingsFromPanel({ shortBreakMinutes: Number(event.target.value) })} className="mt-1 w-full bg-[#0a0a0a] border border-white/10 rounded-md px-2 py-2 text-sm text-neutral-200" />
            </label>
            <label className="block text-xs text-neutral-400">
              Long Break
              <input type="number" min={1} value={pomodoroState?.settings.longBreakMinutes ?? 15} onChange={(event) => updatePomodoroSettingsFromPanel({ longBreakMinutes: Number(event.target.value) })} className="mt-1 w-full bg-[#0a0a0a] border border-white/10 rounded-md px-2 py-2 text-sm text-neutral-200" />
            </label>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button type="button" onClick={() => startPomodoroFromPanel('focus')} className="px-3 py-2 bg-[#67E0A3] text-[#07120f] rounded-md text-xs font-semibold">Start Focus</button>
            <button type="button" onClick={() => startPomodoroFromPanel('shortBreak')} className="px-3 py-2 border border-white/10 rounded-md text-xs text-neutral-300">Start Short Break</button>
            <button type="button" onClick={() => startPomodoroFromPanel('longBreak')} className="px-3 py-2 border border-white/10 rounded-md text-xs text-neutral-300">Start Long Break</button>
            <button type="button" onClick={async () => setPomodoroState(await window.ayati.pausePomodoro())} className="px-3 py-2 border border-white/10 rounded-md text-xs text-neutral-300">Pause</button>
            <button type="button" onClick={async () => setPomodoroState(await window.ayati.resumePomodoro())} className="px-3 py-2 border border-white/10 rounded-md text-xs text-neutral-300">Resume</button>
            <button type="button" onClick={async () => setPomodoroState(await window.ayati.cancelPomodoro())} className="px-3 py-2 border border-white/10 rounded-md text-xs text-neutral-300">Cancel</button>
          </div>
          <p className="text-xs text-neutral-500">Completed focus sessions: {pomodoroState?.completedFocusCount ?? 0}</p>
        </div>
      )}

      {/* CONTENT: Reflections */}
      {activeTab === 'reflections' && (
        <div className="flex-1 flex flex-col overflow-y-auto p-4 scrollbar-hide">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white">Recent Reflections</h2>
              <p className="text-xs text-neutral-500 mt-1">Screenshots stay transient; only text summaries are saved.</p>
            </div>
            <button
              onClick={reflectOnScreen}
              disabled={isLoading}
              className="px-3 py-2 bg-[#67E0A3] text-[#07120f] rounded-md text-xs font-semibold disabled:opacity-60"
            >
              Reflect on Screen
            </button>
          </div>

          {quranStatusMessage && (
            <div className="mb-3 text-xs text-[#67E0A3] bg-[#67E0A3]/10 border border-[#67E0A3]/25 rounded-md px-3 py-2">
              {quranStatusMessage}
            </div>
          )}

          <section className="mb-4 grid gap-3 border border-white/10 rounded-md p-3 bg-white/[0.03]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-semibold text-white">Day Recap</h3>
                <p className="text-[11px] text-neutral-500">
                  {daySummary
                    ? `${daySummary.reflectionCount} reflections, ${daySummary.savedCount} saved, ${daySummary.noteCount} notes today`
                    : 'No day summary loaded yet.'}
                </p>
              </div>
              <div className="text-right text-[11px] text-neutral-400">
                <p>Quran streak: {streakSummary?.currentDays ?? 0} days</p>
                <p className={streakSummary?.syncState === 'synced' ? 'text-[#67E0A3]' : 'text-neutral-500'}>
                  {streakSummary?.syncState === 'synced' ? 'Today recorded' : 'Pending Quran Foundation'}
                </p>
              </div>
            </div>
            {daySummary && daySummary.themes.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {daySummary.themes.map((theme) => (
                  <span key={theme.id} className="text-[11px] px-2 py-1 rounded-md border border-white/10 text-neutral-300">
                    {theme.id} {theme.count}
                  </span>
                ))}
              </div>
            )}
          </section>

          <div className="mb-4 grid gap-2">
            <input
              type="search"
              aria-label="Search reflections"
              value={reflectionSearch}
              onChange={(event) => setReflectionSearch(event.target.value)}
              placeholder="Search reflections..."
              className="w-full bg-[#0a0a0a] border border-white/10 rounded-md px-3 py-2 text-sm text-neutral-200 outline-none focus:border-[#67E0A3]"
            />
            <div className="grid grid-cols-3 gap-2">
              <select
                aria-label="Saved status filter"
                value={reflectionStatusFilter}
                onChange={(event) => setReflectionStatusFilter(event.target.value as typeof reflectionStatusFilter)}
                className="bg-[#0a0a0a] border border-white/10 rounded-md px-2 py-2 text-xs text-neutral-300"
              >
                <option value="all">All</option>
                <option value="saved">Saved</option>
                <option value="pending">Pending</option>
              </select>
              <select
                aria-label="Theme filter"
                value={reflectionThemeFilter}
                onChange={(event) => setReflectionThemeFilter(event.target.value as typeof reflectionThemeFilter)}
                className="bg-[#0a0a0a] border border-white/10 rounded-md px-2 py-2 text-xs text-neutral-300"
              >
                <option value="all">All Themes</option>
                {availableThemes.map((theme) => (
                  <option key={theme} value={theme}>{theme}</option>
                ))}
              </select>
              <select
                aria-label="Feedback filter"
                value={reflectionFeedbackFilter}
                onChange={(event) => setReflectionFeedbackFilter(event.target.value as typeof reflectionFeedbackFilter)}
                className="bg-[#0a0a0a] border border-white/10 rounded-md px-2 py-2 text-xs text-neutral-300"
              >
                <option value="all">All Feedback</option>
                <option value="relevant">Relevant</option>
                <option value="not_relevant">Not Relevant</option>
              </select>
            </div>
          </div>

          {reflections.length === 0 ? (
            <div className="text-center text-neutral-500 py-12 border border-white/10 rounded-md">
              <p className="mb-2 text-neutral-300">No reflections yet.</p>
              <p>Capture your screen to receive a Quran-focused reminder.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReflections.map((reflection) => (
                <article key={reflection.id} className="border-t border-white/10 pt-4">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <span className="text-xs font-semibold text-[#67E0A3]">
                      {reflection.surahName} {reflection.verseKey}
                    </span>
                    <span className="text-[10px] uppercase tracking-wide text-neutral-500">
                      {reflection.syncState}
                    </span>
                  </div>
                  <QulArabicText
                    verseKey={reflection.verseKey}
                    fallbackText={reflection.arabicText}
                    className="text-right text-white"
                    variant="assistant"
                    qulSettingsKey={ayahQulSettingsKey}
                  />
                  <p translate="no" className="text-sm leading-relaxed text-neutral-200 mt-2">
                    {reflection.translation}
                  </p>
                  <p className="text-xs leading-relaxed text-neutral-500 mt-3">
                    {reflection.whyThisVerse}
                  </p>
                  {reflection.tafsir && (
                    <p className="text-xs leading-relaxed text-neutral-400 mt-3 border-l border-[#67E0A3]/40 pl-3">
                      <span className="text-[#AFF9C9]">Tafsir:</span> {reflection.tafsir.text}
                    </p>
                  )}
                  {reflection.audio?.url && (
                    <audio aria-label={`Recitation for ${reflection.verseKey}`} controls src={reflection.audio.url} className="mt-3 w-full" />
                  )}
                  <textarea
                    aria-label={`Note for ${reflection.verseKey}`}
                    value={noteDrafts[reflection.id] ?? reflection.note?.body ?? ''}
                    onChange={(event) => setNoteDrafts((current) => ({ ...current, [reflection.id]: event.target.value }))}
                    placeholder="Add a short note..."
                    className="mt-3 w-full bg-[#0a0a0a] border border-white/10 rounded-md px-3 py-2 text-xs text-neutral-200 outline-none focus:border-[#67E0A3]"
                    rows={2}
                  />
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <button
                      onClick={() => saveReflectionFromPanel(reflection.id)}
                      className="px-3 py-1.5 border border-white/10 rounded-md text-xs text-neutral-300 hover:border-[#67E0A3]/70"
                    >
                      {reflection.savedAt ? 'Sync Bookmark' : 'Save Bookmark'}
                    </button>
                    <button
                      onClick={() => loadReflectionTafsir(reflection.id)}
                      className="px-3 py-1.5 border border-white/10 rounded-md text-xs text-neutral-300 hover:border-[#67E0A3]/70"
                    >
                      Load Tafsir
                    </button>
                    <button
                      onClick={() => loadReflectionAudio(reflection.id)}
                      className="px-3 py-1.5 border border-white/10 rounded-md text-xs text-neutral-300 hover:border-[#67E0A3]/70"
                    >
                      Load Recitation
                    </button>
                    <button
                      onClick={() => saveReflectionNoteFromPanel(reflection.id)}
                      className="px-3 py-1.5 border border-white/10 rounded-md text-xs text-neutral-300 hover:border-[#67E0A3]/70"
                    >
                      Save Note
                    </button>
                    <select
                      aria-label={`Collection for ${reflection.verseKey}`}
                      defaultValue=""
                      onChange={(event) => {
                        if (event.target.value) void addReflectionToCollectionFromPanel(reflection.id, event.target.value);
                      }}
                      className="bg-[#0a0a0a] border border-white/10 rounded-md px-2 py-1.5 text-xs text-neutral-300"
                    >
                      <option value="">Save To Collection</option>
                      {collections.map((collection) => (
                        <option key={collection.id} value={collection.id}>{collection.name}</option>
                      ))}
                    </select>
                    <button
                      onClick={createCollectionFromPanel}
                      className="px-3 py-1.5 border border-white/10 rounded-md text-xs text-neutral-300 hover:border-[#67E0A3]/70"
                    >
                      Create Collection
                    </button>
                    <button
                      onClick={() => setReflectionFeedbackFromPanel(reflection.id, 'relevant')}
                      className="px-3 py-1.5 border border-white/10 rounded-md text-xs text-neutral-300 hover:border-[#67E0A3]/70"
                    >
                      Relevant
                    </button>
                    <button
                      onClick={() => setReflectionFeedbackFromPanel(reflection.id, 'not_relevant')}
                      className="px-3 py-1.5 border border-white/10 rounded-md text-xs text-neutral-300 hover:border-[#67E0A3]/70"
                    >
                      Not Relevant
                    </button>
                    <button
                      onClick={() => showAlternateFromPanel(reflection.id)}
                      className="px-3 py-1.5 border border-white/10 rounded-md text-xs text-neutral-300 hover:border-[#67E0A3]/70"
                    >
                      Show Another Ayah
                    </button>
                    <button
                      onClick={() => copyShareCardFromPanel(reflection.id)}
                      className="px-3 py-1.5 border border-white/10 rounded-md text-xs text-neutral-300 hover:border-[#67E0A3]/70"
                    >
                      Copy Share Card
                    </button>
                    <button
                      onClick={async () => {
                        await window.ayati.deleteAyahReflection(reflection.id);
                        await refreshReflections();
                      }}
                      className="px-3 py-1.5 border border-white/10 rounded-md text-xs text-neutral-500 hover:text-neutral-300"
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
              {filteredReflections.length === 0 && (
                <p className="text-center text-neutral-500 py-8">No reflections match these filters.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* CONTENT: Settings */}
      {activeTab === 'settings' && (
        <div className="flex-1 flex flex-col overflow-y-auto p-5 space-y-6 scrollbar-hide">
          {/* Group: App updates (first) */}
          <div>
            <h3 className="text-[10px] font-medium text-neutral-500 uppercase tracking-widest mb-3">
              Updates
            </h3>
            <p className="text-xs text-neutral-500 mb-3">
              Check for new releases and install updates for Ayati - Quran Desktop Companion.
            </p>

            <div className="border border-white/10 rounded-lg p-4 bg-white/[0.03]">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-neutral-200">{getUpdateStatusLabel(updateState)}</p>
                  <p className="text-[11px] text-neutral-500 mt-1">
                    Current version {updateState?.currentVersion ?? 'unknown'}
                  </p>
                </div>
                <span
                  className={`shrink-0 mt-1 w-2 h-2 rounded-full ${
                    updateState?.status === 'available' || updateState?.status === 'downloaded'
                      ? 'bg-[#67E0A3]'
                      : updateState?.status === 'error'
                        ? 'bg-red-400'
                        : 'bg-neutral-600'
                  }`}
                  aria-hidden="true"
                />
              </div>

              {typeof updateState?.downloadPercent === 'number' && updateState.status === 'downloading' && (
                <div className="mt-4 h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#67E0A3] transition-[width]"
                    style={{ width: `${Math.max(0, Math.min(100, updateState.downloadPercent))}%` }}
                  />
                </div>
              )}

              {updateState?.message && (
                <p className="text-xs leading-relaxed text-neutral-400 mt-3">{updateState.message}</p>
              )}

              {updateStatusMessage && (
                <p className="text-xs leading-relaxed text-[#67E0A3] mt-3">{updateStatusMessage}</p>
              )}

              {updateState?.checkedAt && (
                <p className="text-[11px] text-neutral-600 mt-3">
                  Last checked {new Date(updateState.checkedAt).toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              )}

              {updateState?.runningUnderArm64Translation && (
                <p className="text-xs leading-relaxed text-amber-300 mt-3">
                  This Mac is running the Intel build under Rosetta. The next compatible update can move you to the native Apple Silicon build.
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={handleUpdateAction}
              disabled={isUpdateButtonDisabled(updateState)}
              className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-[#67E0A3] text-[#07120f] rounded-md text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Icon
                icon={getUpdateAction(updateState) === 'install' ? 'solar:restart-linear' : 'solar:download-linear'}
                className="text-base"
              />
              {getUpdateButtonLabel(updateState)}
            </button>
          </div>

          <div className="pt-4 border-t border-white/5">
            <h3 className="text-[10px] font-medium text-neutral-500 uppercase tracking-widest mb-3">
              AI Provider
            </h3>
            <AiProviderSettingsFields
              idPrefix="assistant-ai-provider"
              provider={aiProvider}
              baseUrl={clawbotSettings?.url || ''}
              model={clawbotSettings?.model || ''}
              apiKey={clawbotSettings?.token || ''}
              onProviderChange={handleAiProviderChange}
              onBaseUrlChange={(value) => updateSetting('clawbot.url', value)}
              onModelChange={(value) => updateSetting('clawbot.model', value)}
              onApiKeyChange={(value) => updateSetting('clawbot.token', value)}
            />
          </div>

          <div className="pt-4 border-t border-white/5">
            <h3 className="text-[10px] font-medium text-neutral-500 uppercase tracking-widest mb-3">
              Quran Reminders
            </h3>
            <div className="space-y-3">
              <label className="flex items-center justify-between cursor-pointer group">
                <div className="flex flex-col pr-4">
                  <span className="text-sm font-medium text-neutral-300">
                    Timer Quran Reminders
                  </span>
                  <span className="text-[11px] text-neutral-500 mt-0.5">
                    Show a Quran reminder on the interval you choose
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={ayahSettings?.timedReminders ?? false}
                    onChange={(event) => updateAyahSetting('timedReminders', event.target.checked)}
                  />
                  <div className="w-9 h-5 bg-neutral-800 rounded-full peer-checked:bg-[#67E0A3] transition-colors border border-white/5"></div>
                  <div className="absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-4 shadow-sm"></div>
                </div>
              </label>

              <label className="flex items-center justify-between cursor-pointer group">
                <div className="flex flex-col pr-4">
                  <span className="text-sm font-medium text-neutral-300">
                    App Switch Quran Nudges
                  </span>
                  <span className="text-[11px] text-neutral-500 mt-0.5">
                    Show Quran-linked reminders only when app context is clear
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={ayahSettings?.contextualNudges ?? true}
                    onChange={(event) => updateAyahSetting('contextualNudges', event.target.checked)}
                  />
                  <div className="w-9 h-5 bg-neutral-800 rounded-full peer-checked:bg-[#67E0A3] transition-colors border border-white/5"></div>
                  <div className="absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-4 shadow-sm"></div>
                </div>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="block text-xs font-medium text-neutral-300 mb-1.5">Timer Minutes</span>
                  <input
                    type="number"
                    min={1}
                    max={1440}
                    list="timed-reminder-options"
                    value={ayahSettings?.timedReminderMinutes ?? 15}
                    onChange={(event) => updateAyahSetting('timedReminderMinutes', Number(event.target.value))}
                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2 text-sm text-neutral-200 outline-none focus:border-[#67E0A3] focus:ring-1 focus:ring-[#67E0A3]/30 transition-all"
                  />
                  <datalist id="timed-reminder-options">
                    <option value="5" />
                    <option value="10" />
                    <option value="15" />
                    <option value="20" />
                    <option value="60" />
                  </datalist>
                  <span className="mt-1 block text-[11px] text-neutral-500">
                    Use 5, 10, 15, 20, 60, or any minute interval.
                  </span>
                </label>
                <label className="block">
                  <span className="block text-xs font-medium text-neutral-300 mb-1.5">Cooldown Minutes</span>
                  <input
                    type="number"
                    min={1}
                    max={240}
                    value={ayahSettings?.nudgeCooldownMinutes ?? 15}
                    onChange={(event) => updateAyahSetting('nudgeCooldownMinutes', Number(event.target.value))}
                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2 text-sm text-neutral-200 outline-none focus:border-[#67E0A3] focus:ring-1 focus:ring-[#67E0A3]/30 transition-all"
                  />
                </label>
              </div>
              <label className="block">
                <span className="block text-xs font-medium text-neutral-300 mb-1.5">Reminder Listen Reciter</span>
                <select
                  aria-label="Reminder Listen Reciter"
                  value={ayahSettings?.recitationId ?? ''}
                  onChange={(event) => updateReminderListenReciter(event.target.value)}
                  disabled={recitationResources.length === 0}
                  className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2 text-sm text-neutral-200 outline-none focus:border-[#67E0A3] focus:ring-1 focus:ring-[#67E0A3]/30 transition-all disabled:opacity-60"
                >
                  <option value="">
                    {recitationResources.length === 0 ? 'Loading reciters' : 'Choose reciter'}
                  </option>
                  {recitationResources.map((resource) => (
                    <option key={resource.id} value={resource.id}>{resource.name}</option>
                  ))}
                </select>
                <span className="mt-1 block text-[11px] text-neutral-500">
                  Used when you press Listen on Quran reminder cards.
                </span>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-white/5">
            <h3 className="text-[10px] font-medium text-neutral-500 uppercase tracking-widest mb-3">
              Prayer Awareness
            </h3>
            <div className="space-y-3">
              <label className="flex items-center justify-between cursor-pointer group">
                <div className="flex flex-col pr-4">
                  <span className="text-sm font-medium text-neutral-300">Enable Prayer Awareness</span>
                  <span className="text-[11px] text-neutral-500 mt-0.5">Show prayer schedule and pet reminders</span>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={prayerSettings?.enabled ?? false}
                    onChange={(event) => updatePrayerSettingsFromSettings({ enabled: event.target.checked })}
                  />
                  <div className="w-9 h-5 bg-neutral-800 rounded-full peer-checked:bg-[#67E0A3] transition-colors border border-white/5"></div>
                  <div className="absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-4 shadow-sm"></div>
                </div>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="block text-xs font-medium text-neutral-300 mb-1.5">Country</span>
                  <select
                    value={currentPrayerDraft.country}
                    onChange={(event) => {
                      const country = event.target.value;
                      const firstCity = PRAYER_LOCATION_PRESETS.find((preset) => preset.country === country)?.cities[0] ?? '';
                      updatePrayerSettingsFromSettings({ country, city: firstCity });
                    }}
                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2 text-sm text-neutral-200 outline-none focus:border-[#67E0A3] focus:ring-1 focus:ring-[#67E0A3]/30 transition-all"
                  >
                    <option value="">Select country</option>
                    {prayerCountryOptions.map((country) => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="block text-xs font-medium text-neutral-300 mb-1.5">City</span>
                  <select
                    value={currentPrayerDraft.city}
                    onChange={(event) => updatePrayerSettingsFromSettings({ city: event.target.value })}
                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2 text-sm text-neutral-200 outline-none focus:border-[#67E0A3] focus:ring-1 focus:ring-[#67E0A3]/30 transition-all"
                  >
                    <option value="">Select city</option>
                    {prayerCityOptions.map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="block text-xs font-medium text-neutral-300 mb-1.5">Reminder Lead</span>
                  <input
                    type="number"
                    min={0}
                    max={120}
                    value={prayerSettings?.reminderLeadMinutes ?? 10}
                    onChange={(event) => updatePrayerSettingsFromSettings({ reminderLeadMinutes: Number(event.target.value) })}
                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2 text-sm text-neutral-200 outline-none focus:border-[#67E0A3] focus:ring-1 focus:ring-[#67E0A3]/30 transition-all"
                  />
                </label>
                <label className="block">
                  <span className="block text-xs font-medium text-neutral-300 mb-1.5">Calculation</span>
                  <select
                    value={currentPrayerDraft.method}
                    onChange={(event) => updatePrayerSettingsFromSettings({ method: Number(event.target.value) })}
                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2 text-sm text-neutral-200 outline-none focus:border-[#67E0A3] focus:ring-1 focus:ring-[#67E0A3]/30 transition-all"
                  >
                    {PRAYER_CALCULATION_METHODS.map((method) => (
                      <option key={method.id} value={method.id}>{method.label}</option>
                    ))}
                  </select>
                  <p className="text-[11px] text-neutral-500 mt-1.5 leading-snug" role="note">{PRAYER_CALCULATION_METHOD_UK_NOTE}</p>
                </label>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/5">
            <h3 className="text-[10px] font-medium text-neutral-500 uppercase tracking-widest mb-3">
              To Do
            </h3>
            <label className="flex items-center justify-between cursor-pointer group">
              <div className="flex flex-col pr-4">
                <span className="text-sm font-medium text-neutral-300">Pet Task Reminders</span>
                <span className="text-[11px] text-neutral-500 mt-0.5">Send pet reminders for due local tasks</span>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={todos?.settings?.petRemindersEnabled ?? true}
                  onChange={(event) => updateTodoSettingsFromSettings({ petRemindersEnabled: event.target.checked })}
                />
                <div className="w-9 h-5 bg-neutral-800 rounded-full peer-checked:bg-[#67E0A3] transition-colors border border-white/5"></div>
                <div className="absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-4 shadow-sm"></div>
              </div>
            </label>
          </div>

          <div className="pt-4 border-t border-white/5">
            <h3 className="text-[10px] font-medium text-neutral-500 uppercase tracking-widest mb-3">
              Focus
            </h3>
            <div className="space-y-3">
              <label className="flex items-center justify-between cursor-pointer group">
                <div className="flex flex-col pr-4">
                  <span className="text-sm font-medium text-neutral-300">Pet Focus Reminders</span>
                  <span className="text-[11px] text-neutral-500 mt-0.5">Announce completed focus and break sessions</span>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={pomodoroState?.settings.petRemindersEnabled ?? true}
                    onChange={(event) => updatePomodoroSettingsFromPanel({ petRemindersEnabled: event.target.checked })}
                  />
                  <div className="w-9 h-5 bg-neutral-800 rounded-full peer-checked:bg-[#67E0A3] transition-colors border border-white/5"></div>
                  <div className="absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-4 shadow-sm"></div>
                </div>
              </label>
              <div className="grid grid-cols-3 gap-3">
                <label className="block">
                  <span className="block text-xs font-medium text-neutral-300 mb-1.5">Focus</span>
                  <input
                    type="number"
                    min={1}
                    max={240}
                    value={pomodoroState?.settings.focusMinutes ?? 25}
                    onChange={(event) => updatePomodoroSettingsFromPanel({ focusMinutes: Number(event.target.value) })}
                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2 text-sm text-neutral-200 outline-none focus:border-[#67E0A3] focus:ring-1 focus:ring-[#67E0A3]/30 transition-all"
                  />
                </label>
                <label className="block">
                  <span className="block text-xs font-medium text-neutral-300 mb-1.5">Short Break</span>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={pomodoroState?.settings.shortBreakMinutes ?? 5}
                    onChange={(event) => updatePomodoroSettingsFromPanel({ shortBreakMinutes: Number(event.target.value) })}
                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2 text-sm text-neutral-200 outline-none focus:border-[#67E0A3] focus:ring-1 focus:ring-[#67E0A3]/30 transition-all"
                  />
                </label>
                <label className="block">
                  <span className="block text-xs font-medium text-neutral-300 mb-1.5">Long Break</span>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={pomodoroState?.settings.longBreakMinutes ?? 15}
                    onChange={(event) => updatePomodoroSettingsFromPanel({ longBreakMinutes: Number(event.target.value) })}
                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2 text-sm text-neutral-200 outline-none focus:border-[#67E0A3] focus:ring-1 focus:ring-[#67E0A3]/30 transition-all"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Group 2: Watching */}
          <div className="pt-4 border-t border-white/5">
            <h3 className="text-[10px] font-medium text-neutral-500 uppercase tracking-widest mb-3">
              Watching
            </h3>
            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-sm font-medium text-neutral-300">
                  Watch active app changes
                </span>
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={(settings.watch as { activeApp: boolean })?.activeApp ?? true}
                    onChange={(e) => updateSetting('watch.activeApp', e.target.checked)}
                  />
                  <div className="w-9 h-5 bg-neutral-800 rounded-full peer-checked:bg-[#67E0A3] transition-colors border border-white/5"></div>
                  <div className="absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-4 shadow-sm"></div>
                </div>
              </label>
              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-sm font-medium text-neutral-300">
                  Include window titles
                </span>
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={(settings.watch as { sendWindowTitles: boolean })?.sendWindowTitles ?? false}
                    onChange={(e) => updateSetting('watch.sendWindowTitles', e.target.checked)}
                  />
                  <div className="w-9 h-5 bg-neutral-800 rounded-full peer-checked:bg-[#67E0A3] transition-colors border border-white/5"></div>
                  <div className="absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-4 shadow-sm"></div>
                </div>
              </label>
            </div>
          </div>

          {/* Group 3: Companion Behavior */}
          <div className="pt-4 border-t border-white/5">
            <h3 className="text-[10px] font-medium text-neutral-500 uppercase tracking-widest mb-3">
              Companion Behavior
            </h3>
            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer group">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-neutral-300">
                    Seek attention
                  </span>
                  <span className="text-[11px] text-neutral-500 mt-0.5">
                    Move toward cursor periodically
                  </span>
                </div>
                <div className="relative shrink-0">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={(settings.pet as { attentionSeeker: boolean })?.attentionSeeker ?? true}
                    onChange={(e) => updateSetting('pet.attentionSeeker', e.target.checked)}
                  />
                  <div className="w-9 h-5 bg-neutral-800 rounded-full peer-checked:bg-[#67E0A3] transition-colors border border-white/5"></div>
                  <div className="absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-4 shadow-sm"></div>
                </div>
              </label>
              <label className="flex items-center justify-between cursor-pointer group">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-neutral-300">
                    Transparent while asleep
                  </span>
                  <span className="text-[11px] text-neutral-500 mt-0.5">
                    Fade Ayati - Quran Desktop Companion when in doze/sleep state
                  </span>
                </div>
                <div className="relative shrink-0">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={(settings.pet as { transparentWhenSleeping?: boolean })?.transparentWhenSleeping ?? false}
                    onChange={(e) => updateSetting('pet.transparentWhenSleeping', e.target.checked)}
                  />
                  <div className="w-9 h-5 bg-neutral-800 rounded-full peer-checked:bg-[#67E0A3] transition-colors border border-white/5"></div>
                  <div className="absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-4 shadow-sm"></div>
                </div>
              </label>
              <div className="space-y-2 pt-1">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-neutral-300">Companion appearance</span>
                  <span className="text-[11px] text-neutral-500 mt-0.5">
                    Which pet appears on your desktop
                  </span>
                </div>
                <select
                  aria-label="Companion appearance"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-neutral-200 outline-none focus:border-[#67E0A3]/40"
                  value={(settings.pet as { appearanceId?: PetAppearanceId })?.appearanceId ?? 'ayah'}
                  onChange={(e) => {
                    void updateSetting('pet.appearanceId', e.target.value as PetAppearanceId);
                  }}
                >
                  {PET_APPEARANCE_IDS.map((id) => (
                    <option key={id} value={id}>
                      {PET_APPEARANCE_LABELS[id]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Group 4: Keyboard Shortcuts */}
          <div className="pt-4 border-t border-white/5">
            <h3 className="text-[10px] font-medium text-neutral-500 uppercase tracking-widest mb-3">
              Keyboard Shortcuts
            </h3>
            <div className="space-y-1 divide-y divide-white/5">
              <HotkeyInput
                label="Open Chat"
                description="Summon the quick chat bar"
                value={(settings.hotkeys as { openChat?: string })?.openChat || 'CommandOrControl+Alt+,'}
                onChange={(value) => updateSetting('hotkeys.openChat', value)}
              />
              <HotkeyInput
                label="Open Assistant"
                description="Open the full assistant panel"
                value={(settings.hotkeys as { openAssistant?: string })?.openAssistant || 'CommandOrControl+Alt+.'}
                onChange={(value) => updateSetting('hotkeys.openAssistant', value)}
              />
              <HotkeyInput
                label="Reflect on Screen"
                description="Capture your screen and receive a fitting ayah"
                value={(settings.hotkeys as { captureScreen?: string })?.captureScreen || 'CommandOrControl+Alt+/'}
                onChange={(value) => updateSetting('hotkeys.captureScreen', value)}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-white/5">
            <h3 className="text-[10px] font-medium text-neutral-500 uppercase tracking-widest mb-3">
              Quran Foundation
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-neutral-300">
                    {quranAuthStatus.isConnected ? 'Connected' : 'Not connected'}
                  </p>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    {quranAuthStatus.userName ?? 'Sign in to sync bookmarks with Quran Foundation.'}
                  </p>
                </div>
                {quranAuthStatus.isConnected ? (
                  <button
                    onClick={disconnectQuran}
                    className="px-3 py-2 bg-white/5 border border-white/10 rounded-md hover:bg-white/10 text-xs font-medium text-neutral-300"
                  >
                    Sign Out
                  </button>
                ) : (
                  <button
                    onClick={startQuranSignIn}
                    className="px-3 py-2 bg-[#67E0A3] text-[#07120f] rounded-md text-xs font-semibold"
                  >
                    Sign In
                  </button>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-neutral-300">
                  Manual callback URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={oauthCallbackUrl}
                    onChange={(event) => setOauthCallbackUrl(event.target.value)}
                    placeholder="ayati://oauth/callback?code=..."
                    className="min-w-0 flex-1 bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2 text-xs text-neutral-200 outline-none focus:border-[#67E0A3] focus:ring-1 focus:ring-[#67E0A3]/30 transition-all"
                  />
                  <button
                    onClick={completeQuranSignIn}
                    className="px-3 py-2 bg-white/5 border border-white/10 rounded-md hover:bg-white/10 text-xs font-medium text-neutral-300"
                  >
                    Complete
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="block text-xs font-medium text-neutral-300 mb-1.5">Translation ID</span>
                  <input
                    type="number"
                    min={1}
                    value={ayahSettings?.translationId ?? 20}
                    onChange={(event) => updateAyahSetting('translationId', Number(event.target.value))}
                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2 text-sm text-neutral-200 outline-none focus:border-[#67E0A3] focus:ring-1 focus:ring-[#67E0A3]/30 transition-all"
                  />
                </label>
                <label className="block">
                  <span className="block text-xs font-medium text-neutral-300 mb-1.5">Mushaf ID</span>
                  <input
                    type="number"
                    min={1}
                    value={ayahSettings?.mushafId ?? 4}
                    onChange={(event) => updateAyahSetting('mushafId', Number(event.target.value))}
                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2 text-sm text-neutral-200 outline-none focus:border-[#67E0A3] focus:ring-1 focus:ring-[#67E0A3]/30 transition-all"
                  />
                </label>
              </div>

              <div className="space-y-3 rounded-lg border border-white/10 bg-[#0a0a0a]/80 px-3 py-3">
                <label className="flex items-center justify-between gap-3 cursor-pointer">
                  <span className="text-xs font-medium text-neutral-300">QUL Arabic script</span>
                  <input
                    type="checkbox"
                    className="rounded border-white/20 bg-black/40 text-[#67E0A3] focus:ring-[#67E0A3]"
                    checked={ayahSettings?.qulArabicEnabled !== false}
                    onChange={(e) => updateAyahSetting('qulArabicEnabled', e.target.checked)}
                  />
                </label>
                <label className="block">
                  <span className="block text-xs font-medium text-neutral-300 mb-1.5">QUL mushaf track</span>
                  <select
                    value={ayahSettings?.qulMushafKey === 'madaniTajweed' || ayahSettings?.qulMushafKey === 'madani1405' ? 'madani1421' : ayahSettings?.qulMushafKey ?? 'madani1421'}
                    onChange={(e) => updateAyahSetting('qulMushafKey', e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2 text-sm text-neutral-200 outline-none focus:border-[#67E0A3] focus:ring-1 focus:ring-[#67E0A3]/30 transition-all"
                  >
                    {QUL_SCRIPT_OPTIONS.map((opt) => (
                      <option
                        key={opt.value}
                        value={opt.value}
                        disabled={isQulFontPackMissing(qulFontPacks, opt.value)}
                      >
                        {opt.label}
                        {isQulFontPackMissing(qulFontPacks, opt.value) ? ' — fonts missing in bundle' : ''}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center justify-between gap-3 cursor-pointer">
                  <span className="text-xs font-medium text-neutral-300">Tajweed colors (QUL)</span>
                  <input
                    type="checkbox"
                    className="rounded border-white/20 bg-black/40 text-[#67E0A3] focus:ring-[#67E0A3]"
                    checked={Boolean(ayahSettings?.qulTajweedEnabled)}
                    onChange={(e) => updateAyahSetting('qulTajweedEnabled', e.target.checked)}
                  />
                </label>
                <p className="text-[10px] text-neutral-500 leading-relaxed">
                  Bundled QUL database + fonts (QuranScroll-style pipeline). Tajweed colors are tuned for Ayati&apos;s dark panels. Disable QUL to use Quran Foundation Arabic only.
                </p>
              </div>

              <p className="text-[11px] leading-relaxed text-neutral-500">
                Ayati - Quran Desktop Companion deletes screenshot data after analysis. Translation text from Quran Foundation is displayed as returned and is not re-translated.
              </p>
              {quranStatusMessage && <p className="text-[11px] text-[#67E0A3]">{quranStatusMessage}</p>}
            </div>
          </div>

          {/* Group 5: Developer */}
          <div className="pt-4 border-t border-white/5">
            <h3 className="text-[10px] font-medium text-neutral-500 uppercase tracking-widest mb-3">
              Developer
            </h3>
            <div className="space-y-3">
              {isDevEnvironment && (
                <label className="flex items-center justify-between cursor-pointer group px-1">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-neutral-300">
                      Show window borders
                    </span>
                    <span className="text-[11px] text-neutral-500 mt-0.5">
                      Draw debug outlines around window bounds
                    </span>
                  </div>
                  <div className="relative shrink-0">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={(settings.dev as { windowBorders?: boolean })?.windowBorders ?? false}
                      onChange={(e) => updateSetting('dev.windowBorders', e.target.checked)}
                    />
                    <div className="w-9 h-5 bg-neutral-800 rounded-full peer-checked:bg-[#67E0A3] transition-colors border border-white/5"></div>
                    <div className="absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-4 shadow-sm"></div>
                  </div>
                </label>
              )}
              {isDevEnvironment && (
                <label className="flex items-center justify-between cursor-pointer group px-1">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-neutral-300">
                      Show companion mode overlay
                    </span>
                    <span className="text-[11px] text-neutral-500 mt-0.5">
                      Display current mode text above Ayati - Quran Desktop Companion
                    </span>
                  </div>
                  <div className="relative shrink-0">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={(settings.dev as { showPetModeOverlay?: boolean })?.showPetModeOverlay ?? false}
                      onChange={(e) => updateSetting('dev.showPetModeOverlay', e.target.checked)}
                    />
                    <div className="w-9 h-5 bg-neutral-800 rounded-full peer-checked:bg-[#67E0A3] transition-colors border border-white/5"></div>
                    <div className="absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-4 shadow-sm"></div>
                  </div>
                </label>
              )}
              {isDevEnvironment && (
                <div className="space-y-2">
                  <div className="px-1">
                    <span className="text-sm font-medium text-neutral-300">
                      Force companion state
                    </span>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      Instantly set Ayati - Quran Desktop Companion's current mood state
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      'idle',
                      'happy',
                      'curious',
                      'thinking',
                      'excited',
                      'doze',
                      'sleeping',
                      'startle',
                      'proud',
                      'mad',
                      'spin',
                      'surprised',
                    ].map((mood) => (
                      <button
                        key={mood}
                        onClick={() => {
                          window.ayati.executePetAction({ type: 'set_mood', value: mood });
                        }}
                        className="px-2.5 py-2 bg-white/5 border border-white/10 rounded-md hover:bg-white/10 text-xs font-medium text-neutral-300 transition-colors"
                      >
                        {mood}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {isDevEnvironment && (
                <button
                  onClick={() => {
                    void window.ayati.forceActiveAppComment();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <Icon icon="solar:monitor-smartphone-linear" className="text-neutral-400 group-hover:text-neutral-300" />
                    <span className="text-sm font-medium text-neutral-300">Test Active App Comment</span>
                  </div>
                  <span className="text-[10px] text-neutral-500">Dev action</span>
                </button>
              )}
              {isDevEnvironment && (
                <button
                  onClick={() => {
                    void triggerTestReminderComment();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <Icon icon="solar:bell-bing-linear" className="text-neutral-400 group-hover:text-neutral-300" />
                    <span className="text-sm font-medium text-neutral-300">Test Reminder Comment</span>
                  </div>
                  <span className="text-[10px] text-neutral-500">Dev action</span>
                </button>
              )}
              {isDevEnvironment && (
                <button
                  onClick={() => {
                    void triggerTestPrayerReminderComment();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <Icon icon="solar:alarm-linear" className="text-neutral-400 group-hover:text-neutral-300" />
                    <span className="text-sm font-medium text-neutral-300">Test Prayer Reminder (Maghrib)</span>
                  </div>
                  <span className="text-[10px] text-neutral-500">Dev action</span>
                </button>
              )}
              {isDevEnvironment && (
                <button
                  onClick={() => {
                    void triggerTestTodoReminderComment();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <Icon icon="solar:clipboard-list-linear" className="text-neutral-400 group-hover:text-neutral-300" />
                    <span className="text-sm font-medium text-neutral-300">Test To Do Reminder</span>
                  </div>
                  <span className="text-[10px] text-neutral-500">Review PR 3</span>
                </button>
              )}
              {isDevEnvironment && (
                <button
                  onClick={() => {
                    window.ayati.forcePetSleep();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <Icon icon="solar:sleeping-linear" className="text-neutral-400 group-hover:text-neutral-300" />
                    <span className="text-sm font-medium text-neutral-300">Set Ayati - Quran Desktop Companion to Sleep</span>
                  </div>
                  <span className="text-[10px] text-neutral-500">Dev action</span>
                </button>
              )}
              <button
                onClick={() => {
                  window.ayati.replayTutorial();
                  window.ayati.closeAssistant();
                }}
                className="w-full flex items-center justify-between px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <Icon icon="solar:play-circle-linear" className="text-neutral-400 group-hover:text-neutral-300" />
                  <span className="text-sm font-medium text-neutral-300">Replay Tutorial</span>
                </div>
                <span className="text-[10px] text-neutral-500">Interactive guide</span>
              </button>
              <button
                onClick={() => {
                  if (confirm('This will reset onboarding and restart the app. Continue?')) {
                    window.ayati.resetOnboarding();
                  }
                }}
                className="w-full flex items-center justify-between px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <Icon icon="solar:restart-linear" className="text-neutral-400 group-hover:text-neutral-300" />
                  <span className="text-sm font-medium text-neutral-300">Reset Onboarding</span>
                </div>
                <span className="text-[10px] text-neutral-500">Restart required</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
