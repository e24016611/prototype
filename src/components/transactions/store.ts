import { DATE_PATTERN } from '@/utils/date';
import { Transaction } from '@/utils/type';
import {
  configureStore,
  createAsyncThunk,
  createSlice,
} from '@reduxjs/toolkit';
import { Dayjs } from 'dayjs';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

const HEADERS = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

type TransactionState = {
  transactions: Transaction[];
  isLoading: boolean;
  error: string[];
};

const initialState: TransactionState = {
  transactions: [],
  isLoading: true,
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
  { category: string; transaction: Transaction }
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
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.transactions = action.payload;
      })
      .addCase(createTransaction.fulfilled, (state, action) => {
        state.transactions.push(action.payload);
      })
      .addCase(updateTransaction.fulfilled, (state, action) => {
        const incoming = action.payload;
        state.transactions = state.transactions
          .map((tx) => (tx.id == incoming.id ? incoming : tx))
          .filter((tx) => !tx.deleted);
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
