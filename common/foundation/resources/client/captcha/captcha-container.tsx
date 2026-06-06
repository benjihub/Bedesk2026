import {getInputFieldClassNames} from '@ui/forms/input-field/get-input-field-class-names';
import {Trans} from '@ui/i18n/trans';

interface CaptchaContainerProps {
  className?: string;
}
export function CaptchaContainer({className}: CaptchaContainerProps) {
  const {label} = getInputFieldClassNames();
  return (
    <div className={className}>
      <div className={label}>
        <Trans message="Let us know you're human" />
      </div>
      <div id="captcha-container" className="h-[65px] w-[300px]" />
    </div>
  );
}
