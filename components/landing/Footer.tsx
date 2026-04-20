import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border py-16">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-accent-blue/20 flex h-8 w-8 items-center justify-center rounded-lg font-display text-sm font-bold text-accent-blue">
              M
            </span>
            <span className="font-display font-semibold">MeetvoAI</span>
          </div>
          <p className="mt-3 text-sm text-foreground-secondary">
            India&apos;s AI automation marketplace — agents, builders, escrow.
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">Product</p>
          <ul className="mt-3 space-y-2 text-sm text-foreground-secondary">
            <li>
              <Link href="/signup" className="hover:text-foreground">
                Marketplace
              </Link>
            </li>
            <li>
              <Link href="/signup" className="hover:text-foreground">
                Builders
              </Link>
            </li>
            <li>
              <Link href="/login" className="hover:text-foreground">
                Sign in
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">Company</p>
          <ul className="mt-3 space-y-2 text-sm text-foreground-secondary">
            <li>
              <Link href="/#about" className="hover:text-foreground">
                About
              </Link>
            </li>
            <li>
              <Link href="/#pricing" className="hover:text-foreground">
                Pricing
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">Contact</p>
          <p className="mt-3 text-sm text-foreground-secondary">
            ashiq@meetvoai.in
          </p>
          <p className="mt-2 text-sm text-foreground-secondary">India</p>
        </div>
      </div>
      <div className="mx-auto mt-12 max-w-6xl border-t border-border px-4 pt-8 text-center text-xs text-foreground-muted">
        © {new Date().getFullYear()} MeetvoAI. All rights reserved.
      </div>
    </footer>
  );
}
