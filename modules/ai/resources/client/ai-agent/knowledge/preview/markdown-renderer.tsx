import markdownIt from 'markdown-it';
import {useMemo} from 'react';

interface Props {
  children?: string;
}
export default function MarkdownRenderer({children}: Props) {
  const html = useMemo(() => {
    if (!children) return '';

    const rendered = markdownIt({breaks: true, linkify: true, html: true}).render(children);

    // Ensure links open in a new tab (widget is rendered inside an iframe,
    // so normal navigation may not work correctly).
    return rendered.replace(
      /<a\s+/g,
      '<a target="_blank" rel="noopener noreferrer" ',
    );
  }, [children]);
  return <div dangerouslySetInnerHTML={{__html: html}} />;
}
