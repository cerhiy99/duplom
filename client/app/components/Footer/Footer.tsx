import React from 'react';

type Props = {};

const Footer = (props: Props) => {
  return (
    <div style={{display:'flex',justifyContent:'center',alignItems:'center', height:'50px'}} className='footer'>
      © 2026 Анонімна скринька. Зроблено з повагою до вашої приватності.
    </div>
  );
};

export default Footer;
