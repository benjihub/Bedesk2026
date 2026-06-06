import {PreviewSidebar} from '@ai/ai-agent/preview/preview-sidebar';
import {Trans} from '@common/ui/library/i18n/trans';
import {useSuspenseQuery} from '@tanstack/react-query';
import {Fragment, useState} from 'react';
import {AiAgentPageHeader} from '../ai-agent-page-header';
import {aiAgentQueries} from '../ai-agent-queries';
import {ArticlesKnowledgeSection} from './articles/articles-knowledge-section';
import {DocumentsKnowledgeSection} from './documents/documents-knowledge-section';
import {SnippetsKnowledgeSection} from './snippets/snippets-knowledge-section';
import {WebsitesKnowledgeSection} from './websites/websites-knowledge-section';

export function Component() {
  const {data} = useSuspenseQuery(aiAgentQueries.knowledge.index());
  const [previewVisible, setPreviewVisible] = useState(false);
  return (
    <Fragment>
      <div className="dashboard-grid-content dashboard-rounded-panel flex h-full flex-col">
        <AiAgentPageHeader
          previewVisible={previewVisible}
          onTogglePreview={() => setPreviewVisible(!previewVisible)}
        />
        <div className="flex-auto overflow-y-auto p-24">
          {data.ingesting && (
            <div className="mb-24 rounded-panel bg-[#feecaf] p-12 text-center text-sm font-medium dark:text-on-primary">
              <Trans message="Your content is currently being ingested. You will be notified once the ingestion is complete. In the meantime, AI agent may not have your latest content." />
            </div>
          )}
          <div className="space-y-24">
            <WebsitesKnowledgeSection />
            <ArticlesKnowledgeSection />
            <DocumentsKnowledgeSection />
            <SnippetsKnowledgeSection />
          </div>
        </div>
      </div>
      {previewVisible && (
        <PreviewSidebar onClose={() => setPreviewVisible(false)} />
      )}
    </Fragment>
  );
}
