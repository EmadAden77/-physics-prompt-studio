# Physics Prompt Studio V9

تطبيق ويب ثابت وحتمي لبناء برومبتات صور واقعية مع فصل بين المواصفات الهندسية، النص المرسل للنموذج، والتحقق بعد التوليد.

## الصفحات

- **General Studio:** `index.html` — المشاهد العامة.
- **Car Selfie Studio:** `car-selfie.html` — داخل السيارة أو خارجها بجانب السيارة.

التطبيق:

https://emadaden77.github.io/-physics-prompt-studio/

قسم السيارات:

https://emadaden77.github.io/-physics-prompt-studio/car-selfie.html

## V9 — Narrative First

المخرج الافتراضي للسيارات لم يعد Technical Spec طويلًا. الملف الجديد:

`core/carSelfieNarrativeCompiler.js`

يبني وصفًا سرديًا واحدًا قصيرًا من الحالة، مع Visual Anchor واضح، Clutter Budget، ووصف طبيعي للشخص والكاميرا والمكان والضوء.

`compileCarSelfieDetailed()` أصبح هو المسار السردي. النسخة التقنية القديمة محفوظة في:

`compileCarSelfieTechnicalSpec()`

وتظهر في الواجهة باسم **Technical Spec (legacy)** للمقارنة فقط.

## المخرجات

Step 6 يعرض:

- **سردي** — الافتراضي.
- **مضغوط** — النسخة الأقصر من V8.
- **Technical Spec (legacy)** — للمقارنة.
- **مواصفات هندسية** — لا تُرسل للنموذج.
- **قائمة تحقق** — بعد مشاهدة الصورة.

## الحتمية

- لا `Math.random()` ولا `Date.now()` في Data/Core.
- نفس normalized state = نفس النص السردي حرفيًا.
- Visual Anchor لا يُحذف أثناء الضغط التلقائي.
- إذا تجاوز السرد 300 كلمة، يختصر Camera Processing ثم Place Details ثم Clothing Description حتميًا.

## الاختبار

```bash
npm test
```

الاختبارات تغطي طول السرد، Anchors للسائق/الراكب/الخارج، غياب نبرة `MUST / MANDATORY / FAIL`، القائمة السلبية الموحدة، الحتمية، ووجود المسار التقني القديم منفصلًا.

التفاصيل: `docs/architecture.md`.
