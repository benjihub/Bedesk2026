import {Group} from '@app/dashboard/groups/group';
import {
  UpdateGroupSettingsPayload,
  useUpdateGroupSettings,
} from '@app/dashboard/groups/settings/requests/use-update-group-settings';
import {useUpdateGroupAiAgentSettings} from '@app/dashboard/groups/settings/requests/use-update-group-ai-agent-settings';
import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {useQuery} from '@tanstack/react-query';
import {Button} from '@ui/buttons/button';
import {Form} from '@ui/forms/form';
import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {FormSwitch} from '@ui/forms/toggle/switch';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {toast} from '@ui/toast/toast';
import {useEffect} from 'react';
import {useForm} from 'react-hook-form';
import {useOutletContext} from 'react-router';

function toSecondsString(windowMs: unknown): string {
  const ms = typeof windowMs === 'number' ? windowMs : null;
  if (!ms || !Number.isFinite(ms)) return '';
  return String(Math.round(ms / 1000));
}

function deepClone<T>(value: T): T {
  try {
    return structuredClone(value);
  } catch {
    return JSON.parse(JSON.stringify(value));
  }
}

function ensureObject<T extends Record<string, any>>(value: unknown): T {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as T;
  }
  return {} as T;
}

function setNested(obj: Record<string, any>, path: string[], value: any) {
  let current: any = obj;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    if (!current[key] || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }
  current[path[path.length - 1]] = value;
}

function deleteNested(obj: Record<string, any>, path: string[]) {
  let current: any = obj;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    if (!current[key] || typeof current[key] !== 'object') {
      return;
    }
    current = current[key];
  }
  delete current[path[path.length - 1]];
}

