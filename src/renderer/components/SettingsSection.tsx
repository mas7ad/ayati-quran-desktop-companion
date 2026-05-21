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
    <div className="border-b border-neutral-900 pb-5 last:border-0 last:pb-0">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="group flex w-full items-center justify-between py-2 text-left focus:outline-none"
        aria-expanded={isOpen}
      >
        <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-widest">
          {title}
        </h3>
        <Icon
          icon="solar:alt-arrow-down-linear"
          className={`text-neutral-600 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-out ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="pt-4 space-y-4">
          {children}
        </div>
      </div>
    </div>
  );
}
