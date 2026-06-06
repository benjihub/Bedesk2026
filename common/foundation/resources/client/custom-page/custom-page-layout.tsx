import {CustomPageBody} from '@common/custom-page/custom-page-body';
import {PageMetaTags} from '@common/http/page-meta-tags';
import {PageStatus} from '@common/http/page-status';
import {useEffect} from 'react';
import {useMatches, useParams} from 'react-router';
import {Footer} from '../ui/footer/footer';
import {Navbar} from '../ui/navigation/navbar/navbar';
import {useCustomPage} from './use-custom-page';

interface Props {
  slug?: string | number;
}
export function Component({slug}: Props) {
  const {pageSlug} = useParams();
  let matchesSlug: string;
  useMatches().forEach(match => {
    const slug = (match.handle as {slug: string})?.slug;
    if (slug) {
      matchesSlug = slug;
    }
  });

  const query = useCustomPage(slug || pageSlug || matchesSlug!);

  useEffect(() => {
    if (query.data?.page) {
      window.scrollTo(0, 0);
    }
  }, [query]);

  return (
    <div className="flex min-h-screen flex-col bg">
      <PageMetaTags query={query} />
      <Navbar
        color="bg"
        menuPosition="custom-page-navbar"
        className="sticky top-0 flex-shrink-0"
      />
      <div className="flex-auto">
        {query.data ? (
          <CustomPageBody page={query.data.page} />
        ) : (
          <PageStatus query={query} loaderClassName="mt-80" />
        )}
      </div>
      <Footer className="mx-14 md:mx-40" />
    </div>
  );
}
