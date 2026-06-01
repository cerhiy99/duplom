import React from 'react';
import './Header.scss'
import Link from 'next/link';
import Logo from '../Logo/Logo';

type Props = {};

const Header = (props: Props) => {
  return (
    <div className='header-container'>
      <Logo/>
    </div>
  );
};

export default Header;
