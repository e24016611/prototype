import { STOCK } from '@/utils/constants';
import { DATE_PATTERN } from '@/utils/date';
import { Transaction } from '@/utils/type';
import {
  configureStore,
  createAsyncThunk,
  createSlice,
} from '@reduxjs/toolkit';
import dayjs, { Dayjs } from 'dayjs';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

const HEADERS = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

type TransactionState = {
  transactions: Transaction[];
  isLoading: boolean;
  createState: { [key: string]: boolean };
  error: string[];
};

const initialState: TransactionState = {
  transactions: [],
  isLoading: true,
  createState: {},
  error: [],
};

export const fetchTransactions = createAsyncThunk<
  Transaction[],
  { category: string; transactionDate: Dayjs }
>(
  'transactions/fetchTransactions',
  async ({ category, transactionDate }, { rejectWithValue }) => {
    try {
      const transactionDateStr = transactionDate.format(DATE_PATTERN);
      const result = await (
        await fetch(
          `/api/categories/${category}/transactions?date=${transactionDateStr}`
        )
      ).json();

      return result;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const createTransaction = createAsyncThunk<
  Transaction,
  { category: string; transaction: Transaction; key?: string }
>(
  'transactions/createTransaction',
  async ({ transaction, category }, { rejectWithValue }) => {
    try {
      if (transaction.id != Number.MAX_SAFE_INTEGER)
        throw new Error('Transaction ID Exists');
      const result = await (
        await fetch(`/api/categories/${category}/transactions/`, {
          method: 'PUT',
          headers: HEADERS,
          body: JSON.stringify(transaction),
        })
      ).json();
      return result;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
  {
    condition: ({ key }, { getState }) => {
      const state = getState() as RootState;
      return !key || !state.transaction.createState[key];
    },
  }
);

export const updateTransaction = createAsyncThunk<
  Transaction,
  { category: string; transaction: Transaction }
>(
  'transactions/updateTransaction',
  async ({ transaction, category }, { rejectWithValue }) => {
    try {
      if (transaction.id == Number.MAX_SAFE_INTEGER)
        throw new Error('Invalid Transaction ID');
      const result = await (
        await fetch(
          `/api/categories/${category}/transactions/${transaction.id}`,
          {
            method: 'POST',
            headers: HEADERS,
            body: JSON.stringify(transaction),
          }
        )
      ).json();
      return result;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const createStockTransaction = createAsyncThunk<
  void,
  { category: string; transactionDate: Dayjs; defaultStock: Transaction }
>(
  'transactions/createStockTransaction',
  async (
    { category, transactionDate, defaultStock },
    { rejectWithValue, dispatch }
  ) => {
    try {
      const stock: Transaction = {
        ...defaultStock,
        seller: STOCK,
        transactionDate: transactionDate.toDate(),
        TransactionDetail: [],
      };
      const queryDateStr = transactionDate.format(DATE_PATTERN);
      const statistics: { itemId: number; quantity: number }[] = await (
        await fetch(
          `api/statistics/stock?date=${queryDateStr}&category=${category}`
        )
      ).json();
      if (statistics.length > 0) {
        for (const data of statistics) {
          stock.TransactionDetail.push({
            itemId: +data.itemId,
            quantity: +data.quantity,
            unitPrice: 0,
          });
        }
        dispatch(createTransaction({ category: category, transaction: stock }));
      }
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const updateStockTransaction = createAsyncThunk<
  void,
  { category: string; currentStock: Transaction }
>(
  'transactions/updateStockTransaction',
  async ({ category, currentStock }, { rejectWithValue, dispatch }) => {
    try {
      const stock: Transaction = {
        ...currentStock,
        TransactionDetail: [],
      };
      const queryDateStr = dayjs(currentStock.transactionDate).format(
        DATE_PATTERN
      );
      const statistics: { itemId: number; quantity: number }[] = await (
        await fetch(
          `api/statistics/stock?date=${queryDateStr}&category=${category}`
        )
      ).json();
      if (statistics.length > 0) {
        stock.TransactionDetail = [];
        for (const data of statistics) {
          stock.TransactionDetail.push({
            itemId: +data.itemId,
            quantity: +data.quantity,
            unitPrice: 0,
          });
        }
        dispatch(updateTransaction({ category: category, transaction: stock }));
      }
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const transactionSlice = createSlice({
  name: 'transactions',
  initialState: initialState,
  reducers: {
    createTransaction: (state, action) => {
      const payload = action.payload as Transaction;
      state.transactions.push(payload);
    },
    updateTransaction: (state, action) => {
      const payload = action.payload as Transaction;
      state.transactions = state.transactions.map((transaction) =>
        transaction.id === payload.id ? payload : transaction
      );
    },
    updateTransactions: (state, action) => {
      const payload = action.payload as Transaction[];
      state.transactions = payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTransactions.pending, (state, action) => {
        state.isLoading = true;
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.transactions = action.payload;
        state.isLoading = false;
      })
      .addCase(createTransaction.pending, (state, action) => {
        if (!action.meta.arg.key) return;
        state.createState[action.meta.arg.key] = true;
      })
      .addCase(createTransaction.fulfilled, (state, action) => {
        state.transactions.push(action.payload);
        const parentId = action.payload.parentTransactionId;
        if (parentId) {
          state.transactions.forEach((tx) => {
            if (tx.id == parentId) tx.childTransactions.push(action.payload);
          });
        }
      })
      .addCase(updateTransaction.fulfilled, (state, action) => {
        const incoming = action.payload;
        state.transactions = state.transactions
          .filter((tx) => !tx.deleted)
          .map((tx) => (tx.id == incoming.id ? incoming : tx));
        const parentId = incoming.parentTransactionId;
        if (!parentId) return;
        const parent = state.transactions.find((tx) => tx.id == parentId);
        if (!parent) return;
        parent.childTransactions = parent.childTransactions.map((tx) =>
          tx.id == incoming.id ? incoming : tx
        );
      });
  },
});

export const store = configureStore({
  reducer: { transaction: transactionSlice.reducer },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useTxDispatch: () => AppDispatch = useDispatch;
export const useTxSelector: TypedUseSelectorHook<RootState> = useSelector;
