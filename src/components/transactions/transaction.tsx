import { Category, Item, Transaction } from '@/utils/type';
import { Dayjs } from 'dayjs';
import { createContext, useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import {
  fetchTransactions,
  store,
  useTxDispatch,
  useTxSelector,
} from './store';

export type TransactionsContextType = {
  category: Category;
  date: Dayjs | null;
  transactions: Transaction[];
  items: Item[];
  isLoading: boolean;
};

export const TransactionsContext = createContext<TransactionsContextType>({
  category: { id: -1, name: '', isAgent: false },
  date: null,
  transactions: [],
  items: [],
  isLoading: true,
});

export default function Transactions({
  children,
  category: category,
  date: date,
}: Readonly<{
  children: React.ReactNode;
  category: Category;
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

function TransactionsProvider({ children }: { children: React.ReactNode }) {
  return <Provider store={store}>{children}</Provider>;
}

function TransactionContext({
  children,
  category: category,
  date: date,
}: Readonly<{
  children: React.ReactNode;
  category: Category;
  date: Dayjs | null;
}>) {
  const [items, setItems] = useState<Item[]>([]);
  const dispatch = useTxDispatch();
  const fetchItems = async (category: string) => {
    const fetchItems = fetch(`/api/categories/${category}/items`)
      .then((res) => res.json())
      .then((data) => {
        setItems(data);
      });

    return fetchItems;
  };

  useEffect(() => {
    if (!category) return;
    fetchItems(category.id.toString());
  }, [category]);

  useEffect(() => {
    if (!date || !category) return;
    dispatch(
      fetchTransactions({
        category: category.id.toString(),
        transactionDate: date,
      })
    );
  }, [category, date, dispatch]);

  const transactions = useTxSelector((state) => state.transaction.transactions);
  const isLoading = useTxSelector((state) => state.transaction.isLoading);

  return (
    <TransactionsContext.Provider
      value={{
        category: category,
        date: date,
        transactions: transactions,
        items: items,
        isLoading: isLoading,
      }}
    >
      {children}
    </TransactionsContext.Provider>
  );
}
