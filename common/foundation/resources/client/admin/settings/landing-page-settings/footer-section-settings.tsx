import {LinkStyle} from '@ui/buttons/external-link';
import {Trans} from '@ui/i18n/trans';
import {Link} from 'react-router';

type Props = {
  index: number;
};
export function FooterSectionSettings({index}: Props) {
  return (
    <div className="text-sm">
      <Trans
        message="Configure footer content from <a>Menu manager</a>."
        values={{
          a: text => (
            <Link
              className={LinkStyle}
              to="/admin/settings/menus"
              target="_blank"
            >
              {text}
            </Link>
          ),
        }}
      />
    </div>
  );
}
