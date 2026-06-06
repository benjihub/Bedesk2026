import {IconButton} from '@ui/buttons/icon-button';
import {Trans} from '@ui/i18n/trans';
import {CodeIcon} from '@ui/icons/material/Code';
import {Menu, MenuItem, MenuTrigger} from '@ui/menu/menu-trigger';
import {Tooltip} from '@ui/tooltip/tooltip';
import clsx from 'clsx';
import {useCurrentTextEditor} from '../tiptap-editor-context';
import {MenubarButtonProps} from './menubar-button-props';

export function CodeBlockMenuTrigger({size}: MenubarButtonProps) {
  const editor = useCurrentTextEditor();
  const language = editor?.getAttributes('codeBlock').language || '';
  return (
    <MenuTrigger
      selectionMode="single"
      selectedValue={language}
      onSelectionChange={key => {
        editor?.commands.toggleCodeBlock({language: key as string});
      }}
    >
      <Tooltip label={<Trans message="Codeblock" />}>
        <IconButton
          disabled={!editor}
          className={clsx('flex-shrink-0')}
          size={size}
          color={language ? 'primary' : null}
        >
          <CodeIcon />
        </IconButton>
      </Tooltip>
      <Menu>
        <MenuItem value="html">HTML</MenuItem>
        <MenuItem value="javascript">JavaScript</MenuItem>
        <MenuItem value="css">CSS</MenuItem>
        <MenuItem value="php">PHP</MenuItem>
        <MenuItem value="shell">Shell</MenuItem>
        <MenuItem value="bash">Bash</MenuItem>
        <MenuItem value="ruby">Ruby</MenuItem>
        <MenuItem value="python">Python</MenuItem>
        <MenuItem value="java">Java</MenuItem>
        <MenuItem value="c++">C++</MenuItem>
      </Menu>
    </MenuTrigger>
  );
}
