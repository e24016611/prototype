import {
  Category as CategoryPrisma,
  Item as ItemPrisma,
  TransactionDetail as TransactionDetailPrisma,
  Transaction as TransactionPrisma,
} from '@prisma/client';

export type Category = Pick<CategoryPrisma, 'id' | 'name' | 'isAgent'>;

export type Transaction = Pick<
  TransactionPrisma,
  | 'id'
  | 'buyer'
  | 'seller'
  | 'amount'
  | 'isAccounted'
  | 'isShipped'
  | 'deleted'
  | 'parentTransactionId'
> & {
  TransactionDetail: TransactionDetail[];
  transactionDate: Date | undefined;
  childTransactions: Transaction[];
};
export type TransactionDetail = Pick<
  TransactionDetailPrisma,
  'itemId' | 'quantity' | 'unitPrice'
>;

export type Item = Pick<ItemPrisma, 'id' | 'name'>;
export type TransactionKeys = keyof TransactionPrisma;
