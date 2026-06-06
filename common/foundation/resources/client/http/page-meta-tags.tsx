import {BackendResponse} from '@common/http/backend-response/backend-response';
import {DefaultMetaTags} from '@common/seo/default-meta-tags';
import {Helmet} from '@common/seo/helmet';
import {UseQueryResult, UseSuspenseQueryResult} from '@tanstack/react-query';

interface Props {
  query:
    | UseQueryResult<BackendResponse>
    | UseSuspenseQueryResult<BackendResponse>;
}
export function PageMetaTags({query}: Props) {
  if (query.data?.set_seo) {
    return null;
  }
  return query.data?.seo ? (
    <Helmet tags={query.data.seo} />
  ) : (
    <DefaultMetaTags />
  );
}
