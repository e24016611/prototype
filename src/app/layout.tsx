import NavBar from '@/components/navigation/NavBar';
import Box from '@mui/material/Box';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Create Next App',
  description: 'Generated by create next app',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Box width={'95vw'} height={'95vh'}>
          <NavBar />
          {children}
        </Box>
      </body>
    </html>
  );
}
