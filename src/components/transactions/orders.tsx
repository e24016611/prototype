import { COMMISSION, LOSS, SELF, TRANSPORT, WORKER } from '@/utils/constants';
import { Category, Item, Transaction, TransactionKeys } from '@/utils/type';
import { Box } from '@mui/material';
import { Dayjs } from 'dayjs';
import { useCallback, useContext, useEffect, useState } from 'react';
import EditableTable from '../common/editable-table';
import RealtimeStock from './realtime-stock';
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

const AGENT_INIT_LIST = [WORKER, TRANSPORT, COMMISSION];

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

const ROW_ORDERS: { [key: string]: number } = {
  LOSS: 4,
  WORKER: 3,
  TRANSPORT: 2,
  COMMISSION: 1,
};

function hasBuyer(transactions: Transaction[], buyer: string) {
  return transactions.some((tx) => tx.buyer == LOSS && tx.seller == SELF);
}

export type OrderMainProps = {
  isLoading: boolean;
  items: Item[];
  transactions: Transaction[];
  category: Category;
  date: Dayjs;
  newTransaction: (props?: {
    data?: Partial<Transaction>;
    getKey?: () => string;
  }) => void;
};

export function OrderMain(props: OrderMainProps) {
  const { isLoading, items, transactions, category, date, newTransaction } =
    props;
  const itemMap = useItemMap(items);
  const filter = useCallback(
    (tx: Transaction) => !tx.deleted && tx.seller === SELF,
    []
  );
  const compare = useCallback((row1: Transaction, row2: Transaction) => {
    const id1: number = ROW_ORDERS[row1.buyer]
      ? Number.MAX_SAFE_INTEGER - ROW_ORDERS[row1.buyer]
      : row1.id;
    const id2: number = ROW_ORDERS[row2.buyer]
      ? Number.MAX_SAFE_INTEGER - ROW_ORDERS[row1.buyer]
      : row2.id;
    return id1 - id2;
  }, []);
  const [orders, setOrders] = useState<Transaction[]>([]);
  const [isInit, setIsInit] = useState<Boolean>(false);
  useEffect(() => {
    setIsInit(false);
  }, [category, date]);
  useEffect(() => {
    if (isInit || isLoading) return;
    if (!hasBuyer(transactions, LOSS)) {
      newTransaction({
        data: {
          buyer: LOSS,
        },
        getKey: () => LOSS,
      });
    }

    if (category.isAgent) {
      for (const buyer of AGENT_INIT_LIST) {
        if (hasBuyer(transactions, buyer)) continue;
        newTransaction({
          data: {
            buyer: buyer,
          },
          getKey: () => buyer,
        });
      }
    }
    setIsInit(true);
  }, [isLoading, transactions, newTransaction, isInit, category]);

  useEffect(() => {
    if (isLoading) return;
    const newOrders = transactions.filter(filter).sort(compare);
    setOrders(newOrders);
  }, [isLoading, transactions, filter, compare]);

  const [displayData, setDisplayData] = useDisplayData(orders, items);
  const toDisplay = useToDisplay(itemMap, DISPLAY_HEADER);
  const cellReplace = (value: string) => {
    if (value == LOSS) return '損耗';
    else if (value == WORKER) return '工錢';
    else if (value == COMMISSION) return '佣金';
    else if (value == TRANSPORT) return '運費';
    else return value;
  };
  const columnOrder = useColumnOrder(items);
  const getRowId = useGetRowId();

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

export default function Orders() {
  const { isLoading, items, transactions, category, date } =
    useContext(TransactionsContext);
  const newTransaction = useNewTransaction(
    items,
    EMPTY_ORDER,
    category.id.toString(),
    date
  );
  return date ? (
    <OrderMain
      isLoading={isLoading}
      items={items}
      transactions={transactions}
      category={category}
      date={date}
      newTransaction={newTransaction}
    ></OrderMain>
  ) : (
    <p>loading... </p>
  );
}
