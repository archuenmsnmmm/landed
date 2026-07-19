import { useMemo, useState } from "react";
import { HELP_CATEGORIES, HELP_QUICK_TIPS } from "../../content/help-center";
import { OVERLAY_KEYBINDS, shortcutModLabel } from "../../lib/keybinds";

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function HelpCenterPanel({
  onContactSupport,
}: {
  onContactSupport?: () => void;
}) {
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const mod = shortcutModLabel();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return HELP_CATEGORIES;

    return HELP_CATEGORIES.map((category) => ({
      ...category,
      articles: category.articles.filter(
        (article) =>
          article.q.toLowerCase().includes(q) ||
          article.a.toLowerCase().includes(q) ||
          category.title.toLowerCase().includes(q),
      ),
    })).filter((category) => category.articles.length > 0);
  }, [query]);

  const toggleArticle = (id: string) => {
    setOpenId((current) => (current === id ? null : id));
  };

  return (
    <div>
      <div className="mb-4 border-b border-zinc-100 pb-5">
        <h2 className="text-[15px] font-semibold text-zinc-900">Help Center</h2>
        <p className="mt-1 text-[12px] text-zinc-500">
          Everything you need to use Landed on your screen
        </p>
      </div>

      <label htmlFor="help-search" className="sr-only">
        Search help articles
      </label>
      <input
        id="help-search"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for help..."
        className="h-9 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-[12px] text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-blue-400 focus:bg-white"
      />

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {HELP_QUICK_TIPS.map((tip) => (
          <div
            key={tip.title}
            className="rounded-xl border border-zinc-200 bg-zinc-50/80 px-3 py-2.5"
          >
            <p className="text-[11px] font-semibold text-zinc-800">{tip.title}</p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-500">
              {tip.body}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-zinc-200">
        <p className="border-b border-zinc-100 bg-zinc-50 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
          Keyboard shortcuts
        </p>
        {OVERLAY_KEYBINDS.map((bind, i) => (
          <div
            key={bind.description}
            className={`flex items-center justify-between px-4 py-2 ${i > 0 ? "border-t border-zinc-100" : ""}`}
          >
            <span className="text-[12px] text-zinc-600">{bind.description}</span>
            <kbd className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-medium text-zinc-600">
              {bind.keys(mod)}
            </kbd>
          </div>
        ))}
      </div>

      <div className="mt-5 space-y-5">
        {filtered.map((category) => (
          <section key={category.id}>
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              {category.title}
            </h3>
            <div className="mt-2 space-y-1.5">
              {category.articles.map((article) => {
                const id = `${category.id}-${article.q}`;
                const isOpen = openId === id;

                return (
                  <div
                    key={article.q}
                    className="overflow-hidden rounded-xl border border-zinc-200 bg-white"
                  >
                    <button
                      type="button"
                      onClick={() => toggleArticle(id)}
                      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                    >
                      <span className="text-[13px] font-medium text-zinc-900">
                        {article.q}
                      </span>
                      <ChevronIcon
                        className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {isOpen ? (
                      <p className="border-t border-zinc-100 px-4 pb-3 pt-2 text-[12px] leading-relaxed text-zinc-600">
                        {article.a}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        {filtered.length === 0 ? (
          <p className="text-[12px] text-zinc-500">
            No articles matched your search. Try different keywords or contact support.
          </p>
        ) : null}
      </div>

      <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3">
        <p className="text-[12px] font-medium text-zinc-800">Still need help?</p>
        <p className="mt-0.5 text-[11px] text-zinc-500">
          Our team typically responds within 24 hours.
        </p>
        <button
          type="button"
          onClick={() => {
            if (onContactSupport) {
              onContactSupport();
              return;
            }
            void window.landed?.openExternal?.("mailto:landed.support@gmail.com");
          }}
          className="mt-2.5 rounded-lg border border-zinc-200 bg-white px-3.5 py-1.5 text-[12px] font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
        >
          Contact support
        </button>
      </div>
    </div>
  );
}
