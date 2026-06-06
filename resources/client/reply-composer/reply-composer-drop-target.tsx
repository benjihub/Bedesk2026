import {ConversationAttachment} from '@app/dashboard/types/conversation-attachment';
import {useUploadAttachments} from '@app/reply-composer/use-upload-attachments';
import {opacityAnimation} from '@ui/animation/opacity-animation';
import {Trans} from '@ui/i18n/trans';
import {MixedDraggable} from '@ui/interactions/dnd/use-draggable';
import {useDroppable} from '@ui/interactions/dnd/use-droppable';
import {AnimatePresence, m} from 'framer-motion';
import {ReactNode, useRef, useState} from 'react';

interface Props {
  isDisabled?: boolean;
  onUpload: (attachment: ConversationAttachment) => void;
  children: ReactNode;
}
export function ReplyComposerDropTargetMask({
  isDisabled,
  onUpload,
  children,
}: Props) {
  const upload = useUploadAttachments({
    onSuccess: entry => {
      onUpload(entry);
    },
  });

  const [isDragOver, setIsDragOver] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const {droppableProps} = useDroppable({
    id: 'reply-composer-drop-target',
    ref,
    types: ['nativeFile'],
    disabled: isDisabled,
    onDragEnter: () => setIsDragOver(true),
    onDragLeave: () => setIsDragOver(false),
    onDrop: async (draggable: MixedDraggable) => {
      if (draggable.type === 'nativeFile') {
        upload(await draggable.getData());
      }
    },
  });

  const mask = (
    <m.div
      key="dragTargetMask"
      {...opacityAnimation}
      transition={{duration: 0.3}}
      className="pointer-events-none absolute inset-0 min-h-full w-full rounded-panel border-2 border-dashed border-primary bg-primary-light/30"
    >
      <m.div
        initial={{y: '100%', opacity: 0}}
        animate={{y: '-10px', opacity: 1}}
        exit={{y: '100%', opacity: 0}}
        className="fixed bottom-0 left-0 right-0 mx-auto max-w-max rounded bg-primary p-10 text-on-primary"
      >
        <Trans message="Drop files to attach them to this reply." />
      </m.div>
    </m.div>
  );

  return (
    <div className="relative" {...droppableProps} ref={ref}>
      <AnimatePresence>{isDragOver ? mask : null}</AnimatePresence>
      {children}
    </div>
  );
}
