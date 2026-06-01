import React from 'react';
import './Home.scss'
import TempMailGetName from './components/TempMailGetName/TempMailGetName';

type Props = {};

const page = (props: Props) => {
  return <div className='home-main'>
    <TempMailGetName />
  </div>;
};

export default page;
