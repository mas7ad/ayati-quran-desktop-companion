import React, { useState } from 'react';
import { Icon } from '@iconify/react';

interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function SettingsSection({ title, children, defaultOpen = false }: SettingsSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-white/10 rounded-lg bg-white/[0.03]">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-white/[0.02] transition-colors rounded-lg focus:outline-none focus:ring-1 focus:ring-[#67E0A3]/30"
        aria-expanded={isOpen}
      >
        <h3 className="text-xs font-medium text-neutral-300 uppercase tracking-widest">
          {title}
        </h3>
        <Icon
          icon="solar:alt-arrow-down-linear"
          className={`text-neutral-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-out ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="border-t border-white/5 px-5 pb-5 pt-4">
          {children}
        </div>
      </div>
    </div>
  );
}
