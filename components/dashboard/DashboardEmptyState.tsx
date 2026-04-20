import Link from "next/link";

export function DashboardEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="bg-bg-secondary/30 mx-auto mt-10 max-w-lg rounded-xl border border-dashed border-border p-10 text-center">
      <p className="font-medium text-foreground">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-foreground-secondary">
        {description}
      </p>
      {action ? (
        <Link
          href={action.href}
          className="hover:bg-accent-blue/90 mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-accent-blue px-6 text-sm font-medium text-white shadow-glow transition"
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}
