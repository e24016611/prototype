import { LOSS, SELF } from '@/utils/constants';
import { Transaction, TransactionKeys } from '@/utils/type';
import { Box } from '@mui/material';
import { useCallback, useContext, useEffect, useState } from 'react';
import EditableTable from '../common/editable-table';
import { TransactionsContext } from './transaction';
import {
  DEFAULT_TRANSACTION,
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
  ['buyer', '客戶'],
  ['amount', '金額'],
  ['isShipped', '出貨'],
  ['isAccounted', '入帳'],
]);

const IGNORED_HEADER = new Set<TransactionKeys>(['id', 'seller', 'deleted']);
const DEFAULT_ORDER: Transaction = {
  ...DEFAULT_TRANSACTION,
  seller: SELF,
};

export default function Orders() {
  const { isLoading, items, transactions, category, date } =
    useContext(TransactionsContext);
  const itemMap = useItemMap(items);
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
  useEffect(() => {
    if (isLoading) return;
    const newStock = transactions.filter(filter).sort(compare);
    setOrders(newStock);
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
    DEFAULT_ORDER,
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

  return (
    <Box>
      {isLoading ? (
        <p>loading...</p>
      ) : (
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
          updateData={updateTransaction}
          removeRow={removeTransaction}
        ></EditableTable>
      )}
    </Box>
  );
}