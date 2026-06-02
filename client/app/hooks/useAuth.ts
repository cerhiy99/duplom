'use client'
import { useState, useEffect } from 'react'

export const useAuth = () => {
  const [token, setToken] = useState<string|null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    setToken(savedToken)
    setIsLoading(false)
  }, [])

  const login = (newToken:string) => {
    localStorage.setItem('token', newToken)
    setToken(newToken)
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    window.location.href = '/'
  }

  // Перевірка: чи авторизований юзер (для рендерингу інтерфейсу)
  const isAuth = !!token 

  return { token, isAuth, isLoading, login, logout }
}