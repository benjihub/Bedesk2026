import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {useQuery, UseQueryResult} from '@tanstack/react-query';
import {Button} from '@ui/buttons/button';
import {ButtonGroup} from '@ui/buttons/button-group';
import {Trans} from '@ui/i18n/trans';
import {ErrorIcon} from '@ui/icons/material/Error';
import {IllustratedMessage} from '@ui/images/illustrated-message';
import {Dialog} from '@ui/overlays/dialog/dialog';
import {DialogBody} from '@ui/overlays/dialog/dialog-body';
import {DialogHeader} from '@ui/overlays/dialog/dialog-header';
import {FullPageLoader} from '@ui/progress/full-page-loader';
import {useSettings} from '@ui/settings/use-settings';
import {ReactElement, useState} from 'react';

type ActiveTab = 'html' | 'plain' | 'headers';

export interface OriginalReplyEmailResponse {
  email: {
    headers: Record<string, string>;
    body: {
      html: string;
      plain: string;
    };
  };
}

interface Props {
  replyId: number;
}
export function OriginalEmailPreviewDialog({replyId}: Props) {
  const {base_url} = useSettings();
  const [activeTab, setActiveTab] = useState<ActiveTab>('html');

  const query = useQuery(
    helpdeskQueries.conversations.originalReplyEmail(replyId),
  );

  return (
    <Dialog size="fullscreen" className="h-dialog">
      <DialogHeader
        showDivider
        padding="px-24 py-12"
        titleFontWeight="font-normal"
        titleTextSize="text-base"
        justify="justify-start"
        actions={
          <div>
            <ButtonGroup
              variant="outline"
              radius="rounded-md"
              size="xs"
              value={activeTab}
              onChange={setActiveTab}
            >
              <Button value="html">
                <Trans message="HTML" />
              </Button>
              <Button value="plain">
                <Trans message="Plain" />
              </Button>
              <Button value="headers">
                <Trans message="Headers" />
              </Button>
            </ButtonGroup>
            <Button
              className="ml-34"
              variant="outline"
              size="xs"
              elementType="a"
              download
              href={`${base_url}/api/v1/helpdesk/agent/messages/${replyId}/email/download`}
            >
              <Trans message="Download" />
            </Button>
          </div>
        }
      >
        <Trans message="Original email" />
      </DialogHeader>
      <DialogBody>
        {query.data?.email ? (
          <Content data={query.data} activeTab={activeTab} />
        ) : (
          <Status query={query} />
        )}
      </DialogBody>
    </Dialog>
  );
}

interface ContentProps {
  data: OriginalReplyEmailResponse;
  activeTab: ActiveTab;
}
function Content({data, activeTab}: ContentProps) {
  if (activeTab === 'html') {
    if (!data.email.body.html) {
      return (
        <NoContentMessage>
          <Trans message="Email does not contain HTML content" />
        </NoContentMessage>
      );
    }
    return <div dangerouslySetInnerHTML={{__html: data.email.body.html}} />;
  } else if (activeTab === 'plain') {
    if (!data.email.body.plain) {
      return (
        <NoContentMessage>
          <Trans message="Email does not contain plain text content" />
        </NoContentMessage>
      );
    }
    return (
      <pre className="whitespace-pre-wrap break-words">
        {data.email.body.plain}
      </pre>
    );
  } else {
    return (
      <table>
        <tbody>
          {Object.entries(data.email.headers).map(([key, value]) => (
            <tr key={key}>
              <th className="whitespace-nowrap border px-20 py-10 text-left">
                {key}
              </th>
              <td className="whitespace-nowrap border px-20 py-10 text-left">
                {value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
}

interface StatusProps {
  query: UseQueryResult;
}
export function Status({query}: StatusProps) {
  if (query.isLoading) {
    return <FullPageLoader className="absolute inset-0 m-auto" />;
  }

  return (
    <NoContentMessage>
      <Trans message="Original email for this reply does not exist" />
    </NoContentMessage>
  );
}

type NoContentMessageProps = {
  children: ReactElement;
};
function NoContentMessage({children}: NoContentMessageProps) {
  return (
    <IllustratedMessage
      className="mt-40"
      image={
        <div>
          <ErrorIcon size="xl" />
        </div>
      }
      imageHeight="h-auto"
      title={children}
    />
  );
}
