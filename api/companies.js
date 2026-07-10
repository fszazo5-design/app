// api/companies.js
// Vercel Serverless Function: جلب واستعراض الشركات من MongoDB Atlas

import { getCompaniesCollection } from './mongodb.js'

export default async function handler(req, res) {
  // إعدادات الـ CORS للسماح بالاتصال من أي مكان
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  // التعامل مع طلبات فحص الاتصال التلقائية
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // السماح فقط بطلبات GET لقراءة البيانات
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      status: "error",
      message: "الرجاء استخدام طريقة GET لجلب البيانات" 
    })
  }

  // ⚠️ فحص وجود المتغير لإرجاع رسالة فشل واضحة إذا لم يتم ربطه في Vercel
  if (!process.env.MONGODB_URI) {
    return res.status(500).json({
      status: "error",
      message: "فشل الاتصال: متغير البيئة MONGODB_URI مفقود في إعدادات Vercel!",
      code: 500
    })
  }

  try {
    // الاتصال بالـ Collection وجلب البيانات
    const collection = await getCompaniesCollection()
    const companies = await collection
      .find({})
      .sort({ id: 1 })
      .toArray()

    // 🎯 رسالة النجاح: إرجاع البيانات مباشرة كـ JSON نظيف للمتصفح
    return res.status(200).json({
      status: "success",
      message: "تم جلب البيانات بنجاح من الباك اند سحابة MongoDB",
      count: companies.length,
      companies: companies, // مصفوفة الشركات
      code: 200
    })

  } catch (err) {
    // ⚠️ رسالة الفشل في حال حدوث خطأ أثناء الاستعلام من قاعدة البيانات
    console.error('Fetch error:', err)
    return res.status(500).json({ 
      status: "error",
      message: "حدث خطأ داخل السيرفر أثناء جلب البيانات",
      error_details: err.message,
      code: 500
    })
  }
}
