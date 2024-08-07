import { SELF, STOCK } from '@/utils/constants';
import { Category, Item, Transaction, TransactionKeys } from '@/utils/type';
import { Box } from '@mui/material';

import { Row } from '@tanstack/react-table';
import dayjs, { Dayjs } from 'dayjs';
import { useCallback, useContext, useEffect, useState } from 'react';
import EditableTable from '../common/editable-table';
import { OrderMain } from './orders';
import {
  createStockTransaction,
  updateStockTransaction,
  useTxDispatch,
} from './store';
import { TransactionsContext } from './transaction';
import {
  EMPTY_TRANSACTION,
  useColumnOrder,
  useDisplayData,
  useGetRowId,
  useItemMap,
  useNewTransaction,
  useRemoveTransaction,
  useToDisplay,
  useUpdateTransactionData,
} from './utils';

const DISPLAY_HEADER = new Map<TransactionKeys, string>([
  ['seller', '貨源'],
  ['amount', '金額'],
  ['isShipped', '進貨'],
  ['isAccounted', '付款'],
]);

const IGNORED_HEADER = new Set<TransactionKeys>([
  'id',
  'buyer',
  'deleted',
  'childTransactions',
]);
const EMPTY_STOCK: Transaction = {
  ...EMPTY_TRANSACTION,
  buyer: SELF,
};

function useCollapseOrder(
  transactions: Transaction[],
  items: Item[],
  category: Category,
  date: Dayjs | null
) {
  const newTransaction = useNewTransaction(
    items,
    EMPTY_STOCK,
    category.id.toString(),
    date
  );

  return useCallback(
    (rowId: string) => {
      const txId = Number.parseInt(rowId);
      const parentTransaction = transactions.find((tx) => tx.id == txId);
      if (!parentTransaction) return '';
      const childTransactions = parentTransaction.childTransactions;
      const newChildTransaction = (props?: {
        data?: Partial<Transaction>;
        getKey?: () => string;
      }) => {
        const getKey = props?.getKey;
        newTransaction({
          data: {
            parentTransactionId: txId,
            seller: SELF,
            buyer: '',
            ...props?.data,
          },
          getKey: getKey ? () => `${txId}-${getKey()}` : undefined,
        });
      };
      const sourceAndOrders = [...childTransactions, parentTransaction];
      const isLoading = false;
      return (
        date && (
          <OrderMain
            transactions={sourceAndOrders}
            isLoading={isLoading}
            category={category}
            date={date}
            items={items}
            newTransaction={newChildTransaction}
          ></OrderMain>
        )
      );
    },
    [transactions, items, category, date, newTransaction]
  );
}

export default function Stock() {
  const { isLoading, items, transactions, category, date } =
    useContext(TransactionsContext);
  const dispatch = useTxDispatch();

  const itemMap = useItemMap(items);
  const filter = useCallback(
    (tx: Transaction) => !tx.deleted && tx.buyer === SELF,
    []
  );
  const compare = useCallback((row1: Transaction, row2: Transaction) => {
    const id1: number =
      row1.seller === STOCK ? Number.MIN_SAFE_INTEGER : row1.id;
    const id2: number =
      row2.seller === STOCK ? Number.MIN_SAFE_INTEGER : row2.id;
    return id1 - id2;
  }, []);
  const [stock, setStock] = useState<Transaction[]>([]);
  const [isInit, setIsInit] = useState<Boolean>(false);
  const isRowEditable = useCallback(
    (row: Row<any>) => row.getValue('seller') != STOCK,
    []
  );

  useEffect(() => {
    if (isLoading) return;
    const newStock = transactions.filter(filter).sort(compare);
    setStock(newStock);
  }, [isLoading, transactions, filter, compare]);

  useEffect(() => {
    if (isLoading) return;
    setIsInit(false);
  }, [date, category, isLoading]);

  useEffect(() => {
    if (isInit || isLoading || !date) return;
    if (!transactions.some((tx) => tx.buyer == SELF && tx.seller == STOCK)) {
      dispatch(
        createStockTransaction({
          category: category.id.toString(),
          transactionDate: date,
          defaultStock: EMPTY_STOCK,
        })
      );
    } else {
      const stockTransaction = transactions.find(
        (tx) => tx.buyer == SELF && tx.seller == STOCK
      );
      if (
        !stockTransaction ||
        !dayjs(stockTransaction.transactionDate!).isSame(date)
      )
        return;
      dispatch(
        updateStockTransaction({
          category: category.id.toString(),
          currentStock: stockTransaction,
        })
      );
    }
    setIsInit(true);
  }, [isLoading, category, date, transactions, dispatch, isInit]);

  const [displayData] = useDisplayData(stock, items);
  const toDisplay = useToDisplay(itemMap, DISPLAY_HEADER);

  const cellReplace = (value: string) => {
    if (value == STOCK) return '昨日庫存';
    else return value;
  };
  const columnOrder = useColumnOrder(items);
  const getRowId = useGetRowId();
  const newTransaction = useNewTransaction(
    items,
    EMPTY_STOCK,
    category.id.toString(),
    date
  );

  const updateTransaction = useUpdateTransactionData(
    itemMap,
    transactions,
    category.id.toString()
  );

  const removeTransaction = useRemoveTransaction(
    transactions,
    category.id.toString()
  );

  const collapseTable = useCollapseOrder(transactions, items, category, date);

  return (
    <Box>
      {isLoading ? (
        <p>loading...</p>
      ) : (
        <EditableTable
          data={displayData}
          isEditable={true}
          toDisplay={toDisplay}
          ignoredHeader={IGNORED_HEADER}
          cellReplace={cellReplace}
          columnOrder={columnOrder}
          getRowId={getRowId}
          addNewRow={newTransaction}
          updateData={updateTransaction}
          removeRow={removeTransaction}
          isRowEditable={isRowEditable}
          isCollapsible={category.isAgent}
          collapseTable={collapseTable}
        ></EditableTable>
      )}
    </Box>
  );
}
