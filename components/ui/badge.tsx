import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] px-3 py-1 text-xs font-medium text-[var(--color-text-primary)] transition-all duration-200 hover:border-[var(--color-border-hover)]",
        className,
      )}
      {...props}
    />
  );
}
