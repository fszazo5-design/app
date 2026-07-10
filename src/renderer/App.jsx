import React from 'react'

export default function App() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      fontFamily: 'sans-serif',
      backgroundColor: '#f0f2f5',
      color: '#1c1e21',
      direction: 'rtl',
      padding: '20px',
      textAlign: 'center'
    }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🏢 أهلاً بك في دليل الشركات!</h1>
      <p style={{ fontSize: '1.2rem', color: '#606770' }}>
        إذا كنت ترى هذه الصفحة الآن، فهذا يعني أن نظام البناء (Vite + Vercel) يعمل بنجاح 100% وبدون أي مشاكل مسارات!
      </p>
      <div style={{
        marginTop: '20px',
        padding: '10px 20px',
        backgroundColor: '#0070f3',
        color: 'white',
        borderRadius: '5px',
        fontWeight: 'bold'
      }}>
        جاري اختبار الرندرة من الهاتف 📱
      </div>
    </div>
  )
}
