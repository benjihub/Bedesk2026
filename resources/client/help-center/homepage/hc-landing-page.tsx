import {ArticleGrid} from '@app/help-center/homepage/article-grid';
import {CategoryGrid} from '@app/help-center/homepage/category-grid';
import {ColorfulHeader} from '@app/help-center/homepage/colorful-header';
import {MultiProductArticleGrid} from '@app/help-center/homepage/multi-product-article-grid';
import {SimpleHeader} from '@app/help-center/homepage/simple-header';
import {AuthRoute} from '@common/auth/guards/auth-route';
import {Footer} from '@common/ui/footer/footer';
import {useSettings} from '@ui/settings/use-settings';

export function Component() {
  const {hcLanding} = useSettings();

  return (
    <AuthRoute requireLogin={false} permission="articles.view">
      <div className="isolate">
        {hcLanding?.header?.variant === 'simple' ? (
          <SimpleHeader />
        ) : (
          <ColorfulHeader />
        )}
        <div className="container mx-auto mb-60 px-14 md:px-24">
          <main className="relative z-10 min-h-850">
            <Content />
          </main>
        </div>
        {hcLanding?.show_footer && <Footer className="px-40" />}
      </div>
    </AuthRoute>
  );
}

function Content() {
  const {hcLanding} = useSettings();

  if (hcLanding?.content?.variant === 'categoryGrid') {
    return <CategoryGrid />;
  }

  if (hcLanding?.content?.variant === 'multiProduct') {
    return <MultiProductArticleGrid />;
  }

  return <ArticleGrid />;
}
