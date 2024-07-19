'use client';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PeopleIcon from '@mui/icons-material/People';
import { useCallback, useEffect, useState } from 'react';
import { NavLinkItem } from './NavItem';
import styles from './navbar.module.css';
import NavLink from './navlink/navLink';
const links: NavLinkItem[] = [
  {
    title: '每日交易',
    path: '/transactions',
    icon: <CalendarMonthIcon></CalendarMonthIcon>,
  },
  {
    title: '客戶管理',
    path: '/customers',
    icon: <PeopleIcon></PeopleIcon>,
  },
  {
    title: '數據統計',
    path: '/statistics',
    icon: <AnalyticsIcon></AnalyticsIcon>,
  },
];

export default function NavBar() {
  const [isVisible, setIsVisible] = useState(false);
  const [timer, setTimer] = useState<any>(null);

  const hideNavbar = useCallback(() => {
    setIsVisible(false);
  }, []);

  const showNavbar = useCallback(() => {
    setIsVisible(true);
    if (timer) clearTimeout(timer);
    const newTimer = setTimeout(hideNavbar, 1000);
    setTimer(newTimer);
  }, [timer, hideNavbar]);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (e.clientX <= 20) {
        // 當滑鼠在距離左邊 20px 以內時
        showNavbar();
      }
    },
    [showNavbar]
  );

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (timer) clearTimeout(timer);
    };
  }, [handleMouseMove, timer]);

  return (
    <div>
      <nav
        className={`${styles.navbar} `}
        style={{
          position: 'fixed',
          left: isVisible ? '0' : '-200px',
          zIndex: 1000,
        }}
        onMouseEnter={() => {
          if (timer) clearTimeout(timer);
        }}
        onMouseLeave={showNavbar}
      >
        <div className={styles.navInfo}></div>
        <div className={styles.container}>
          {links.map((link) => (
            <NavLink item={link} key={link.title}></NavLink>
          ))}
        </div>
        <div className={`${styles.navFooter}`}></div>
      </nav>
    </div>
  );
}
