import {FullConversationResponse} from '@app/dashboard/conversation';
import {useUpdateConversation} from '@app/dashboard/conversations/conversation-page/requests/use-update-conversation';
import {useCustomerName} from '@app/dashboard/conversations/customer-name';
import {Button} from '@ui/buttons/button';
import {TextField} from '@ui/forms/input-field/text-field/text-field';
import {Trans} from '@ui/i18n/trans';
import {useTrans} from '@ui/i18n/use-trans';
import {Dialog} from '@ui/overlays/dialog/dialog';
import {DialogBody} from '@ui/overlays/dialog/dialog-body';
import {useDialogContext} from '@ui/overlays/dialog/dialog-context';
import {DialogFooter} from '@ui/overlays/dialog/dialog-footer';
import {DialogHeader} from '@ui/overlays/dialog/dialog-header';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {toast} from '@ui/toast/toast';
import {useState} from 'react';

interface Props {
  data: FullConversationResponse;
}
export function ConversationSubject({data}: Props) {
  const titlePlaceholder = useCustomerName(data.user);

  return (
    <>
      <DialogTrigger type="modal">
        <h1 className="min-w-0 cursor-pointer overflow-hidden text-ellipsis whitespace-nowrap rounded px-4 text-lg font-semibold hover:bg-primary/focus">
          {data.conversation.subject || titlePlaceholder}
        </h1>
        <EditSubjectDialog data={data} />
      </DialogTrigger>
    </>
  );
}

function EditSubjectDialog({data: {conversation}}: Props) {
  const {close} = useDialogContext();
  const [subject, setSubject] = useState(conversation.subject || '');
  const updateConversation = useUpdateConversation(conversation.id);
  const {trans} = useTrans();

  const handleSubmit = () => {
    updateConversation.mutate(
      {subject},
      {
        onSuccess: () => {
          toast(trans({message: 'Subject updated'}));
          close();
        },
      },
    );
  };

  return (
    <Dialog>
      <DialogHeader>
        <Trans message="Edit subject" />
      </DialogHeader>
      <DialogBody>
        <TextField
          value={subject}
          onChange={e => setSubject(e.target.value)}
          label={<Trans message="Subject" />}
          autoFocus
          required
          minLength={3}
          maxLength={180}
          className="w-full"
        />
      </DialogBody>
      <DialogFooter>
        <Button onClick={() => close()}>
          <Trans message="Cancel" />
        </Button>
        <Button
          onClick={handleSubmit}
          variant="flat"
          color="primary"
          disabled={
            updateConversation.isPending ||
            subject === conversation.subject ||
            !subject.trim()
          }
        >
          <Trans message="Save" />
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
