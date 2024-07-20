'use client';

import { SELF } from '@/utils/constants';
import { Transaction } from '@/utils/type';
import { useContext, useEffect, useState } from 'react';
import EditableTable from '../common/editable-table';
import { TransactionsContext } from './transaction';
import { useItemMap, useToDisplay } from './utils';

type RealtimeStockProps = {
  transactions: Transaction[];
};

export default function RealtimeStock(props: RealtimeStockProps) {
  const { items } = useContext(TransactionsContext);
  const itemMap = useItemMap(items);
  const toDisplay = useToDisplay(itemMap, new Map());
  const [realtimeStock, setRealtimeStock] = useState<any[]>([]);
  const transactions = props.transactions;
  useEffect(() => {
    const temp = new Map<string, number>();
    for (const transaction of transactions) {
      for (const detail of transaction.TransactionDetail) {
        const itemId = detail.itemId.toString();
        const quantity = temp.get(itemId) ?? 0;
        if (transaction.buyer == SELF)
          temp.set(itemId, quantity + detail.quantity);
        else if (transaction.seller == SELF)
          temp.set(itemId, quantity - detail.quantity);
      }
    }
    setRealtimeStock([Object.fromEntries(temp)]);
  }, [transactions, itemMap]);

  return (
    <EditableTable
      data={realtimeStock}
      setData={setRealtimeStock}
      isEditable={false}
      toDisplay={toDisplay}
    ></EditableTable>
  );
}
