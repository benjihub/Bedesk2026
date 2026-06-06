import {LocaleSwitcher} from '@common/locale-switcher/locale-switcher';
import {Trans} from '@ui/i18n/trans';
import {removeFromLocalStorage} from '@ui/utils/hooks/local-storage';
import {Fragment, ReactElement, useEffect} from 'react';
import {CustomMenu} from '../../menus/custom-menu';
import {StaticPageTitle} from '../../seo/static-page-title';
import {Navbar} from '../../ui/navigation/navbar/navbar';

interface CheckoutLayoutProps {
  children: [ReactElement, ReactElement];
}
export function CheckoutLayout({children}: CheckoutLayoutProps) {
  const [left, right] = children;

  useEffect(() => {
    removeFromLocalStorage('be.onboarding.selected');
  }, []);

  return (
    <Fragment>
      <StaticPageTitle>
        <Trans message="Checkout" />
      </StaticPageTitle>
      <Navbar
        color="transparent"
        className="z-10 mb-20 md:mb-0"
        textColor="text-main"
        logoColor="dark"
        darkModeColor="transparent"
        menuPosition="checkout-page-navbar"
      />
      <div className="mx-auto w-full justify-between px-20 md:flex md:max-w-950 md:px-0 md:pt-128">
        <div className="fixed right-0 top-0 hidden h-full w-1/2 bg-alt shadow-[15px_0_30px_0_rgb(0_0_0_/_18%)] md:block" />
        <div className="overflow-hidden md:w-400">
          {left}
          <CustomMenu
            menu="checkout-page-footer"
            className="mt-50 overflow-x-auto text-xs text-muted"
          />
          <div className="mt-40">
            <LocaleSwitcher />
          </div>
        </div>
        <div className="hidden w-384 md:block">
          <div className="relative z-10">{right}</div>
        </div>
      </div>
    </Fragment>
  );
}
