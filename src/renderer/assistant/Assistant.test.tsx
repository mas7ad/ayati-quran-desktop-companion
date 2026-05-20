import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Assistant } from './Assistant';

vi.mock('@iconify/react', () => ({
  Icon: ({ icon }: { icon: string }) => <span data-icon={icon} />,
}));

function createMockAyati() {
  return {
    getSettings: vi.fn().mockResolvedValue({}),
    getAyahLensSettings: vi.fn().mockResolvedValue({
      translationId: 131,
      tafsirResourceId: 169,
      tafsirResourceName: 'Tafsir Ibn Kathir',
      mushafId: 4,
      captureMode: 'fullScreen',
      saveScreenshots: false,
      defaultSave: false,
      contextualNudges: true,
      nudgeCooldownMinutes: 15,
      timedReminders: false,
      timedReminderMinutes: 15,
      recitationId: null,
      reciterName: null,
    }),
    getAyahRecitationResources: vi.fn().mockResolvedValue([
      { id: 7, name: 'Mishari Rashid al-`Afasy' },
      { id: 4, name: 'Abu Bakr Shatri' },
      { id: 1, name: 'Abdul Baset' },
    ]),
    getAyahTafsirResources: vi.fn().mockResolvedValue([
      { id: 169, name: 'Tafsir Ibn Kathir', languageName: 'english' },
      { id: 171, name: 'Tafhim-ul-Quran', languageName: 'english' },
    ]),
    getAyahTranslationResources: vi.fn().mockResolvedValue([
      { id: 131, name: 'Saheeh International', languageName: 'english' },
      { id: 20, name: 'Dr. Mustafa Khattab', languageName: 'english' },
    ]),
    getQuranAuthStatus: vi.fn().mockResolvedValue({ isConnected: false, scopes: [] }),
    getKeychainConsentStatus: vi.fn().mockResolvedValue({
      required: false,
      acknowledged: true,
      hasStoredSecrets: false,
    }),
    acknowledgeKeychainConsent: vi.fn().mockResolvedValue(true),
    ensureKeychainConsent: vi.fn().mockResolvedValue({ granted: true }),
    getAyahReflectionHistory: vi.fn().mockResolvedValue([]),
    getChatHistory: vi.fn().mockResolvedValue([]),
    getClawbotStatus: vi.fn().mockResolvedValue({ connected: true, error: null, gatewayUrl: '' }),
    getUpdateState: vi.fn().mockResolvedValue({
      enabled: true,
      status: 'idle',
      currentVersion: '0.0.1',
      hostArch: 'arm64',
      appArch: 'arm64',
      runningUnderArm64Translation: false,
      availableVersion: null,
      downloadedVersion: null,
      downloadPercent: null,
      checkedAt: null,
      message: null,
      errorContext: null,
      canRetry: false,
    }),
    checkForUpdate: vi.fn().mockResolvedValue({
      checked: true,
      state: {
        enabled: true,
        status: 'up-to-date',
        currentVersion: '0.0.1',
        hostArch: 'arm64',
        appArch: 'arm64',
        runningUnderArm64Translation: false,
        availableVersion: null,
        downloadedVersion: null,
        downloadPercent: null,
        checkedAt: '2026-04-20T10:00:00.000Z',
        message: null,
        errorContext: null,
        canRetry: false,
      },
    }),
    downloadUpdate: vi.fn(),
    installUpdate: vi.fn(),
    forceTimedReminderComment: vi.fn().mockResolvedValue(true),
    forcePrayerReminderComment: vi.fn().mockResolvedValue(true),
    forceTodoReminderComment: vi.fn().mockResolvedValue(true),
    executePetAction: vi.fn().mockResolvedValue({ ok: true }),
    getPrayerSettings: vi.fn().mockResolvedValue({
      enabled: false,
      city: '',
      country: '',
      method: 15,
      school: 0,
      reminderLeadMinutes: 10,
      quietMinutesAfterPrayer: 15,
      hasSavedSettings: false,
    }),
    updatePrayerSettings: vi.fn().mockResolvedValue({
      enabled: true,
      city: 'London',
      country: 'United Kingdom',
      method: 15,
      school: 0,
      reminderLeadMinutes: 10,
      quietMinutesAfterPrayer: 15,
      hasSavedSettings: true,
    }),
    getPrayerTimes: vi.fn().mockResolvedValue({
      today: {
        date: '2026-05-02',
        city: 'London',
        country: 'United Kingdom',
        method: 15,
        school: 0,
        timezone: 'Europe/London',
        source: 'aladhan',
        fetchedAt: Date.now(),
        prayers: [
          { name: 'fajr', label: 'Fajr', time: '04:11', at: Date.now() + 1000, isReminderEnabled: true },
          { name: 'sunrise', label: 'Sunrise', time: '05:44', at: Date.now() + 2000, isReminderEnabled: false },
          { name: 'dhuhr', label: 'Dhuhr', time: '13:02', at: Date.now() + 3000, isReminderEnabled: true },
          { name: 'asr', label: 'Asr', time: '17:07', at: Date.now() + 4000, isReminderEnabled: true },
          { name: 'maghrib', label: 'Maghrib', time: '20:17', at: Date.now() + 5000, isReminderEnabled: true },
          { name: 'isha', label: 'Isha', time: '21:43', at: Date.now() + 6000, isReminderEnabled: true },
        ],
      },
      tomorrow: null,
    }),
    refreshPrayerTimes: vi.fn().mockResolvedValue({
      today: {
        date: '2026-05-02',
        city: 'London',
        country: 'United Kingdom',
        method: 15,
        school: 0,
        timezone: 'Europe/London',
        source: 'aladhan',
        fetchedAt: Date.now(),
        prayers: [],
      },
      tomorrow: null,
    }),
    getTodos: vi.fn().mockResolvedValue([]),
    updateTodoSettings: vi.fn(),
    createTodo: vi.fn().mockResolvedValue([]),
    updateTodo: vi.fn(),
    completeTodo: vi.fn().mockResolvedValue([]),
    deleteTodo: vi.fn().mockResolvedValue([]),
    getPomodoroState: vi.fn().mockResolvedValue({
      settings: {
        focusMinutes: 25,
        shortBreakMinutes: 5,
        longBreakMinutes: 15,
        sessionsUntilLongBreak: 4,
        petRemindersEnabled: true,
      },
      activeSession: null,
      completedFocusCount: 0,
      history: [],
      sentCompletionIds: [],
    }),
    updatePomodoroSettings: vi.fn(),
    startPomodoro: vi.fn().mockResolvedValue({
      settings: {
        focusMinutes: 25,
        shortBreakMinutes: 5,
        longBreakMinutes: 15,
        sessionsUntilLongBreak: 4,
        petRemindersEnabled: true,
      },
      activeSession: {
        id: 'session-1',
        kind: 'focus',
        status: 'running',
        startedAt: Date.now(),
        pausedAt: null,
        accumulatedPausedMs: 0,
        durationMinutes: 25,
        todoId: null,
        completedAt: null,
      },
      completedFocusCount: 0,
      history: [],
      sentCompletionIds: [],
    }),
    pausePomodoro: vi.fn(),
    resumePomodoro: vi.fn(),
    cancelPomodoro: vi.fn(),
    completePomodoro: vi.fn(),
    onUpdateState: vi.fn(),
    onConnectionStatusChange: vi.fn(),
    onAyahOAuthCallback: vi.fn(),
    onClawbotSuggestion: vi.fn(),
    onCronResult: vi.fn(),
    onCronError: vi.fn(),
    onClawbotStreamChunk: vi.fn(),
    onClawbotStreamEnd: vi.fn(),
    onClawbotStreamError: vi.fn(),
    onChatSync: vi.fn(),
    onSwitchToChat: vi.fn(),
    onSwitchToSettings: vi.fn(),
    onSwitchToPrayers: vi.fn(),
    onSwitchToTodos: vi.fn(),
    onSwitchToFocus: vi.fn(),
    saveChatHistory: vi.fn(),
    removeAllListeners: vi.fn(),
    closeAssistant: vi.fn(),
    beginHotkeyCapture: vi.fn().mockResolvedValue(undefined),
    endHotkeyCapture: vi.fn().mockResolvedValue(undefined),
    updateSettings: vi.fn().mockResolvedValue({}),
    qulIsAvailable: vi.fn().mockResolvedValue(false),
    getQulFontPacks: vi.fn().mockResolvedValue({
      madani1421: true,
      indoPakNastaleeq: true,
    }),
    getQulRenderedVerse: vi.fn().mockResolvedValue(null),
  } satisfies Partial<Window['ayati']>;
}

