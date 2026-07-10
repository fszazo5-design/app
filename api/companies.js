// Vercel Serverless Function: fetch all companies from MongoDB Atlas.
// Used by the desktop app to restore data from the cloud backup.

import { getCompaniesCollection } from './mongodb.js'

export default async function handler(req, res) {
  // إعدادات CORS للسماح لتطبيق الديسكتوب بالاتصال بالسيرفر بدون قيود
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  // التعامل مع طلبات Preflight (OPTIONS)
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // منع أي طلبات غير GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // ⚠️ التحقق من وجود متغير البيئة MONGODB_URI قبل بدء الاتصال بقاعدة البيانات
  if (!process.env.MONGODB_URI) {
    console.error('خطأ: متغير البيئة MONGODB_URI غير معرّف في إعدادات Vercel!');
    return res.status(500).json({ 
      error: 'Database connection string (MONGODB_URI) is missing in environment variables.' 
    })
  }

  try {
    // جلب الـ Collection والبيانات
    const collection = await getCompaniesCollection()
    const companies = await collection
      .find({})
      .sort({ id: 1 })
      .toArray()

    // إرجاع البيانات بنجاح
    return res.status(200).json({ companies })
  } catch (err) {
    console.error('Fetch error:', err)
    return res.status(500).json({ error: err.message })
  }
}
