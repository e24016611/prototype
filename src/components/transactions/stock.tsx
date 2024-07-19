import {
  DISPLAY_UNIT_PRICE_POSTFIX,
  NEW_ORDER_ID,
  SELF,
  STOCK,
  UNIT_PRICE_POSTFIX,
} from '@/utils/constants';
import {
  Item,
  Transaction,
  TransactionDetail,
  TransactionKeys,
} from '@/utils/type';
import { Box } from '@mui/material';
import { Row } from '@tanstack/react-table';
import { Dayjs } from 'dayjs';
import { useCallback, useContext, useEffect, useState } from 'react';
import EditableTable from '../common/editable-table';
import {
  createTransaction,
  updateTransaction,
  useTxDispatch,
  useTxSelector,
} from './store';
import { TransactionsContext } from './transaction';

const DISPLAY_HEADER = new Map<TransactionKeys, string>([
  ['seller', '貨源'],
  ['amount', '金額'],
  ['isShipped', '出貨'],
  ['isAccounted', '入帳'],
]);

const IGNORED_HEADER = new Set<TransactionKeys>(['id', 'buyer', 'deleted']);
const DEFAULT_STOCK: Transaction = {
  id: NEW_ORDER_ID,
  buyer: SELF,
  seller: '',
  amount: 0,
  isShipped: false,
  isAccounted: false,
  deleted: false,
  transactionDate: undefined,
  TransactionDetail: [],
};

function isKeyOf<T extends object>(
  key: string | number | symbol,
  obj: T
): key is keyof T {
  return key in obj;
}

export function useItemMap(items: Item[]): Map<string, Item> {
  const [itemMap, setItemMap] = useState<Map<string, Item>>(new Map());

  useEffect(() => {
    if (items.length > 0) {
      const temp = new Map<string, Item>();
      items.forEach((item) => {
        temp.set(item.id.toString(), item);
        temp.set(item.name.toString(), item);
      });
      setItemMap(temp);
    }
  }, [items]);

  return itemMap;
}

export function useToDisplay(
  itemMap: Map<string, Item>,
  displayHeader: Map<TransactionKeys, string>
): (ori: string) => string {
  return useCallback(
    (ori: string) => {
      if (displayHeader.has(ori as TransactionKeys)) {
        return displayHeader.get(ori as TransactionKeys) || ori;
      }

      const [itemId] = ori.split('_');
      const itemName = itemMap.get(itemId)?.name || '';

      return ori.endsWith(UNIT_PRICE_POSTFIX)
        ? `${itemName}${DISPLAY_UNIT_PRICE_POSTFIX}`
        : itemName || ori;
    },
    [itemMap, displayHeader]
  );
}

export function useDisplayData(
  transactions: Transaction[],
  items: Item[]
): [any[], any] {
  const [displayData, setDisplayData] = useState<any[]>([]);
  useEffect(() => {
    if (!transactions || items.length == 0) return;
    const result = transactions.map((transaction) =>
      transactionToDisplay(transaction, items)
    );
    // .sort(compare);
    setDisplayData(result);
  }, [transactions, items]);

  return [displayData, setDisplayData];
}

export function transactionToDisplay(transaction: Transaction, items: Item[]) {
  const details = transaction.TransactionDetail;
  const detailMap: Map<number, TransactionDetail> = new Map();
  details.forEach((detail) => detailMap.set(detail.itemId, detail));
  let result: any = {};
  result.id = transaction.id;
  result.buyer = transaction.buyer;
  result.seller = transaction.seller;
  result.amount = transaction.amount;
  result.isShipped = transaction.isShipped;
  result.isAccounted = transaction.isAccounted;
  result.deleted = transaction.deleted;
  for (const item of items) {
    let quantity: number, unitPrice: number;
    if (detailMap.has(item.id)) {
      quantity = detailMap.get(item.id)!.quantity;
      unitPrice = detailMap.get(item.id)!.unitPrice;
    } else {
      quantity = 0;
      unitPrice = 0;
    }
    result[item.id] = quantity;
    result[item.id.toString() + UNIT_PRICE_POSTFIX] = unitPrice;
  }
  return result;
}

