import {castObjectValuesToString} from '@ui/utils/objects/cast-object-values-to-string';

export type ArticleSearchParams = {
  perPage?: string;
  query?: string;
  categoryIds?: (number | string)[];
};

export type ValidatedArticleSearchParams = {
  perPage: string;
  query: string;
  categoryIds: string;
};

export const validateArticleSearchParams = (
  search: ArticleSearchParams,
): ValidatedArticleSearchParams => {
  return castObjectValuesToString({
    perPage: search.perPage || '',
    query: search.query || '',
    categoryIds: search.categoryIds?.join(',') || '',
  });
};
