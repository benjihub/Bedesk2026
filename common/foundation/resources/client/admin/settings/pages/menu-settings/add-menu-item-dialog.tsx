import {commonAdminQueries} from '@common/admin/common-admin-queries';
import {useAvailableRoutes} from '@common/admin/settings/pages/menu-settings/use-available-routes';
import {MenuItemConfig} from '@common/menus/menu-config';
import {useQuery} from '@tanstack/react-query';
import {Accordion, AccordionItem} from '@ui/accordion/accordion';
import {Button} from '@ui/buttons/button';
import {Form} from '@ui/forms/form';
import {
  FormTextField,
  TextField,
} from '@ui/forms/input-field/text-field/text-field';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {useFilter} from '@ui/i18n/use-filter';
import {useTrans} from '@ui/i18n/use-trans';
import {AddIcon} from '@ui/icons/material/Add';
import {List, ListItem} from '@ui/list/list';
import {Dialog} from '@ui/overlays/dialog/dialog';
import {DialogBody} from '@ui/overlays/dialog/dialog-body';
import {useDialogContext} from '@ui/overlays/dialog/dialog-context';
import {DialogHeader} from '@ui/overlays/dialog/dialog-header';
import {ucFirst} from '@ui/utils/string/uc-first';
import {nanoid} from 'nanoid';
import {Fragment, ReactNode, useState} from 'react';
import {useForm} from 'react-hook-form';

interface AddMenuItemDialogProps {
  title?: ReactNode;
}
export function AddMenuItemDialog({
  title = <Trans message="Add menu item" />,
}: AddMenuItemDialogProps) {
  const {type} = useDialogContext();
  const {data} = useQuery(commonAdminQueries.settings.menuEditorConfig());
  const routeItems = useAvailableRoutes();
  const categories = data?.categories || [];
  const maxHeight =
    type === 'drawer' ? 'max-h-auto' : 'max-h-240 overflow-y-auto';

  return (
    <Dialog size={type === 'drawer' ? 'md' : 'sm'}>
      <DialogHeader>{title}</DialogHeader>
      <DialogBody>
        <Accordion variant="outline">
          <AccordionItem
            label={<Trans message="Link" />}
            bodyClassName={maxHeight}
          >
            <AddCustomLink />
          </AccordionItem>
          <AccordionItem
            label={<Trans message="Route" />}
            bodyClassName={maxHeight}
          >
            <AddRoute items={routeItems} />
          </AccordionItem>
          {categories.map(category => (
            <AccordionItem
              bodyClassName={maxHeight}
              key={category.name}
              label={<Trans message={category.name} />}
            >
              <AddRoute items={category.items} />
            </AccordionItem>
          ))}
        </Accordion>
      </DialogBody>
    </Dialog>
  );
}

function AddCustomLink() {
  const form = useForm<MenuItemConfig>({
    defaultValues: {
      id: nanoid(6),
      type: 'link',
      target: '_blank',
    },
  });
  const {close} = useDialogContext();

  return (
    <Form
      form={form}
      onSubmit={value => {
        close(value);
      }}
    >
      <FormTextField
        required
        name="label"
        label={<Trans message="Label" />}
        className="mb-20"
      />
      <FormTextField
        required
        type="url"
        name="action"
        placeholder="https://"
        label={<Trans message="Url" />}
        className="mb-20"
      />
      <div className="text-right">
        <Button type="submit" variant="flat" color="primary" size="xs">
          <Trans message="Add to menu" />
        </Button>
      </div>
    </Form>
  );
}

interface AddRouteProps {
  items: Partial<MenuItemConfig>[];
}
function AddRoute({items}: AddRouteProps) {
  const {trans} = useTrans();
  const {close} = useDialogContext();

  const [searchQuery, setSearchQuery] = useState('');
  const {contains} = useFilter({
    sensitivity: 'base',
  });
  const matchedItems = items.filter(item =>
    contains(item.action ?? '', searchQuery),
  );

  return (
    <Fragment>
      <TextField
        placeholder={trans(message('Search...'))}
        value={searchQuery}
        size="sm"
        onChange={e => setSearchQuery(e.target.value)}
        className="mb-12"
      />
      <List>
        {matchedItems.map(item => {
          return (
            <ListItem
              key={item.id}
              startIcon={<AddIcon size="sm" />}
              onSelected={() => {
                if (item.label) {
                  const last = item.label.split('/').pop();
                  item.label = last ? ucFirst(last) : item.label;
                  item.id = nanoid(6);
                }
                if (!item.target) {
                  item.target = '_self';
                }
                close(item);
              }}
            >
              {item.label}
            </ListItem>
          );
        })}
      </List>
    </Fragment>
  );
}
