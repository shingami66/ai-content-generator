# ملخص المشروع بالكامل (Frontend + Backend) — AI Content Generation App

## 1) Artificial Intelligence (AI) — Overview

### 1.1 تعريف سريع
الذكاء الاصطناعي (AI) هو مجموعة تقنيات تهدف لجعل الكمبيوتر قادرًا على أداء مهام تتطلب عادةً ذكاءً بشريًا مثل: الفهم، التعلّم، التنبؤ، التعرّف على الأنماط، واتخاذ القرار.

### 1.2 AI applications (تطبيقات الذكاء الاصطناعي)
هذا المشروع مثال عملي على AI في تطبيقات الويب، خصوصًا في:
- توليد المحتوى (صور/فيديو) من وصف نصي.
- تحسين تجربة المستخدم (تقديم خدمة توليد بشكل سلس، حفظ النتائج، معرض محتوى).
- تطبيق قواعد أعمال (Business Rules) مثل الحد اليومي والتعامل مع الاشتراكات.

أمثلة عامة لتطبيقات AI (للمناقشة):
- رؤية حاسوبية: تصنيف الصور، الكشف عن أشياء، OCR.
- معالجة لغة طبيعية: محادثة، تلخيص، ترجمة.
- توصية: توصيات منتجات/أفلام.
- تنبؤ: توقع الطلب، كشف احتيال.

### 1.3 AI types (أنواع الذكاء الاصطناعي)
- **Narrow AI (ذكاء ضيق/متخصص):** ينفذ مهمة محددة بكفاءة (مثل توليد صور من نص).
- **General AI (ذكاء عام):** قادر على أداء مهام متنوعة بمستوى الإنسان (غير متاح عمليًا اليوم).

وبتصنيف آخر:
- **Supervised Learning:** تعلم من بيانات مُعلّمة.
- **Unsupervised Learning:** تعلم من بيانات غير مُعلّمة.
- **Reinforcement Learning:** تعلم بالمكافأة/العقوبة.
- **Generative AI:** توليد محتوى جديد (وهذا هو محور مشروعنا الأساسي).

---

## 2) Generative AI Models (نماذج الذكاء الاصطناعي التوليدي)

### 2.1 Study of generative models (فكرة عمل النماذج التوليدية)
النماذج التوليدية تتعلم أنماط البيانات (صور/نص/فيديو) ثم تنتج مخرجات جديدة مشابهة في الشكل لكن ليست نسخًا حرفية.

في مشروعنا، نستخدم نماذج توليدية كـ خدمات جاهزة (APIs):
- **OpenAI DALL·E 3** لتوليد الصور من وصف نصي.
- **Google Vertex AI Veo** لتوليد فيديو من وصف نصي عبر عملية طويلة (Long Running Operation) مع polling.

### 2.2 Strengths (نقاط القوة)
- **سرعة إنتاج المحتوى** مقارنةً بالإنتاج اليدوي.
- **سهولة الاستخدام**: وصف نصي بسيط ينتج صورة/فيديو.
- **قابلية التوسع**: backend يقدر يتعامل مع عدة طلبات ضمن حدود rate limit.
- **تخصيص**: اختلاف الوصف يؤدي لاختلاف النتائج.

### 2.3 Weaknesses (نقاط الضعف / التحديات)
- **التكلفة**: استدعاءات APIs قد تكون مكلفة.
- **التحكم والجودة**: النتائج قد لا تكون مطابقة 100% للطلب.
- **زمن التوليد للفيديو**: عمليات طويلة تحتاج polling وtimeouts أكبر.
- **الأمان**: حماية مفاتيح الـAPI وملف Service Account وإدارة الوصول.
- **الاعتمادية على مزود خارجي**: أي انقطاع لدى المزود يؤثر على الخدمة.

---

## 3) الفكرة العامة للمشروع (من البداية للنهاية)

### 3.1 جملة واحدة تلخص المشروع
منصة Web Full‑Stack تسمح للمستخدم بتسجيل حساب، ثم توليد صور أو فيديوهات من وصف نصي عبر AI، مع حفظ النتائج في MySQL، وتطبيق حد يومي للمستخدم المجاني واشتراك Premium للتوليد غير المحدود.

### 3.2 المكونات الرئيسية
- **Frontend:** React + TypeScript (داخل `src/frontend/`).
- **Backend:** Node.js + Express (داخل `src/backend/src/`).
- **Database:** MySQL (قاعدة `ai_db`).
- **External AI Providers:** OpenAI (صور) + Vertex AI Veo (فيديو).

