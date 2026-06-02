'use client'
import React from 'react';
import './Header.scss';
import Link from 'next/link';
import Logo from '../Logo/Logo';
import { useAuth } from '@/app/hooks/useAuth';

type Props = {};

const Header = (props: Props) => {
  const { isAuth, logout, isLoading } = useAuth()

  if (isLoading) return <header>Завантаження шлюзу...</header>
  return (
    <header className='header-wrapper'>
      <div className='header-container'>
        {/* Ліва частина: Логотип */}
        <div className="header-left">
          <Link href="/">
            <Logo />
          </Link>
        </div>

        {/* Центральна частина: Навігація */}
        <nav className="header-nav">
          <Link href="/" className="nav-link active">Тимчасова пошта</Link>
          {isAuth?
            <>
            <Link href="/cabinet" className="nav-link active">Кабінет</Link>
            <Link onClick={logout} href="/" className="nav-link active">Вийти</Link>
            
            </>
            :
            <Link href="/login" className="nav-link active">Авторизуватися</Link>
          }
        </nav>

        {/* Права частина: Статус системи (фішка для кібербезпеки) */}
        <div className="header-right">
          <div className="system-status">
            <span className="status-dot"></span>
            <span className="status-text">UA_NODE: ACTIVE</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;