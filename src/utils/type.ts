import {
  Item as ItemPrisma,
  TransactionDetail as TransactionDetailPrisma,
  Transaction as TransactionPrisma,
} from '@prisma/client';

export type Transaction = Pick<
  TransactionPrisma,
  'id' | 'buyer' | 'seller' | 'amount' | 'isAccounted' | 'isShipped' | 'deleted'
> & {
  TransactionDetail: TransactionDetail[];
  transactionDate: Date | undefined;
};
export type TransactionDetail = Pick<
  TransactionDetailPrisma,
  'itemId' | 'quantity' | 'unitPrice'
>;

export type Item = Pick<ItemPrisma, 'id' | 'name'>;
export type TransactionKeys = keyof TransactionPrisma;
