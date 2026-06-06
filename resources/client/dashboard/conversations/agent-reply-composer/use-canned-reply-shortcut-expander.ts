import {CannedReply} from '@app/canned-replies/canned-reply';
import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {useQuery} from '@tanstack/react-query';
import {Editor} from '@tiptap/react';
import {useEffect, useMemo} from 'react';

interface Options {
  editor: Editor | null;
  transformBody?: (body: string) => string;
}

const MAX_LOOKBACK = 60;

export function useCannedReplyShortcutExpander({
  editor,
  transformBody,
}: Options) {
  const query = useQuery(
    helpdeskQueries.cannedReplies.index({
      query: '',
      forCurrentUser: true,
      perPage: 200,
    }),
  );

  const shortcutMap = useMemo(() => {
    const map = new Map<string, CannedReply>();
    const replies = query.data?.pagination.data ?? [];
    replies.forEach(reply => {
      if (reply.shortcut) {
        map.set(reply.shortcut.toLowerCase(), reply);
      }
    });
    return map;
  }, [query.data]);

  useEffect(() => {
    if (!editor || !shortcutMap.size) return;

    const onKeyDown = (event: KeyboardEvent) => {
      // Expand on Tab (preferred) and on Space.
      if (event.key !== 'Tab' && event.key !== ' ') return;

      const {from, empty} = editor.state.selection;
      if (!empty) return;

      const start = Math.max(0, from - MAX_LOOKBACK);
      const before = editor.state.doc.textBetween(start, from, '\n', '\n');
      const match = before.match(/(^|\s)(#[A-Za-z0-9_-]+)$/);
      if (!match) return;

      const shortcut = match[2];
      const reply = shortcutMap.get(shortcut.toLowerCase());
      if (!reply) return;

      event.preventDefault();

      const body = transformBody ? transformBody(reply.body) : reply.body;
      const deleteFrom = from - shortcut.length;

      editor
        .chain()
        .focus()
        .deleteRange({from: deleteFrom, to: from})
        .insertContent(body)
        .run();

      if (event.key === ' ') {
        editor.commands.insertContent(' ');
      }
    };

    editor.view.dom.addEventListener('keydown', onKeyDown);
    return () => {
      editor.view.dom.removeEventListener('keydown', onKeyDown);
    };
  }, [editor, shortcutMap, transformBody]);

  return {
    isLoading: query.isLoading,
  };
}
