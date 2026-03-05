"use client";

import * as React from "react";
import { ChevronDownIcon, SearchIcon, CheckIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComboboxProps {
    options: string[];
    value: string;
    onValueChange: (value: string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    className?: string;
}

export function Combobox({
    options,
    value,
    onValueChange,
    placeholder = "Select...",
    searchPlaceholder = "Search...",
    className,
}: ComboboxProps) {
    const [open, setOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState("");
    const containerRef = React.useRef<HTMLDivElement>(null);
    const inputRef = React.useRef<HTMLInputElement>(null);

    const filteredOptions = React.useMemo(() => {
        if (!searchQuery) return options;
        const lower = searchQuery.toLowerCase();
        return options.filter((opt) => opt.toLowerCase().includes(lower));
    }, [options, searchQuery]);

    // Close on outside click
    React.useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
                setSearchQuery("");
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Focus search input when opened
    React.useEffect(() => {
        if (open && inputRef.current) {
            inputRef.current.focus();
        }
    }, [open]);

    const displayValue = value && value !== "all" ? value : placeholder;

    return (
        <div ref={containerRef} className={cn("relative", className)}>
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => {
                    setOpen(!open);
                    setSearchQuery("");
                }}
                className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none cursor-pointer",
                    "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                    "dark:bg-input/30 dark:hover:bg-input/50",
                    "h-9 whitespace-nowrap",
                    (!value || value === "all") && "text-muted-foreground"
                )}
            >
                <span className="truncate">{displayValue}</span>
                <ChevronDownIcon className="size-4 opacity-50 shrink-0" />
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute top-full left-0 z-50 mt-1 w-full min-w-[240px] rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95">
                    {/* Search Input */}
                    <div className="flex items-center border-b px-3 py-2">
                        <SearchIcon className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder={searchPlaceholder}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex h-7 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="ml-1 shrink-0 opacity-50 hover:opacity-100 cursor-pointer"
                            >
                                <XIcon className="h-3 w-3" />
                            </button>
                        )}
                    </div>

                    {/* Options List */}
                    <div className="max-h-[280px] overflow-y-auto p-1">
                        {filteredOptions.length === 0 ? (
                            <div className="py-6 text-center text-sm text-muted-foreground">
                                No results found
                            </div>
                        ) : (
                            filteredOptions.map((option) => (
                                <button
                                    key={option}
                                    type="button"
                                    onClick={() => {
                                        onValueChange(option);
                                        setOpen(false);
                                        setSearchQuery("");
                                    }}
                                    className={cn(
                                        "relative flex w-full items-center rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none cursor-pointer",
                                        "hover:bg-accent hover:text-accent-foreground",
                                        value === option && "bg-accent text-accent-foreground"
                                    )}
                                >
                                    <span className="truncate">{option}</span>
                                    {value === option && (
                                        <span className="absolute right-2 flex size-3.5 items-center justify-center">
                                            <CheckIcon className="size-4" />
                                        </span>
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
