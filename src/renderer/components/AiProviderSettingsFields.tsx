import {
  AI_PROVIDER_CONFIGS,
  DEFAULT_OPENROUTER_BASE_URL,
  DEFAULT_OPENROUTER_MODEL,
  getAiProviderConfig,
  type ClawBotProvider,
} from '../aiProviderDefaults';

interface AiProviderSettingsFieldsProps {
  idPrefix: string;
  provider: ClawBotProvider;
  baseUrl: string;
  model: string;
  apiKey: string;
  onProviderChange: (provider: ClawBotProvider) => void;
  onBaseUrlChange: (baseUrl: string) => void;
  onModelChange: (model: string) => void;
  onApiKeyChange: (apiKey: string) => void;
  /** `light` — onboarding / cream surfaces + brand emerald accents (see docs/BRAND_GUIDELINES.md). Default `dark` for assistant settings. */
  variant?: 'dark' | 'light';
}

export function AiProviderSettingsFields({
  idPrefix,
  provider,
  baseUrl,
  model,
  apiKey,
  onProviderChange,
  onBaseUrlChange,
  onModelChange,
  onApiKeyChange,
  variant = 'dark',
}: AiProviderSettingsFieldsProps) {
  const providerConfig = getAiProviderConfig(provider);

  const inputClasses =
    variant === 'light'
      ? 'w-full bg-[#FAF9F6] border border-[#1a2a24]/10 rounded-xl px-4 py-3 min-h-[2.75rem] text-sm text-[#1a2a24] leading-snug outline-none focus:border-[#67E0A3] focus:ring-1 focus:ring-[#67E0A3]/25 transition-all font-mono placeholder:text-[#1a2a24]/35'
      : 'w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 min-h-[2.75rem] text-sm text-white leading-snug outline-none focus:border-[#67E0A3] focus:ring-1 focus:ring-[#67E0A3]/30 transition-all font-mono placeholder:text-white/40';
  const labelClasses =
    variant === 'light'
      ? 'block text-xs font-bold text-[#1a2a24]/55 uppercase tracking-wider mb-2'
      : 'block text-xs font-bold text-white/70 uppercase tracking-wider mb-2';
  const selectClasses =
    variant === 'light'
      ? 'w-full bg-[#FAF9F6] border border-[#1a2a24]/10 rounded-xl px-4 py-3 min-h-[2.75rem] text-sm text-[#1a2a24] leading-snug outline-none focus:border-[#67E0A3] focus:ring-1 focus:ring-[#67E0A3]/25 transition-all cursor-pointer'
      : 'w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 min-h-[2.75rem] text-sm text-white leading-snug outline-none focus:border-[#67E0A3] focus:ring-1 focus:ring-[#67E0A3]/30 transition-all cursor-pointer backdrop-blur-md';
  const optionClassName = variant === 'light' ? 'bg-white text-[#1a2a24]' : 'bg-[#1a2a24] text-white';

  return (
    <div className="space-y-5">
      <div>
        <label htmlFor={`${idPrefix}-provider`} className={labelClasses}>
          Provider
        </label>
        <select
          id={`${idPrefix}-provider`}
          name="provider"
          value={provider}
          onChange={(event) => onProviderChange(event.target.value as ClawBotProvider)}
          className={selectClasses}
        >
          {AI_PROVIDER_CONFIGS.map((providerOption) => (
            <option key={providerOption.id} value={providerOption.id} className={optionClassName}>
              {providerOption.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor={`${idPrefix}-base-url`} className={labelClasses}>
          Base URL
        </label>
        <input
          id={`${idPrefix}-base-url`}
          name="baseUrl"
          type="text"
          value={baseUrl}
          onChange={(event) => onBaseUrlChange(event.target.value)}
          placeholder={providerConfig.baseUrl || DEFAULT_OPENROUTER_BASE_URL}
          autoComplete="off"
          spellCheck={false}
          className={inputClasses}
        />
      </div>
      <div>
        <label htmlFor={`${idPrefix}-model`} className={labelClasses}>
          Model
        </label>
        <input
          id={`${idPrefix}-model`}
          name="model"
          type="text"
          value={model}
          onChange={(event) => onModelChange(event.target.value)}
          placeholder={providerConfig.defaultModel || DEFAULT_OPENROUTER_MODEL}
          autoComplete="off"
          spellCheck={false}
          className={inputClasses}
        />
        <p
          className={
            variant === 'light'
              ? 'text-[11px] text-[#67E0A3]/80 mt-1.5 font-medium leading-relaxed'
              : 'text-[11px] text-[#67E0A3]/60 mt-1.5 font-medium leading-relaxed'
          }
        >
          {providerConfig.protocol === 'anthropic-messages'
            ? 'Ayati - Quran Desktop Companion appends /messages to this Claude API base URL.'
            : 'Ayati - Quran Desktop Companion appends /chat/completions to this base URL.'}
        </p>
      </div>
      <div>
        <label htmlFor={`${idPrefix}-api-key`} className={labelClasses}>
          API Key
        </label>
        <input
          id={`${idPrefix}-api-key`}
          name="apiKey"
          type="password"
          value={apiKey}
          onChange={(event) => onApiKeyChange(event.target.value)}
          placeholder={`Enter your ${providerConfig.apiKeyLabel}`}
          autoComplete="off"
          spellCheck={false}
          className={inputClasses}
        />
      </div>
    </div>
  );
}
