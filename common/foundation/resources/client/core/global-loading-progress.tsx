import {UseQueryResult} from '@tanstack/react-query';
import {TopProgressBar} from '@ui/progress/top-progress-bar';
import {useEffect, useState} from 'react';

interface Props {
  query: UseQueryResult<unknown>;
}
export function GlobalLoadingProgress({query}: Props) {
  const [bar] = useState(() => new TopProgressBar());
  const isLoading = query.isFetching;

  useEffect(() => {
    if (isLoading) {
      bar.show();
    } else {
      bar.hide();
    }
    return () => {
      if (!isLoading) {
        bar.hide();
      }
    };
  }, [isLoading, bar]);

  return null;
}
