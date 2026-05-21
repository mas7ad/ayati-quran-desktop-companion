import React, { useState, useCallback, useRef, useEffect } from 'react';
import { parseDate } from 'chrono-node';
import { format } from 'date-fns';
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

/** Fits the 400px assistant window; layout size matches visuals for collision detection. */
const COMPACT_CALENDAR_CLASS_NAMES = {
  months: 'flex flex-col',
  month: 'space-y-2',
  caption: 'flex justify-center pt-0.5 relative items-center',
  caption_label: 'text-xs font-medium',
  nav: 'space-x-0.5 flex items-center',
  nav_button: cn(
    buttonVariants({ variant: 'outline' }),
    'h-6 w-6 bg-transparent p-0 opacity-50 hover:opacity-100',
  ),
  nav_button_previous: 'absolute left-0',
  nav_button_next: 'absolute right-0',
  table: 'w-full border-collapse space-y-0.5',
  head_row: 'flex',
  head_cell: 'text-muted-foreground rounded-md w-7 font-normal text-[0.65rem]',
  row: 'flex w-full mt-0.5',
  cell: 'h-7 w-7 text-center text-xs p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
  day: cn(buttonVariants({ variant: 'ghost' }), 'h-7 w-7 p-0 text-xs font-normal aria-selected:opacity-100'),
};

interface SmartDatePickerProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  /** Popover alignment; use `end` for pickers on the right edge of narrow panels. */
  popoverAlign?: 'start' | 'center' | 'end';
}

export function SmartDatePicker({
  value,
  onChange,
  placeholder = 'Due',
  className,
  popoverAlign = 'start',
}: SmartDatePickerProps) {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value) {
      setInputValue(format(value, 'MMM d'));
    } else {
      setInputValue('');
    }
  }, [value]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setInputValue(text);

    const parsed = parseDate(text);
    if (parsed) {
      onChange(parsed);
    }
  }, [onChange]);

  const handleCalendarSelect = useCallback((date: Date | undefined) => {
    onChange(date);
    setIsOpen(false);
  }, [onChange]);

  const handleBlur = useCallback(() => {
    if (!value) {
      setInputValue('');
    }
  }, [value]);

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex items-center justify-center shrink-0 text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded p-0.5"
            aria-label="Open calendar"
          >
            <CalendarIcon className="size-3.5" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto max-w-[min(100vw-1rem,17.5rem)] p-0"
          align={popoverAlign}
          side="top"
          sideOffset={4}
          collisionPadding={12}
          avoidCollisions
        >
          <Calendar
            mode="single"
            selected={value}
            onSelect={handleCalendarSelect}
            initialFocus
            className="p-2"
            classNames={COMPACT_CALENDAR_CLASS_NAMES}
            components={{
              IconLeft: () => <ChevronLeft className="size-3" />,
              IconRight: () => <ChevronRight className="size-3" />,
            }}
          />
        </PopoverContent>
      </Popover>
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        className="bg-transparent border-0 border-b border-transparent focus:border-b-[#67E0A3]/50 px-0 py-0.5 text-xs text-foreground placeholder:text-neutral-600 focus:outline-none focus-visible:ring-0 w-16"
      />
    </div>
  );
}
