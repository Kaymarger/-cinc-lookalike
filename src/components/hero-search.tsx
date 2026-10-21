"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function HeroSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [error, setError] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = q.trim();
    if (!trimmed) {
      setError(true);
      return;
    }
    setError(false);
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <div className="hero-searchbar relative mx-auto mt-8 w-full max-w-[600px] text-left">
      <ul className="mb-3 flex gap-5 text-sm text-white">
        <li className="border-b-2 border-white pb-1 font-semibold">Buy a Home</li>
        <li>
          <a
            id="sell-home-link"
            href="/seller/homeestimate"
            className="!text-white hover:underline"
          >
            Sell a Home
          </a>
        </li>
      </ul>
      <form id="search-bar-form" onSubmit={onSubmit} className="flex">
        <label className="min-w-0 flex-[2]">
          <input
            id="search-bar-input"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              if (e.target.value.trim()) setError(false);
            }}
            placeholder="City or postal code"
            aria-label="Search Bar"
            autoComplete="off"
            className="h-10 w-full border-0 bg-white px-3 text-sm text-[#1f2930] outline-none placeholder:text-[#7b97aa]"
          />
        </label>
        <button
          id="home-search-button"
          type="submit"
          className="h-10 flex-1 cursor-pointer border-0 bg-[#1976d2] text-sm font-bold tracking-[1px] text-white uppercase hover:bg-[#145ca4]"
        >
          Search
        </button>
      </form>
      {error && (
        <p id="search-bar-validation" className="mt-2 text-sm text-[#ffb4b4]">
          *city, county, or postal code required
        </p>
      )}
    </div>
  );
}
