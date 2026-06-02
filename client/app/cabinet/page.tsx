'use client'
import React, { useState, useEffect } from 'react'
import './Cabinet.scss'
import { $authHost } from '@/app/http'
import Link from 'next/link'

interface Alias {
  id: number;
  email: string;
  type: string;
  lettersCount?: number; // Додали поле підрахунку листів з бекенду
}

interface Letter {
  id: number;
  from: string;
  subject: string;
  message: string;
  createdAt: string;
}

const CabinetPage = () => {
  const [aliases, setAliases] = useState<Alias[]>([])
  const [selectedAlias, setSelectedAlias] = useState<Alias | null>(null)
  const [letters, setLetters] = useState<Letter[]>([])
  const [selectedLetter, setSelectedLetter] = useState<Letter | null>(null)
  
  const [newAliasName, setNewAliasName] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isMailLoading, setIsMailLoading] = useState(false)

  // 1. Завантаження списку створених аліасів разом із кількістю листів
  const fetchAliases = async () => {
    try {
      const res = await $authHost.get('private/list')
      if (res.data.success) {
        setAliases(res.data.data)
        // Якщо є аліаси і жоден не обраний — обираємо перший
        if (res.data.data.length > 0 && !selectedAlias) {
          setSelectedAlias(res.data.data[0])
        }
      }
    } catch (err) {
      console.error('Помилка завантаження аліасів', err)
    }
  }

  const fetchLetters = async (email: string) => {
    try {
      const res = await $authHost.get('private/getMyLetters?email='+email)
      if (res.data.success) {
        setLetters(res.data.data) 
      }
    } catch (err) {
      console.error('Помилка завантаження листів', err)
    }
  }

  // 3. Створення нового постійного (reusable) аліасу
  const handleCreateAlias = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!newAliasName.trim()) return

    setIsLoading(true)
    try {
      const res = await $authHost.post('private/create', { customName: newAliasName })
      if (res.data.success) {
        // Додаємо лічильник за замовчуванням для нового запису
        const newAlias = { ...res.data.data, lettersCount: 0 }
        setAliases([...aliases, newAlias])
        setSelectedAlias(newAlias)
        setNewAliasName('')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Помилка створення аліасу')
    } finally {
      setIsLoading(false)
    }
  }

  // 4. Каскадне видалення аліасу та його листів
  const handleDeleteAlias = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation() // Запобігаємо тригеру кліку на вибір самого аліасу
    if (!confirm('Ви впевнені, що хочете видалити цей аліас та всі його листи з бази MariaDB?')) return

    try {
      const res = await $authHost.delete(`private/delete/${id}`)
      if (res.data.success) {
        const updated = aliases.filter(a => a.id !== id)
        setAliases(updated)
        if (selectedAlias?.id === id) {
          setSelectedAlias(updated.length > 0 ? updated[0] : null)
          setLetters([])
          setSelectedLetter(null)
        }
      }
    } catch (err) {
      console.error('Помилка видалення аліасу', err)
    }
  }

  // Первинне завантаження списку адрес
  useEffect(() => {
    fetchAliases()
  }, [])

  // Асинхронний моніторинг повідомлень (Short Polling) при зміні обраної адреси
  useEffect(() => {
    if (!selectedAlias) return
    
    setLetters([])
    setSelectedLetter(null)
    setIsMailLoading(true)
    fetchLetters(selectedAlias.email).finally(() => setIsMailLoading(false))

    const interval = setInterval(() => {
      fetchLetters(selectedAlias.email)
      // Оновлюємо також і лічильники листів у списку аліасів
      fetchAliases()
    }, 5000)

    return () => clearInterval(interval)
  }, [selectedAlias])

  return (
    <div className='cabinet-container'>
      <div className='cabinet-grid-layout'>
        
        {/* ЛІВА ПАНЕЛЬ: Керування аліасами */}
        <div className='alias-management-panel'>
          <div className='panel-section-title'>
            <h3>🛡️ Захищені аліаси</h3>
            <span className='alias-count-badge'>{aliases.length}</span>
          </div>

          {/* Форма створення кастомного аліасу */}
          <form onSubmit={handleCreateAlias} className='create-alias-form'>
            <div className='alias-input-wrapper'>
              <input 
                type='text' 
                placeholder='назва-аліасу'
                value={newAliasName}
                onChange={(e) => setNewAliasName(e.target.value)}
                disabled={isLoading}
              />
              <span className='domain-label'>@mail-tmp.xyz</span>
            </div>
            {error && <span className='input-error-msg'>{error}</span>}
            <button type='submit' className='create-alias-btn' disabled={isLoading}>
              {isLoading ? <span className='btn-spinner'></span> : 'Додати адресу'}
            </button>
          </form>

          {/* Список створених пошт */}
          <div className='alias-list-scroller'>
            {aliases.length === 0 ? (
              <div className='no-aliases-blank'>
                <p>У вас немає постійних скриньок</p>
                <span>Створіть свій перший захищений ідентифікатор вище</span>
              </div>
            ) : (
              aliases.map((alias) => (
                <div 
                  key={alias.id} 
                  className={`alias-list-item ${selectedAlias?.id === alias.id ? 'active' : ''}`}
                  onClick={() => setSelectedAlias(alias)}
                >
                  <div className='alias-info'>
                    <span className='alias-email-text'>{alias.email}</span>
                    {/* Виводимо динамічну кількість листів, що повернув Sequelize */}
                    <span className='alias-letters-count-badge'>
                      ✉️ {alias.lettersCount || 0}
                    </span>
                  </div>
                  <button 
                    onClick={(e) => handleDeleteAlias(alias.id, e)} 
                    className='delete-alias-icon-btn'
                    title='Видалити аліас'
                  >
                    🗑️
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ЦЕНТРАЛЬНА ПАНЕЛЬ: Список листів обраного аліасу */}
        <div className='cabinet-letters-list-panel'>
          <div className='panel-section-title'>
            <h3>Вхідні повідомлення</h3>
          </div>
          
          <div className='cabinet-letters-scroller'>
            {!selectedAlias ? (
              <div className='select-alias-prompt'>Оберіть аліас зліва</div>
            ) : letters.length === 0 ? (
              <div className='cabinet-empty-mailbox'>
                {isMailLoading ? <div className='loader-spin'></div> : '✉️ Очікування листів...'}
              </div>
            ) : (
              letters.map((letter) => (
                <div 
                  key={letter.id} 
                  className={`cabinet-letter-item ${selectedLetter?.id === letter.id ? 'active' : ''}`}
                  onClick={() => setSelectedLetter(letter)}
                >
                  <div className='letter-top-row'>
                    <span className='sender-name'>{letter.from.split('<')[0]}</span>
                    <span className='letter-time-badge'>
                      {new Date(letter.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                  <div className='letter-subject-line'>{letter.subject}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ПРАВА ПАНЕЛЬ: Вміст конкретного листа */}
        <div className='cabinet-letter-view-panel'>
          {selectedLetter ? (
            <div className='cabinet-full-letter-wrapper'>
              <div className='cabinet-letter-header'>
                <h2>{selectedLetter.subject}</h2>
                <div className='sender-details'>
                  <p><strong>Від:</strong> {selectedLetter.from}</p>
                  <p><strong>Отримано:</strong> {new Date(selectedLetter.createdAt).toLocaleString()}</p>
                </div>
              </div>
              <div 
                className='cabinet-letter-body-html'
                dangerouslySetInnerHTML={{ __html: selectedLetter.message }}
              />
            </div>
          ) : (
            <div className='cabinet-no-letter-placeholder'>
              <div className='watermark-shield'>🛡️</div>
              <p>Оберіть лист для безпечного перегляду</p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

export default CabinetPage;