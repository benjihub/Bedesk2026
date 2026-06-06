import {CaptchaContainer} from '@common/captcha/captcha-container';
import {Footer} from '@common/ui/footer/footer';
import {Navbar} from '@common/ui/navigation/navbar/navbar';
import {Button} from '@ui/buttons/button';
import {Form} from '@ui/forms/form';
import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {toast} from '@ui/toast/toast';
import {useForm} from 'react-hook-form';
import {useCaptcha} from '../captcha/use-captcha';
import {StaticPageTitle} from '../seo/static-page-title';
import {
  ContactPagePayload,
  useSubmitContactForm,
} from './use-submit-contact-form';

export function Component() {
  const form = useForm<ContactPagePayload>();
  const submitForm = useSubmitContactForm(form);
  const {captchaToken, captchaEnabled, resetCaptcha} = useCaptcha('contact');

  return (
    <div className="flex min-h-screen flex-col bg">
      <StaticPageTitle>
        <Trans message="Contact us" />
      </StaticPageTitle>
      <Navbar
        color="bg"
        className="sticky top-0 flex-shrink-0"
        menuPosition="contact-us-page"
      />
      <div className="container mx-auto flex flex-auto items-center justify-center p-24 md:p-40">
        <div className="max-w-620 rounded-panel border bg-elevated p-24 shadow-sm">
          <h1 className="text-2xl">
            <Trans message="Contact us" />
          </h1>
          <p className="mb-30 mt-4 text-sm">
            <Trans message="Please use the form below to send us a message and we'll get back to you as soon as possible." />
          </p>
          <Form
            form={form}
            onSubmit={async value => {
              if (captchaEnabled && !captchaToken) {
                toast.danger(message('Please solve the captcha challenge.'));
                return;
              }
              submitForm.mutate(
                {
                  ...value,
                  captcha_token: captchaToken,
                },
                {onError: () => resetCaptcha()},
              );
            }}
          >
            <FormTextField
              label={<Trans message="Name" />}
              name="name"
              required
              className="mb-20"
            />
            <FormTextField
              label={<Trans message="Email" />}
              name="email"
              required
              type="email"
              className="mb-20"
            />
            <FormTextField
              label={<Trans message="Message" />}
              name="message"
              required
              inputElementType="textarea"
              className="mb-20"
              rows={8}
            />
            {captchaEnabled && <CaptchaContainer className="mb-20" />}
            <Button
              type="submit"
              variant="flat"
              color="primary"
              disabled={submitForm.isPending}
            >
              <Trans message="Send" />
            </Button>
          </Form>
        </div>
      </div>
      <Footer className="container mx-auto flex-shrink-0 px-24" />
    </div>
  );
}
