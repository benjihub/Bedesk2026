import {Avatar} from '@ui/avatar/avatar';
import {Button} from '@ui/buttons/button';
import {TextField} from '@ui/forms/input-field/text-field/text-field';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {useTrans} from '@ui/i18n/use-trans';
import {SearchIcon} from '@ui/icons/material/Search';
import {IllustratedMessage} from '@ui/images/illustrated-message';
import {SvgImage} from '@ui/images/svg-image';
import {Dialog} from '@ui/overlays/dialog/dialog';
import {DialogBody} from '@ui/overlays/dialog/dialog-body';
import {useDialogContext} from '@ui/overlays/dialog/dialog-context';
import {DialogFooter} from '@ui/overlays/dialog/dialog-footer';
import {DialogHeader} from '@ui/overlays/dialog/dialog-header';
import {NormalizedModel} from '@ui/types/normalized-model';
import clsx from 'clsx';
import {useState} from 'react';
import teamSvg from '../admin/roles/team.svg';
import {useNormalizedModels} from '../ui/normalized-model/use-normalized-models';

interface SingleProps<T extends NormalizedModel> {
  multiple?: false;
}

interface MultipleProps<T extends NormalizedModel> {
  multiple?: true;
}

export function SelectUserDialog<T extends NormalizedModel>({
  multiple = false,
  endpoint = 'normalized-models/user',
}: (MultipleProps<T> | SingleProps<T>) & {endpoint?: string}) {
  const {close} = useDialogContext();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const {trans} = useTrans();
  const query = useNormalizedModels(endpoint, {
    query: searchTerm,
    perPage: 14,
  });
  const users = query.data?.results || [];
  const [selectedUsers, setSelectedUsers] = useState<T[]>([]);

  const emptyStateMessage = (
    <IllustratedMessage
      className="pt-20"
      size="sm"
      title={<Trans message="No matching users" />}
      description={<Trans message="Try another search query" />}
      image={<SvgImage src={teamSvg} />}
    />
  );

  return (
    <Dialog size="lg">
      <DialogHeader>
        {multiple ? (
          <Trans message="Select users" />
        ) : (
          <Trans message="Select a user" />
        )}
      </DialogHeader>
      <DialogBody>
        <TextField
          autoFocus
          size="sm"
          className="mb-20"
          startAdornment={<SearchIcon />}
          placeholder={trans(message('Search for user by name or email'))}
          value={searchTerm}
          onChange={e => {
            setSearchTerm(e.target.value);
          }}
        />
        {!query.isLoading && !users.length && emptyStateMessage}
        <div className="grid grid-cols-2 gap-x-10">
          {users.map(user => (
            <UserListItem
              isSelected={!!selectedUsers.find(u => u.id === user.id)}
              key={user.id}
              user={user}
              onSelected={user => {
                if (multiple) {
                  if (selectedUsers.find(u => u.id === user.id)) {
                    setSelectedUsers(
                      selectedUsers.filter(u => u.id !== user.id),
                    );
                  } else {
                    setSelectedUsers([...selectedUsers, user as T]);
                  }
                } else {
                  close(user);
                }
              }}
            />
          ))}
        </div>
      </DialogBody>
      {multiple && (
        <DialogFooter>
          <Button onClick={() => close()}>
            <Trans message="Cancel" />
          </Button>
          <Button
            variant="flat"
            color="primary"
            onClick={() => close(selectedUsers)}
            disabled={!selectedUsers.length}
          >
            <Trans message="Select" />
          </Button>
        </DialogFooter>
      )}
    </Dialog>
  );
}

interface UserListItemProps {
  isSelected: boolean;
  user: NormalizedModel;
  onSelected: (user: NormalizedModel) => void;
}
function UserListItem({user, onSelected, isSelected}: UserListItemProps) {
  return (
    <div
      key={user.id}
      className={clsx(
        'flex items-center gap-10 rounded-panel border-1 p-10 outline-none ring-offset-4 focus-visible:ring',
        isSelected
          ? 'border-primary bg-primary/5 hover:bg-primary/10'
          : 'border-transparent hover:bg-hover',
      )}
      role="button"
      tabIndex={0}
      onClick={() => {
        onSelected(user);
      }}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelected(user);
        }
      }}
    >
      <Avatar src={user.image} label={user.name ?? 'Visitor'} circle />
      <div className="overflow-hidden">
        <div className="overflow-hidden text-ellipsis whitespace-nowrap">
          {user.name ?? <Trans message="Visitor" />}
        </div>
        <div className="overflow-hidden text-ellipsis text-muted">
          {user.description}
        </div>
      </div>
    </div>
  );
}
