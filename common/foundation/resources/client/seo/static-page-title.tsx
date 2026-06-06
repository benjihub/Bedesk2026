import {MessageDescriptor} from '@ui/i18n/message-descriptor';
import {useSettings} from '@ui/settings/use-settings';
import {ReactElement} from 'react';
import {Helmet} from './helmet';

type TitleChild =
  | string
  | null
  | ReactElement<MessageDescriptor>
  | MessageDescriptor;
export type TitleMetaTagChildren = TitleChild | TitleChild[];

interface StaticPageTitleProps {
  children: TitleMetaTagChildren;
}
export function StaticPageTitle({children}: StaticPageTitleProps) {
  const {
    branding: {site_name},
  } = useSettings();
  return (
    <Helmet>
      {children ? (
        <title>
          {children as any} - {site_name}
        </title>
      ) : undefined}
    </Helmet>
  );
}
