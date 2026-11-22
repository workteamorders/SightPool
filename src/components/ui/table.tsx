import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  numeric?: boolean;
  /** Hidden in the card layout on small screens when false. */
  inCard?: boolean;
}

/**
 * Table on wide screens (sticky header, numeric columns right-aligned, focusable rows),
 * a stack of cards under 768px.
 */
export function DataTable<T>({ rows, columns, rowKey, caption, onRowActivate }: { rows: T[]; columns: Column<T>[]; rowKey: (r: T) => string; caption: string; onRowActivate?: (r: T) => void }) {
  return (
    <>
      <div className="hidden max-h-[var(--h-dialog-max)] overflow-auto rounded-md border border-line md:block">
        <table className="w-full border-collapse text-14">
          <caption className="sr-only">{caption}</caption>
          <thead className="sticky top-0 z-10 bg-surface-2">
            <tr>
              {columns.map((c) => (
                <th key={c.key} scope="col" className={cn("border-b border-line px-4 py-3 text-left text-12 font-medium uppercase tracking-wider text-muted", c.numeric && "text-right")}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={rowKey(r)}
                tabIndex={onRowActivate ? 0 : -1}
                onClick={onRowActivate ? () => onRowActivate(r) : undefined}
                onKeyDown={onRowActivate ? (e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onRowActivate(r)) : undefined}
                className={cn("border-b border-line last:border-b-0 focus-visible:bg-surface-2", onRowActivate && "cursor-pointer hover:bg-surface-2")}
              >
                {columns.map((c) => (
                  <td key={c.key} className={cn("px-4 py-3 align-top", c.numeric && "num text-right")}>
                    {c.cell(r)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="flex flex-col gap-3 md:hidden" aria-label={caption}>
        {rows.map((r) => (
          <li key={rowKey(r)} className="rounded-md border border-line bg-surface p-4">
            <dl className="flex flex-col gap-2 text-14">
              {columns
                .filter((c) => c.inCard !== false)
                .map((c) => (
                  <div key={c.key} className="leader">
                    <dt className="text-muted">{c.header}</dt>
                    <dd className={cn("text-right", c.numeric && "num")}>{c.cell(r)}</dd>
                  </div>
                ))}
            </dl>
            {onRowActivate && (
              <button type="button" onClick={() => onRowActivate(r)} className="mt-3 min-h-touch text-14 link">
                View details
              </button>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
