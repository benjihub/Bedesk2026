import {TextFormatButtons} from '@common/text-editor/text-format-buttons';
import {
  autoUpdate,
  shift,
  useFloating,
  VirtualElement,
} from '@floating-ui/react-dom';
import {
  Editor,
  isNodeSelection,
  isTextSelection,
  posToDOMRect,
} from '@tiptap/core';
import {rootEl} from '@ui/root-el';
import {useEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {useCurrentTextEditor} from './tiptap-editor-context';

export function FloatingToolbar() {
  const editor = useCurrentTextEditor();
  const preventHide = useRef(false);
  const [virtualEl, setVirtualEl] = useState<VirtualElement | null>(null);

  const contentEditableElRef = useRef<HTMLElement | undefined>(
    editor?.view.dom,
  );

  const {x, y, strategy, refs} = useFloating({
    whileElementsMounted: autoUpdate,
    middleware: [
      shift({
        crossAxis: true,
        mainAxis: true,
      }),
    ],
    placement: 'top',
    elements: {
      reference: virtualEl,
    },
  });

  useEffect(() => {
    const el = contentEditableElRef.current;
    if (!editor) return;

    const toggleToolbar = () => {
      const {ranges} = editor.view.state.selection;
      const from = Math.min(...ranges.map(range => range.$from.pos));
      const to = Math.max(...ranges.map(range => range.$to.pos));

      const shouldShow = shouldShowToolbar({
        editor: editor,
        from,
        to,
      });

      if (!shouldShow) {
        setVirtualEl(null);
        return;
      }

      setVirtualEl({
        contextElement: contentEditableElRef.current ?? undefined,
        getBoundingClientRect: () => {
          if (isNodeSelection(editor.view.state.selection)) {
            let node = editor.view.nodeDOM(from) as HTMLElement;

            if (node) {
              const nodeViewWrapper = node.dataset.nodeViewWrapper
                ? node
                : node.querySelector('[data-node-view-wrapper]');

              if (nodeViewWrapper) {
                node = nodeViewWrapper.firstChild as HTMLElement;
              }

              if (node) {
                return node.getBoundingClientRect();
              }
            }
          }

          return posToDOMRect(editor.view, from, to);
        },
      });
    };

    const dragStartHandler = () => {
      setVirtualEl(null);
    };

    const focusHandler = () => {
      // we use `setTimeout` to make sure `selection` is already updated
      setTimeout(() => toggleToolbar());
    };

    const blurHandler = ({event}: {event: FocusEvent}) => {
      if (preventHide.current) {
        preventHide.current = false;
        return;
      }

      if (
        event?.relatedTarget &&
        el?.parentNode?.contains(event.relatedTarget as Node)
      ) {
        return;
      }

      if (event?.relatedTarget === editor.view.dom) {
        return;
      }

      setVirtualEl(null);
    };

    let prevState = editor.view.state;
    const transactionHandler = () => {
      const selectionChanged = !prevState.selection.eq(
        editor.view.state.selection,
      );
      const docChanged = !prevState.doc.eq(editor.view.state.doc);

      if (selectionChanged || docChanged) {
        toggleToolbar();
      }

      prevState = editor.view.state;
    };

    if (el) {
      el.addEventListener('dragstart', dragStartHandler);
      editor.on('focus', focusHandler);
      editor.on('blur', blurHandler);
      editor.on('transaction', transactionHandler);

      return () => {
        el.removeEventListener('dragstart', dragStartHandler);
        editor.off('focus', focusHandler);
        editor.off('blur', blurHandler);
        editor.off('transaction', transactionHandler);
      };
    }
  }, [contentEditableElRef, editor]);

  return virtualEl
    ? createPortal(
        <div
          className="reply-composer-floating-toolbar z-tooltip"
          onMouseDownCapture={() => {
            preventHide.current = true;
          }}
          style={{
            position: strategy,
            top: y ?? '',
            left: x ?? '',
          }}
          ref={refs.setFloating}
        >
          <TextFormatButtons size="sm" />
        </div>,
        rootEl,
      )
    : null;
}

interface ShouldShowProps {
  editor: Editor;
  from: number;
  to: number;
}
function shouldShowToolbar({from, to, editor}: ShouldShowProps): boolean {
  // Sometime check for `empty` is not enough.
  // Doubleclick an empty paragraph returns a node size of 2.
  // So we check also for an empty text size.
  const isEmptyTextBlock =
    !editor.view.state.doc.textBetween(from, to).length ||
    !isTextSelection(editor.view.state.selection);

  // When clicking on a element inside the bubble menu the editor "blur" event
  // is called and the bubble menu item is focussed. In this case we should
  // consider the menu as part of the editor and keep showing the menu
  const isChildOfMenu = document.activeElement?.closest(
    '.reply-composer-floating-toolbar',
  );

  const hasEditorFocus = editor.view.hasFocus() || isChildOfMenu;

  if (
    !hasEditorFocus ||
    editor.view.state.selection.empty ||
    isEmptyTextBlock ||
    !editor.isEditable
  ) {
    return false;
  }

  return true;
}
