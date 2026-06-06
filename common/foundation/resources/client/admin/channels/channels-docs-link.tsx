import {DocsLink} from '@common/admin/settings/layout/settings-links';
import {SiteConfigContext} from '@common/core/settings/site-config-context';
import {useContext} from 'react';

interface Props {
  className?: string;
  hash?: string;
  variant?: 'link' | 'button';
}
export function ChannelsDocsLink({className, hash, variant}: Props) {
  const {admin} = useContext(SiteConfigContext);
  if (!admin?.channelsDocsLink) return null;
  const link = hash
    ? `${admin.channelsDocsLink}#${hash}`
    : admin.channelsDocsLink;
  return <DocsLink link={link} className={className} variant={variant} />;
}
