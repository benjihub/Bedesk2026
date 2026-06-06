import markdownIt from 'markdown-it';
import {useMemo} from 'react';

interface Props {
  children?: string;
}
export default function MarkdownRenderer({children}: Props) {
  const html = useMemo(() => {
    if (!children) return '';
    return markdownIt().render(children);
  }, [children]);
  return <div dangerouslySetInnerHTML={{__html: html}} />;
}
