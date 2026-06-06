import {Invoice} from '@common/billing/invoice';
import {Product} from '@common/billing/product';
import {PaginatedBackendResponse} from '@common/http/backend-response/pagination-response';
import {get} from '@common/http/queries-file-helpers';
import {queryOptions} from '@tanstack/react-query';
import {getBootstrapData} from '@ui/bootstrap-data/bootstrap-data-store';

export const billingQueries = {
  products: {
    invalidateKey: ['billing', 'products'],
    index: (loader?: 'landingPage' | 'pricingPage') => {
      const key = ['billing', 'products', 'index'];
      if (loader) {
        key.push(loader);
      }
      return queryOptions<{products: Product[]}>({
        queryKey: key,
        queryFn: () =>
          get<PaginatedBackendResponse<Product>>('billing/products').then(
            r => ({
              products: r.pagination.data,
            }),
          ),
        initialData: () => {
          if (loader) {
            // @ts-ignore
            return getBootstrapData().loaders?.[loader];
          }
        },
      });
    },
    get: (productId: number | string) =>
      queryOptions<{product: Product}>({
        queryKey: ['billing', 'products', 'get', productId],
        queryFn: () => get<{product: Product}>(`billing/products/${productId}`),
      }),
  },
  invoices: {
    invalidateKey: ['billing', 'invoices'],
    index: (userId: number) =>
      queryOptions<{invoices: Invoice[]}>({
        queryKey: ['billing', 'invoices', 'index', userId],
        queryFn: () => get('billing/invoices', {userId}),
      }),
  },
};
