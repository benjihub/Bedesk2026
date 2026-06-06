import {AttributeSelector} from '@app/attributes/attribute-selector/attribute-selector';
import {CreateCannedReplyPayload} from '@app/canned-replies/requests/use-create-canned-reply';
import {ArticleSearchButton} from '@app/dashboard/conversations/agent-reply-composer/article-search-button';
import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {ConversationAttachment} from '@app/dashboard/types/conversation-attachment';
import {ReplyComposerEmojiPickerButton} from '@app/reply-composer/emoji-picker-button';
import {EnhanceTextWithAiButton} from '@app/reply-composer/enhance-text-with-ai-button';
import {InsertInlineImageButton} from '@app/reply-composer/insert-inline-image-button';
import {ReplyComposerAttachments} from '@app/reply-composer/reply-composer-attachments';
import ReplyComposerContainer from '@app/reply-composer/reply-composer-container';
import {ReplyComposerDropTargetMask} from '@app/reply-composer/reply-composer-drop-target';
import {ReplyComposerFooter} from '@app/reply-composer/reply-composer-footer';
import {UploadAttachmentsButton} from '@app/reply-composer/upload-attachments-button';
import {UploadType} from '@app/site-config';
import {useAuth} from '@common/auth/use-auth';
import {useNormalizedModels} from '@common/ui/normalized-model/use-normalized-models';
import {FloatingToolbar} from '@common/text-editor/floating-toolbar';
import {useCurrentTextEditor} from '@common/text-editor/tiptap-editor-context';
import {FileUploadProvider} from '@common/uploads/uploader/file-upload-provider';
import {useQuery} from '@tanstack/react-query';
import {Avatar} from '@ui/avatar/avatar';
import {Button} from '@ui/buttons/button';
import {ButtonGroup} from '@ui/buttons/button-group';
import {IconButton} from '@ui/buttons/icon-button';
import {FormChipField} from '@ui/forms/input-field/chip-field/form-chip-field';
import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {Item} from '@ui/forms/listbox/item';
import {FormSelect} from '@ui/forms/select/select';
import {Trans} from '@ui/i18n/trans';
import {useTrans} from '@ui/i18n/use-trans';
import {DataObjectIcon} from '@ui/icons/material/DataObject';
import {PeopleIcon} from '@ui/icons/material/People';
import {PersonIcon} from '@ui/icons/material/Person';
import {PushPinIcon} from '@ui/icons/material/PushPin';
import {Tooltip} from '@ui/tooltip/tooltip';
import {Fragment, useState} from 'react';
import {useFormContext, useWatch} from 'react-hook-form';

export function CrupdateCannedReplyFormFields() {
  const form = useFormContext<CreateCannedReplyPayload>();
  const isShared = useWatch({control: form.control, name: 'shared'});
  const groupQuery = useQuery(helpdeskQueries.groups.normalizedList);

  return (
    <FileUploadProvider>
      <div className="mb-24">
        <ButtonGroup
          size="xs"
          value={isShared}
          onChange={newValue => {
            form.setValue('shared', newValue, {shouldDirty: true});
          }}
        >
          <Button variant="outline" startIcon={<PeopleIcon />} value={true}>
            <Trans message="Shared" />
          </Button>
          <Button variant="outline" startIcon={<PersonIcon />} value={false}>
            <Trans message="Private" />
          </Button>
        </ButtonGroup>
        <div className="mt-10 text-xs text-muted">
          <Trans message="Shared replies will be visible to all agents, not just you." />
        </div>
      </div>
      <FormTextField
        autoFocus
        className="mb-24"
        label={<Trans message="Name" />}
        name="name"
      />
      <FormTextField
        className="mb-24"
        label={<Trans message="Shortcut" />}
        name="shortcut"
        placeholder="#1"
        description={<Trans message="Type this in the reply box and press Tab to expand." />}
      />
      <FormSelect
        className="mb-24"
        selectionMode="single"
        name="groupId"
        label={<Trans message="Group" />}
        description={
          <Trans message="Only agents in this group will see this reply." />
        }
      >
        {groupQuery.data?.groups.map(group => (
          <Item
            value={group.id}
            key={group.id}
            startIcon={<Avatar label={group.name} size="sm" />}
          >
            {group.name}
          </Item>
        ))}
      </FormSelect>
      <BodyComposer />
      <TagField />
    </FileUploadProvider>
  );
}

function BodyComposer() {
  const {hasPermission} = useAuth();
  const uploadsDisabled = !hasPermission('files.create');
  const form = useFormContext<CreateCannedReplyPayload>();
  const bodyError = form.formState.errors.body?.message;
  const attachments =
    useWatch({control: form.control, name: 'attachments'}) || [];

  const handleUpload = (attachment: ConversationAttachment) => {
    form.setValue('attachments', [attachment, ...attachments], {
      shouldDirty: true,
    });
  };

  return (
    <Fragment>
      <div className="mb-4 text-sm">
        <Trans message="Reply text" />
      </div>
      <ReplyComposerDropTargetMask
        isDisabled={uploadsDisabled}
        onUpload={handleUpload}
      >
        <ReplyComposerContainer
          initialContent={form.getValues('body') || ''}
          submitToClosestForm
          onChange={value => {
            form.setValue('body', value, {shouldDirty: true});
          }}
        >
          <FloatingToolbar />
          <ReplyComposerFooter>
            <ArticleSearchButton />
            <ReplyComposerEmojiPickerButton />
            {!uploadsDisabled && (
              <UploadAttachmentsButton onUpload={handleUpload} />
            )}
            {!uploadsDisabled && (
              <InsertInlineImageButton
                uploadType={UploadType.conversationImages}
              />
            )}
            <EnhanceTextWithAiButton />
            <AddVariableButton />
          </ReplyComposerFooter>
        </ReplyComposerContainer>
      </ReplyComposerDropTargetMask>
      {bodyError && (
        <div className="mt-12 text-xs text-danger">{bodyError}</div>
      )}
      <ReplyComposerAttachments
        attachments={attachments}
        onRemove={attachment => {
          form.setValue(
            'attachments',
            attachments.filter(a => a.id !== attachment.id),
            {shouldDirty: true},
          );
        }}
        className="mt-12"
      />
    </Fragment>
  );
}

function TagField() {
  const {trans} = useTrans();
  const [query, setQuery] = useState('');
  const {data, isLoading} = useNormalizedModels('helpdesk/normalized-models/tags', {
    query,
  });
  return (
    <FormChipField
      name="tags"
      className="mt-24"
      label={<Trans message="Tags" />}
      isAsync
      isLoading={isLoading}
      inputValue={query}
      onInputValueChange={setQuery}
      suggestions={data?.results}
      placeholder={trans({message: 'Type tag name...'})}
      description={
        <Trans message="Selected tags will be automatically assigned to conversation." />
      }
    >
      {data?.results.map(tag => (
        <Item key={tag.id} value={tag} startIcon={<PushPinIcon size="xs" />}>
          {tag.name}
        </Item>
      ))}
    </FormChipField>
  );
}

function AddVariableButton() {
  const editor = useCurrentTextEditor();

  return (
    <AttributeSelector
      showReadonly
      floatingWidth="auto"
      offset={6}
      onChange={value => {
        if (value && editor) {
          editor.commands.insertContent(
            `<be-variable name="${value.name}" type="${value.type}"/>`,
          );
        }
      }}
    >
      <Tooltip label={<Trans message="Add attribute" />}>
        <IconButton size="sm" iconSize="sm">
          <DataObjectIcon />
        </IconButton>
      </Tooltip>
    </AttributeSelector>
  );
}
