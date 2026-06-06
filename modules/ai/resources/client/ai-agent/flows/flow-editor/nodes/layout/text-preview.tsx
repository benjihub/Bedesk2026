import {AttributeSelectorItemType} from '@app/attributes/attribute-selector/attribute-selector-item';
import {useAttributeSelectorItems} from '@app/attributes/attribute-selector/use-attribute-selector-items';
import {useMemo} from 'react';

const regexWithoutCaptureGroups = new RegExp(
  '(<be-variable name="[a-zA-Z0-9_-]+" type="[a-zA-Z0-9_-]+" fallback="(?:[a-zA-Z0-9_-]+)?"><\/be-variable>)',
  'gm',
);
const regexWithCaptureGroups = new RegExp(
  '<be-variable name="([a-zA-Z0-9_-]+)" type="([a-zA-Z0-9_-]+)" fallback="(([a-zA-Z0-9_-]+)?)"><\/be-variable>',
);

interface TextPreviewProps {
  children: string;
}
export function TextPreview({children}: TextPreviewProps) {
  const compiledMessage = useMemo(() => {
    const parts = children.split(regexWithoutCaptureGroups);
    return parts.filter(Boolean).map((part, i) => {
      if (part.startsWith('<be-variable')) {
        const match = part.match(regexWithCaptureGroups);
        if (match) {
          return (
            <Variable
              name={match[1]}
              type={match[2]}
              fallback={match[3]}
              key={i}
            />
          );
        }
      }
      return part;
    });
  }, [children]);

  return <div>{compiledMessage}</div>;
}

type VariableProps = {
  name: string;
  type: string;
  fallback: string;
};
function Variable({name, type, fallback}: VariableProps) {
  const {getItem} = useAttributeSelectorItems();
  const itemConfig = getItem({name, type: type as AttributeSelectorItemType});

  return (
    <div className="trim-both mx-2 inline-flex min-w-34 items-center justify-center rounded-full border bg-chip px-4 align-middle font-medium leading-[20px]">
      {itemConfig?.displayName || name}
    </div>
  );
}
