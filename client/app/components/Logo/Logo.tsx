import Link from 'next/link'
import React from 'react'
import './Logo.scss'

const Logo = () => {
  return (
    <div className='logo-cont'>
        <Link href='/'>
            Анонімна скринька
        </Link>
    </div>
  )
}

export default Logo