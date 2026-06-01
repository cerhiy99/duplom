'use client'
import React, { useState, useEffect } from 'react'
import './TempMailGetName.scss'
import { $host } from '@/app/http'

const TempMailGetName = () => {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isCopied, setIsCopied] = useState(false)

  // Імітація запиту до нашого бекенду (Node.js API на порту 4444 через Nginx proxy /api)
  const generateNewEmail = async () => {
    setIsLoading(true)
    setIsCopied(false)
    

    try {
      let accessKey=Math.random().toString(36).substring(2, 10)
      localStorage.setItem('accessKey', accessKey);
    
      const res=await $host.post('tempEmail/create',{accessKey});
      
      setEmail(res.data.email)
    } catch (error) {
      console.error("Помилка генерації адреси:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Генеруємо першу пошту при завантаженні сторінки
  useEffect(() => {
    generateNewEmail()
  }, [])

  // Функція копіювання адреси в буфер обміну
  const copyToClipboard = () => {
    if (!email || isLoading) return
    navigator.clipboard.writeText(email)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000) // Повертаємо текст кнопки назад через 2 сек
  }

  return (
    <div className='temp-mail-get-name'>
      <div className="your-temp-mail-cont">
        <div className="shield-icon">🛡️</div>
        
        <div className="your-temp-mail">
          <div className="title">ВАША ТИМЧАСОВА СКРИНЬКА</div>
          
          <div className="input-group">
            <input 
              type="text" 
              value={isLoading ? 'Генерація захищеної адреси...' : email} 
              readOnly 
              className={isLoading ? 'loading-text' : ''}
            />
            
            <button 
              onClick={copyToClipboard} 
              disabled={isLoading} 
              className={`copy-btn ${isCopied ? 'copied' : ''}`}
            >
              {isCopied ? 'Скопійовано!' : 'Копіювати'}
            </button>
          </div>
        </div>

        <button 
          onClick={generateNewEmail} 
          disabled={isLoading} 
          className="refresh-btn"
        >
          {isLoading ? (
            <span className="spinner"></span>
          ) : (
            'Згенерувати іншу скриньку'
          )}
        </button>
      </div>
    </div>
  )
}

export default TempMailGetName