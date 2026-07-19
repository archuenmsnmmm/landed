import { Fragment, useMemo } from "react";
import katex from "katex";

type Block =
  | { type: "code"; lang: string; body: string }
  | { type: "text"; body: string };

function parseBlocks(content: string): Block[] {
  const blocks: Block[] = [];
  const re = /```(\w*)\n?([\s\S]*?)```/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(content)) !== null) {
    if (match.index > last) {
      blocks.push({ type: "text", body: content.slice(last, match.index) });
    }
    blocks.push({ type: "code", lang: match[1] ?? "", body: match[2] ?? "" });
    last = match.index + match[0].length;
  }

  if (last < content.length) {
    blocks.push({ type: "text", body: content.slice(last) });
  }

  return blocks.length ? blocks : [{ type: "text", body: content }];
}

function renderLatex(expr: string, displayMode: boolean): string {
  try {
    return katex.renderToString(expr.trim(), {
      displayMode,
      throwOnError: false,
      strict: "ignore",
    });
  } catch {
    return expr;
  }
}

function renderInlineMarkdown(text: string, bodyClass: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const pattern =
    /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$|\*\*[^*]+\*\*)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) {
      nodes.push(
        <Fragment key={key++}>{text.slice(last, match.index)}</Fragment>,
      );
    }

    const token = match[0];
    if (token.startsWith("$$") && token.endsWith("$$")) {
      const html = renderLatex(token.slice(2, -2), true);
      nodes.push(
        <span
          key={key++}
          className="suggestion-math block my-2 overflow-x-auto text-[14px]"
          dangerouslySetInnerHTML={{ __html: html }}
        />,
      );
    } else if (token.startsWith("$") && token.endsWith("$")) {
      const html = renderLatex(token.slice(1, -1), false);
      nodes.push(
        <span
          key={key++}
          className="suggestion-math inline text-[15px]"
          dangerouslySetInnerHTML={{ __html: html }}
        />,
      );
    } else if (token.startsWith("**") && token.endsWith("**")) {
      nodes.push(
        <strong key={key++} className={`font-semibold ${bodyClass}`}>
          {token.slice(2, -2)}
        </strong>,
      );
    }

    last = match.index + token.length;
  }

  if (last < text.length) {
    nodes.push(<Fragment key={key++}>{text.slice(last)}</Fragment>);
  }

  return nodes;
}

function TextBlock({
  body,
  bodyClass,
  mutedClass,
}: {
  body: string;
  bodyClass: string;
  mutedClass: string;
}) {
  const lines = body.split("\n");

  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        const trimmed = line.trimEnd();
        if (!trimmed) return <div key={i} className="h-1" />;

        if (trimmed.startsWith(">")) {
          const quote = trimmed.replace(/^>\s?/, "");
          return (
            <blockquote
              key={i}
              className={`border-l-2 border-zinc-400/50 pl-3 text-[14px] leading-snug ${bodyClass}`}
            >
              {renderInlineMarkdown(quote, bodyClass)}
            </blockquote>
          );
        }

        if (trimmed === "---") {
          return <hr key={i} className="my-2 border-zinc-300/40" />;
        }

        const isSubBullet = /^\s*└─/.test(line);
        const isBullet =
          /^[•*]\s/.test(trimmed) ||
          /^-\s+/.test(trimmed) ||
          /^\d+\.\s/.test(trimmed) ||
          isSubBullet;

        if (isBullet) {
          const text = trimmed
            .replace(/^[\s•*└─]+/, "")
            .replace(/^\d+\.\s+/, "")
            .replace(/^-\s+/, "")
            .trim();
          return (
            <p
              key={i}
              className={`text-[14px] leading-snug ${isSubBullet ? `pl-4 ${mutedClass}` : bodyClass}`}
            >
              {isSubBullet ? "└ " : "• "}
              {renderInlineMarkdown(text, bodyClass)}
            </p>
          );
        }

        const isHeadline = i === 0 && lines.filter((l) => l.trim()).length > 2;
        return (
          <p
            key={i}
            className={`leading-snug ${
              isHeadline
                ? `text-[17px] font-semibold tracking-[-0.01em] ${bodyClass}`
                : `text-[15px] ${bodyClass}`
            }`}
          >
            {renderInlineMarkdown(trimmed, bodyClass)}
          </p>
        );
      })}
    </div>
  );
}

export function SuggestionRichText({
  content,
  bodyClass,
  mutedClass,
}: {
  content: string;
  bodyClass: string;
  mutedClass: string;
}) {
  const blocks = useMemo(() => parseBlocks(content), [content]);

  return (
    <div className="suggestion-rich max-h-[min(60vh,420px)] overflow-y-auto pr-1">
      {blocks.map((block, i) =>
        block.type === "code" ? (
          <pre
            key={i}
            className={`my-2 overflow-x-auto rounded-xl bg-black/75 px-3 py-2.5 font-mono text-[12px] leading-relaxed text-emerald-100`}
          >
            <code>{block.body.trimEnd()}</code>
          </pre>
        ) : (
          <TextBlock
            key={i}
            body={block.body}
            bodyClass={bodyClass}
            mutedClass={mutedClass}
          />
        ),
      )}
    </div>
  );
}

export function isRichSuggestion(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  if (t.includes("```")) return true;
  if (/^[•*\-]|\n[•*\-]|\n\s*└─/m.test(t)) return true;
  if (/^\d+\.\s/m.test(t)) return true;
  if (/^>/m.test(t)) return true;
  if (/\$\$?[^$]+\$/.test(t)) return true;
  if (t.includes("\n---\n")) return true;
  if (t.split("\n").filter(Boolean).length > 2) return true;
  return t.length > 120;
}
