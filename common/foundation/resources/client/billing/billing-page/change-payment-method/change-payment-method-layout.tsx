import {useNavigate} from '@common/ui/navigation/use-navigate';
import {Breadcrumb} from '@ui/breadcrumbs/breadcrumb';
import {BreadcrumbItem} from '@ui/breadcrumbs/breadcrumb-item';
import {Trans} from '@ui/i18n/trans';
import {Fragment} from 'react';
import {Outlet} from 'react-router';

const previousUrl = '/billing';

export function Component() {
  const navigate = useNavigate();

  return (
    <Fragment>
      <Breadcrumb>
        <BreadcrumbItem isLink onSelected={() => navigate(previousUrl)}>
          <Trans message="Billing" />
        </BreadcrumbItem>
        <BreadcrumbItem>
          <Trans message="Payment method" />
        </BreadcrumbItem>
      </Breadcrumb>
      <h1 className="my-32 text-3xl font-bold md:my-64">
        <Trans message="Change payment method" />
      </h1>
      <Outlet />
    </Fragment>
  );
}
