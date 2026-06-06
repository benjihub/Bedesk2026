import {FlowArticlesNode} from '@ai/ai-agent/flows/flow-editor/nodes/flow-node';
import {CompactBoxLayout} from '@ai/ai-agent/flows/flow-editor/nodes/layout/compact-box-layout';
import {Trans} from '@ui/i18n/trans';
import {NodeProps} from '@xyflow/react';

export function ArticlesNode({data, id, type}: NodeProps<FlowArticlesNode>) {
  return (
    <CompactBoxLayout id={id} type={type} label={data.name}>
      <Trans
        message="Show articles (:count)"
        values={{count: data.articleIds?.length || 0}}
      />
    </CompactBoxLayout>
  );
}
