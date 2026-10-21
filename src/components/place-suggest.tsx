"use client";

import { useEffect, useId, useRef, useState } from "react";
import { suggestPlaces, type Place } from "@/lib/places";
import { cn } from "@/lib/utils";

export function PlaceSuggest({
  value,
  onChange,
  onPick,
  placeholder,
  id,
  className,
  inputClassName,
  "aria-label": ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  onPick?: (place: Place) => void;
  placeholder?: string;
  id?: string;
  className?: string;
  inputClassName?: string;
  "aria-label"?: string;
}) {
  const autoId = useId();
  const listId = `${id ?? autoId}-places`;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const matches = suggestPlaces(value);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function choose(place: Place) {
    onChange(place.label);
    onPick?.(place);
    setOpen(false);
  }

  return (
    <div ref={box} className={cn("relative min-w-0 flex-1", className)}>
      <input
        id={id}
        value={value}
        role="combobox"
        aria-label={ariaLabel}
        aria-expanded={open && matches.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        placeholder={placeholder}
        className={inputClassName}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActive(0);
        }}
        onKeyDown={(e) => {
          if (!open || matches.length === 0) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((n) => (n + 1) % matches.length);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((n) => (n - 1 + matches.length) % matches.length);
          } else if (e.key === "Enter" && open) {
            e.preventDefault();
            choose(matches[active] ?? matches[0]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
      />
      {open && matches.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute top-[calc(100%+4px)] right-0 left-0 z-50 max-h-72 overflow-auto border border-[#d7e0e8] bg-white py-1 text-left shadow-lg"
        >
          {matches.map((place, i) => (
            <li key={`${place.kind}-${place.label}`} role="option" aria-selected={i === active}>
              <button
                type="button"
                className={cn(
                  "flex w-full items-baseline justify-between gap-3 px-3 py-2 text-left text-sm",
                  i === active ? "bg-[#edf5fd] text-[#04427d]" : "text-[#1f2930] hover:bg-[#f4f7f9]"
                )}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(place);
                }}
              >
                <span className="font-medium">{place.label}</span>
                <span className="shrink-0 text-[11px] text-[#7b97aa]">
                  {place.kind === "city" ? "City" : place.city}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
