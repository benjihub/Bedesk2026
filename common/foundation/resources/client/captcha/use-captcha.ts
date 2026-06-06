import {useSettingsPreviewMode} from '@common/admin/settings/preview/use-settings-preview-mode';
import {CaptchaAction} from '@common/core/settings/base-backend-settings';
import {getBootstrapData} from '@ui/bootstrap-data/bootstrap-data-store';
import {useSettings} from '@ui/settings/use-settings';
import lazyLoader from '@ui/utils/loaders/lazy-loader';
import {useCallback, useEffect, useRef, useState} from 'react';

export function useCaptcha(action: CaptchaAction, disabled = false) {
  const {isInsideSettingsPreview} = useSettingsPreviewMode();
  const alreadyRendered = useRef(false);
  const settings = useSettings();
  const provider =
    settings.captcha?.provider === 'turnstile' ? 'turnstile' : 'recaptcha';
  const siteKey =
    provider === 'recaptcha'
      ? settings.captcha?.g_site_key
      : settings.captcha?.t_site_key;
  const captchaEnabled = !!(
    !isInsideSettingsPreview &&
    siteKey &&
    settings.captcha?.enable?.[action] &&
    !disabled
  );

  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (captchaEnabled && !cancelled && !alreadyRendered.current) {
      if (cancelled || alreadyRendered.current) return;

      const renderCaptcha = () => {
        if (provider === 'recaptcha') {
          window.grecaptcha.render('captcha-container', {
            sitekey: siteKey,
            action,
            callback: function (token: string) {
              setCaptchaToken(token);
            },
          });
        } else {
          turnstile.render('#captcha-container', {
            sitekey: siteKey,
            action,
            callback: function (token: string) {
              setCaptchaToken(token);
            },
          });
        }
      };

      if (window.turnstile || window.grecaptcha) {
        setTimeout(() => renderCaptcha());
      } else {
        window.captchaOnloadCallback = function () {
          renderCaptcha();
        };
      }

      loadCaptchaScript();

      alreadyRendered.current = true;
    }

    return () => {
      cancelled = true;
      if (window.turnstile) {
        window.turnstile?.remove('#captcha-container');
      }
    };
  }, [captchaEnabled, siteKey]);

  const resetCaptcha = useCallback(() => {
    if (!siteKey || !captchaEnabled) return;
    if (provider === 'turnstile') {
      window.turnstile?.reset('#captcha-container');
    } else {
      window.grecaptcha?.reset();
    }
  }, [siteKey, captchaEnabled, provider]);

  return {captchaToken, captchaEnabled, resetCaptcha};
}

function loadCaptchaScript() {
  if (getBootstrapData().settings.captcha?.provider === 'turnstile') {
    return lazyLoader.loadAsset(
      `https://challenges.cloudflare.com/turnstile/v0/api.js?onload=captchaOnloadCallback&render=explicit`,
      {id: 'turnstile-js'},
    );
  }
  return lazyLoader.loadAsset(
    `https://www.google.com/recaptcha/api.js?onload=captchaOnloadCallback&render=explicit`,
    {id: 'recaptcha-js'},
  );
}
