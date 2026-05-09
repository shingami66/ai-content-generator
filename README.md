# 🤖 AI Content Generation App

تطبيق ويب متطور لتوليد المحتوى باستخدام الذكاء الاصطناعي، مبني باستخدام React و Node.js

## ✨ المميزات

- 🎨 **توليد الصور** باستخدام OpenAI DALL-E
- 🔐 **نظام مصادقة متقدم** مع JWT tokens
- 👤 **إدارة المستخدمين** الكاملة (تسجيل، تسجيل دخول، ملف شخصي)
- 💳 **نظام اشتراكات** مع خطط مختلفة (مجاني/مدفوع)
- 📊 **تتبع استخدام المستخدم** وحدود التوليد
- 🖼️ **معرض المحتوى** الشخصي
- 💬 **نظام تقييم** للمستخدمين
- 📱 **تصميم متجاوب** يعمل على جميع الأجهزة

## 🛠️ التقنيات المستخدمة

### Frontend
- **React 18** مع TypeScript
- **Vite** للبناء والتطوير
- **React Router** للتنقل
- **Custom CSS** للتصميم
- **Context API** لإدارة الحالة

### Backend
- **Node.js** مع Express.js
- **MySQL** قاعدة البيانات
- **JWT** للمصادقة
- **bcrypt** لتشفير كلمات المرور
- **express-validator** للتحقق من صحة البيانات

### APIs الخارجية
- **OpenAI DALL-E** لتوليد الصور
- **Google Gemini** لتوليد النصوص (Endpoint منفصل)

## 🚀 كيفية التشغيل

### متطلبات النظام
- Node.js (الإصدار 16 أو أحدث)
- MySQL Server
- npm أو yarn

### خطوات التثبيت

1. **استنساخ المشروع**
   ```bash
   git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   cd ai-app
   ```

2. **تثبيت dependencies الخلفية**
   ```bash
   cd backend
   npm install
   ```

3. **تثبيت dependencies الأمامية**
   ```bash
   cd ../frontend
   npm install
   ```

4. **إعداد قاعدة البيانات**
   - قم بإنشاء قاعدة بيانات MySQL جديدة
   - قم بتحديث ملف `.env` في مجلد backend

5. **تشغيل الخادم**
   ```bash
   # في terminal منفصل للخلفية
   cd backend
   npm run dev

   # في terminal منفصل للأمامية
   cd frontend
   npm run dev
   ```

6. **افتح المتصفح**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:3001

## 🔧 متغيرات البيئة

أنشئ ملف `.env` في مجلد `backend` بالمحتوى التالي:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=ai_db
DB_PORT=3306

# JWT Secret
JWT_SECRET=your_jwt_secret_key

# OpenAI API
OPENAI_API_KEY=your_openai_api_key

# Gemini API (Optional)
GEMINI_API_KEY=your_gemini_api_key

# Vertex AI Veo (Video)
VERTEX_PROJECT_ID=your_gcp_project_id
VERTEX_LOCATION=us-central1
VERTEX_VEO_MODEL_ID=veo-3.1-generate-preview
VERTEX_GCS_OUTPUT_URI=gs://your_bucket/veo-results
GOOGLE_APPLICATION_CREDENTIALS=backend/keys/veo-sa.json

# Server Port
PORT=3001
```

## 📁 هيكل المشروع

```
ai-app/
├── backend/                 # خادم Node.js
│   ├── src/
│   │   ├── config/         # إعدادات قاعدة البيانات
│   │   ├── middlewares/    # middlewares المخصصة
│   │   ├── routes/         # routes الـ API
│   │   └── services/       # خدمات الخادم
│   └── uploads/            # الملفات المرفوعة
├── frontend/                # تطبيق React
│   ├── src/
│   │   ├── api/            # ملفات API
│   │   ├── components/     # مكونات React
│   │   ├── context/        # Context للحالة العامة
│   │   ├── hooks/          # Custom hooks
│   │   └── pages/          # صفحات التطبيق
│   └── public/             # الملفات الثابتة
└── DOCS/                   # التوثيق
```

## 🔒 الأمان

- ✅ تشفير كلمات المرور باستخدام bcrypt
- ✅ مصادقة JWT tokens بدون fallback غير آمن
- ✅ التحقق الشامل من صحة البيانات (frontend + backend)
- ✅ حماية CORS
- ✅ تصفية المدخلات لمنع XSS
- ✅ إزالة تخزين بيانات البطاقات من localStorage
- ✅ rate limiting لمنع الهجمات
- ✅ التحقق من صحة البيانات في الإنتاج

## 📊 قاعدة البيانات

الجداول الرئيسية:
- `registereduser` - بيانات المستخدمين
- `content` - المحتوى المولد
- `subscription` - الاشتراكات
- `generations` - تتبع التوليد

## 🚀 التحديثات الأخيرة (v1.1.0)

### ✅ إصلاحات الأمان الحرجة
- إزالة تخزين بيانات البطاقات الائتمانية من localStorage
- إصلاح JWT secret fallback غير الآمن
- إضافة rate limiting شامل
- تحسين التحقق من صحة البيانات

### ✅ تحسينات الأداء
- إضافة database indexes للأداء الأفضل
- تحسين TypeScript types
- إصلاح Runway API integration
- تحسين validation في الفرونت اند

### ✅ تحسينات الجودة
- إزالة استخدام `any` types
- إضافة validation أفضل للمستخدمين
- تحسين error handling
- تنظيف الكود

---

## 🤝 المساهمة

نرحب بالمساهمات! يرجى اتباع الخطوات التالية:

1. Fork المشروع
2. أنشئ branch جديد (`git checkout -b feature/AmazingFeature`)
3. Commit التغييرات (`git commit -m 'Add some AmazingFeature'`)
4. Push للbranch (`git push origin feature/AmazingFeature`)
5. افتح Pull Request

## 📝 الترخيص

هذا المشروع مرخص تحت رخصة MIT - راجع ملف [LICENSE](LICENSE) للتفاصيل.

## 📞 التواصل

- **المطورين **: [مظفر محمد -فاطمة -احمد ابو بكر -لينة يحي]
- **البريد الإلكتروني**: mozfer524@gmail.com
- **GitHub**: [https://github.com/shingami66(https://github.com/shingami66)


⭐ إذا أعجبك المشروع، لا تنس إعطاؤه نجمة!
