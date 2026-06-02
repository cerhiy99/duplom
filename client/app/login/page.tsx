'use client'
import React, { useState } from 'react'
import './Login.scss'
import { $host } from '@/app/http'
import Link from 'next/link'

const LoginPage = () => {
  const [isLoginMode, setIsLoginMode] = useState(true) // Перемикач Вхід / Реєстрація
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    // Валідація на фронтенді
    if (!email || !password) {
      setError('Будь ласка, заповніть усі поля')
      setIsLoading(false)
      return
    }

    try {
      // Визначаємо ендпоінт залежно від режиму
      const endpoint = isLoginMode ? 'user/login' : 'user/register'
      
      const res = await $host.post(endpoint, { email, password })

      if (res.data.token) {
        // Зберігаємо JWT-токен для авторизованих запитів (постійна пошта, псевдоніми)
        localStorage.setItem('token', res.data.token)
        // Перенаправляємо на головну сторінку або в кабінет
        window.location.href = '/'
      }
    } catch (err: any) {
      console.error(err)
      setError(err.response?.data?.message || 'Помилка авторизації. Спробуйте ще раз.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='login-container'>
      <div className='login-card'>
        
        {/* Декоративний кібербезпековий елемент зверху */}
        <div className='auth-shield-header'>
          <div className='shield-icon'>🔐</div>
          <h2>{isLoginMode ? 'Авторизація' : 'Створення акаунту'}</h2>
          <p>{isLoginMode ? 'Увійдіть у систему захисту MailShield' : 'Зареєструйтеся для керування постійними аліасами'}</p>
        </div>

        {error && <div className='auth-error-badge'>⚠️ {error}</div>}

        <form onSubmit={handleSubmit} className='auth-form'>
          <div className='input-field-group'>
            <label htmlFor='email'>Електронна пошта</label>
            <input
              id='email'
              type='email'
              placeholder='name@example.com'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className='input-field-group'>
            <label htmlFor='password'>Пароль захисту</label>
            <input
              id='password'
              type='password'
              placeholder='••••••••'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <button type='submit' className='auth-submit-btn' disabled={isLoading}>
            {isLoading ? (
              <span className='auth-spinner'></span>
            ) : (
              isLoginMode ? 'Увійти в систему' : 'Зареєструватися'
            )}
          </button>
        </form>

        {/* Перемикач режимів знизу карти */}
        <div className='auth-toggle-footer'>
          {isLoginMode ? (
            <p>
              Вперше у нас?{' '}
              <button onClick={() => { setIsLoginMode(false); setError(''); }} type='button'>
                Створити захищений акаунт
              </button>
            </p>
          ) : (
            <p>
              Вже маєте акаунт?{' '}
              <button onClick={() => { setIsLoginMode(true); setError(''); }} type='button'>
                Увійти під своїми даними
              </button>
            </p>
          )}
          <div className='back-to-home'>
            <Link href='/'>← Повернутися до тимчасової пошти</Link>
          </div>
        </div>

      </div>
    </div>
  )
}

export default LoginPage