import {aiAgentQueries} from '@ai/ai-agent/ai-agent-queries';
import {
  FlowNode,
  FlowToolNode,
} from '@ai/ai-agent/flows/flow-editor/nodes/flow-node';
import {FlowNodeType} from '@ai/ai-agent/flows/flow-editor/nodes/flow-node-type';
import {useFlowEditorStore} from '@ai/ai-agent/flows/flow-editor/store/flow-editor-store-provider';
import {getAncestorIdsOfType} from '@ai/ai-agent/flows/flow-editor/utils/get-ancestor-ids-of-type';
import {useQuery} from '@tanstack/react-query';
import {Item} from '@ui/forms/listbox/item';
import {FormSelect} from '@ui/forms/select/select';
import {Trans} from '@ui/i18n/trans';
import {useTrans} from '@ui/i18n/use-trans';
import {useMemo} from 'react';

type Props = {
  node: FlowNode;
  onToolChange: () => void;
};
export function AncestorToolSelector({node, onToolChange}: Props) {
  const {trans} = useTrans();
  const nodes = useFlowEditorStore(s => s.nodes);

  const ancestorToolNodes = useMemo(() => {
    const nodeIds = getAncestorIdsOfType(node.id, FlowNodeType.tool, nodes);
    return nodeIds
      .map(id => nodes.find(n => n.id === id))
      .filter(Boolean) as FlowToolNode[];
  }, [node.id, nodes]);

  const ancestorToolIds = ancestorToolNodes.map(node => node.data.toolId);
  const {data} = useQuery(aiAgentQueries.tools.list());

  const ancestorTools =
    data?.tools.filter(tool => ancestorToolIds.includes(tool.id)) ?? [];

  return (
    <FormSelect
      name="toolId"
      className="mb-24"
      label={<Trans message="Tool response" />}
      placeholder={trans({message: 'Select a tool response'})}
      showSearchField
      required
      onSelectionChange={onToolChange}
    >
      {ancestorTools.map(tool => (
        <Item key={tool.id} value={tool.id}>
          {tool.name}
        </Item>
      ))}
    </FormSelect>
  );
}