export function Component() {
  const group = useOutletContext() as Group;
  const settingsQuery = useQuery(helpdeskQueries.groupSettings.get(group.id));
  const aiQuery = useQuery(helpdeskQueries.groupAiAgentSettings.get(group.id));

  const baseUrl = window.location.origin;
  const publicLinkToken = settingsQuery.data?.public_link_token;
  const livechatPublicUrl = publicLinkToken
    ? `${baseUrl}/lc/${publicLinkToken}`
    : null;

  const settingsForm = useForm<UpdateGroupSettingsPayload>({
    defaultValues: {
      settings: {
        brandName: '',
        welcomeMessage: '',
        weeklyRebateDay: '',
        weeklyRebateTime: '',
        minDeposit: null,
        maxDeposit: null,
        minWithdrawal: null,
        maxWithdrawal: null,
        banks: '',
        ewallets: '',
        qris: false,
        humanSupportPingRepeatMaxSeconds: null,
      },
    },
  });

  const rtpForm = useForm<UpdateGroupSettingsPayload>({
    defaultValues: {
      settings: {
        websiteLink: '',
        rtpLink: '',
      },
    },
  });

  const delayForm = useForm<{delaySeconds: string}>({
    defaultValues: {
      delaySeconds: '',
    },
  });

  const templatesForm = useForm<{
    depositProblemTemplate: string;
    withdrawProblemTemplate: string;
    turnoverProblemTemplate: string;
    passwordResetProblemTemplate: string;
    claimProblemTemplate?: string;
    qrisProblemTemplate?: string;
    rtpReplyTemplates?: string;
    waitMessage?: string;
    // deposit flow templates
    depositAskUsername?: string;
    depositAskProof?: string;
    depositProofMissing?: string;
    depositChecking?: string;
    depositDoneResolved?: string;
    depositDoneUnresolved?: string;
  }>({
    defaultValues: {
      depositProblemTemplate: '',
      withdrawProblemTemplate: '',
      turnoverProblemTemplate: '',
      passwordResetProblemTemplate: '',
      claimProblemTemplate: '',
      qrisProblemTemplate: '',
      rtpReplyTemplates: '',
      waitMessage: '',
      depositAskUsername: '',
      depositAskProof: '',
      depositProofMissing: '',
      depositChecking: '',
      depositDoneResolved: '',
      depositDoneUnresolved: '',
    },
  });

  useEffect(() => {
    const s = settingsQuery.data?.settings ?? {};
    settingsForm.reset({
      settings: {
        brandName: typeof (s as any).brandName === 'string' ? ((s as any).brandName as string) : '',
        welcomeMessage:
          typeof (s as any).welcomeMessage === 'string'
            ? ((s as any).welcomeMessage as string)
            : '',
        weeklyRebateDay:
          typeof (s as any).weeklyRebateDay === 'string'
            ? ((s as any).weeklyRebateDay as string)
            : '',
        weeklyRebateTime:
          typeof (s as any).weeklyRebateTime === 'string'
            ? ((s as any).weeklyRebateTime as string)
            : '',
        minDeposit: typeof (s as any).minDeposit === 'number' ? ((s as any).minDeposit as number) : null,
        maxDeposit: typeof (s as any).maxDeposit === 'number' ? ((s as any).maxDeposit as number) : null,
        minWithdrawal:
          typeof (s as any).minWithdrawal === 'number' ? ((s as any).minWithdrawal as number) : null,
        maxWithdrawal:
          typeof (s as any).maxWithdrawal === 'number' ? ((s as any).maxWithdrawal as number) : null,
        banks: typeof (s as any).banks === 'string' ? ((s as any).banks as string) : '',
        ewallets:
          typeof (s as any).ewallets === 'string' ? ((s as any).ewallets as string) : '',
        qris: typeof (s as any).qris === 'boolean' ? ((s as any).qris as boolean) : false,
        humanSupportPingRepeatMaxSeconds:
          typeof (s as any).humanSupportPingRepeatMaxSeconds === 'number'
            ? ((s as any).humanSupportPingRepeatMaxSeconds as number)
            : null,
      },
    });

    rtpForm.reset({
      settings: {
        websiteLink:
          typeof (s as any).websiteLink === 'string'
            ? ((s as any).websiteLink as string)
            : '',
        rtpLink: typeof (s as any).rtpLink === 'string' ? ((s as any).rtpLink as string) : '',
      },
    });
  }, [settingsQuery.data, settingsForm, rtpForm]);

  useEffect(() => {
    const windowMs = (aiQuery.data?.effective as any)?.aggregator?.windowMs;
    delayForm.reset({delaySeconds: toSecondsString(windowMs)});
  }, [aiQuery.data, delayForm]);

  useEffect(() => {
    const overridesRaw = aiQuery.data?.overrides ?? {};
    const overrides = ensureObject(overridesRaw) as Record<string, any>;
    const templates = (overrides?.userIdRequestTemplates ?? {}) as Record<
      string,
      any
    >;
    templatesForm.reset({
      depositProblemTemplate:
        typeof templates.deposit === 'string' ? (templates.deposit as string) : '',
      withdrawProblemTemplate:
        typeof templates.withdraw === 'string'
          ? (templates.withdraw as string)
          : '',
      turnoverProblemTemplate:
        typeof templates.turnover === 'string'
          ? (templates.turnover as string)
          : '',
      passwordResetProblemTemplate:
        typeof templates.password_reset === 'string'
          ? (templates.password_reset as string)
          : '',
      claimProblemTemplate:
        typeof templates.claim === 'string' ? (templates.claim as string) : '',
      qrisProblemTemplate:
        typeof templates.qris === 'string' ? (templates.qris as string) : '',
      // deposit flow overrides
      depositAskUsername:
        typeof (overrides as any)?.depositFlow?.askUsername === 'string'
          ? ((overrides as any).depositFlow.askUsername as string)
          : '',
      depositAskProof:
        typeof (overrides as any)?.depositFlow?.askProof === 'string'
          ? ((overrides as any).depositFlow.askProof as string)
          : '',
      depositProofMissing:
        typeof (overrides as any)?.depositFlow?.proofMissing === 'string'
          ? ((overrides as any).depositFlow.proofMissing as string)
          : '',
      depositChecking:
        typeof (overrides as any)?.depositFlow?.checking === 'string'
          ? ((overrides as any).depositFlow.checking as string)
          : '',
      depositDoneResolved:
        typeof (overrides as any)?.depositFlow?.doneResolved === 'string'
          ? ((overrides as any).depositFlow.doneResolved as string)
          : '',
      depositDoneUnresolved:
        typeof (overrides as any)?.depositFlow?.doneUnresolved === 'string'
          ? ((overrides as any).depositFlow.doneUnresolved as string)
          : '',
      rtpReplyTemplates: Array.isArray((overrides as any).rtpReplyTemplates)
          ? ((overrides as any).rtpReplyTemplates as string[]).join('\n')
          : '',
    });
  }, [aiQuery.data, templatesForm]);

  const settingsMutation = useUpdateGroupSettings(group.id, settingsForm);
  const rtpMutation = useUpdateGroupSettings(group.id, rtpForm);

  // We only use this mutation for Response Delay updates.
  // (UI is in Settings tab in newtest4.html)
  const delayPayloadForm = useForm<{overrides: Record<string, unknown>}>({
    defaultValues: {
      overrides: {},
    },
  });

  const aiMutation = useUpdateGroupAiAgentSettings(
    group.id,
    delayPayloadForm as any,
  );

  const templatesPayloadForm = useForm<{overrides: Record<string, unknown>}>({
    defaultValues: {
      overrides: {},
    },
  });
  const templatesMutation = useUpdateGroupAiAgentSettings(
    group.id,
    templatesPayloadForm as any,
  );

  return (
    <div className="container mx-auto px-24">
      <div className="mb-24">
        <div className="text-xl font-semibold">
          <Trans message="Settings" />
        </div>
        <div className="text-sm text-muted">
          <Trans message="Edit group-specific site settings." />
        </div>
      </div>

      <div className="rounded border p-24">
        <div className="text-lg font-semibold">
          <Trans message="Edit Site Settings" />
        </div>

        {livechatPublicUrl && (
          <div className="mt-16 rounded border bg-alt p-16 text-sm">
            <div className="mb-8 font-semibold">
              <Trans message="Dedicated livechat link for this group" />
            </div>
            <div className="flex flex-col gap-8 @md:flex-row @md:items-center @md:gap-12">
              <div className="flex-1 break-all text-xs text-muted">
                {livechatPublicUrl}
              </div>
              <Button
                size="xs"
                variant="outline"
                type="button"
                onClick={() => {
                  if (!livechatPublicUrl) return;
                  navigator.clipboard
                    .writeText(livechatPublicUrl)
                    .then(() => toast(message('Link copied to clipboard')))
                    .catch(() => toast(message('Could not copy link')));
                }}
              >
                <Trans message="Copy link" />
              </Button>
            </div>
          </div>
        )}

        <div className="mt-24">
          <Form
            form={settingsForm}
            onSubmit={values => {
              settingsMutation.mutate(values, {
                onSuccess: () => toast(message('Settings saved')),
              });
            }}
          >
            <div className="grid grid-cols-1 gap-24">
              <FormTextField
                name="settings.brandName"
                label={<Trans message="Brand/Site Name" />}
                required
              />

              <FormTextField
                name="settings.welcomeMessage"
                label={<Trans message="Welcome Message" />}
                inputElementType="textarea"
                rows={2}
                required
              />

              <div className="border-t pt-24">
                <div className="text-base font-semibold">
                  <Trans message="Weekly rebate" />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-24 md:grid-cols-2">
                <FormTextField
                  name="settings.weeklyRebateDay"
                  label={<Trans message="Weekly rebate day" />}
                  placeholder="e.g., Tuesday"
                  description={<Trans message="Day when weekly rebate is distributed." />}
                />
                <FormTextField
                  name="settings.weeklyRebateTime"
                  label={<Trans message="Weekly rebate time" />}
                  placeholder="e.g., 12:00 PM"
                  description={<Trans message="Time when weekly rebate is distributed." />}
                />
              </div>

              <div className="border-t pt-24">
                <div className="text-base font-semibold">
                  <Trans message="Deposit & Withdrawal Limits" />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-24 md:grid-cols-2">
                <FormTextField
                  name="settings.minDeposit"
                  label={<Trans message="Minimum Deposit" />}
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="e.g., 50000"
                  description={
                    <Trans message="Minimum amount for deposits (in rupiah)" />
                  }
                />
                <FormTextField
                  name="settings.maxDeposit"
                  label={<Trans message="Maximum Deposit" />}
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="e.g., 50000000"
                  description={
                    <Trans message="Maximum amount for deposits (in rupiah)" />
                  }
                />
                <FormTextField
                  name="settings.minWithdrawal"
                  label={<Trans message="Minimum Withdrawal" />}
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="e.g., 100000"
                  description={
                    <Trans message="Minimum amount for withdrawals (in rupiah)" />
                  }
                />
                <FormTextField
                  name="settings.maxWithdrawal"
                  label={<Trans message="Maximum Withdrawal" />}
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="e.g., 100000000"
                  description={
                    <Trans message="Maximum amount for withdrawals (in rupiah)" />
                  }
                />
              </div>

              <div className="border-t pt-24">
                <div className="text-base font-semibold">
                  <Trans message="Payment Methods (per group)" />
                </div>
              </div>

              <FormTextField
                name="settings.banks"
                label={<Trans message="Banks (one per line)" />}
                inputElementType="textarea"
                rows={4}
                placeholder={'BCA\nMandiri\nBNI\nBRI'}
                description={
                  <Trans message="List banks accepted for deposits/withdrawals. One bank per line." />
                }
              />

              <FormTextField
                name="settings.ewallets"
                label={<Trans message="E-Wallets (one per line)" />}
                inputElementType="textarea"
                rows={3}
                placeholder={'Gopay\nDana\nOVO'}
                description={
                  <Trans message="List e-wallet providers (one per line)." />
                }
              />

              <FormSwitch name="settings.qris">
                <Trans message="Enable QRIS" />
              </FormSwitch>

              <div className="border-t pt-24">
                <div className="text-base font-semibold">
                  <Trans message="Human support ping" />
                </div>
                <div className="mt-6 text-sm text-muted">
                  <Trans message="When a conversation is queued or transferred to human support, a ping will repeat until the conversation is opened (or until this duration expires)." />
                </div>
              </div>

              <FormTextField
                name="settings.humanSupportPingRepeatMaxSeconds"
                label={<Trans message="Repeat duration (seconds)" />}
                type="number"
                min="0"
                step="1"
                placeholder="60"
                description={
                  <Trans message="0 = keep pinging until opened. Empty = default (60s)." />
                }
              />
            </div>

            <div className="mt-24 flex items-center justify-end gap-12">
              <Button
                type="submit"
                variant="flat"
                color="primary"
                disabled={settingsMutation.isPending}
              >
                <Trans message="Save Settings" />
              </Button>
            </div>
          </Form>
        </div>

        <div className="mt-24 border-t pt-24">
          <div className="text-base font-semibold">
            <Trans message="Response Delay" />
          </div>
          <div className="mt-6 text-sm text-muted">
            <Trans message="Adjust how long the AI waits before processing a reply. Value is in seconds and must be between 1 and 10 seconds." />
          </div>

          <div className="mt-12">
            <Form
              form={delayForm}
              onSubmit={({delaySeconds}) => {
                const raw = (delaySeconds ?? '').trim();
                const currentOverrides = ensureObject(aiQuery.data?.overrides ?? {});
                const nextOverrides = deepClone(currentOverrides || {});

                if (raw === '') {
                  deleteNested(nextOverrides, ['aggregator', 'windowMs']);
                } else {
                  const seconds = Number(raw);
                  if (!Number.isFinite(seconds) || seconds < 1 || seconds > 10) {
                    toast(message('Delay must be between 1 and 10 seconds'));
                    return;
                  }
                  setNested(
                    nextOverrides,
                    ['aggregator', 'windowMs'],
                    Math.round(seconds * 1000),
                  );
                }

                aiMutation.mutate(
                  {overrides: nextOverrides},
                  {
                    onSuccess: () => toast(message('Response delay saved')),
                  },
                );
              }}
            >
              <div className="flex flex-col gap-12 md:flex-row md:items-end">
                <FormTextField
                  name="delaySeconds"
                  label={<Trans message="Delay Time (second)" />}
                  type="number"
                  min="1"
                  max="10"
                  step="1"
                  placeholder="3"
                />

                <Button
                  type="button"
                  variant="outline"
                  onClick={async () => {
                    const r = await aiQuery.refetch();
                    const windowMs = (r.data?.effective as any)?.aggregator
                      ?.windowMs;
                    delayForm.setValue('delaySeconds', toSecondsString(windowMs));
                    toast(message('Loaded current'));
                  }}
                >
                  <Trans message="Load current" />
                </Button>
                <Button
                  type="submit"
                  variant="flat"
                  color="primary"
                  disabled={aiMutation.isPending}
                >
                  <Trans message="Save" />
                </Button>
              </div>
            </Form>
          </div>
        </div>

        <div className="mt-24 border-t pt-24">
          <div className="text-base font-semibold">
            <Trans message="Problem reply templates" />
          </div>
          <div className="mt-6 text-sm text-muted">
            <Trans message="Customize what the assistant asks when users report deposit/withdraw/turnover/password reset problems. Leave empty to inherit defaults." />
          </div>

          <div className="mt-12">
            <Form
              form={templatesForm}
              onSubmit={values => {
                const currentOverrides = ensureObject(aiQuery.data?.overrides ?? {});
                const nextOverrides = deepClone(currentOverrides || {});

                const templates: Record<string, any> =
                  (nextOverrides.userIdRequestTemplates as any) ?? {};

                const setOrDelete = (
                  key: string,
                  value: string | undefined,
                ) => {
                  const v = (value ?? '').trim();
                  if (v === '') {
                    delete templates[key];
                  } else {
                    templates[key] = v;
                  }
                };

                setOrDelete('deposit', values.depositProblemTemplate);
                setOrDelete('withdraw', values.withdrawProblemTemplate);
                setOrDelete('turnover', values.turnoverProblemTemplate);
                setOrDelete('claim', (values as any).claimProblemTemplate);
                setOrDelete('qris', (values as any).qrisProblemTemplate);
                setOrDelete(
                  'password_reset',
                  values.passwordResetProblemTemplate,
                );

                // depositFlow templates
                const setDeep = (key: string, val?: string) => {
                  const v = (val ?? '').trim();
                  if (v === '') {
                    deleteNested(nextOverrides, ['depositFlow', key]);
                  } else {
                    setNested(nextOverrides, ['depositFlow', key], v);
                  }
                };
                setDeep('askUsername', (values as any).depositAskUsername);
                setDeep('askProof', (values as any).depositAskProof);
                setDeep('proofMissing', (values as any).depositProofMissing);
                setDeep('checking', (values as any).depositChecking);
                setDeep('doneResolved', (values as any).depositDoneResolved);
                setDeep('doneUnresolved', (values as any).depositDoneUnresolved);

                // Wait message override
                const waitRaw = (values as any).waitMessage ?? '';
                if ((waitRaw ?? '').trim() === '') {
                  deleteNested(nextOverrides, ['waitMessage']);
                } else {
                  setNested(nextOverrides, ['waitMessage'], waitRaw.trim());
                }

                // RTP reply templates (one per line). Store as array in overrides.rtpReplyTemplates
                const rtpRaw = (values as any).rtpReplyTemplates ?? '';
                const rtpList = rtpRaw
                  .split(/\r?\n/)
                  .map((t: string) => t.trim())
                  .filter(Boolean);
                if (!rtpList.length) {
                  deleteNested(nextOverrides, ['rtpReplyTemplates']);
                } else {
                  setNested(nextOverrides, ['rtpReplyTemplates'], rtpList);
                }

                // If empty, remove entirely so it inherits defaults.
                if (!Object.keys(templates).length) {
                  deleteNested(nextOverrides, ['userIdRequestTemplates']);
                } else {
                  setNested(nextOverrides, ['userIdRequestTemplates'], templates);
                }

                templatesMutation.mutate(
                  {overrides: nextOverrides},
                  {
                    onSuccess: () => toast(message('Templates saved')),
                  },
                );
              }}
            >
              <div className="grid grid-cols-1 gap-24">
                <FormTextField
                  name="depositProblemTemplate"
                  label={<Trans message="Deposit problem template" />}
                  inputElementType="textarea"
                  rows={2}
                  placeholder="Boleh minta USER ID-nya? Biar saya cek status deposit kamu 🎰. NOTE: USER ID cukup 1 kata ya."
                />

                <FormTextField
                  name="withdrawProblemTemplate"
                  label={<Trans message="Withdraw problem template" />}
                  inputElementType="textarea"
                  rows={2}
                  placeholder="Boleh minta USER ID-nya? Biar saya cek status withdraw kamu 🎰. NOTE: USER ID cukup 1 kata ya."
                />

                <FormTextField
                  name="turnoverProblemTemplate"
                  label={<Trans message="Turnover problem template" />}
                  inputElementType="textarea"
                  rows={2}
                  placeholder="Boleh minta USER ID-nya? Biar saya cek turnover-nya 📊. NOTE: USER ID cukup 1 kata ya."
                />

                <FormTextField
                  name="claimProblemTemplate"
                  label={<Trans message="Claim problem template" />}
                  inputElementType="textarea"
                  rows={2}
                  placeholder="Boleh minta USER ID-nya? Biar saya bantu klaim promonya. NOTE: USER ID cukup 1 kata ya."
                />

                <FormTextField
                  name="qrisProblemTemplate"
                  label={<Trans message="QRIS problem template" />}
                  inputElementType="textarea"
                  rows={2}
                  placeholder="Boleh minta USER ID-nya? Biar saya cek detail QRIS atau nomor pembayaran. NOTE: USER ID cukup 1 kata ya."
                />

                <FormTextField
                  name="passwordResetProblemTemplate"
                  label={<Trans message="Password reset problem template" />}
                  inputElementType="textarea"
                  rows={2}
                  placeholder="Boleh minta USER ID-nya? Biar saya bantu reset password-nya 🔐. NOTE: USER ID cukup 1 kata ya."
                />

                <FormTextField
                  name="waitMessage"
                  label={<Trans message="Wait message" />}
                  inputElementType="textarea"
                  rows={2}
                  placeholder="Oke, tunggu sebentar ya — lagi dicek."
                />

                {/* deposit flow templates */}
                <FormTextField
                  name="depositAskUsername"
                  label={<Trans message="Ask for username(depo)" />}
                  inputElementType="textarea"
                  rows={2}
                  placeholder="Bos, boleh minta UserID akun kamu dulu? 1 kata saja (tanpa spasi), biar aku bisa bantu cek..."
                />
                <FormTextField
                  name="depositAskProof"
                  label={<Trans message="Ask for proof(depo)" />}
                  inputElementType="textarea"
                  rows={2}
                  placeholder="Sekarang kirim bukti transfer (screenshot struk/bukti deposit) yang jelas supaya bisa dicek otomatis ke sistem ya. 🙏"
                />
                <FormTextField
                  name="depositProofMissing"
                  label={<Trans message="Proof missing reminder(depo)" />}
                  inputElementType="textarea"
                  rows={2}
                  placeholder="Aku belum lihat bukti transfernya nih bos..."
                />
                <FormTextField
                  name="depositChecking"
                  label={<Trans message="Checking message(depo)" />}
                  inputElementType="textarea"
                  rows={2}
                  placeholder="Bukti deposit kamu lagi dicek ke sistem ya bos, mohon tunggu sebentar..."
                />
                <FormTextField
                  name="depositDoneResolved"
                  label={<Trans message="Success message(depo)" />}
                  inputElementType="textarea"
                  rows={2}
                  placeholder="Oke bosku, bukti deposit kamu sudah terdeteksi dan cocok di sistem..."
                />
                <FormTextField
                  name="depositDoneUnresolved"
                  label={<Trans message="Failure message(depo)" />}
                  inputElementType="textarea"
                  rows={2}
                  placeholder="Dari hasil cek otomatis, bukti deposit ini belum ketemu jelas di sistem..."
                />

                <FormTextField
                  name="rtpReplyTemplates"
                  label={<Trans message="RTP reply templates" />}
                  inputElementType="textarea"
                  rows={4}
                  placeholder={
                    'Anda dapat melihat rates RTP live dan informasi lengkapnya langsung di halaman resmi kami: {{RTP_LINK}}.'
                  }
                />
                <div className="text-sm text-muted"> 
                  <Trans message="Enter one template per line. Use {{RTP_LINK}} placeholder where the RTP page link should be inserted." />
                </div>
              </div>

              <div className="mt-24 flex items-center justify-end gap-12">
                <Button
                  type="button"
                  variant="outline"
                  onClick={async () => {
                    const r = await aiQuery.refetch();
                    const overridesRaw = r.data?.overrides ?? {};
                    const overrides = ensureObject(overridesRaw) as Record<
                      string,
                      any
                    >;
                    const t = (overrides.userIdRequestTemplates ?? {}) as Record<
                      string,
                      any
                    >;
                    templatesForm.reset({
                      depositProblemTemplate:
                        typeof t.deposit === 'string' ? (t.deposit as string) : '',
                      withdrawProblemTemplate:
                        typeof t.withdraw === 'string'
                          ? (t.withdraw as string)
                          : '',
                      turnoverProblemTemplate:
                        typeof t.turnover === 'string'
                          ? (t.turnover as string)
                          : '',
                      passwordResetProblemTemplate:
                        typeof t.password_reset === 'string'
                          ? (t.password_reset as string)
                          : '',
                      claimProblemTemplate:
                        typeof t.claim === 'string' ? (t.claim as string) : '',
                      qrisProblemTemplate:
                        typeof t.qris === 'string' ? (t.qris as string) : '',
                      depositAskUsername:
                        typeof (overrides as any)?.depositFlow?.askUsername === 'string'
                          ? ((overrides as any).depositFlow.askUsername as string)
                          : '',
                      depositAskProof:
                        typeof (overrides as any)?.depositFlow?.askProof === 'string'
                          ? ((overrides as any).depositFlow.askProof as string)
                          : '',
                      depositProofMissing:
                        typeof (overrides as any)?.depositFlow?.proofMissing === 'string'
                          ? ((overrides as any).depositFlow.proofMissing as string)
                          : '',
                      depositChecking:
                        typeof (overrides as any)?.depositFlow?.checking === 'string'
                          ? ((overrides as any).depositFlow.checking as string)
                          : '',
                      depositDoneResolved:
                        typeof (overrides as any)?.depositFlow?.doneResolved === 'string'
                          ? ((overrides as any).depositFlow.doneResolved as string)
                          : '',
                      depositDoneUnresolved:
                        typeof (overrides as any)?.depositFlow?.doneUnresolved === 'string'
                          ? ((overrides as any).depositFlow.doneUnresolved as string)
                          : '',
                      rtpReplyTemplates: Array.isArray((overrides as any).rtpReplyTemplates)
                        ? ((overrides as any).rtpReplyTemplates as string[]).join('\n')
                        : '',
                      waitMessage:
                        typeof (overrides as any).waitMessage === 'string'
                          ? ((overrides as any).waitMessage as string)
                          : (typeof (overrides as any)?.customMessages?.waitMessage === 'string' ? (overrides as any).customMessages.waitMessage : ''),
                    });
                    toast(message('Loaded current'));
                  }}
                >
                  <Trans message="Load current" />
                </Button>
                <Button
                  type="submit"
                  variant="flat"
                  color="primary"
                  disabled={templatesMutation.isPending}
                >
                  <Trans message="Save" />
                </Button>
              </div>
            </Form>
          </div>
        </div>

        <div className="mt-24 border-t pt-24">
          <div className="text-base font-semibold">
            <Trans message="RTP Link" />
          </div>

          <div className="mt-12">
            <Form
              form={rtpForm}
              onSubmit={({settings}) => {
                const existing = (settingsQuery.data?.settings ?? {}) as Record<
                  string,
                  unknown
                >;
                const merged: Record<string, unknown> = {
                  ...existing,
                  ...((settings as any) ?? {}),
                };

                const payload: UpdateGroupSettingsPayload = {settings: merged};

                rtpMutation.mutate(payload, {
                  onSuccess: () => toast(message('RTP link saved')),
                });
              }}
            >
                <FormTextField
                  name="settings.websiteLink"
                  label={<Trans message="Main website URL" />}
                  type="url"
                  placeholder="https://your-main-website.example/"
                  required
                />

              <FormTextField
                name="settings.rtpLink"
                label={<Trans message="Current RTP URL" />}
                type="url"
                placeholder="https://your-rtp-link.example/rtp"
                required
              />
              

              <div className="mt-24 flex items-center justify-end gap-12">
                <Button
                  type="submit"
                  variant="outline"
                  disabled={rtpMutation.isPending}
                >
                  <Trans message="Save RTP Link" />
                </Button>
              </div>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}