---

## 4) Technology Stack (React / Node.js / Express)

### 4.1 Frontend
- React 18 + TypeScript
- Vite (Build/Dev Server)
- React Router (Routing)
- Context API (State Management)

نقطة الدخول المهمة:
- `src/frontend/src/App.tsx` يعرّف Routes الأساسية.

صفحات أساسية ظاهرة في `App.tsx`:
- `/` Landing
- `/login` و`/register` Authentication
- `/dashboard` Dashboard (التوليد)
- `/gallery` Gallery
- `/subscription` Subscription
- `/feedback` Feedback
- `/profile` Profile

### 4.2 Backend
- Node.js + Express
- mysql2/promise للتعامل مع MySQL
- JWT للمصادقة
- bcrypt لتشفير كلمات المرور
- express-validator للتحقق من المدخلات
- express-rate-limit للـ Rate Limiting

نقطة الدخول:
- `src/backend/src/server.js`

---

## 5) System Stakeholders (أصحاب المصلحة) + System Actors

### 5.1 Identify users (أنواع المستخدمين)
- **Guest (زائر):** يزور Landing ويقرر التسجيل/تسجيل الدخول.
- **Registered Free User (مستخدم مجاني):** توليد محدود يوميًا (5/اليوم).
- **Premium User (مستخدم مدفوع/مميز):** توليد غير محدود (عمليًا limit كبير جدًا).

### 5.2 Identify system actors (Actors)
- **User (المستخدم):** يرسل وصف ويطلب توليد.
- **Frontend App (React):** واجهة العرض وإرسال الطلبات.
- **Backend API (Express):** تنفيذ المنطق/الأمان/الحفظ.
- **Database (MySQL):** حفظ المستخدمين والمحتوى والاشتراكات.
- **OpenAI API:** توليد صور.
- **Vertex AI Veo + GCS:** توليد فيديو ثم تنزيله/حفظه محليًا.

---

## 6) Use Case Specification (مواصفات حالات الاستخدام)

### UC-01: تسجيل حساب (Register)
- **Actor:** Guest
- **المسار الأساسي:**
  - المستخدم يملأ بيانات التسجيل.
  - Frontend يرسل `POST /api/auth/register`.
  - Backend يتحقق من صحة المدخلات (validation).
  - Backend يتحقق إن البريد غير مستخدم.
  - Backend يعمل hash للباسورد (bcrypt) ثم يحفظ المستخدم.
- **النتيجة:** حساب جديد.

### UC-02: تسجيل دخول (Login)
- **Actor:** Registered User
- **المسار الأساسي:**
  - `POST /api/auth/login`
  - مقارنة كلمة المرور مع الـhash.
  - إنشاء JWT token لمدة 24 ساعة.
  - إرجاع user info + subscription status.
- **النتيجة:** المستخدم يحصل على token لاستعماله في كل الطلبات المحمية.

### UC-03: التحقق من صلاحية التوكن
- **Actor:** Frontend
- **المسار:** `GET /api/auth/verify` مع `Authorization: Bearer <token>`
- **النتيجة:** تأكيد أن المستخدم ما زال authenticated.

### UC-04: التأكد هل المستخدم يمكنه التوليد اليوم (Daily Limit)
- **Actor:** Frontend
- **المسار:** `GET /api/generations/can-generate/:userId`
- **المنطق:**
  - لو المستخدم Premium (اشتراك active وEndDate > الآن) => unlimited.
  - لو Free => count من جدول `content` لليوم (CURDATE())، limit = 5.

### UC-05: توليد صورة (Generate Image)
- **Actor:** Free/Premium User
- **Endpoint:** `POST /api/content/generate`
- **Body:** `{ userId, type: 'image', description }`
- **الخطوات:**
  - validateContentGeneration
  - authenticateToken
  - استدعاء DALL·E 3 ثم تنزيل الصورة إلى `uploads/` وإرجاع رابط محلي.
  - حفظ سجل في جدول `content`.

### UC-06: توليد فيديو (Generate Video)
- **Actor:** Free/Premium User
- **Endpoint:** `POST /api/content/generate`
- **Body:** `{ userId, type: 'video', description }`
- **الخطوات:**
  - التحقق من متغيرات Veo بالـenv.
  - `generateVideoWithVeo()` (Long Running Operation + polling)
  - الحصول على `gcsUri` (أو base64 احتياطي) ثم تنزيل/حفظ في `uploads/`.
  - حفظ سجل في `content`.

