import {useLocation} from 'react-router';

export function useIsAiAgentPreviewMode(): boolean {
  const {pathname} = useLocation();
  return pathname.startsWith('/ai-agent-preview-mode');
}
