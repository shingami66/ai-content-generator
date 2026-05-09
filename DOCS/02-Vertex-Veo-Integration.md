# Vertex AI Veo Integration (Backend + Frontend)

## الهدف
هذا المستند يشرح تكامل توليد الفيديو عبر **Google Vertex AI Veo** داخل المشروع، بدل Runway، من لحظة ضغط المستخدم زر التوليد في الـ Frontend إلى حفظ الفيديو في قاعدة البيانات وإرجاع رابط محلي قابل للعرض.

---

## نظرة عامة على التدفق (End-to-End Flow)
- Frontend (`DashboardPage.tsx`) يرسل طلب توليد محتوى.
- Frontend يستدعي `contentAPI.generateContent()` من `src/frontend/src/api/api.ts`.
- الطلب يذهب إلى Backend Endpoint:
  - `POST /api/content/generate`
- Backend يمر عبر:
  - `validateContentGeneration`
  - `authenticateToken`
  - `ContentController.generateContent`
- إذا `type === "video"`:
  - Backend يستدعي `generateVideoWithVeo()` من `src/backend/src/services/vertexVeoService.js`
  - هذا ينفّذ:
    - `predictLongRunning` لبدء عملية توليد الفيديو (Long Running Operation)
    - `fetchPredictOperation` عبر polling حتى `done = true`
  - ثم Backend يحصل على ناتج الفيديو من:
    - `gcsUri` (مُفضل) أو `bytesBase64Encoded` (احتياطي)
  - ثم Backend ينزل الفيديو إلى `src/backend/src/uploads/` ويرجّع رابط محلي `http://localhost:3001/uploads/...mp4`
- أخيرًا Backend يحفظ المحتوى في جدول `content` ويرجع response للفرونت.

---

## ملفات التكامل الأساسية

### 1) Endpoint وربط التوليد
- **Backend Route:** `src/backend/src/routes/content.js`
  - `router.post('/generate', validateContentGeneration, authenticateToken, ContentController.generateContent)`

### 2) منطق التوليد (Controller)
- **File:** `src/backend/src/controllers/contentController.js`
- أهم نقاط في مسار الفيديو:
  - يتحقق من وجود متغيرات البيئة:
    - `VERTEX_PROJECT_ID`
    - `VERTEX_LOCATION`
    - `VERTEX_VEO_MODEL_ID`
    - `VERTEX_GCS_OUTPUT_URI`
    - `GOOGLE_APPLICATION_CREDENTIALS`
  - ينفّذ `generateVideoWithVeo({ prompt, durationSeconds, aspectRatio })`
  - إذا رجع `gcsUri`:
    - يتم تنزيل الفيديو من GCS إلى `uploads/` باستخدام `@google-cloud/storage`
  - إذا رجع `bytesBase64Encoded`:
    - يتم كتابته كملف mp4 داخل `uploads/`

### 3) خدمة Veo (Vertex AI API)
- **File:** `src/backend/src/services/vertexVeoService.js`
- مسؤولياتها:
  - الحصول على Access Token باستخدام `google-auth-library` عبر Service Account JSON.
  - إرسال طلب بدء التوليد إلى:
    - `.../publishers/google/models/{MODEL_ID}:predictLongRunning`
  - حفظ `operationName`.
  - Polling عبر:
    - `.../publishers/google/models/{MODEL_ID}:fetchPredictOperation`
  - عند `done: true` ترجع:
    - `gcsUri` أو `bytesBase64Encoded`

---

## متغيرات البيئة المطلوبة (Backend)
ضعها في: `src/backend/.env`

```env
VERTEX_PROJECT_ID=gen-lang-client-0483781688
VERTEX_LOCATION=us-central1
VERTEX_VEO_MODEL_ID=veo-3.1-generate-preview
VERTEX_GCS_OUTPUT_URI=gs://veo-video-output32/veo-results
GOOGLE_APPLICATION_CREDENTIALS=Key/gen-lang-client-0483781688-dd0a774c14c0.json
```

ملاحظة: يُفضّل في ويندوز استخدام مسار كامل لـ `GOOGLE_APPLICATION_CREDENTIALS` لتجنب مشاكل relative paths.

---

## إعدادات Google Cloud المطلوبة (IAM + APIs)

### 1) تفعيل الـ APIs
- فعّل:
  - **Vertex AI API** (`aiplatform.googleapis.com`)

### 2) صلاحيات Service Account
الخطأ الذي ظهر:
- `Permission 'aiplatform.endpoints.predict' denied ...` (403)

يعني أن Service Account يحتاج Role مناسب. الحد الأدنى غالبًا:
- **Vertex AI User**: `roles/aiplatform.user`

### 3) صلاحيات Cloud Storage (Bucket)
لأننا نكتب الناتج إلى:
- `gs://veo-video-output32/veo-results`

Service Account يحتاج صلاحية كتابة/قراءة على الـ bucket مثل:
- **Storage Object Admin**: `roles/storage.objectAdmin`

---

## ملاحظات تشغيلية

### مدة الفيديو والـ Polling
- Veo يعمل Long Running Operation.
- في `vertexVeoService.js` الافتراضي:
  - `maxAttempts = 120`
  - `intervalMs = 5000`
  - يعني ~ 10 دقائق كحد أقصى.

### Serving الفيديو للفرونت
- الفيديو يُخزن محليًا في `uploads/` ويُعرض عبر:
  - `app.use('/uploads', express.static(...))`

---

## أخطاء شائعة وحلولها

### 403 PERMISSION_DENIED
- السبب: صلاحيات Vertex AI ناقصة
- الحل: أضف `roles/aiplatform.user` للـ service account + فعّل Vertex AI API.

### أخطاء GCS (No such object / permission)
- السبب: صلاحيات bucket ناقصة أو مسار `VERTEX_GCS_OUTPUT_URI` غير صحيح
- الحل:
  - منح `roles/storage.objectAdmin`
  - التأكد من وجود bucket

### مسار JSON غير صحيح (ENOENT)
- الحل: استخدم مسار مطلق للملف.

---

## ملاحظات أمان مهمة
- لا ترفع ملف Service Account JSON إلى GitHub.
- تأكد من وجوده في `.gitignore`.
- إذا تسرب المفتاح، احذف الـ key من Google Cloud وأصدر Key جديد.