export function useColumnOrder(items: Item[]) {
  const [displayOrder, setDisplayOrder] = useState<string[]>([]);

  useEffect(() => {
    if (items.length > 0) {
      let temp: string[] = ['id', 'buyer', 'seller'];

      items.sort((a, b) => a.id - b.id);
      for (const item of items) {
        temp.push(item.id.toString());
        temp.push(item.id.toString() + UNIT_PRICE_POSTFIX);
      }
      temp = [...temp, 'amount', 'isAccounted', 'isShipped'];
      setDisplayOrder(temp);
    }
  }, [items]);
  return displayOrder;
}

export function useGetRowId() {
  return useCallback(
    (originalRow: Transaction, index: number, parent?: Row<any>) =>
      originalRow.id.toString(),
    []
  );
}

export function useNewTransaction(
  items: Item[],
  defaultTransaction: Transaction,
  category: string,
  transactionDate: Dayjs | null
) {
  const dispatch = useTxDispatch();
  return useCallback(() => {
    if (!transactionDate) return;
    let emptyTransaction: Transaction = {
      ...defaultTransaction,
      transactionDate: transactionDate.toDate(),
      TransactionDetail: [],
    };
    for (const item of items) {
      emptyTransaction.TransactionDetail.push({
        itemId: item.id,
        quantity: 0,
        unitPrice: 0,
      });
    }
    dispatch(
      createTransaction({ category: category, transaction: emptyTransaction })
    );
  }, [items, defaultTransaction, transactionDate, category, dispatch]);
}

export function useUpdateTransactionData(
  itemMap: Map<string, Item>,
  transactions: Transaction[],
  category: string
) {
  const dispatch = useTxDispatch();
  return useCallback(
    (rowId: string, rowIndex: number, columnId: string, value: string) => {
      if (isNaN(+rowId)) return;
      const immutableTransaction = transactions.find((tx) => tx.id === +rowId);
      if (!immutableTransaction) return;
      const transaction = { ...immutableTransaction };
      if (isKeyOf(columnId, DEFAULT_STOCK)) {
        if (typeof transaction[columnId] == 'number' && isNaN(+value)) return;
        (transaction as any)[columnId] = value;
        dispatch(
          updateTransaction({ category: category, transaction: transaction })
        );
        return;
      }
      const itemId = columnId.split('_')[0];
      if (itemMap.has(itemId)) {
        if (isNaN(+value)) return;
        const immutableDetail = transaction.TransactionDetail.find(
          (detail) => detail.itemId == +itemId
        );
        if (!immutableDetail) return;
        const detail = { ...immutableDetail };
        if (columnId.endsWith(UNIT_PRICE_POSTFIX)) detail.unitPrice = +value;
        else detail.quantity = +value;
        transaction.amount += detail.quantity * detail.unitPrice;
        transaction.TransactionDetail = transaction.TransactionDetail.map(
          (temp) => (temp.itemId == +itemId ? detail : temp)
        );
        dispatch(
          updateTransaction({ category: category, transaction: transaction })
        );
      }
    },
    [itemMap, transactions, category, dispatch]
  );
}

export function useRemoveTransaction(
  transactions: Transaction[],
  category: string
) {
  const dispatch = useTxDispatch();
  return useCallback(
    (rowId: string, rowIndex: number) => {
      if (isNaN(+rowId)) return;
      const immutableTransaction = transactions.find((tx) => tx.id === +rowId);
      if (!immutableTransaction) return;
      const transaction = { ...immutableTransaction };
      transaction.deleted = true;
      dispatch(
        updateTransaction({ category: category, transaction: transaction })
      );
    },
    [transactions, category, dispatch]
  );
}

function useStockCompare() {
  return useCallback((row1: Transaction, row2: Transaction) => {
    const id1: number =
      row1.seller === 'stock' ? Number.MIN_SAFE_INTEGER : row1.id;
    const id2: number =
      row2.seller === 'stock' ? Number.MIN_SAFE_INTEGER : row2.id;
    return id1 - id2;
  }, []);
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
  const compare = useStockCompare();
  const [stock, setStock] = useState<Transaction[]>([]);
  const persistingStock = useTxSelector(
    (state) => state.transaction.persistingStock
  );
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
    DEFAULT_STOCK,
    category,
    date
  );

  const updateTransaction = useUpdateTransactionData(
    itemMap,
    transactions,
    category
  );

  const removeTransaction = useRemoveTransaction(transactions, category);

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
