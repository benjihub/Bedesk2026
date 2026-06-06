import {ConversationCategoryAttribute} from '@app/attributes/compact-attribute';
import {FullConversationResponse} from '@app/dashboard/conversation';
import {EnvatoPurchaseList} from '@envato/envato-purchase-list/envato-purchase-list';
import {PersonIcon} from '@ui/icons/material/Person';
import {PublicIcon} from '@ui/icons/material/Public';
import {SvgIconProps} from '@ui/icons/svg-icon';
import {cloneElement, Fragment, ReactElement, ReactNode, useMemo} from 'react';

interface Props {
  data: FullConversationResponse;
}
export function ConversationPagePurchaseList({data}: Props) {
  const categoryAttribute = data.attributes.find(
    attribute => attribute.key === 'category',
  ) as ConversationCategoryAttribute | undefined;
  const currentPurchase = useMemo(() => {
    return (
      data.envatoPurchaseCodes.find(code =>
        categoryAttribute?.config?.options?.find(option =>
          option.envatoItems?.includes(code.item_id),
        ),
      ) || data.envatoPurchaseCodes[0]
    );
  }, [data, categoryAttribute?.config?.options]);

  return (
    <Fragment>
      {currentPurchase && (
        <LinkItem
          href={`https://codecanyon.net/user/${currentPurchase.envato_username}`}
          icon={<PersonIcon />}
        >
          {currentPurchase.envato_username}
        </LinkItem>
      )}
      {currentPurchase.domain && (
        <LinkItem href={currentPurchase.domain} icon={<PublicIcon />}>
          {currentPurchase.domain}
        </LinkItem>
      )}
      <EnvatoPurchaseList
        userId={data.user.id}
        initialData={data.envatoPurchaseCodes}
        selectedPurchaseId={currentPurchase?.id}
      />
    </Fragment>
  );
}

type LinkItemProps = {
  href: string;
  children: ReactNode;
  icon: ReactElement<SvgIconProps>;
};
function LinkItem({href, children, icon}: LinkItemProps) {
  return (
    <div className="mb-8 flex items-center gap-4 text-sm">
      {cloneElement(icon, {size: 'sm'})}
      <a
        href={href.includes('http') ? href : `https://${href}`}
        target="_blank"
        rel="noreferrer"
        className="hover:underline"
      >
        {children}
      </a>
    </div>
  );
}
