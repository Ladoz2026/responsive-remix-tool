import { useEffect, useState } from "react";
import { Crown, Menu, X } from "lucide-react";

const links = [
  { label: "Acheter", href: "#properties" },
  { label: "Louer", href: "#properties" },
  { label: "Vendre", href: "#cta" },
  { label: "Agences", href: "#validation" },
  { label: "Blog", href: "#magazine" },
  { label: "Contact", href: "#cta" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4">
      <div
        className={`mx-auto flex max-w-7xl items-center gap-4 rounded-2xl px-4 py-3 transition-all sm:px-6 ${
          scrolled ? "bg-card/95 shadow-soft backdrop-blur-xl" : "glass-panel"
        }`}
      >
        <a href="#top" className="flex min-w-0 shrink-0 items-center gap-2">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full gold-gradient">
            <Crown className="h-4 w-4 text-accent-foreground" />
          </span>
          <span
            className={`truncate text-lg font-extrabold tracking-tight ${
              scrolled ? "text-foreground" : "text-primary-foreground"
            }`}
          >
            SeLoger<span className="text-gold">CI</span>
          </span>
        </a>

        <nav className="ml-6 hidden items-center gap-6 lg:flex">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className={`text-sm font-medium transition-colors hover:text-gold ${
                scrolled ? "text-foreground" : "text-primary-foreground"
              }`}
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-3 lg:flex">
          <a
            href="#cta"
            className={`text-sm font-medium transition-colors hover:text-gold ${
              scrolled ? "text-foreground" : "text-primary-foreground"
            }`}
          >
            Connexion
          </a>
          <a
            href="#cta"
            className="rounded-full gold-gradient px-5 py-2.5 text-sm font-bold text-accent-foreground shadow-gold transition-transform hover:-translate-y-0.5"
          >
            Publier une annonce
          </a>
        </div>

        <button
          type="button"
          aria-label="Ouvrir le menu"
          onClick={() => setOpen((v) => !v)}
          className={`ml-auto grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border/40 lg:hidden ${
            scrolled ? "text-foreground" : "text-primary-foreground"
          }`}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="mx-auto mt-2 max-w-7xl rounded-2xl bg-card p-4 shadow-elevated lg:hidden">
          <nav className="grid gap-1">
            {links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-secondary"
              >
                {l.label}
              </a>
            ))}
            <a
              href="#cta"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-full gold-gradient px-4 py-2.5 text-center text-sm font-bold text-accent-foreground"
            >
              Publier une annonce
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