describe('Assistant updates in settings', () => {
  it('saves the reminders listen reciter from settings', async () => {
    const ayati = createMockAyati();
    ayati.updateAyahLensSetting = vi.fn()
      .mockResolvedValueOnce({
        translationId: 20,
        mushafId: 4,
        captureMode: 'fullScreen',
        saveScreenshots: false,
        defaultSave: false,
        contextualNudges: true,
        nudgeCooldownMinutes: 15,
        timedReminders: false,
        timedReminderMinutes: 15,
        recitationId: 4,
        reciterName: null,
      })
      .mockResolvedValueOnce({
        translationId: 20,
        mushafId: 4,
        captureMode: 'fullScreen',
        saveScreenshots: false,
        defaultSave: false,
        contextualNudges: true,
        nudgeCooldownMinutes: 15,
        timedReminders: false,
        timedReminderMinutes: 15,
        recitationId: 4,
        reciterName: 'Abu Bakr Shatri',
      });
    Object.defineProperty(window, 'ayati', {
      configurable: true,
      value: ayati as Window['ayati'],
    });

    await act(async () => {
      render(<Assistant />);
    });

    await userEvent.click(await screen.findByRole('button', { name: 'Settings' }));
    expect(screen.queryByRole('option', { name: "Mishari Rashid al-`Afasy" })).not.toBeInTheDocument();
    await userEvent.selectOptions(await screen.findByLabelText('Reminder Listen Reciter'), '4');

    expect(ayati.updateAyahLensSetting).toHaveBeenNthCalledWith(1, 'recitationId', 4);
    expect(ayati.updateAyahLensSetting).toHaveBeenNthCalledWith(2, 'reciterName', 'Abu Bakr Shatri');
  });

  it('saves companion appearance with the pet.appearanceId settings key', async () => {
    const ayati = createMockAyati();
    ayati.getSettings = vi.fn().mockResolvedValue({
      pet: { appearanceId: 'ayah', transparentWhenSleeping: false },
    });
    ayati.updateSettings = vi.fn().mockResolvedValue({
      pet: { appearanceId: 'cosmo', transparentWhenSleeping: false },
    });
    Object.defineProperty(window, 'ayati', {
      configurable: true,
      value: ayati as Window['ayati'],
    });

    await act(async () => {
      render(<Assistant />);
    });

    await userEvent.click(await screen.findByRole('button', { name: 'Settings' }));
    await userEvent.selectOptions(await screen.findByLabelText('Companion appearance'), 'cosmo');

    expect(ayati.updateSettings).toHaveBeenCalledWith('pet.appearanceId', 'cosmo');
  });

  it('shows title bar update action when an update is available and downloads on click', async () => {
    let notifyUpdateState: ((state: {
      enabled: boolean;
      status: string;
      currentVersion: string;
      hostArch: string;
      appArch: string;
      runningUnderArm64Translation: boolean;
      availableVersion: string | null;
      downloadedVersion: string | null;
      downloadPercent: number | null;
      checkedAt: string | null;
      message: string | null;
      errorContext: string | null;
      canRetry: boolean;
    }) => void) | undefined;

    const ayati = createMockAyati();
    ayati.onUpdateState = vi.fn((cb) => {
      notifyUpdateState = cb as NonNullable<typeof notifyUpdateState>;
    });
    ayati.downloadUpdate = vi.fn().mockResolvedValue({
      accepted: true,
      completed: true,
      state: {
        enabled: true,
        status: 'downloaded',
        currentVersion: '0.0.1',
        hostArch: 'arm64',
        appArch: 'arm64',
        runningUnderArm64Translation: false,
        availableVersion: '0.1.0',
        downloadedVersion: '0.1.0',
        downloadPercent: null,
        checkedAt: '2026-04-20T10:00:00.000Z',
        message: null,
        errorContext: null,
        canRetry: false,
      },
    });
    Object.defineProperty(window, 'ayati', {
      configurable: true,
      value: ayati as Window['ayati'],
    });

    await act(async () => {
      render(<Assistant />);
    });

    await waitFor(() => {
      expect(ayati.getUpdateState).toHaveBeenCalled();
      expect(ayati.onUpdateState).toHaveBeenCalled();
    });

    await act(async () => {
      notifyUpdateState?.({
        enabled: true,
        status: 'available',
        currentVersion: '0.0.1',
        hostArch: 'arm64',
        appArch: 'arm64',
        runningUnderArm64Translation: false,
        availableVersion: '0.1.0',
        downloadedVersion: null,
        downloadPercent: null,
        checkedAt: '2026-04-20T10:00:00.000Z',
        message: null,
        errorContext: null,
        canRetry: false,
      });
    });

    const updateButton = await screen.findByRole('button', { name: 'Download Update' });
    await userEvent.click(updateButton);

    await waitFor(() => {
      expect(ayati.downloadUpdate).toHaveBeenCalled();
    });

    await userEvent.click(await screen.findByRole('button', { name: 'Settings' }));
    expect(screen.queryByText('Check for new releases and install updates')).not.toBeInTheDocument();
  });
});

