import {CrupdateButtonFields} from '@ai/ai-agent/flows/flow-editor/node-editor/fields/crupdate-button-fields';
import {FormTipTapTextField} from '@ai/ai-agent/flows/flow-editor/node-editor/fields/tiptap-text-field/tiptap-text-field';
import {CardsNodeData} from '@ai/ai-agent/flows/flow-editor/nodes/cards-node/card-node-data';
import {UploadType} from '@app/site-config';
import {useRequiredParams} from '@common/ui/navigation/use-required-params';
import {FormImageSelector} from '@common/uploads/components/image-selector';
import {FileUploadProvider} from '@common/uploads/uploader/file-upload-provider';
import {Accordion, AccordionItem} from '@ui/accordion/accordion';
import {Button} from '@ui/buttons/button';
import {Form} from '@ui/forms/form';
import {Trans} from '@ui/i18n/trans';
import {AddIcon} from '@ui/icons/material/Add';
import {Dialog} from '@ui/overlays/dialog/dialog';
import {DialogBody} from '@ui/overlays/dialog/dialog-body';
import {useDialogContext} from '@ui/overlays/dialog/dialog-context';
import {DialogFooter} from '@ui/overlays/dialog/dialog-footer';
import {DialogHeader} from '@ui/overlays/dialog/dialog-header';
import {useState} from 'react';
import {useFieldArray, useForm} from 'react-hook-form';

type CardData = CardsNodeData['cards'][number];

interface Props {
  card: CardData;
}
export function EditCardDialog({card}: Props) {
  const {flowId} = useRequiredParams(['flowId']);
  const [expandedValues, setExpandedValues] = useState<(number | string)[]>([]);
  const {formId, close} = useDialogContext();
  const form = useForm<CardData>({
    defaultValues: card,
  });

  const {
    fields: buttons,
    append,
    remove,
  } = useFieldArray<CardData, 'buttons'>({
    name: 'buttons',
    control: form.control,
  });

  const handleAddButton = () => {
    append({
      name: 'Button label',
      actionType: 'openUrl',
      actionValue: '',
    });
  };

  return (
    <Dialog>
      <DialogHeader>
        <Trans message="Edit card" />
      </DialogHeader>
      <DialogBody>
        <Form id={formId} form={form} onSubmit={value => close(value)}>
          <FileUploadProvider>
            <FormImageSelector
              name="image"
              label={<Trans message="Image" />}
              className="mb-24"
              variant="input"
              uploadType={UploadType.conversationImages}
              showRemoveButton
            />
          </FileUploadProvider>
          <FormTipTapTextField
            name="title"
            label={<Trans message="Title" />}
            className="mb-24"
            maxLength={80}
            size="md"
          />
          <FormTipTapTextField
            name="description"
            label={<Trans message="Description" />}
            className="mb-24"
            maxLength={120}
            size="md"
            multiline
          />
          <div>
            <div className="mb-4">
              <Trans message="Buttons" />
            </div>
            <Accordion
              variant="outline"
              expandedValues={expandedValues}
              onExpandedChange={setExpandedValues}
            >
              {buttons.map((button, index) => (
                <AccordionItem key={index} label={button.name}>
                  <CrupdateButtonFields
                    size="sm"
                    pathPrefix={`buttons.${index}`}
                  />
                  <div className="text-right">
                    <Button
                      size="xs"
                      color="danger"
                      variant="outline"
                      onClick={() => {
                        remove(index);
                        setExpandedValues([]);
                      }}
                      className="mt-20"
                    >
                      <Trans message="Remove" />
                    </Button>
                  </div>
                </AccordionItem>
              ))}
            </Accordion>
            <Button
              size="sm"
              color="primary"
              className="-ml-18 mt-6"
              startIcon={<AddIcon />}
              onClick={() => handleAddButton()}
            >
              <Trans message="Add button" />
            </Button>
          </div>
        </Form>
      </DialogBody>
      <DialogFooter>
        <Button size="sm" variant="outline" onClick={() => close()}>
          <Trans message="Cancel" />
        </Button>
        <Button
          size="sm"
          variant="flat"
          color="primary"
          type="submit"
          form={formId}
        >
          <Trans message="Save" />
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
