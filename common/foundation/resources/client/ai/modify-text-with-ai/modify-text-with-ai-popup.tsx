import {
  EnhanceTextWithAiInstruction,
  EnhanceTextWithAiPayload,
  EnhanceTextWithAiTone,
  useEnhanceTextWithAi,
} from '@common/ai/modify-text-with-ai/use-enhance-text-with-ai';
import {Button} from '@ui/buttons/button';
import {IconButton} from '@ui/buttons/icon-button';
import {Item} from '@ui/forms/listbox/item';
import {Trans} from '@ui/i18n/trans';
import {CloseFullscreenIcon} from '@ui/icons/material/CloseFullscreen';
import {KeyboardArrowDownIcon} from '@ui/icons/material/KeyboardArrowDown';
import {MediationIcon} from '@ui/icons/material/Mediation';
import {OpenInFullIcon} from '@ui/icons/material/OpenInFull';
import {SpellcheckIcon} from '@ui/icons/material/Spellcheck';
import {Menu, MenuTrigger} from '@ui/menu/menu-trigger';
import {Dialog} from '@ui/overlays/dialog/dialog';
import {DialogBody} from '@ui/overlays/dialog/dialog-body';
import {useDialogContext} from '@ui/overlays/dialog/dialog-context';
import {ProgressBar} from '@ui/progress/progress-bar';
import {Tooltip} from '@ui/tooltip/tooltip';
import {getLanguageList} from '@ui/utils/intl/languages';
import {useState} from 'react';

interface Props {
  onModify: (handler: (text: string) => Promise<string>) => void;
}
export function ModifyTextWithAiPopup({onModify}: Props) {
  const {close} = useDialogContext();
  const modifyText = useEnhanceTextWithAi();

  const handleModifyText = (payload: EnhanceTextWithAiPayload) => {
    return new Promise<string>((resolve, reject) => {
      modifyText.mutate(payload, {
        onSettled: (data, error) => {
          if (data) {
            resolve(data?.content);
            close();
          } else {
            reject(error);
          }
        },
      });
    });
  };

  const refine = (instruction: EnhanceTextWithAiInstruction) => {
    onModify((text: string) => handleModifyText({instruction, text}));
  };

  return (
    <Dialog>
      <DialogBody padding="p-10">
        {modifyText.isPending && (
          <ProgressBar
            isIndeterminate
            className="absolute left-0 right-0 top-0 w-full"
            size="xs"
          />
        )}
        <div className="flex items-center gap-4 overflow-x-auto">
          <Tooltip label={<Trans message="Simplify text" />}>
            <IconButton
              disabled={modifyText.isPending}
              size="sm"
              onClick={() => refine(EnhanceTextWithAiInstruction.Simplify)}
            >
              <MediationIcon />
            </IconButton>
          </Tooltip>
          <Tooltip label={<Trans message="Shorten text" />}>
            <IconButton
              disabled={modifyText.isPending}
              size="sm"
              onClick={() => refine(EnhanceTextWithAiInstruction.Shorten)}
            >
              <CloseFullscreenIcon />
            </IconButton>
          </Tooltip>
          <Tooltip label={<Trans message="Lenghten text" />}>
            <IconButton
              disabled={modifyText.isPending}
              size="sm"
              iconSize="md"
              onClick={() => refine(EnhanceTextWithAiInstruction.Lengthen)}
            >
              <OpenInFullIcon />
            </IconButton>
          </Tooltip>
          <Tooltip label={<Trans message="Fix spelling and grammar" />}>
            <IconButton
              disabled={modifyText.isPending}
              size="sm"
              onClick={() => refine(EnhanceTextWithAiInstruction.FixSpelling)}
            >
              <SpellcheckIcon />
            </IconButton>
          </Tooltip>
          <ChangeToneDropdown
            disabled={modifyText.isPending}
            onSelected={tone => {
              onModify((text: string) =>
                handleModifyText({
                  instruction: EnhanceTextWithAiInstruction.ChangeTone,
                  tone,
                  text,
                }),
              );
            }}
          />
          <TranslateDropdown
            disabled={modifyText.isPending}
            onSelected={language => {
              onModify((text: string) =>
                handleModifyText({
                  instruction: EnhanceTextWithAiInstruction.Translate,
                  language,
                  text,
                }),
              );
            }}
          />
        </div>
      </DialogBody>
    </Dialog>
  );
}

interface ChangeToneDropdownProps {
  onSelected: (tone: EnhanceTextWithAiTone) => void;
  disabled: boolean;
}
function ChangeToneDropdown({onSelected, disabled}: ChangeToneDropdownProps) {
  const [value, setValue] = useState<EnhanceTextWithAiTone | ''>('');
  return (
    <MenuTrigger
      onItemSelected={value => onSelected(value as EnhanceTextWithAiTone)}
      selectedValue={value}
      selectionMode="single"
      onSelectionChange={value => setValue(value as EnhanceTextWithAiTone)}
    >
      <Button
        disabled={disabled}
        variant="outline"
        size="xs"
        endIcon={<KeyboardArrowDownIcon />}
        className="ml-18"
      >
        <Trans message="Change tone" />
      </Button>
      <Menu>
        {Object.values(EnhanceTextWithAiTone).map(tone => (
          <Item value={tone} key={tone} capitalizeFirst>
            <Trans message={tone} />
          </Item>
        ))}
      </Menu>
    </MenuTrigger>
  );
}

interface TranslateDropdownProps {
  onSelected: (language: string) => void;
  disabled: boolean;
}
function TranslateDropdown({onSelected, disabled}: TranslateDropdownProps) {
  const languages = getLanguageList();
  return (
    <MenuTrigger
      onItemSelected={value => onSelected(value as string)}
      showSearchField
    >
      <Button
        disabled={disabled}
        variant="outline"
        size="xs"
        endIcon={<KeyboardArrowDownIcon />}
        className="ml-6"
      >
        <Trans message="Translate" />
      </Button>
      <Menu>
        {languages.map(language => (
          <Item value={language.code} key={language.code}>
            {language.name}
          </Item>
        ))}
      </Menu>
    </MenuTrigger>
  );
}
