import {Helmet} from './helmet';
import {useBootstrapDataStore} from '@ui/bootstrap-data/bootstrap-data-store';

export function DefaultMetaTags() {
  const {default_meta_tags} = useBootstrapDataStore(s => s.data);
  return <Helmet tags={default_meta_tags} />;
}
