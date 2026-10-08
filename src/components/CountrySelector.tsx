import { useEffect, useId, useState } from "react";

import { COUNTRIES, countryLabel, searchCountries } from "@/lib/countries";

export function CountrySelector({
  value,
  onChange,
  label = "Country of origin",
  id: providedId,
}: {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  id?: string;
}) {
  const generatedId = useId();
  const id = providedId ?? generatedId;
  const [query, setQuery] = useState(() => countryLabel(value));
  const [open, setOpen] = useState(false);
  const matches = searchCountries(query);

  useEffect(() => {
    setQuery(countryLabel(value));
  }, [value]);

  return (
    <div className="relative text-sm">
      <label htmlFor={id} className="block">
        {label}
      </label>
      <input
        id={id}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={`${id}-options`}
        autoComplete="off"
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        placeholder="Search country or ISO code"
        className="mt-1 block h-10 w-full rounded border px-3"
      />
      {open && (
        <div
          id={`${id}-options`}
          role="listbox"
          aria-label="Countries"
          className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 shadow-lg"
        >
          {(query.trim() ? matches : COUNTRIES).map((country) => (
            <button
              type="button"
              role="option"
              aria-selected={country.code === value}
              key={country.code}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onChange(country.code);
                setQuery(`${country.name} (${country.code})`);
                setOpen(false);
              }}
              className="flex w-full items-center justify-between rounded px-3 py-2 text-left hover:bg-blue-50"
            >
              <span>{country.name}</span>
              <span className="text-xs text-slate-500">{country.code}</span>
            </button>
          ))}
          {query.trim() && matches.length === 0 && (
            <p className="px-3 py-2 text-slate-500">No matching country</p>
          )}
        </div>
      )}
    </div>
  );
}
