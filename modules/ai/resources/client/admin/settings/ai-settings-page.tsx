import {AdminDocsUrls} from '@app/admin/admin-config';
import {AdminSettings} from '@common/admin/settings/admin-settings';
import {AdminSettingsLayout} from '@common/admin/settings/layout/settings-layout';
import {DocsLink} from '@common/admin/settings/layout/settings-links';
import {SettingsPanel} from '@common/admin/settings/layout/settings-panel';
import {useAdminSettings} from '@common/admin/settings/requests/use-admin-settings';
import {InstallModuleCard} from '@livechat/admin/settings/install-module-card';
import {LinkStyle} from '@ui/buttons/external-link';
import {FormComboBox} from '@ui/forms/combobox/form-combobox';
import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {Item} from '@ui/forms/listbox/item';
import {FormSelect} from '@ui/forms/select/select';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {useTrans} from '@ui/i18n/use-trans';
import {ChatbotIcon} from '@ui/icons/lucide/chatbot-icon';
import {OpenInNewIcon} from '@ui/icons/material/OpenInNew';
import {useSettings} from '@ui/settings/use-settings';
import clsx from 'clsx';
import {ReactNode} from 'react';
import {useForm, useWatch} from 'react-hook-form';
import {Link} from 'react-router';

export function Component() {
  const {modules} = useSettings();

  if (!modules.ai.installed) {
    return <NotInstalledCard />;
  }

  return <SettingsForm />;
}

function SettingsForm() {
  const {data} = useAdminSettings();
  const form = useForm<AdminSettings>({
    defaultValues: {
      server: {
        ai_agent_document_parser:
          data.server.ai_agent_document_parser ?? 'basic',
        llm_provider: data.server.llm_provider ?? 'openai',
        embeddings_provider: data.server.embeddings_provider ?? 'openai',
        openai_api_key: data.server.openai_api_key ?? '',
        openai_text_model: data.server.openai_text_model ?? 'gpt-4o-mini',
        anthropic_api_key: data.server.anthropic_api_key ?? '',
        anthropic_text_model:
          data.server.anthropic_text_model ?? 'claude-sonnet-4-0',
        gemini_api_key: data.server.gemini_api_key ?? '',
        gemini_text_model: data.server.gemini_text_model ?? 'gemini-2.5-flash',
        openrouter_api_key: data.server.openrouter_api_key ?? '',
        openrouter_text_model: data.server.openrouter_text_model ?? '',
      },
    },
  });

  return (
    <AdminSettingsLayout
      form={form}
      title={<Trans message="AI & Agents" />}
      docsLink={AdminDocsUrls.settings.ai}
    >
      <div className="mb-24 flex items-center gap-8 text-sm">
        <ChatbotIcon size="sm" className="text-primary" />
        <Link to="/admin/ai-agent/settings" className={LinkStyle}>
          <Trans message="Find more settings on AI Agent page" />
        </Link>
      </div>
      <AiAgentSection />
      <EmbeddingsSection />
      <CredentialsSection />
    </AdminSettingsLayout>
  );
}

function AiAgentSection() {
  return (
    <SettingsPanel
      className="mb-24"
      title={<Trans message="LLM provider" />}
      description={
        <Trans message="Choose which LLM provider and model to use for AI functionality." />
      }
    >
      <FormSelect
        size="sm"
        className="mb-12"
        name="server.llm_provider"
        label={<Trans message="Provider" />}
      >
        <Item value="openai">OpenAI (default)</Item>
        <Item value="anthropic">Anthropic</Item>
        <Item value="gemini">Gemini</Item>
        <Item value="openrouter">OpenRouter</Item>
      </FormSelect>
      <ProviderModelCombobox />
    </SettingsPanel>
  );
}

function EmbeddingsSection() {
  return (
    <SettingsPanel
      className="mb-24"
      title={<Trans message="Knowledge ingesting" />}
      description={
        <Trans message="Configure how knowledge like websites, documents and articles are ingested." />
      }
    >
      <FormSelect
        size="sm"
        className="mb-12"
        name="server.embeddings_provider"
        label={<Trans message="Embeddings provider" />}
      >
        <Item value="openai">OpenAI (default)</Item>
        <Item value="gemini">Gemini</Item>
      </FormSelect>
      <FormSelect
        size="sm"
        selectionMode="single"
        name="server.ai_agent_document_parser"
        label={<Trans message="Document content parser" />}
      >
        <Item value="basic">
          <Trans message="Basic" />
        </Item>
        <Item value="markitdown">
          <Trans message="Markitdown" />
        </Item>
      </FormSelect>
    </SettingsPanel>
  );
}

function CredentialsSection() {
  return (
    <SettingsPanel
      className="mb-24"
      title={<Trans message="Provider credentials" />}
      description={
        <Trans message="Enter your selected provider credentials." />
      }
    >
      <ProviderApiKeyField />
    </SettingsPanel>
  );
}

