import { Transaction } from '@/utils/type';
import { Dayjs } from 'dayjs';
import { createContext, useEffect } from 'react';
import { Provider, TypedUseSelectorHook } from 'react-redux';
import {
  AppDispatch,
  RootState,
  fetchTransactions,
  store,
  useTxDispatch,
  useTxSelector,
} from './store';

function TransactionsProvider({ children }: { children: React.ReactNode }) {
  return <Provider store={store}>{children}</Provider>;
}

function TransactionContext({
  children,
  category: category,
  date: date,
}: Readonly<{
  children: React.ReactNode;
  category: string;
  date: Dayjs | null;
}>) {
  const dispatch = useTxDispatch();
  useEffect(() => {
    if (!date || !category) return;
    dispatch(fetchTransactions({ category, transactionDate: date }));
  }, [category, date, dispatch]);

  const transactions = useTxSelector((state) => state.transaction.transactions);

  return (
    <TransactionsContext.Provider
      value={{
        category: category,
        date: date,
        transactions: transactions,
        useTxDispatch: useTxDispatch,
        useTxSelector: useTxSelector,
      }}
    >
      {children}
    </TransactionsContext.Provider>
  );
}

export type TransactionsContextType = {
  category: string;
  date: Dayjs | null;
  transactions: Transaction[];
  useTxDispatch: () => AppDispatch;
  useTxSelector: TypedUseSelectorHook<RootState>;
};

export const TransactionsContext = createContext<TransactionsContextType>({
  category: '',
  date: null,
  transactions: [],
  useTxDispatch: useTxDispatch,
  useTxSelector: useTxSelector,
});

export default function Transactions({
  children,
  category: category,
  date: date,
}: Readonly<{
  children: React.ReactNode;
  category: string;
  date: Dayjs | null;
}>) {
  return (
    <TransactionsProvider>
      <TransactionContext category={category} date={date}>
        {children}
      </TransactionContext>
    </TransactionsProvider>
  );
}
