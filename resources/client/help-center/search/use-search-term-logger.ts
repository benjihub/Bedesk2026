import {getBootstrapData} from '@ui/bootstrap-data/bootstrap-data-store';
import {useCallback} from 'react';

export interface SearchSessionItem {
  term: string;
  results: number[];
  clickedArticle?: boolean;
  createdTicket?: boolean;
  categoryId?: number;
  date?: string;
}

interface LogTermData {
  term: string;
  results: {id: number}[];
  categoryId?: number;
}

let searchSession: SearchSessionItem[] = [];

let isInitialized = false;
export function initSearchTermLogger() {
  if (isInitialized) return;
  document.addEventListener('visibilitychange', () => {
    if (
      document.visibilityState === 'hidden' &&
      searchSession.length &&
      navigator.sendBeacon
    ) {
      const {base_url} = getBootstrapData().settings;
      navigator.sendBeacon(
        `${base_url}/search-term?_token=${getBootstrapData().csrf_token}`,
        JSON.stringify({
          searchSession: searchSession,
        }),
      );
      searchSession = [];
    }
  });
  isInitialized = true;
}

export function useSearchTermLogger() {
  const log = useCallback(({term, results, categoryId}: LogTermData) => {
    term = term?.trim();
    if (!term || term.length < 4) {
      return;
    }
    searchSession.push({
      term,
      results: results.map(r => r.id),
      clickedArticle: false,
      createdTicket: false,
      categoryId,
    });
  }, []);

  const updateLastSearch = useCallback((data: Partial<SearchSessionItem>) => {
    const lastItem = searchSession.at(-1);
    if (lastItem) {
      searchSession.push({...lastItem, ...data});
    }
  }, []);

  return {
    log,
    updateLastSearch,
  };
}
