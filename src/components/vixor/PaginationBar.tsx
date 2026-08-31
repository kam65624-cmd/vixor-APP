/* eslint-disable react-refresh/only-export-components */
// ============================================================================
// Vixor Pagination Bar — Reusable UI component
// ============================================================================
//
// Wraps the shadcn <Pagination> primitives into a controlled component that
// emits page changes. Used by all list pages (signals, portfolio, journal,
// trade-desk, moxi, daily-loop) so users can paginate through long lists.
//
// Usage:
//   <PaginationBar
//     page={page}
//     pageSize={pageSize}
//     total={total}
//     onPageChange={setPage}
//   />
// ============================================================================

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination";

interface PaginationBarProps {
  /** Current page (1-indexed) */
  page: number;
  /** Items per page */
  pageSize: number;
  /** Total number of items across all pages */
  total: number;
  /** Called when user clicks a page nav control */
  onPageChange: (page: number) => void;
  /** Optional sibling count (default 1) — how many page numbers to show on each side of current */
  siblingCount?: number;
  /** Optional className override */
  className?: string;
}

/**
 * Build a compact page list with ellipses.
 * Example for 10 pages, current=5, sibling=1:
 *   [1, "...", 4, 5, 6, "...", 10]
 */
function buildPageRange(
  currentPage: number,
  totalPages: number,
  siblingCount: number,
): (number | "ellipsis")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const leftSibling = Math.max(currentPage - siblingCount, 1);
  const rightSibling = Math.min(currentPage + siblingCount, totalPages);

  const showLeftEllipsis = leftSibling > 2;
  const showRightEllipsis = rightSibling < totalPages - 1;

  const range: (number | "ellipsis")[] = [];

  // Always include first page
  range.push(1);

  if (showLeftEllipsis) {
    range.push("ellipsis");
  } else if (leftSibling === 2) {
    range.push(2);
  }

  // Middle pages
  for (let p = Math.max(leftSibling, showLeftEllipsis ? leftSibling : 2); p <= rightSibling; p++) {
    if (!range.includes(p)) range.push(p);
  }

  if (showRightEllipsis) {
    range.push("ellipsis");
  } else if (rightSibling === totalPages - 1) {
    range.push(totalPages - 1);
  }

  // Always include last page (if more than 1 page total)
  if (totalPages > 1) range.push(totalPages);

  // De-duplicate
  return range.filter((v, i, arr) => v !== arr[i - 1]);
}

export function PaginationBar({
  page,
  pageSize,
  total,
  onPageChange,
  siblingCount = 1,
  className,
}: PaginationBarProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Don't render pagination if there's only one page (or zero items)
  if (total <= pageSize) return null;

  // Clamp current page to valid range
  const safePage = Math.min(Math.max(1, page), totalPages);
  const pages = buildPageRange(safePage, totalPages, siblingCount);

  const canPrev = safePage > 1;
  const canNext = safePage < totalPages;

  const handleClick = (e: React.MouseEvent, target: number) => {
    e.preventDefault();
    if (target >= 1 && target <= totalPages && target !== safePage) {
      onPageChange(target);
    }
  };

  return (
    <Pagination className={className}>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (canPrev) onPageChange(safePage - 1);
            }}
            aria-disabled={!canPrev}
            className={!canPrev ? "pointer-events-none opacity-50" : ""}
          />
        </PaginationItem>

        {pages.map((p, idx) => {
          if (p === "ellipsis") {
            return (
              <PaginationItem key={`ellipsis-${idx}`}>
                <PaginationEllipsis />
              </PaginationItem>
            );
          }
          return (
            <PaginationItem key={p}>
              <PaginationLink href="#" isActive={p === safePage} onClick={(e) => handleClick(e, p)}>
                {p}
              </PaginationLink>
            </PaginationItem>
          );
        })}

        <PaginationItem>
          <PaginationNext
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (canNext) onPageChange(safePage + 1);
            }}
            aria-disabled={!canNext}
            className={!canNext ? "pointer-events-none opacity-50" : ""}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

// ── Helper hook: pagination state ──
export function usePagination(initialPageSize = 10) {
  const [page, setPage] = useStateValue(1);
  const [pageSize] = useStateValue(initialPageSize);
  return { page, pageSize, setPage };
}

// Small wrapper so we don't need a separate useState import at the top of every file
import { useState as useStateValue } from "react";
