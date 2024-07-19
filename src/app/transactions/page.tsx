'use client';
import Stock from '@/components/transactions/stock';
import Transactions from '@/components/transactions/transaction';
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
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [date, setDate] = useState<Dayjs | null>(dayjs().startOf('date'));

  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        setCategoryId(data[0].id);
        setCategories(data);
      });
  }, []);

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setCategoryId(newValue);
  };
  return categories.length > 0 ? (
    <Box
      width={'100vw'}
      height={'100vh'}
      display="flex"
      flexDirection={'column'}
      sx={{ border: '2px solid grey' }}
    >
      <Transactions category={categoryId} date={date}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={categoryId}
            onChange={handleChange}
            aria-label="categories"
          >
            {categories.map((item) => (
              <Tab label={item.name} value={item.id} key={item.id} />
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
        {/* <div className={styles.bottom}>
            <Order></Order>
          </div> */}
      </Transactions>
    </Box>
  ) : (
    <p>loading...</p>
  );
}
