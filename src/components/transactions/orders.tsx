import { LOSS, SELF } from '@/utils/constants';
import { Transaction, TransactionKeys } from '@/utils/type';
import { Box } from '@mui/material';
import { useCallback, useContext, useEffect, useState } from 'react';
import EditableTable from '../common/editable-table';
import RealtimeStock from './realtime-stock';
import { createTransaction, useTxDispatch } from './store';
import { TransactionsContext } from './transaction';
import {
  EMPTY_TRANSACTION,
  useColumnOrder,
  useDisplayData,
  useEmptyTransactionDetail,
  useGetRowId,
  useItemMap,
  useNewTransaction,
  useRemoveTransaction,
  useToDisplay,
  useUpdateTransactionData,
} from './utils';

const DISPLAY_HEADER = new Map<TransactionKeys, string>([
  ['buyer', '客戶'],
  ['amount', '金額'],
  ['isShipped', '出貨'],
  ['isAccounted', '入帳'],
]);

const IGNORED_HEADER = new Set<TransactionKeys>(['id', 'seller', 'deleted']);
const EMPTY_ORDER: Transaction = {
  ...EMPTY_TRANSACTION,
  seller: SELF,
};

export default function Orders() {
  const { isLoading, items, transactions, category, date } =
    useContext(TransactionsContext);
  const itemMap = useItemMap(items);
  const dispatch = useTxDispatch();
  const filter = useCallback(
    (tx: Transaction) => !tx.deleted && tx.seller === SELF,
    []
  );
  const compare = useCallback((row1: Transaction, row2: Transaction) => {
    const id1: number = row1.buyer === LOSS ? Number.MAX_SAFE_INTEGER : row1.id;
    const id2: number = row2.buyer === LOSS ? Number.MAX_SAFE_INTEGER : row2.id;
    return id1 - id2;
  }, []);
  const [orders, setOrders] = useState<Transaction[]>([]);
  const emptyTransactionDetail = useEmptyTransactionDetail(items);
  const [isInit, setIsInit] = useState<Boolean>(false);
  useEffect(() => {
    setIsInit(false);
  }, [category, date]);
  useEffect(() => {
    if (isInit || isLoading || !date) return;
    if (transactions.some((tx) => tx.buyer == LOSS && tx.seller == SELF))
      return;
    dispatch(
      createTransaction({
        category: category.id.toString(),
        transaction: {
          ...EMPTY_ORDER,
          buyer: LOSS,
          TransactionDetail: emptyTransactionDetail(),
          transactionDate: date.toDate(),
        },
      })
    );
    setIsInit(true);
  }, [
    category,
    date,
    isLoading,
    transactions,
    dispatch,
    emptyTransactionDetail,
    isInit,
  ]);

  useEffect(() => {
    if (isLoading) return;
    const newOrders = transactions.filter(filter).sort(compare);
    setOrders(newOrders);
  }, [isLoading, transactions, filter, compare]);

  const [displayData, setDisplayData] = useDisplayData(orders, items);
  const toDisplay = useToDisplay(itemMap, DISPLAY_HEADER);
  const cellReplace = (value: string) => {
    if (value == LOSS) return '損耗';
    else return value;
  };
  const columnOrder = useColumnOrder(items);
  const getRowId = useGetRowId();
  const newTransaction = useNewTransaction(
    items,
    EMPTY_ORDER,
    category.id.toString(),
    date
  );

  const updateTransactionData = useUpdateTransactionData(
    itemMap,
    transactions,
    category.id.toString()
  );

  const removeTransaction = useRemoveTransaction(
    transactions,
    category.id.toString()
  );

  return (
    <Box>
      {isLoading ? (
        <p>loading...</p>
      ) : (
        <Box>
          <RealtimeStock transactions={transactions}></RealtimeStock>
          <EditableTable
            data={displayData}
            setData={setDisplayData}
            isEditable={true}
            toDisplay={toDisplay}
            ignoredHeader={IGNORED_HEADER}
            cellReplace={cellReplace}
            columnOrder={columnOrder}
            getRowId={getRowId}
            addNewRow={newTransaction}
            updateData={updateTransactionData}
            removeRow={removeTransaction}
          ></EditableTable>
        </Box>
      )}
    </Box>
  );
}
