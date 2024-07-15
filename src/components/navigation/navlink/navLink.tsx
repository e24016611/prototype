'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NavLinkItem } from '../NavItem';
import styles from './navLink.module.css';

export default function NavLink(parameter: { item: NavLinkItem }) {
  const pathName = usePathname();
  return (
    <Link
      className={`${styles.navLink} ${
        pathName === parameter.item.path && styles.active
      }`}
      key={parameter.item.path}
      href={parameter.item.path}
    >
      {/* <Image
        className={styles.icon}
        src={parameter.item.icon}
        alt=""
        height={20}
        width={20}
      />{' '} */}
      {parameter.item.icon}&nbsp;&nbsp;{parameter.item.title}
    </Link>
  );
}
