# Architecture Review & Cleanup Suggestions

## الهدف
هذا المستند يعطي مراجعة للهيكلة الحالية للمشروع (Frontend + Backend) ويحدد:
- الملفات/المجلدات المكررة
- ملفات اختبار أو وثائق غير مؤثرة على تشغيل الموقع
- اقتراحات دمج/حذف آمنة

> ملاحظة: لا تقم بحذف أي ملف قبل التأكد أنه غير مستخدم فعلاً (مثلاً بالبحث عن `require()` أو `import`).

---

## 1) الهيكلة الحالية (High-Level)

### Root
- مستندات كثيرة في الجذر (README, guides, security docs, runway docs)
- كود التطبيق داخل `src/`

### Backend
- المسار: `src/backend/`
- نقطة التشغيل (حسب `package.json`):
  - `main: src/server.js`
  - `npm run dev: nodemon src/server.js`

### Frontend
- المسار: `src/frontend/`
- React + Vite

---

## 2) نقاط الدخول (Entry Points)

### Backend entry
- **المعتمد فعلياً:** `src/backend/src/server.js`
  - لأن `package.json` يشير له.

### Frontend entry
- Vite default entry داخل `src/frontend/src/` (غير موثّق هنا بالتفصيل).

---

## 3) ملاحظات هيكلية مهمة (يُفضل إصلاحها)

### A) Server file مكرر
يوجد ملفين سيرفر:
- `src/backend/src/server.js`  (هو المستخدم فعلياً)
- `src/backend/src/services/server.js` (نسخة ثانية كاملة تقريباً)

**التوصية:**
- **Keep:** `src/backend/src/server.js`
- **Remove أو Archive:** `src/backend/src/services/server.js`

**السبب:** وجود سيرفرين يسبب لخبطة في `.env`, الـ routes, static uploads, والـ middleware.

### B) مجلدين للـ middleware
يوجد:
- `src/backend/src/middleware/`
- `src/backend/src/middlewares/`

وحاليًا الاستيراد في routes يستخدم:
- `../middleware/validation` في `routes/content.js`
لكن الملف الفعلي الذي تمت مراجعته في الجلسة كان:
- `src/backend/src/middlewares/validation.js`

**ده خطر** لأنه ممكن يكون في ملف `validation` ثاني في `middleware/` أو حصل mismatch.

**التوصية:**
- توحيد الاسم لمجلد واحد: `middleware/`
- نقل كل الملفات من `middlewares/` إلى `middleware/`
- تحديث كل الـ imports accordingly

### C) `app.js` غير مكتمل
- `src/backend/src/app.js` مكتوب:
  - `const app = require('./server');`
- لكنه لا يصدّر app بشكل واضح.

**التوصية:**
- لو ما عندك اختبارات unit تستعمله: ممكن حذفه.
- لو محتاجه للاختبارات: خليه يصدّر `module.exports = app;`.

---

## 4) ملفات اختبار (Test Scripts)
يوجد في `src/backend/`:
- `test-video-generation.js`
- `test-video-status.js`
- `test-complete-flow.js`

هذه ملفات كانت مرتبطة بـ Runway ثم تم تعديلها لاحقًا أثناء الانتقال.

**التوصية:**
- إذا ما بتستخدمها الآن:
  - انقلها إلى `src/backend/scripts/` أو `src/backend/dev-tools/`
  - أو احذفها بعد التأكد أنها غير مستخدمة.

**الأفضل الآن:**
- إما تحديثها لتختبر Veo فعلاً، أو حذفها.

---

## 5) وثائق Runway القديمة
لا زال يوجد:
- `RUNWAY_SETUP.md`
- `RUNWAY_VEO3_SETUP.md`
- `RUNWAY_QUICK_START.md`

تم تحويلها لإشعار بأن التكامل أزيل، لكنها لا تخدم المنتج حالياً.

**التوصية:**
- إما نقلها إلى `DOCS/legacy/`
- أو حذفها لاحقاً لتقليل التشويش.

---

## 6) ملاحظات على تكامل Veo داخل الباك
### ملفات جديدة مهمة
- `src/backend/src/services/vertexVeoService.js`
- تعديل `src/backend/src/controllers/contentController.js`

**ملاحظة تصميم:**
الـ controller يحتوي الآن helper functions ل:
- parsing `gs://`
- download من GCS
- حفظ base64

**تحسين مقترح (غير إلزامي):**
نقل helpers الخاصة بالـ files إلى `utils/mediaStorage.js` عشان يقل حجم controller.

---

## 7) توصيات Cleanup (مختصرة)

### KEEP
- `src/backend/src/server.js`
- `src/backend/src/controllers/contentController.js`
- `src/backend/src/services/vertexVeoService.js`

### MERGE / REFACTOR
- `middleware/` و `middlewares/` -> مجلد واحد

### REMOVE / ARCHIVE (بعد التأكد)
- `src/backend/src/services/server.js` (مكرر)
- `src/backend/src/app.js` (إن لم يُستخدم)
- `src/backend/test-*.js` (إن لم تُستخدم)
- `RUNWAY_*.md` (إن لم تعد تريد أي أثر Runway)

---

## 8) ملاحظة أمنية حرجة
يوجد ملف Service Account JSON داخل:
- `src/backend/Key/*.json`

**التوصية:**
- تأكد أنه ضمن `.gitignore`
- لا يتم رفعه للمستودع.
- الأفضل وضعه خارج المشروع (مثل `C:\secrets\veo.json`) وتحديد المسار في `.env`.
