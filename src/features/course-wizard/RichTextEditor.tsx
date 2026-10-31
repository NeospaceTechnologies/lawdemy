"use client";
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";

// Write-up editor (bold, italic, headings, quote, link, lists). Uses the
// browser's editing commands, as in the design; the server sanitises the HTML.
const TOOLS: { label: string; title: string; cmd: string; arg?: string }[] = [
  { label: "B", title: "Bold", cmd: "bold" },
  { label: "I", title: "Italic", cmd: "italic" },
  { label: "H1", title: "Heading 1", cmd: "formatBlock", arg: "h3" },
  { label: "H2", title: "Heading 2", cmd: "formatBlock", arg: "h4" },
  { label: "❝", title: "Quote", cmd: "formatBlock", arg: "blockquote" },
  { label: "Link", title: "Link", cmd: "createLink" },
  { label: "•", title: "Bullet list", cmd: "insertUnorderedList" },
  { label: "1.", title: "Numbered list", cmd: "insertOrderedList" },
];

export function RichTextEditor({
  initialHtml,
  onChange,
  labelledBy,
  placeholder = "Enter a description…",
}: {
  initialHtml: string;
  onChange: (html: string) => void;
  labelledBy: string;
  placeholder?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const savedRange = useRef<Range | null>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [url, setUrl] = useState("https://");

  // Uncontrolled after mount so the caret doesn't jump while typing.
  useEffect(() => {
    if (box.current) box.current.innerHTML = initialHtml;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function emit() {
    const html = box.current?.innerHTML ?? "";
    onChange(box.current?.innerText.trim() ? html : "");
  }

  function run(cmd: string, arg?: string) {
    box.current?.focus();
    try {
      document.execCommand(cmd, false, arg);
    } catch {}
    emit();
  }

  function openLink() {
    const sel = window.getSelection();
    savedRange.current = sel && sel.rangeCount && box.current?.contains(sel.anchorNode) ? sel.getRangeAt(0).cloneRange() : null;
    setUrl("https://");
    setLinkOpen(true);
  }

  function applyLink() {
    const href = url.trim();
    setLinkOpen(false);
    if (!/^https?:\/\/\S+\.\S+/.test(href)) return;
    box.current?.focus();
    const sel = window.getSelection();
    if (savedRange.current && sel) {
      sel.removeAllRanges();
      sel.addRange(savedRange.current);
    }
    if (sel && sel.isCollapsed) document.execCommand("insertHTML", false, `<a href="${encodeURI(href)}">${href.replace(/[<>&"]/g, "")}</a>`);
    else document.execCommand("createLink", false, href);
    emit();
  }

  return (
    <div className="overflow-hidden rounded-control border border-line-input bg-surface focus-within:border-primary">
      <div role="toolbar" aria-label="Formatting" className="flex flex-wrap gap-0.5 border-b border-line bg-white p-1.5">
        {TOOLS.map((t) => (
          <button
            key={t.title}
            type="button"
            title={t.title}
            aria-label={t.title}
            onMouseDown={(e) => {
              e.preventDefault(); // keep the selection in the editor
              if (t.cmd === "createLink") openLink();
              else run(t.cmd, t.arg);
            }}
            onKeyDown={(e) => {
              if (e.key !== "Enter" && e.key !== " ") return;
              e.preventDefault();
              if (t.cmd === "createLink") openLink();
              else run(t.cmd, t.arg);
            }}
            className={clsx("h-[30px] min-w-[30px] rounded-md border-0 bg-transparent px-1.5 text-xs font-bold text-ink-2 hover:bg-surface", t.label === "I" && "italic")}
          >
            {t.label}
          </button>
        ))}
      </div>
      {linkOpen && (
        <div className="flex items-center gap-2 border-b border-line bg-white px-2 py-1.5">
          <label htmlFor={`${labelledBy}-url`} className="sr-only">Link URL</label>
          <input
            id={`${labelledBy}-url`}
            autoFocus
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applyLink();
              }
              if (e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation();
                setLinkOpen(false);
              }
            }}
            className="h-8 min-w-0 flex-1 rounded-md border border-line-input px-2 text-xs outline-none focus:border-primary"
          />
          <button type="button" onClick={applyLink} className="h-8 rounded-md bg-primary px-2.5 text-xs font-semibold text-white">Add link</button>
          <button type="button" onClick={() => setLinkOpen(false)} className="h-8 rounded-md px-2 text-xs text-ink-3">Cancel</button>
        </div>
      )}
      <div
        ref={box}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-labelledby={labelledBy}
        data-placeholder={placeholder}
        onInput={emit}
        className="prose-lesson min-h-[110px] px-3 py-2.5 text-[13px] leading-[1.55] outline-none"
      />
    </div>
  );
}
