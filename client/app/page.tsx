import React from 'react';
import './Home.scss'
import TempMailGetName from './components/TempMailGetName/TempMailGetName';
import TempMailMessage from './components/TempMailMessage/TempMailMessage';

type Props = {};

const page = (props: Props) => {
  return <div className='home-main'>
    <TempMailGetName />
    <TempMailMessage />
  </div>;
};

export default page;
