import { SELF, STOCK } from '@/utils/constants';
import { Transaction, TransactionKeys } from '@/utils/type';
import { Box } from '@mui/material';
import { useCallback, useContext, useEffect, useState } from 'react';
import EditableTable from '../common/editable-table';
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
  ['isShipped', '出貨'],
  ['isAccounted', '入帳'],
]);

const IGNORED_HEADER = new Set<TransactionKeys>(['id', 'buyer', 'deleted']);
const EMPTY_STOCK: Transaction = {
  ...EMPTY_TRANSACTION,
  buyer: SELF,
};

export default function Stock() {
  const { isLoading, items, transactions, category, date } =
    useContext(TransactionsContext);
  //     const dispatch = useTxDispatch();
  //   const persistingStock = useTxSelector(
  //     (state) => state.transaction.persistingStock
  //   );
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
  useEffect(() => {
    if (isLoading) return;
    const newStock = transactions.filter(filter).sort(compare);
    setStock(newStock);
  }, [isLoading, transactions, filter, compare]);

  //   useEffect(() => {
  //     if (isLoading || !date) return;
  //     if (
  //       !persistingStock[date.format(DATE_PATTERN)] &&
  //       !transactions.some((tx) => tx.buyer == SELF && tx.seller == STOCK)
  //     ) {
  //       dispatch(
  //         createStockTransaction({
  //           category: category,
  //           transactionDate: date,
  //           defaultStock: DEFAULT_STOCK,
  //         })
  //       );
  //     } else {
  //       const stockTransaction = transactions.find(
  //         (tx) => tx.buyer == SELF && tx.seller == STOCK
  //       );
  //       if (!stockTransaction) return;
  //     }
  //   }, [persistingStock, isLoading, category, date, transactions, dispatch]);

  const [displayData, setDisplayData] = useDisplayData(stock, items);
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
