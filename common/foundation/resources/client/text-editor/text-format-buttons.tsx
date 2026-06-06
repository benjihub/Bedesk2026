import {ClearFormatButton} from '@common/text-editor/menubar/clear-format-button';
import {CodeBlockMenuTrigger} from '@common/text-editor/menubar/code-block-menu-trigger';
import {FontStyleButtons} from '@common/text-editor/menubar/font-style-buttons';
import {LinkButton} from '@common/text-editor/menubar/link-button';
import {ListButtons} from '@common/text-editor/menubar/list-buttons';
import {ButtonSize} from '@ui/buttons/button-size';
import {useCurrentTextEditor} from './tiptap-editor-context';

interface Props {
  size?: ButtonSize;
}
export function TextFormatButtons({size = 'sm'}: Props) {
  const editor = useCurrentTextEditor();

  if (!editor) return null;

  return (
    <div className="flex items-center gap-4 rounded-panel border bg py-2 shadow">
      <FontStyleButtons size={size} />
      <Divider />
      <ListButtons size={size} />
      <Divider />
      <LinkButton size={size} />
      <Divider />
      <CodeBlockMenuTrigger size={size} />
      <ClearFormatButton size={size} />
    </div>
  );
}

function Divider() {
  return <div className="w-1 flex-shrink-0 self-stretch bg-divider" />;
}