describe('Assistant productivity tabs', () => {
  it('shows Prayers, To Do, and Focus tabs and calls their bridge APIs', async () => {
    const ayati = createMockAyati();
    Object.defineProperty(window, 'ayati', {
      configurable: true,
      value: ayati as Window['ayati'],
    });

    await act(async () => {
      render(<Assistant />);
    });

    expect(await screen.findByRole('button', { name: 'Prayers' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'To Do' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Focus' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Chat' })).not.toBeInTheDocument();
    expect(await screen.findByLabelText('Prayer city')).toBeInTheDocument();
    expect(screen.getByLabelText('Prayer country')).toHaveRole('combobox');
    expect(screen.getByLabelText('Prayer city')).toHaveRole('combobox');
    expect(screen.getByLabelText('Prayer calculation method')).toHaveValue('15');
    expect(screen.getByLabelText('Prayer juristic school')).toHaveValue('0');

    expect((await screen.findAllByText('Fajr')).length).toBeGreaterThan(0);
    await userEvent.selectOptions(screen.getByLabelText('Prayer country'), 'United States');
    expect(screen.getByRole('option', { name: 'Oklahoma City' })).toBeInTheDocument();
    await userEvent.selectOptions(screen.getByLabelText('Prayer city'), 'New York');
    await userEvent.selectOptions(screen.getByLabelText('Prayer calculation method'), '2');
    await userEvent.selectOptions(screen.getByLabelText('Prayer juristic school'), '1');
    await userEvent.click(screen.getByRole('button', { name: 'Save Prayer Settings' }));
    expect(ayati.updatePrayerSettings).toHaveBeenCalledWith(expect.objectContaining({
      city: 'New York',
      country: 'United States',
      method: 2,
      school: 1,
      hasSavedSettings: true,
    }));
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Save Prayer Settings' })).not.toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: 'To Do' }));
    await userEvent.click(screen.getByRole('button', { name: 'Add Task' }));
    await userEvent.type(await screen.findByLabelText('Task title'), 'Read tafsir');
    await userEvent.click(screen.getByRole('button', { name: 'Add Task' }));
    expect(ayati.createTodo).toHaveBeenCalledWith(expect.objectContaining({ title: 'Read tafsir' }));

    await userEvent.click(screen.getByRole('button', { name: 'Focus' }));
    expect(await screen.findByText('25:00')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Start Focus' }));
    expect(ayati.startPomodoro).toHaveBeenCalledWith(expect.objectContaining({ kind: 'focus' }));
  });

  it('keeps prayer setup off the Prayers tab after the first saved setup', async () => {
    const ayati = createMockAyati();
    ayati.getPrayerSettings.mockResolvedValue({
      enabled: true,
      city: 'London',
      country: 'United Kingdom',
      method: 15,
      school: 0,
      reminderLeadMinutes: 10,
      quietMinutesAfterPrayer: 15,
      hasSavedSettings: true,
    });
    Object.defineProperty(window, 'ayati', {
      configurable: true,
      value: ayati as Window['ayati'],
    });

    await act(async () => {
      render(<Assistant />);
    });

    expect(await screen.findByRole('button', { name: 'Prayers' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save Prayer Settings' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Prayer calculation method')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Settings' }));
    expect(await screen.findByText('Prayer Awareness')).toBeInTheDocument();
    expect(screen.getByDisplayValue('London')).toBeInTheDocument();
  });
});

describe('Assistant settings shortcuts', () => {
  it('does not show AI provider setup in the settings tab', async () => {
    const ayati = createMockAyati();
    ayati.getSettings.mockResolvedValue({
      clawbot: {
        provider: 'gemini',
        url: 'https://generativelanguage.googleapis.com/v1beta/openai',
        token: 'onboarding-gemini-key',
        model: 'gemini-3-flash-preview',
      },
    });
    Object.defineProperty(window, 'ayati', {
      configurable: true,
      value: ayati as Window['ayati'],
    });

    await act(async () => {
      render(<Assistant />);
    });

    await userEvent.click(await screen.findByRole('button', { name: 'Settings' }));

    expect(await screen.findByText('Quran Reminders')).toBeInTheDocument();
    expect(screen.queryByLabelText(/provider/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/api key/i)).not.toBeInTheDocument();
  });

  it('shows shortcut controls without chat or screen reflection shortcuts', async () => {
    const ayati = createMockAyati();
    Object.defineProperty(window, 'ayati', {
      configurable: true,
      value: ayati as Window['ayati'],
    });

    await act(async () => {
      render(<Assistant />);
    });

    await userEvent.click(await screen.findByRole('button', { name: 'Settings' }));

    const openAssistant = await screen.findByText('Open Assistant');
    const hideApp = screen.getByText('Hide App');
    expect(openAssistant.compareDocumentPosition(hideApp) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.queryByText('Open Chat')).not.toBeInTheDocument();
    expect(screen.queryByText('Reflect on Screen')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /change open assistant shortcut, currently ⌘ \+ ⌥ \+ \./i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /change hide app shortcut, currently ⌘ \+ ⌥ \+ ⇧ \+ ,/i })).toBeInTheDocument();
  });
});

describe('Assistant developer settings', () => {
  it('lists every available selected companion state in developer settings', async () => {
    const ayati = createMockAyati();
    ayati.getSettings = vi.fn().mockResolvedValue({
      pet: { appearanceId: 'ayah', transparentWhenSleeping: false },
      dev: { showPetModeOverlay: false },
    });
    Object.defineProperty(window, 'ayati', {
      configurable: true,
      value: ayati as Window['ayati'],
    });

    await act(async () => {
      render(<Assistant />);
    });

    await userEvent.click(await screen.findByRole('button', { name: 'Settings' }));

    expect(await screen.findByRole('button', { name: 'running-right' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'review' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'curious' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'surprised' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'review' }));

    expect(ayati.executePetAction).toHaveBeenCalledWith({ type: 'set_mood', value: 'review' });
  });

  it('can trigger a test reminder comment from developer settings', async () => {
    const ayati = createMockAyati();
    Object.defineProperty(window, 'ayati', {
      configurable: true,
      value: ayati as Window['ayati'],
    });

    await act(async () => {
      render(<Assistant />);
    });

    await userEvent.click(await screen.findByRole('button', { name: 'Settings' }));
    await userEvent.click(await screen.findByRole('button', { name: /test reminder comment/i }));

    expect(ayati.forceTimedReminderComment).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(ayati.closeAssistant).toHaveBeenCalledTimes(1);
    });
  });

  it('can trigger a test Maghrib prayer reminder from developer settings', async () => {
    const ayati = createMockAyati();
    Object.defineProperty(window, 'ayati', {
      configurable: true,
      value: ayati as Window['ayati'],
    });

    await act(async () => {
      render(<Assistant />);
    });

    await userEvent.click(await screen.findByRole('button', { name: 'Settings' }));
    await userEvent.click(await screen.findByRole('button', { name: /test prayer reminder \(maghrib\)/i }));

    expect(ayati.forcePrayerReminderComment).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(ayati.closeAssistant).toHaveBeenCalledTimes(1);
    });
  });

  it('can trigger a test to do reminder from developer settings', async () => {
    const ayati = createMockAyati();
    Object.defineProperty(window, 'ayati', {
      configurable: true,
      value: ayati as Window['ayati'],
    });

    await act(async () => {
      render(<Assistant />);
    });

    await userEvent.click(await screen.findByRole('button', { name: 'Settings' }));
    await userEvent.click(await screen.findByRole('button', { name: /test to do reminder/i }));

    expect(ayati.forceTodoReminderComment).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(ayati.closeAssistant).toHaveBeenCalledTimes(1);
    });
  });
});
