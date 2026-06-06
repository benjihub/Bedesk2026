import {Group} from '@app/dashboard/groups/group';
import {GroupPromotion} from '@app/dashboard/groups/promotions/group-promotion';
import {
  CreateGroupPromotionPayload,
  useCreateGroupPromotion,
} from '@app/dashboard/groups/promotions/requests/use-create-group-promotion';
import {useDeleteGroupPromotion} from '@app/dashboard/groups/promotions/requests/use-delete-group-promotion';
import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {useQuery} from '@tanstack/react-query';
import {Button} from '@ui/buttons/button';
import {Form} from '@ui/forms/form';
import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {toast} from '@ui/toast/toast';
import {useForm} from 'react-hook-form';
import {useOutletContext} from 'react-router';

export function Component() {
  const group = useOutletContext() as Group;

  const {data, isFetching} = useQuery(
    helpdeskQueries.groupPromotions.index(group.id),
  );

  const form = useForm<CreateGroupPromotionPayload>({
    defaultValues: {
      title: '',
      description: '',
      discount: null,
      code: '',
      terms: '',
      how_to_claim: '',
      active: true,
    },
  });

  const createPromotion = useCreateGroupPromotion(group.id, form);
  const deletePromotion = useDeleteGroupPromotion(group.id);

  const promotions = (data?.promotions ?? []) as GroupPromotion[];

  return (
    <div className="container mx-auto px-24">
      <div className="mb-24">
        <div className="text-xl font-semibold">
          <Trans message="Promotions" />
        </div>
        <div className="text-sm text-muted">
          <Trans message="Create promotions that apply to this group." />
        </div>
      </div>

      <div className="mb-34 rounded border p-24">
        <div className="mb-16 text-sm font-semibold">
          <Trans message="Add promotion" />
        </div>
        <Form
          form={form}
          onSubmit={values => {
            createPromotion.mutate(values, {
              onSuccess: () => {
                toast(message('Promotion created'));
                form.reset({
                  title: '',
                  description: '',
                  discount: null,
                  code: '',
                  terms: '',
                  how_to_claim: '',
                  active: true,
                });
              },
            });
          }}
        >
          <div className="grid grid-cols-1 gap-24 md:grid-cols-2">
            <FormTextField
              name="title"
              label={<Trans message="Title" />}
              required
            />
            <FormTextField
              name="code"
              label={<Trans message="Code" />}
            />
            <FormTextField
              name="discount"
              type="number"
              label={<Trans message="Discount" />}
              description={<Trans message="Optional numeric discount value." />}
            />
            <div />
            <div className="md:col-span-2">
              <FormTextField
                name="description"
                label={<Trans message="Description" />}
                inputElementType="textarea"
                rows={3}
              />
            </div>
            <div className="md:col-span-2">
              <FormTextField
                name="terms"
                label={<Trans message="Terms" />}
                inputElementType="textarea"
                rows={3}
              />
            </div>
            <div className="md:col-span-2">
              <FormTextField
                name="how_to_claim"
                label={<Trans message="How to claim" />}
                inputElementType="textarea"
                rows={3}
              />
            </div>
          </div>

          <div className="mt-24 flex items-center justify-end gap-12">
            <Button
              type="submit"
              variant="flat"
              color="primary"
              disabled={createPromotion.isPending}
            >
              <Trans message="Save" />
            </Button>
          </div>
        </Form>
      </div>

      <div>
        <div className="mb-12 flex items-center justify-between">
          <div className="text-sm font-semibold">
            <Trans message="Current promotions" />
          </div>
          {isFetching && (
            <div className="text-xs text-muted">
              <Trans message="Refreshing…" />
            </div>
          )}
        </div>

        {promotions.length ? (
          <div className="space-y-12">
            {promotions.map(promo => (
              <div key={promo.id} className="rounded border p-16">
                <div className="flex items-start justify-between gap-12">
                  <div>
                    <div className="font-semibold">{promo.title}</div>
                    {promo.code ? (
                      <div className="text-sm text-muted">
                        <Trans message="Code:" /> {promo.code}
                      </div>
                    ) : null}
                    {promo.description ? (
                      <div className="mt-8 text-sm">{promo.description}</div>
                    ) : null}
                  </div>
                  <Button
                    size="xs"
                    variant="outline"
                    color="danger"
                    disabled={deletePromotion.isPending}
                    onClick={() => {
                      deletePromotion.mutate(promo.id, {
                        onSuccess: () => {
                          toast(message('Promotion deleted'));
                        },
                      });
                    }}
                  >
                    <Trans message="Delete" />
                  </Button>
                </div>

                {(promo.terms || promo.how_to_claim) && (
                  <div className="mt-12 grid grid-cols-1 gap-12 md:grid-cols-2">
                    {promo.terms ? (
                      <div>
                        <div className="text-xs font-semibold text-muted">
                          <Trans message="Terms" />
                        </div>
                        <div className="text-sm">{promo.terms}</div>
                      </div>
                    ) : null}
                    {promo.how_to_claim ? (
                      <div>
                        <div className="text-xs font-semibold text-muted">
                          <Trans message="How to claim" />
                        </div>
                        <div className="text-sm">{promo.how_to_claim}</div>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded border p-24 text-sm text-muted">
            <Trans message="No promotions yet." />
          </div>
        )}
      </div>
    </div>
  );
}
