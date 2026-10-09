import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PaginationProps = {
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  className?: string;
};

export function Pagination({ page, total, pageSize, onPageChange, className }: PaginationProps) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pages);
  if (total <= pageSize) return null;

  const first = (safePage - 1) * pageSize + 1;
  const last = Math.min(total, safePage * pageSize);
  const visible = Array.from({ length: pages }, (_, index) => index + 1).filter(
    (value) => value === 1 || value === pages || Math.abs(value - safePage) <= 1,
  );

  return (
    <nav className={cn("mt-6 flex flex-wrap items-center justify-between gap-3", className)} aria-label="Pagination">
      <p className="text-xs text-muted-foreground">{first}–{last} sur {total}</p>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon" disabled={safePage === 1} onClick={() => onPageChange(safePage - 1)} aria-label="Page précédente">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {visible.map((value, index) => {
          const previous = visible[index - 1];
          return (
            <span key={value} className="flex items-center gap-1">
              {previous && value - previous > 1 && <span className="px-1 text-muted-foreground">…</span>}
              <Button
                variant={value === safePage ? "default" : "outline"}
                size="icon"
                onClick={() => onPageChange(value)}
                aria-current={value === safePage ? "page" : undefined}
                aria-label={`Page ${value}`}
              >
                {value}
              </Button>
            </span>
          );
        })}
        <Button variant="outline" size="icon" disabled={safePage === pages} onClick={() => onPageChange(safePage + 1)} aria-label="Page suivante">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </nav>
  );
}