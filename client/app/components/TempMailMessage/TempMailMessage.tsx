'use client'
import React, { useState, useEffect } from 'react'
import './TempMailMessage.scss'
import { $host } from '@/app/http'

const TempMailMessage = () => {
  const [letters, setLetters] = useState([])
  const [selectedLetter, setSelectedLetter] = useState<any>(null)
  const [isMailLoading, setIsMailLoading] = useState(false)

  // Функція для завантаження листів з бекенду
  const fetchLetters = async () => {
    const accessKey = localStorage.getItem('accessKey')
    if (!accessKey) return

    try {
      const res = await $host.get('tempEmail/letters?accessKey=' + accessKey)
      if(res.data.data.length==letters.length) return;
      setLetters(res.data.data)
      
    } catch (error) {
      console.error("Помилка при отриманні листів:", error)
    }
  };

  useEffect(() => {
    setIsMailLoading(true)
    fetchLetters().finally(() => setIsMailLoading(false))

    const interval = setInterval(() => {
      fetchLetters()
    }, 3000)

    return () => clearInterval(interval) 
  }, [])

  return (
    <div className='temp-mail-message-container'>
      <div className='mailbox-wrapper'>
        
        {/* Ліва панель: Список листів */}
        <div className='letters-list-panel'>
          <div className='panel-header'>
            <h3>Вхідні листи</h3>
            <span className='badge'>{letters.length}</span>
          </div>

          <div className='letters-scroller'>
            {letters.length === 0 ? (
              <div className='empty-mailbox'>
                {isMailLoading ? (
                  <div className="mini-spinner"></div>
                ) : (
                  <>
                    <div className='animated-envelope'>✉️</div>
                    <p>Очікування нових листів...</p>
                    <span className='sub'>Сторінка оновлюється автоматично</span>
                  </>
                )}
              </div>
            ) : (
              letters.map((letter:any) => (
                <div 
                  key={letter.id} 
                  className={`letter-item ${selectedLetter?.id === letter.id ? 'active' : ''}`}
                  onClick={() => setSelectedLetter(letter)}
                >
                  <div className='letter-meta'>
                    <span className='sender' title={letter.from}>{letter.from.split('<')[0]}</span>
                    <span className='time'>
                      {new Date(letter.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                  <div className='subject'>{letter.subject}</div>
                  <div className='preview-text'>
                    {letter.message.replace(/<[^>]*>/g, '').substring(0, 60)}...
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Права панель: Вміст обраного листа */}
        <div className='letter-content-panel'>
          {selectedLetter ? (
            <div className='full-letter'>
              <div className='letter-header'>
                <h2>{selectedLetter.subject}</h2>
                <div className='info-row'>
                  <div><strong>Від:</strong> {selectedLetter.from}</div>
                  <div><strong>Час:</strong> {new Date(selectedLetter.createdAt).toLocaleString()}</div>
                </div>
              </div>
              
              {/* Рендеримо HTML, який пройшов очищення на нашому бекенді */}
              <div 
                className='letter-body-html'
                dangerouslySetInnerHTML={{ __html: selectedLetter.message }}
              />
            </div>
          ) : (
            <div className='no-letter-selected'>
              <div className='shield-watermark'>🛡️</div>
              <p>Оберіть лист зі списку для перегляду контенту</p>
              <span>Кожен лист перевірено MailShield на наявність XSS та прихованих трекерів</span>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

export default TempMailMessage