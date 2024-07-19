import {
  DISPLAY_UNIT_PRICE_POSTFIX,
  NEW_ORDER_ID,
  UNIT_PRICE_POSTFIX,
} from '@/utils/constants';
import {
  Item,
  Transaction,
  TransactionDetail,
  TransactionKeys,
} from '@/utils/type';
import { Row } from '@tanstack/react-table';
import { Dayjs } from 'dayjs';
import { useCallback, useEffect, useState } from 'react';
import { createTransaction, updateTransaction, useTxDispatch } from './store';

export const DEFAULT_TRANSACTION: Transaction = {
  id: NEW_ORDER_ID,
  buyer: '',
  seller: '',
  amount: 0,
  isShipped: false,
  isAccounted: false,
  deleted: false,
  transactionDate: undefined,
  TransactionDetail: [],
};

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
      if (isKeyOf(columnId, DEFAULT_TRANSACTION)) {
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

function isKeyOf<T extends object>(
  key: string | number | symbol,
  obj: T
): key is keyof T {
  return key in obj;
}