function ProviderModelCombobox() {
  const provider = useWatch<AdminSettings>({
    name: 'server.llm_provider',
  });
  switch (provider) {
    case 'openai':
      return <OpenAiModelCombobox />;
    case 'anthropic':
      return <AnthropicModelCombobox />;
    case 'gemini':
      return <GeminiModelCombobox />;
    case 'openrouter':
      return <OpenRouterModelTextField />;
    default:
      return null;
  }
}

function OpenAiModelCombobox() {
  return (
    <ModelCombobox
      name="server.openai_text_model"
      docsLink="https://platform.openai.com/docs/models"
    >
      <Item value="gpt-5">GPT-5</Item>
      <Item value="gpt-5-mini">GPT-5-mini</Item>
      <Item value="gpt-5-nano">GPT-5-nano</Item>
      <Item value="gpt-4.1">GPT-4.1</Item>
      <Item value="gpt-4.1-mini">GPT-4.1-mini</Item>
      <Item value="gpt-4.1-nano">GPT-4.1-nano</Item>
      <Item value="gpt-4o">GPT-4o</Item>
      <Item value="gpt-4o-mini">GPT-4o-mini (default)</Item>
    </ModelCombobox>
  );
}

function AnthropicModelCombobox() {
  return (
    <ModelCombobox
      name="server.anthropic_text_model"
      docsLink="https://docs.anthropic.com/en/docs/about-claude/models/overview"
    >
      <Item value="claude-opus-4-1">Claude Opus 4.1</Item>
      <Item value="claude-opus-4-0">Claude Opus 4</Item>
      <Item value="claude-sonnet-4-0">Claude Sonnet 4 (Default)</Item>
      <Item value="claude-sonnet-3-7">Claude Sonnet 3.7</Item>
      <Item value="claude-3-5-haiku">Claude 3.5 Haiku</Item>
    </ModelCombobox>
  );
}

function GeminiModelCombobox() {
  return (
    <ModelCombobox
      name="server.gemini_text_model"
      docsLink="https://ai.google.dev/gemini-api/docs/models"
    >
      <Item value="gemini-2.5-pro">Gemini 2.5 Pro</Item>
      <Item value="gemini-2.5-flash">Gemini 2.5 Flash (default)</Item>
      <Item value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite</Item>
      <Item value="gemini-2.0-flash">Gemini 2.0 Flash</Item>
      <Item value="gemini-2.0-flash-lite">Gemini 2.0 Flash Lite</Item>
    </ModelCombobox>
  );
}

function OpenRouterModelTextField() {
  return (
    <FormTextField
      size="sm"
      name="server.openrouter_text_model"
      label={<Trans message="Model" />}
    />
  );
}

function ProviderApiKeyField() {
  const llmProvider = useWatch<AdminSettings>({
    name: 'server.llm_provider',
  });
  const embeddingProvider = useWatch<AdminSettings>({
    name: 'server.embeddings_provider',
  });

  const usedProviders = [llmProvider, embeddingProvider];

  return (
    <div className="col-12 flex flex-col">
      {usedProviders.includes('openai') && (
        <ApiKeyField
          label={<Trans message="OpenAI API key" />}
          name="server.openai_api_key"
        />
      )}
      {usedProviders.includes('anthropic') && (
        <ApiKeyField
          label={<Trans message="Anthropic API key" />}
          name="server.anthropic_api_key"
        />
      )}
      {usedProviders.includes('gemini') && (
        <ApiKeyField
          label={<Trans message="Gemini API key" />}
          name="server.gemini_api_key"
        />
      )}
      {usedProviders.includes('openrouter') && (
        <ApiKeyField
          label={<Trans message="OpenRouter API key" />}
          name="server.openrouter_api_key"
        />
      )}
    </div>
  );
}

type ApiKeyFieldProps = {
  name: string;
  label: ReactNode;
};
function ApiKeyField({name, label}: ApiKeyFieldProps) {
  return (
    <FormTextField
      key={name}
      size="sm"
      className="mb-12"
      name={name}
      label={label}
      required
    />
  );
}

type ModelComboboxProps = {
  name: string;
  children: ReactNode;
  docsLink?: string;
};
function ModelCombobox({name, children, docsLink}: ModelComboboxProps) {
  const {trans} = useTrans();
  return (
    <FormComboBox
      required
      allowCustomValue
      size="sm"
      key={name}
      name={name}
      label={<Trans message="Model" />}
      description={
        <a
          className={clsx('flex items-center gap-6', LinkStyle)}
          target="_blank"
          href={docsLink}
        >
          <OpenInNewIcon size="xs" />
          <Trans message="List of models." />
        </a>
      }
      placeholder={trans(message('Select a model...'))}
    >
      {children}
    </FormComboBox>
  );
}

export function NotInstalledCard() {
  return (
    <InstallModuleCard
      title="Supercharge Your Support with AI"
      description="Instantly resolve common questions with a smart AI agent, get instant conversation summaries, and perfect every reply with one-click rewriting. Reduce ticket volume and empower your team to focus on what matters most."
      icon={<ChatbotIcon size="lg" />}
      moduleName="ai"
      getModuleLabel={<Trans message="Get AI Agent Addon" />}
    />
  );
}
