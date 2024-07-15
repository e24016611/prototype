import {
  TransactionDetail as TransactionDetailPrisma,
  Transaction as TransactionPrisma,
} from '@prisma/client';

export type Transaction = Pick<
  TransactionPrisma,
  'id' | 'buyer' | 'seller' | 'amount' | 'isAccounted' | 'isShipped' | 'deleted'
> & { TransactionDetail: TransactionDetail[] };
export type TransactionDetail = Pick<
  TransactionDetailPrisma,
  'itemId' | 'quantity' | 'unitPrice'
>;
