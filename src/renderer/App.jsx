import React, { useState, useEffect, useCallback } from 'react'
import SearchBar from './components/SearchBar.jsx'
import CompanyForm from './components/CompanyForm.jsx'
import CompanyList from './components/CompanyList.jsx'
import StatusBar from './components/StatusBar.jsx'
import { getAllCompanies, addCompany, updateCompany, deleteCompany } from './lib/db.js'
import { rebuildIndex, addToIndex, removeFromIndex } from './lib/search.js'
import {
  startP2PSync,
  handleGetAllDocsRequest,
  handleReceiveDocs,
  pushToAllPeers,
} from './lib/p2pSync.js'
import { syncToCloud } from './lib/cloudSync.js'

export default function App() {
  const [companies, setCompanies] = useState([])
  const [searchResults, setSearchResults] = useState(null)
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [peers, setPeers] = useState([])
  const [cloudStatus, setCloudStatus] = useState('')
  const [loading, setLoading] = useState(true)

  // 🌐 الروابط الجديدة والمستقرة الخاصة بسيرفر Express المباشر
  const API_COMPANIES_URL = 'https://bak-end-pink.vercel.app/api/companies'
  const API_SYNC_URL = 'https://bak-end-pink.vercel.app/api/sync'

  const loadCompanies = useCallback(async () => {
    try {
      if (typeof getAllCompanies === 'function') {
        const docs = await getAllCompanies()
        if (docs && docs.length > 0) {
          setCompanies(docs)
          if (typeof rebuildIndex === 'function') rebuildIndex(docs)
        } else {
          // 🌐 جلب البيانات مباشرة من رابط الـ API الجديد الخاص بك عند عدم وجود بيانات محلية
          const response = await fetch(API_COMPANIES_URL)
          const data = await response.json()
          if (data && data.status === 'success' && data.companies) {
            setCompanies(data.companies)
            if (typeof rebuildIndex === 'function') rebuildIndex(data.companies)
          }
        }
      }
    } catch (error) {
      console.error("خطأ أثناء تحميل الشركات في هذه البيئة:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (window.electronP2P) {
      try {
        loadCompanies()
        if (typeof startP2PSync === 'function') startP2PSync()
        if (typeof handleGetAllDocsRequest === 'function') handleGetAllDocsRequest()
        if (typeof handleReceiveDocs === 'function') handleReceiveDocs()

        window.electronP2P.onPeerDiscovered((_peer) => {
          window.electronP2P.getPeers().then(setPeers).catch(() => {})
        })
        window.electronP2P.getPeers().then(setPeers).catch(() => {})
      } catch (error) {
        console.error("خطأ في ربط دوال الـ P2P:", error)
      }

      const refreshInterval = setInterval(loadCompanies, 15000)
      return () => clearInterval(refreshInterval)
    } else {
      // 🌐 تشغيل الجلب المباشر من الـ API الجديد عند فتح الواجهة من المتصفح (الهاتف)
      loadCompanies()
    }
  }, [loadCompanies])

  const handleAdd = async (data) => {
    if (editing) {
      try {
        const updated = await updateCompany({ ...data, _id: editing._id })
        await loadCompanies()
        setEditing(null)
        setShowForm(false)
        if (typeof pushToAllPeers === 'function') await pushToAllPeers()
      } catch (error) {
        console.error(error)
      }
      return { ok: true }
    }
    try {
      const doc = await addCompany(data)
      if (doc) {
        if (typeof addToIndex === 'function') addToIndex(doc)
        setCompanies((prev) => [...prev, doc].sort((a, b) => a.id - b.id))
      }
      setShowForm(false)
      if (typeof pushToAllPeers === 'function') await pushToAllPeers()
    } catch (error) {
      console.error(error)
    }
    return { ok: true }
  }

  const handleEdit = (company) => {
    setEditing(company)
    setShowForm(true)
  }

  const handleDelete = async (company) => {
    try {
      await deleteCompany(company._id)
      if (typeof removeFromIndex === 'function') removeFromIndex(company)
      setCompanies((prev) => prev.filter((c) => c._id !== company._id))
      if (typeof pushToAllPeers === 'function') await pushToAllPeers()
    } catch (error) {
      console.error(error)
    }
  }

  const handleSearch = (results) => {
    setSearchResults(results)
  }

  const handleCloudSync = async () => {
    setCloudStatus('جارٍ المزامنة مع السحابة...')
    try {
      // 🌐 إرسال طلب الحفظ والمزامنة السحابية مباشرة إلى السيرفر الجديد
      const response = await fetch(API_SYNC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companies: companies })
      })
      const result = await response.json()

      if (result && result.ok) {
        setCloudStatus(`تم رفع ومزامنة ${result.total || companies.length} شركة إلى النسخة السحابية`)
      } else {
        // إذا فشل الاتصال المباشر، يتم الرجوع للدالة الاحتياطية الأصلية
        const fallbackResult = await syncToCloud()
        if (fallbackResult && fallbackResult.ok) {
          setCloudStatus(`تم رفع ${fallbackResult.count} شركة إلى النسخة السحابية`)
        } else {
          setCloudStatus(`فشل: ${result?.error || fallbackResult?.reason || 'خطأ غير معروف'}`)
        }
      }
    } catch (error) {
      setCloudStatus('فشلت المزامنة التلقائية مع الرابط السحابي')
    }
    setTimeout(() => setCloudStatus(''), 5000)
  }

  const displayCompanies = searchResults !== null ? searchResults : companies

  return (
    <div className="min-h-screen flex flex-col" dir="rtl">
      <header className="bg-gradient-to-l from-primary-700 to-primary-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <span className="text-3xl">🏢</span>
              دليل الشركات
            </h1>
            <p className="text-primary-100 text-sm mt-1">
              قاعدة بيانات محلية مع مزامنة لاسلكية ونسخة سحابية احتياطية
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCloudSync}
              className="bg-white/15 hover:bg-white/25 text-white px-4 py-2 rounded-lg font-medium border border-white/20"
            >
              ☁️ نسخة سحابية
            </button>
            <button
              onClick={() => { setEditing(null); setShowForm(true) }}
              className="bg-accent-500 hover:bg-accent-600 text-white px-5 py-2 rounded-lg font-bold shadow-md"
            >
              + إضافة شركة
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-6">
        <SearchBar onSearch={handleSearch} companies={companies} />

        {showForm && (
          <CompanyForm
            onSubmit={handleAdd}
            editing={editing}
            onCancel={() => { setShowForm(false); setEditing(null) }}
          />
        )}

        {loading ? (
          <div className="text-center py-20 text-slate-500 text-lg">جارٍ التحميل...</div>
        ) : (
          <CompanyList
            companies={displayCompanies || []}
            onEdit={handleEdit}
            onDelete={handleDelete}
            isSearch={searchResults !== null}
          />
        )}
      </main>

      <StatusBar
        peerCount={peers ? peers.length : 0}
        totalCount={companies ? companies.length : 0}
        cloudStatus={cloudStatus}
      />
    </div>
  )
}
