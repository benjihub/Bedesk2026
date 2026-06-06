import {MessageDescriptor} from '@ui/i18n/message-descriptor';
import {useState} from 'react';
import {useMatches} from 'react-router';

export interface UrlBackedTabConfig {
  uri: string;
  label: MessageDescriptor;
}

export function useUrlBackedTabs(config: UrlBackedTabConfig[]) {
  const matches = useMatches();
  return useState(() => {
    const index = config.findIndex(tab =>
      matches.some(match => match.pathname.endsWith(tab.uri)),
    );
    return index === -1 ? 0 : index;
  });
}
