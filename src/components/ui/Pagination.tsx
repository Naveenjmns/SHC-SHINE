import React from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className = "",
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) {
        pages.push("ellipsis");
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push("ellipsis");
      }
      pages.push(totalPages);
    }

    return pages;
  };

  const pages = getPageNumbers();

  return (
    <nav
      role="navigation"
      aria-label="Pagination"
      className={`flex items-center justify-center gap-1 select-none ${className}`}
    >
      <button
        type="button"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        aria-label="Previous page"
        className="min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px] p-2 rounded-[8px] border border-border bg-surface text-ink hover:bg-surface-raised disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors cursor-pointer"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {pages.map((p, idx) => {
        if (p === "ellipsis") {
          return (
            <span
              key={`ellipsis-${idx}`}
              className="min-h-[44px] min-w-[32px] sm:min-h-[36px] flex items-center justify-center text-ink-subtle"
            >
              <MoreHorizontal className="w-4 h-4" />
            </span>
          );
        }

        const isCurrent = p === currentPage;

        return (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            aria-current={isCurrent ? "page" : undefined}
            className={`min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px] px-3 rounded-[8px] text-sm font-semibold flex items-center justify-center transition-colors cursor-pointer ${
              isCurrent
                ? "bg-accent text-accent-ink border border-accent"
                : "border border-border bg-surface text-ink hover:bg-surface-raised"
            }`}
          >
            {p}
          </button>
        );
      })}

      <button
        type="button"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        aria-label="Next page"
        className="min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px] p-2 rounded-[8px] border border-border bg-surface text-ink hover:bg-surface-raised disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors cursor-pointer"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </nav>
  );
}
