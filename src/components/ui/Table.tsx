import React, {
  forwardRef,
  HTMLAttributes,
  TableHTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from "react";

export const Table = forwardRef<
  HTMLTableElement,
  TableHTMLAttributes<HTMLTableElement>
>(({ className = "", ...props }, ref) => (
  <div className="w-full overflow-x-auto rounded-[12px] border border-border bg-surface">
    <table
      ref={ref}
      className={`w-full caption-bottom text-sm border-collapse ${className}`}
      {...props}
    />
  </div>
));
Table.displayName = "Table";

export const TableHeader = forwardRef<
  HTMLTableSectionElement,
  HTMLAttributes<HTMLTableSectionElement>
>(({ className = "", ...props }, ref) => (
  <thead
    ref={ref}
    className={`border-b border-border bg-surface-raised/80 select-none text-xs font-semibold text-ink-muted uppercase tracking-wider ${className}`}
    {...props}
  />
));
TableHeader.displayName = "TableHeader";

export const TableBody = forwardRef<
  HTMLTableSectionElement,
  HTMLAttributes<HTMLTableSectionElement>
>(({ className = "", ...props }, ref) => (
  <tbody
    ref={ref}
    className={`divide-y divide-border text-sm text-ink ${className}`}
    {...props}
  />
));
TableBody.displayName = "TableBody";

export const TableFooter = forwardRef<
  HTMLTableSectionElement,
  HTMLAttributes<HTMLTableSectionElement>
>(({ className = "", ...props }, ref) => (
  <tfoot
    ref={ref}
    className={`border-t border-border bg-surface-raised/50 font-medium text-ink ${className}`}
    {...props}
  />
));
TableFooter.displayName = "TableFooter";

export interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  interactive?: boolean;
}

export const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ interactive = true, className = "", ...props }, ref) => (
    <tr
      ref={ref}
      className={`transition-colors ${
        interactive ? "hover:bg-surface-raised/40" : ""
      } ${className}`}
      {...props}
    />
  )
);
TableRow.displayName = "TableRow";

export const TableHead = forwardRef<
  HTMLTableCellElement,
  ThHTMLAttributes<HTMLTableCellElement>
>(({ className = "", ...props }, ref) => (
  <th
    ref={ref}
    className={`h-11 px-4 text-left align-middle font-medium text-ink-muted [&:has([role=checkbox])]:pr-0 ${className}`}
    {...props}
  />
));
TableHead.displayName = "TableHead";

export const TableCell = forwardRef<
  HTMLTableCellElement,
  TdHTMLAttributes<HTMLTableCellElement>
>(({ className = "", ...props }, ref) => (
  <td
    ref={ref}
    className={`py-3.5 px-4 align-middle [&:has([role=checkbox])]:pr-0 ${className}`}
    {...props}
  />
));
TableCell.displayName = "TableCell";

export const TableCaption = forwardRef<
  HTMLTableCaptionElement,
  HTMLAttributes<HTMLTableCaptionElement>
>(({ className = "", ...props }, ref) => (
  <caption
    ref={ref}
    className={`mt-4 text-xs text-ink-muted ${className}`}
    {...props}
  />
));
TableCaption.displayName = "TableCaption";
