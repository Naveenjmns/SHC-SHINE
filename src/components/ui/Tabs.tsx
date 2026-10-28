"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
  HTMLAttributes,
  ButtonHTMLAttributes,
} from "react";

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (val: string) => void;
  syncHash?: boolean;
}

const TabsContext = createContext<TabsContextValue | null>(null);

export interface TabsProps extends HTMLAttributes<HTMLDivElement> {
  defaultValue: string;
  value?: string;
  onValueChange?: (val: string) => void;
  syncHash?: boolean;
  children: ReactNode;
}

export function Tabs({
  defaultValue,
  value,
  onValueChange,
  syncHash = false,
  children,
  className = "",
  ...props
}: TabsProps) {
  const [internalTab, setInternalTab] = useState<string>(() => {
    if (typeof window !== "undefined" && syncHash && window.location.hash) {
      const hashVal = window.location.hash.replace("#", "");
      if (hashVal) return hashVal;
    }
    return value || defaultValue;
  });

  const activeTab = value !== undefined ? value : internalTab;

  const setActiveTab = (tab: string) => {
    if (value === undefined) {
      setInternalTab(tab);
    }
    if (syncHash && typeof window !== "undefined") {
      window.history.replaceState(null, "", `#${tab}`);
    }
    onValueChange?.(tab);
  };

  useEffect(() => {
    if (!syncHash || typeof window === "undefined") return;
    const handleHashChange = () => {
      const hashVal = window.location.hash.replace("#", "");
      if (hashVal) {
        setActiveTab(hashVal);
      }
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [syncHash]);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab, syncHash }}>
      <div className={`space-y-4 ${className}`} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export function TabsList({
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  const listRef = useRef<HTMLDivElement>(null);

  // Arrow key navigation between tabs
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const tabs = Array.from(
      listRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]') || []
    );
    const currentIndex = tabs.findIndex((t) => t === document.activeElement);
    if (currentIndex === -1) return;

    if (e.key === "ArrowRight") {
      e.preventDefault();
      const nextTab = tabs[(currentIndex + 1) % tabs.length];
      nextTab?.focus();
      nextTab?.click();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      const prevTab = tabs[(currentIndex - 1 + tabs.length) % tabs.length];
      prevTab?.focus();
      prevTab?.click();
    } else if (e.key === "Home") {
      e.preventDefault();
      tabs[0]?.focus();
      tabs[0]?.click();
    } else if (e.key === "End") {
      e.preventDefault();
      tabs[tabs.length - 1]?.focus();
      tabs[tabs.length - 1]?.click();
    }
  };

  return (
    <div
      ref={listRef}
      role="tablist"
      onKeyDown={handleKeyDown}
      className={`inline-flex items-center p-1 rounded-[10px] bg-surface-raised gap-1 overflow-x-auto max-w-full ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export interface TabsTriggerProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

export function TabsTrigger({
  value,
  children,
  className = "",
  ...props
}: TabsTriggerProps) {
  const context = useContext(TabsContext);
  if (!context) throw new Error("TabsTrigger must be used inside Tabs");

  const isSelected = context.activeTab === value;

  return (
    <button
      role="tab"
      type="button"
      id={`tab-${value}`}
      aria-selected={isSelected}
      aria-controls={`tabpanel-${value}`}
      onClick={() => context.setActiveTab(value)}
      className={`min-h-[44px] sm:min-h-[40px] px-4 py-2 rounded-[8px] text-[15px] font-semibold select-none transition-all flex items-center justify-center gap-1.5 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-accent ${
        isSelected
          ? "bg-surface text-accent shadow-card"
          : "text-ink-muted hover:text-ink"
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export interface TabsContentProps extends HTMLAttributes<HTMLDivElement> {
  value: string;
}

export function TabsContent({
  value,
  children,
  className = "",
  ...props
}: TabsContentProps) {
  const context = useContext(TabsContext);
  if (!context) throw new Error("TabsContent must be used inside Tabs");

  if (context.activeTab !== value) return null;

  return (
    <div
      role="tabpanel"
      id={`tabpanel-${value}`}
      aria-labelledby={`tab-${value}`}
      className={`focus:outline-none animate-in fade-in duration-150 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
