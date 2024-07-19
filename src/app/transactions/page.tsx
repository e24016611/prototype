'use client';
import Orders from '@/components/transactions/orders';
import Stock from '@/components/transactions/stock';
import Transactions from '@/components/transactions/transaction';
import { Category } from '@/utils/type';
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs, { Dayjs } from 'dayjs';
import { useEffect, useState } from 'react';
import styles from './transactions.module.css';

export default function Page() {
  const [category, setCategory] = useState<Category>();
  const [categories, setCategories] = useState<Category[]>([]);
  const [date, setDate] = useState<Dayjs | null>(dayjs().startOf('date'));

  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        setCategory(data[0]);
        setCategories(data);
      });
  }, []);

  const handleChange = (event: React.SyntheticEvent, newValue: Category) => {
    setCategory(newValue);
  };
  return categories.length > 0 && category ? (
    <Box
      width={'100vw'}
      height={'100vh'}
      display="flex"
      flexDirection={'column'}
      sx={{ border: '2px solid grey' }}
    >
      <Transactions category={category} date={date}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={category}
            onChange={handleChange}
            aria-label="categories"
          >
            {categories.map((item) => (
              <Tab label={item.name} value={item} key={item.id} />
            ))}
          </Tabs>
        </Box>
        <Box>
          <LocalizationProvider
            dateAdapter={AdapterDayjs}
            adapterLocale="zh-tw"
          >
            <DatePicker value={date} onChange={(date) => setDate(date)} />
          </LocalizationProvider>
        </Box>
        <div className={styles.top}>
          <Stock></Stock>
        </div>
        <div className={styles.bottom}>
          <Orders></Orders>
        </div>
      </Transactions>
    </Box>
  ) : (
    <p>loading...</p>
  );
}
