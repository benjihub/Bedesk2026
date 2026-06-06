import {ArticlePageData} from '@app/help-center/articles/article-page/article-page-data';
import {BulletSeparatedItems} from '@common/ui/other/bullet-seprated-items';
import {FormattedBytes} from '@ui/i18n/formatted-bytes';
import {Trans} from '@ui/i18n/trans';
import {AttachFileIcon} from '@ui/icons/material/AttachFile';
import {useSettings} from '@ui/settings/use-settings';

interface Props {
  attachments: ArticlePageData['article']['attachments'];
  articleId: number;
}
export function ArticleAttachments({attachments, articleId}: Props) {
  const {base_url} = useSettings();
  return (
    <div className="space-y-12">
      {attachments?.map(attachment => {
        const downloadLink = `${base_url}/api/v1/hc/articles/${articleId}/download/${attachment.hash}`;
        return (
          <div key={attachment.id} className="flex items-start gap-4">
            <AttachFileIcon className="mt-6" size="sm" />
            <div>
              <a
                href={downloadLink}
                download={attachment.name}
                className="text-sm text-primary hover:underline"
              >
                {attachment.name}
              </a>
              <BulletSeparatedItems className="mt-4 text-xs text-muted">
                <FormattedBytes bytes={attachment.file_size} />
                <a href={downloadLink} download className="hover:underline">
                  <Trans message="Download" />
                </a>
              </BulletSeparatedItems>
            </div>
          </div>
        );
      })}
    </div>
  );
}
