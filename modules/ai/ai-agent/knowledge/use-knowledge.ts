import {AiAgentDocument} from './documents/ai-agent-document';
import {AiAgentSnippet} from './snippets/ai-agent-snippet';
import {AiAgentWebsite} from './websites/requests/ai-agent-website';

interface KnowledgeGroup<T> {
  items: T[];
  ingesting: boolean;
  more: {
    count: number;
    ingesting: boolean;
  };
}

export interface Knowledge {
  ingesting: boolean;
  websites: KnowledgeGroup<AiAgentWebsite>;
  documents: KnowledgeGroup<AiAgentDocument>;
  articles: KnowledgeGroup<{
    id: number;
    title: string;
    scan_pending: boolean;
    updated_at: string;
  }>;
  snippets: KnowledgeGroup<AiAgentSnippet>;
}