### UC-07: عرض معرض محتوى المستخدم
- **Actor:** User
- **Endpoint:** `GET /api/content/user/:userId`
- **النتيجة:** إرجاع قائمة المحتوى مرتبة بالأحدث.

### UC-08: حذف عنصر محتوى
- **Actor:** User
- **Endpoint:** `DELETE /api/content/:id`
- **النتيجة:** حذف من DB (حسب الكود الحالي).

---

## 7) Class Diagram (تصور الكلاسات والعلاقات) — نصيًا

> الهدف هنا في المناقشة: تثبت أنك فاهم “مين مسؤول عن إيه” في الباك.

### 7.1 System classes (كلاسات النظام)
Backend (Node/Express) عنده Controllers وServices وMiddlewares:
- `AuthController`
- `ContentController`
- `GenerationController`
- (Routes classes كموديولات: `routes/auth.js`, `routes/content.js`, ...)
- `vertexVeoService` كـ Service للتعامل مع Vertex Veo.
- `authenticateToken` كـ Middleware.
- Validators مثل `validateLogin`, `validateRegister`, `validateContentGeneration`.

### 7.2 العلاقات (Relations)
- Route -> Middleware(s) -> Controller
  - مثال: `POST /api/content/generate` يمر عبر:
    - `validateContentGeneration` ثم `authenticateToken` ثم `ContentController.generateContent`
- Controller -> DB (عبر `config/database.js` pool)
- Controller -> External AI Services
  - صور: Controller -> OpenAI
  - فيديو: Controller -> `vertexVeoService.generateVideoWithVeo()`

---

## 8) User Interface Wireframes (وصف Wireframes) — نصيًا

> أنت ممكن ترسمها يدويًا في المناقشة، لكن هنا وصف واضح.

### 8.1 Landing Page (`/`)
- Header + CTA (Login / Sign Up)
- تعريف سريع بالخدمة

### 8.2 Authentication Page (`/login` و`/register`)
- فورم email/password (+ username في التسجيل)
- رسائل أخطاء validation
- عند النجاح: حفظ token ثم redirect للـDashboard

### 8.3 Dashboard (`/dashboard`)
- Textarea لوصف الصورة/الفيديو
- اختيار نوع التوليد (image/video)
- زر Generate
- Loading overlay أثناء التوليد (`isGenerating` في context)
- عرض النتيجة (صورة أو فيديو)

### 8.4 Gallery (`/gallery`)
- Grid/List للمحتوى المولد
- إمكانية حذف عنصر (حسب التصميم)

### 8.5 Subscription (`/subscription`)
- عرض خطط (Free/Premium)
- تفعيل Premium (Test Mode) عبر backend

### 8.6 Profile (`/profile`)
- معلومات المستخدم
- حالة الاشتراك والحد اليومي

---

## 9) API Integration And Security Design

### 9.1 Connecting backend to model (ربط الباك بالموديلات)
- **صور:** داخل `ContentController.generateContent` يتم استدعاء OpenAI DALL·E 3.
- **فيديو:** داخل `ContentController.generateContent` يتم استدعاء `generateVideoWithVeo` من `src/backend/src/services/vertexVeoService.js`.

تدفق Veo باختصار (من DOCS):
- `predictLongRunning` لبدء التوليد
- Polling عبر `fetchPredictOperation` حتى `done=true`
- استلام الناتج `gcsUri` أو `bytesBase64Encoded`
- تنزيل/حفظ في `uploads/` وإرجاع URL محلي

### 9.2 API key protection and access control (حماية المفاتيح والتحكم في الوصول)
- **مفاتيح OpenAI/Gemini/Veo موجودة في `.env` داخل `src/backend/.env`** وليست في frontend.
- **JWT:** كل endpoints الحساسة تستخدم `authenticateToken`.
- **Rate limiting:**
  - عام على `/api/`
  - خاص على login/register
  - خاص على `/api/content/generate`
- **عدم تعريض تفاصيل حساسة في production:**
  - Error handling في `server.js` يقلل تسريب stack في production.

ملاحظة مهمة جدًا للمناقشة:
- ملف Service Account الخاص بـ Google لازم يكون خارج GitHub وموجود في `.gitignore`.

---

## 10) FRONT / Frontend Development — كيف تم تنفيذ UI بـ React

### 10.1 Routing
- `src/frontend/src/App.tsx` يحدد الـroutes.
- Layout يخفي Header/Footer في صفحات auth.

### 10.2 State Management
- Context API عبر `src/frontend/src/context/AppContext.tsx` (حسب وصف الدليل).
- يتم حفظ حالة مثل:
  - user
  - isAuthenticated
  - isGenerating (لـ LoadingOverlay)

