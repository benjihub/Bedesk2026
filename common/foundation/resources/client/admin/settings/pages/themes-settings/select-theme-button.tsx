import {Item} from '@ui/forms/listbox/item';
import {Select} from '@ui/forms/select/select';
import {CssTheme} from '@ui/themes/css-theme';

interface Props {
  selectedThemeId: number;
  onSelectionChange: (themeId: number) => void;
  allThemes: CssTheme[];
}
export function SelectThemeButton({
  selectedThemeId,
  onSelectionChange,
  allThemes,
}: Props) {
  return (
    <Select
      size="sm"
      selectionMode="single"
      selectedValue={selectedThemeId}
      onSelectionChange={value => onSelectionChange(value as number)}
      appearance="dropdown"
    >
      {allThemes.map(theme => (
        <Item key={theme.id} value={theme.id}>
          {theme.name}
        </Item>
      ))}
    </Select>
  );
}
