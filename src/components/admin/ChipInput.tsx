'use client';

import { useState, KeyboardEvent } from 'react';
import { X } from 'lucide-react';

type Props = {
  label: string;
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
  hint?: string;
};

export default function ChipInput({
  label,
  value,
  onChange,
  placeholder,
  suggestions,
  hint,
}: Props) {
  const [draft, setDraft] = useState('');

  const add = (raw: string) => {
    const v = raw.trim();
    if (!v) return;
    if (value.includes(v)) {
      setDraft('');
      return;
    }
    onChange([...value, v]);
    setDraft('');
  };

  const remove = (chip: string) => onChange(value.filter((c) => c !== chip));

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      add(draft);
    } else if (e.key === 'Backspace' && draft === '' && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const visibleSuggestions = suggestions
    ? suggestions
        .filter(
          (s) => !value.includes(s) && s.toLowerCase().includes(draft.toLowerCase())
        )
        .slice(0, 8)
    : [];

  return (
    <div>
      <label className="block text-sm font-medium mb-1.5 text-[color:var(--color-cocoa)]">
        {label}
      </label>
      <div className="flex flex-wrap gap-1.5 p-2 border border-[color:var(--color-cream)] bg-[color:var(--color-shell)] rounded-md min-h-[42px]">
        {value.map((chip) => (
          <span
            key={chip}
            className="inline-flex items-center gap-1 bg-[color:var(--color-cream)] text-[color:var(--color-cocoa)] text-sm px-2 py-1 rounded"
          >
            {chip}
            <button
              type="button"
              onClick={() => remove(chip)}
              aria-label={`Quitar ${chip}`}
              className="hover:text-[color:var(--color-terra)]"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => add(draft)}
          placeholder={placeholder ?? 'Tipear y presionar Enter'}
          className="flex-1 min-w-[120px] bg-transparent outline-none text-sm"
        />
      </div>
      {hint && (
        <p className="text-xs text-[color:var(--color-taupe)] mt-1">{hint}</p>
      )}
      {visibleSuggestions.length > 0 && draft.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1">
          {visibleSuggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="text-xs px-2 py-1 rounded-full bg-[color:var(--color-cream)] hover:bg-[color:var(--color-tan)]/30 text-[color:var(--color-cocoa)]"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