### 10.3 API calls
- استدعاءات API موجودة في `src/frontend/src/api/api.ts` (حسب DOCS).
- يتم إرسال `Authorization: Bearer <token>` في الهيدر.

---

## 11) ERROR HANDLING (معالجة الأخطاء)

### 11.1 Backend
- try/catch في controllers
- إرجاع status codes مناسبة:
  - 400 للـvalidation
  - 401 لعدم وجود token/توكن غير صالح
  - 404 route not found
  - 500 أخطاء السيرفر/التكامل

- Middleware Error handler في `src/backend/src/server.js`:
  - في development: يظهر message/stack
  - في production: يخفي التفاصيل

أمثلة أخطاء مهمة متوقعة في المناقشة:
- **OpenAI API key missing** => يرفض التوليد برسالة واضحة.
- **Veo not configured** (env ناقصة) => 500 برسالة إعداد.
- **403 PERMISSION_DENIED** من Vertex => مشكلة IAM Roles.

### 11.2 Frontend
- عرض رسائل للمستخدم عند فشل request
- تعطيل زر Generate أثناء `isGenerating`
- التعامل مع limit reached عبر تجربة المستخدم (modal/redirect للـsubscription)

---

## 12) SERVER AND USER (العلاقة بين السيرفر والمستخدم)

### 12.1 ماذا يرسل المستخدم وماذا يستقبل؟
- المستخدم يرسل: وصف نصي + نوع (image/video).
- السيرفر يستقبل ويطبق:
  - Validation
  - Authentication
  - Rate limit
  - Integration مع AI provider
  - Save في DB
- السيرفر يرجّع:
  - `url` (رابط محلي من `uploads/`)
  - `contentId`
  - metadata مثل type/description

### 12.2 لماذا نحفظ الملفات في uploads ونرجع رابط محلي؟
- تقليل مشاكل CORS.
- ضمان استمرار عرض الملف حتى لو الرابط الخارجي انتهى/تغير.
- توحيد طريقة عرض المحتوى على الفرونت.

---

## 13) Database (MySQL) — الجداول والعلاقات

### 13.1 جداول مهمة
- `registereduser`: المستخدمين
- `content`: المحتوى المولد (وفيه `URL` لحفظ الرابط)
- `subscription`: الاشتراك وتاريخه
- (قد توجد جداول أخرى حسب المشروع مثل payment/feedback)

### 13.2 العلاقات الأساسية
- `registereduser (UserID)` 1..* `content (OwnerID)`
- `registereduser (UserID)` 1..* `subscription (UserID)`

### 13.3 منطق الحد اليومي
- العد يتم من `content` حسب تاريخ اليوم:
  - `WHERE OwnerID = ? AND DATE(DateCreated) = CURDATE()`
- Free limit = 5
- Premium = unlimited (limit كبير)

---

## 14) التدفق End-to-End (مختصر جدًا لكنه مهم)

### 14.1 تدفق توليد صورة
1) المستخدم على Dashboard يضغط Generate Image
2) Frontend يرسل `POST /api/content/generate`
3) Backend:
- validate + auth
- يستدعي OpenAI
- ينزل الصورة لـ uploads
- يحفظ في DB
4) Frontend يعرض الصورة من رابط `/uploads/...png`

### 14.2 تدفق توليد فيديو (Vertex Veo)
1) المستخدم يضغط Generate Video
2) Frontend يرسل `POST /api/content/generate`
3) Backend:
- validate + auth
- يبدأ predictLongRunning
- polling حتى done
- ينزل الناتج من GCS (أو base64)
- يحفظ mp4 في uploads
- يحفظ في DB
4) Frontend يعرض الفيديو من رابط `/uploads/...mp4`

---

## 15) نقاط تركيز “أكيد هيسألوك عنها” (مختصر للمراجعة)
- **الفرق بين Frontend وBackend** في مشروعك بالأمثلة.
- **JWT**: لماذا استخدمته؟ وكيف يمر في Authorization Header؟
- **Rate limiting**: ليه موجود؟ وأين تم تطبيقه؟
- **Validation**: أين؟ وكيف يمنع bad input؟
- **الحد اليومي**: لماذا الحقيقة في DB وليس في UI؟
- **تكامل Veo**: Long running + polling + GCS + تنزيل محلي.
- **حماية مفاتيح الـAPI**: المفاتيح في backend env فقط + Service Account JSON خارج git.

