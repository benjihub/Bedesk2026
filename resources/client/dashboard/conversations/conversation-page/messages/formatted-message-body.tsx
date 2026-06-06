import {highlightAllCode} from '@common/text-editor/highlight/highlight-code';
import clsx from 'clsx';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function looksLikeHtml(text: string): boolean {
  // Heuristic: treat as HTML if it contains any tag-like token.
  // This preserves existing behavior for agent/composer output that uses <p>, <br>, etc.
  return /<\s*\/?\s*[a-z][\s\S]*?>/i.test(text);
}

function containsHtmlListTags(text: string): boolean {
  return /<\s*(ul|ol|li)\b/i.test(text);
}

function containsPlainTextListSyntax(text: string): boolean {
  const normalized = text.replace(/\r\n|\r/g, '\n');
  return (
    /(^|\n)\s*(?:[-*]|•)\s+\S+/m.test(normalized) ||
    /(^|\n)\s*\d+\.\s+\S+/m.test(normalized)
  );
}

function htmlToPlainTextPreserveLineBreaks(html: string): string {
  // Convert common line-break-ish tags to newlines, then strip remaining tags.
  // This is intentionally lightweight; we only need enough fidelity to recover
  // list syntax like "- item" split across lines.
  return html
    .replace(/<\s*br\s*\/?\s*>/gi, '\n')
    .replace(/<\s*\/\s*p\s*>/gi, '\n')
    .replace(/<\s*p\b[^>]*>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function formatPlainTextToHtml(text: string): string {
  const normalized = text.replace(/\r\n|\r/g, '\n');
  const lines = normalized.split('\n');

  const parts: string[] = [];
  let paragraphLines: string[] = [];
  let inUl = false;
  let inOl = false;

  const closeLists = () => {
    if (inUl) {
      parts.push('</ul>');
      inUl = false;
    }
    if (inOl) {
      parts.push('</ol>');
      inOl = false;
    }
  };

  const flushParagraph = () => {
    if (!paragraphLines.length) return;
    const html = paragraphLines.map(l => escapeHtml(l)).join('<br />');
    parts.push(`<p>${html}</p>`);
    paragraphLines = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (trimmed === '') {
      flushParagraph();
      closeLists();
      continue;
    }

    const bulletMatch = /^\s*(?:[-*]|•)\s+(.*)$/.exec(line);
    if (bulletMatch) {
      flushParagraph();
      if (inOl) closeLists();
      if (!inUl) {
        parts.push('<ul>');
        inUl = true;
      }
      parts.push(`<li>${escapeHtml(bulletMatch[1] ?? '')}</li>`);
      continue;
    }

    const numberedMatch = /^\s*(\d+)\.\s+(.*)$/.exec(line);
    if (numberedMatch) {
      flushParagraph();
      if (inUl) closeLists();
      if (!inOl) {
        parts.push('<ol>');
        inOl = true;
      }
      parts.push(`<li>${escapeHtml(numberedMatch[2] ?? '')}</li>`);
      continue;
    }

    // Normal text line
    closeLists();
    paragraphLines.push(line);
  }

  flushParagraph();
  closeLists();
  return parts.join('');
}

export const formattedMessageBodyClassName =
  'prose prose-neutral max-w-none text-sm text-inherit [--tw-prose-bullets:inherit] [--tw-prose-counters:inherit] dark:prose-invert prose-li:my-2 prose-headings:text-sm prose-ul:pl-16 prose-ol:pl-16';

export const bodyClassNameWithoutParagraphSpacing =
  'prose prose-neutral max-w-none text-sm text-inherit [--tw-prose-bullets:inherit] [--tw-prose-counters:inherit] dark:prose-invert prose-li:m-0 prose-headings:text-sm prose-ul:pl-16 prose-ol:pl-16 prose-p:m-0 prose-img:m-0 prose-blockquote:border-l-on-primary';

interface Props {
  className?: string;
  children: string;
  isStreaming?: boolean;
  // If reply is by agent using bedesk reply composer, spaces will be via line breaks, no need for extra spacing. Chatbot will use html <p> tags to add spacing.
  addParagraphSpacing?: boolean;
}
export function FormattedMessageBody({
  className,
  children,
  isStreaming,
  addParagraphSpacing,
}: Props) {
  let html: string;
  if (looksLikeHtml(children)) {
    // If we got HTML that already contains list tags, render as-is.
    // But if it's mostly just line breaks (<br>/<p>) and the content uses
    // plain-text list syntax ("- item" / "1. item"), convert it into real
    // <ul>/<ol> so it renders as a proper list in the bubble.
    if (!containsHtmlListTags(children) && containsPlainTextListSyntax(children)) {
      html = formatPlainTextToHtml(htmlToPlainTextPreserveLineBreaks(children));
    } else {
      html = children;
    }
  } else {
    html = formatPlainTextToHtml(children);
  }

  // Convert plain-text URLs (including rtp://) into clickable links while
  // avoiding transformation inside <a>, <code>, <pre>, <script>, and <style>.
  function linkifyHtml(inputHtml: string): string {
    if (typeof window === 'undefined') return inputHtml;

    const container = document.createElement('div');
    container.innerHTML = inputHtml;

    const urlRegex = /^(?:[a-z][a-z0-9+.-]*):\/\/[\S]+$/i;

    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
    const textNodes: Text[] = [];
    let node: Text | null = null;
    while ((node = walker.nextNode() as Text | null)) {
      const parentTag = node.parentElement?.tagName?.toLowerCase();
      if (!parentTag) continue;
      if (['a', 'code', 'pre', 'script', 'style'].includes(parentTag)) continue;
      if (/[a-z][a-z0-9+.-]*:\/\//i.test(node.nodeValue || '')) {
        textNodes.push(node);
      }
    }

    for (const textNode of textNodes) {
      const text = textNode.nodeValue || '';
      // Split by URLs, preserving the URLs in the result
      const parts = text.split(/((?:[a-z][a-z0-9+.-]*):\/\/[^\n\r\s<>]+)/i);
      if (parts.length === 1) continue;

      const frag = document.createDocumentFragment();
      for (const part of parts) {
        if (!part) continue;
        if (urlRegex.test(part)) {
          const a = document.createElement('a');
          a.href = part;
          a.textContent = part;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          a.className = 'break-words underline';
          frag.appendChild(a);
        } else {
          frag.appendChild(document.createTextNode(part));
        }
      }

      textNode.parentNode?.replaceChild(frag, textNode);
    }

    return container.innerHTML;
  }

  html = linkifyHtml(html);

  return (
    <div
      ref={el => {
        if (el && !isStreaming) {
          highlightAllCode(el);
        }
      }}
      className={clsx(
        addParagraphSpacing
          ? formattedMessageBodyClassName
          : bodyClassNameWithoutParagraphSpacing,
        className,
        isStreaming && 'streaming-message-body',
        'compact-scrollbar max-w-full overflow-x-auto',
      )}
      dangerouslySetInnerHTML={{__html: html}}
    />
  );
}
