import {aiAgentQueries} from '@ai/ai-agent/ai-agent-queries';
import {AttributeSelectorExtraItemsContext} from '@app/attributes/attribute-selector/attribute-selector-extra-items-context';
import {AttributeSelectorItemType} from '@app/attributes/attribute-selector/attribute-selector-item';
import {AttributeSelectorItemConfig} from '@app/attributes/attribute-selector/use-attribute-selector-items';
import {useSuspenseQuery} from '@tanstack/react-query';
import {ReactNode, useMemo} from 'react';

type Props = {
  toolId: number;
  listPath: string | undefined;
  children: ReactNode;
};
export function ToolResponseAttrributesProvider({
  toolId,
  listPath,
  children,
}: Props) {
  const {data} = useSuspenseQuery(aiAgentQueries.tools.get(toolId));
  const properties: AttributeSelectorItemConfig[] = useMemo(() => {
    if (!listPath) return [];
    return data.tool.response_schema.properties
      .filter(property => property.path.startsWith(listPath))
      .map(property => ({
        name: property.id,
        displayName: property.path
          .replace(`${listPath}.[*].`, '')
          .replace('[root]', 'items'),
        type: AttributeSelectorItemType.AiAgentTool,
        key: `${AttributeSelectorItemType.AiAgentTool}.${property.id}`,
        isReadonly: true,
      }));
  }, [data.tool.response_schema.properties, listPath]);

  return (
    <AttributeSelectorExtraItemsContext.Provider value={properties}>
      {children}
    </AttributeSelectorExtraItemsContext.Provider>
  );
}
