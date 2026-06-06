import {FlowCardsNode} from '@ai/ai-agent/flows/flow-editor/nodes/flow-node';
import {CompactBoxLayout} from '@ai/ai-agent/flows/flow-editor/nodes/layout/compact-box-layout';
import {Trans} from '@ui/i18n/trans';
import {NodeProps} from '@xyflow/react';
import {FlowNodeType} from '../flow-node-type';

export function CardsNode({data, id, type}: NodeProps<FlowCardsNode>) {
  return (
    <CompactBoxLayout
      id={id}
      type={type as FlowNodeType.message}
      label={data.name}
    >
      <Trans
        message="Show cards (:count)"
        values={{count: data.cards?.length || 0}}
      />
    </CompactBoxLayout>
  );
}
