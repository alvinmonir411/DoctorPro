"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Search, ChevronDown, Check, X } from "lucide-react";
import { getMediaUrl } from "@/lib/utils";

export interface DoctorOption {
  id: string;
  name: string;
  title?: string;
  specialization: string;
  image?: string;
  department?: { name?: string };
  chamberAddress?: string;
}

interface DoctorSearchSelectProps {
  doctors: DoctorOption[];
  value: string;
  onChange: (doctorId: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

function formatDoctorTitleName(name: string): string {
  const trimmed = (name || "").trim();
  if (!trimmed) return "Doctor";
  return /^dr\.?\s/i.test(trimmed) ? trimmed : `Dr. ${trimmed}`;
}

/** Searchable dropdown selector for picking a doctor chamber by name or specialty. */
export function DoctorSearchSelect({
  doctors,
  value,
  onChange,
  disabled = false,
  placeholder = "Search doctor name or specialty...",
}: DoctorSearchSelectProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const selectedDoctor = useMemo(
    () => doctors.find((d) => d.id === value) || null,
    [doctors, value]
  );

  const selectedLabel = selectedDoctor
    ? `${formatDoctorTitleName(selectedDoctor.name)} (${selectedDoctor.specialization})`
    : "";

  const filteredDoctors = useMemo(() => {
    const raw = searchQuery.trim().toLowerCase();
    if (!raw) return doctors;
    const normalized = raw.replace(/^dr\.?\s+/, "");

    return doctors.filter((d) => {
      const display = formatDoctorTitleName(d.name).toLowerCase();
      const haystacks = [
        display,
        d.name?.toLowerCase() || "",
        d.specialization?.toLowerCase() || "",
        d.title?.toLowerCase() || "",
        d.department?.name?.toLowerCase() || "",
        d.chamberAddress?.toLowerCase() || "",
      ];
      return haystacks.some(
        (text) => text.includes(raw) || (normalized.length > 0 && text.includes(normalized))
      );
    });
  }, [doctors, searchQuery]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  // Keep activeIndex in bounds when filter narrows results
  useEffect(() => {
    setActiveIndex(0);
  }, [searchQuery, isOpen]);

  const handleSelectDoctor = (doctorId: string) => {
    onChange(doctorId);
    setIsOpen(false);
    setSearchQuery("");
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        return;
      }
      setActiveIndex((prev) =>
        filteredDoctors.length > 0 ? (prev + 1) % filteredDoctors.length : 0
      );
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        return;
      }
      setActiveIndex((prev) =>
        filteredDoctors.length > 0
          ? (prev - 1 + filteredDoctors.length) % filteredDoctors.length
          : 0
      );
      return;
    }

    if (e.key === "Enter" && isOpen) {
      e.preventDefault();
      const candidate = filteredDoctors[activeIndex];
      if (candidate) {
        handleSelectDoctor(candidate.id);
      }
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      setSearchQuery("");
      inputRef.current?.blur();
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          disabled={disabled}
          value={isOpen ? searchQuery : selectedLabel}
          placeholder={
            isOpen
              ? selectedLabel
                ? `Search doctor... (${selectedLabel})`
                : placeholder
              : placeholder
          }
          onFocus={() => {
            if (!disabled) {
              setIsOpen(true);
              setSearchQuery("");
            }
          }}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          className="w-full h-11 pl-10 pr-14 bg-background border rounded-2xl text-xs sm:text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 disabled:opacity-60"
        />

        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {isOpen && searchQuery && (
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                setSearchQuery("");
                inputRef.current?.focus();
              }}
              aria-label="Clear search"
              className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            disabled={disabled}
            onMouseDown={(e) => {
              e.preventDefault();
              if (disabled) return;
              if (isOpen) {
                setIsOpen(false);
                setSearchQuery("");
                inputRef.current?.blur();
              } else {
                setIsOpen(true);
                setSearchQuery("");
                inputRef.current?.focus();
              }
            }}
            aria-label="Toggle doctor list"
            className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
            />
          </button>
        </div>
      </div>

      {isOpen && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 rounded-2xl border bg-card shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150"
        >
          <div className="max-h-64 overflow-y-auto p-1.5 space-y-0.5">
            {filteredDoctors.length > 0 ? (
              filteredDoctors.map((doc, idx) => {
                const isSelected = doc.id === value;
                const isHighlighted = idx === activeIndex;
                const displayName = formatDoctorTitleName(doc.name);

                return (
                  <button
                    key={doc.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelectDoctor(doc.id);
                    }}
                    onMouseEnter={() => setActiveIndex(idx)}
                    className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-left transition-colors ${
                      isSelected
                        ? "bg-primary/10 text-primary"
                        : isHighlighted
                        ? "bg-muted text-foreground"
                        : "hover:bg-muted/60 text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/15 overflow-hidden shrink-0 flex items-center justify-center text-xs font-bold text-primary">
                        {doc.image ? (
                          <img
                            src={getMediaUrl(doc.image)}
                            alt={displayName}
                            className="h-full w-full object-cover object-top"
                          />
                        ) : (
                          <span>{(doc.name || "D").charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-semibold truncate">
                          {displayName}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {doc.specialization}
                          {doc.department?.name ? ` • ${doc.department.name}` : ""}
                        </p>
                      </div>
                    </div>

                    {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
                  </button>
                );
              })
            ) : (
              <div className="py-6 px-3 text-center space-y-2">
                <p className="text-xs text-muted-foreground">
                  No doctor found matching &ldquo;{searchQuery}&rdquo;.
                </p>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setSearchQuery("");
                    inputRef.current?.focus();
                  }}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Show all doctors
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
