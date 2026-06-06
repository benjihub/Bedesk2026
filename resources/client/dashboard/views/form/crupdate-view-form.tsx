import {useConversationListFilters} from '@app/dashboard/conversations/conversations-table/conversations-table-filters';
import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {ColumnsEditor} from '@app/dashboard/views/form/columns-editor';
import {ConditionsEditor} from '@app/dashboard/views/form/conditions-editor';
import {IconSelector} from '@app/dashboard/views/form/icon-selector';
import {View} from '@app/dashboard/views/view';
import {useQuery} from '@tanstack/react-query';
import {Avatar} from '@ui/avatar/avatar';
import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {Item} from '@ui/forms/listbox/item';
import {FormRadio} from '@ui/forms/radio-group/radio';
import {FormRadioGroup} from '@ui/forms/radio-group/radio-group';
import {FormSelect} from '@ui/forms/select/select';
import {FormSwitch} from '@ui/forms/toggle/switch';
import {Trans} from '@ui/i18n/trans';
import {FullPageLoader} from '@ui/progress/full-page-loader';
import {useWatch} from 'react-hook-form';

interface Props {
  isInternal?: boolean;
}
export function CrupdateViewForm({isInternal}: Props) {
  const filters = useConversationListFilters();
  if (!filters.length) {
    return (
      <FullPageLoader screen={false} className="absolute inset-0 my-auto" />
    );
  }
  return (
    <div>
      <FormTextField
        autoFocus
        className="mb-24"
        label={<Trans message="Name" />}
        name="name"
        startAppend={<IconSelector />}
      />
      <FormTextField
        className="mb-24"
        label={<Trans message="Description" />}
        name="description"
        inputElementType="textarea"
        rows={1}
      />
      <PinnedSection />
      {!isInternal && <AccessSection />}
      <OrderBySection />
      {!isInternal && <ConditionsEditor filters={filters} />}
      <ColumnsEditor />
    </div>
  );
}

function PinnedSection() {
  return (
    <FormSwitch
      className="mt-24"
      name="pinned"
      description={
        <Trans message="Pinned view will appear at the top of chats sidebar." />
      }
    >
      <Trans message="Pinned" />
    </FormSwitch>
  );
}

function AccessSection() {
  const accessValue = useWatch<View>({name: 'access'});
  const groupQuery = useQuery(helpdeskQueries.groups.normalizedList);
  return (
    <div className="my-24 flex items-center gap-12">
      <FormSelect
        selectionMode="single"
        className="max-w-224 flex-auto"
        name="access"
        label={<Trans message="Who has access" />}
      >
        <Item value="anyone">
          <Trans message="Any agent" />
        </Item>
        <Item value="owner">
          <Trans message="Only view owner" />
        </Item>
        <Item value="group">
          <Trans message="Agents in specific group" />
        </Item>
      </FormSelect>
      {accessValue == 'group' && (
        <FormSelect
          selectionMode="single"
          name="group_id"
          className="max-w-264 flex-auto"
          label={<Trans message="Which group has access" />}
        >
          {groupQuery.data?.groups.map(group => (
            <Item
              key={group.id}
              value={group.id}
              startIcon={<Avatar size="xs" label={group.name} />}
            >
              {group.name}
            </Item>
          ))}
        </FormSelect>
      )}
    </div>
  );
}

function OrderBySection() {
  return (
    <div className="my-24 max-w-224">
      <FormSelect
        name="order_by"
        selectionMode="single"
        label={<Trans message="Order by" />}
      >
        <Item value="id">
          <Trans message="ID" />
        </Item>
        <Item value="status_category">
          <Trans message="Status category" />
        </Item>
        <Item value="conversations.updated_at">
          <Trans message="Latest update" />
        </Item>
        <Item value="conversations.created_at">
          <Trans message="Request date" />
        </Item>
        <Item value="closed_at">
          <Trans message="Solved date" />
        </Item>
        <Item value="priority">
          <Trans message="Priority" />
        </Item>
        <Item value="assignee_id">
          <Trans message="Assigne" />
        </Item>
        <Item value="group_id">
          <Trans message="Group" />
        </Item>
        <Item value="user_id">
          <Trans message="Requester" />
        </Item>
        <Item value="type">
          <Trans message="Conversation type" />
        </Item>
        <Item value="rating">
          <Trans message="Rating" />
        </Item>
      </FormSelect>
      <FormRadioGroup
        name="order_dir"
        orientation="vertical"
        size="sm"
        className="mt-12"
      >
        <FormRadio value="asc">
          <Trans message="Ascending" />
        </FormRadio>
        <FormRadio value="desc">
          <Trans message="Descending" />
        </FormRadio>
      </FormRadioGroup>
    </div>
  );
}
