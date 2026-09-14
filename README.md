# Physics Prompt Studio V7

تطبيق ويب ثابت وحتمي لبناء برومبتات صور واقعية مع Conflict Checker وفيزياء كاميرا/إضاءة/مواد صارمة.

## الصفحات

- **General Studio:** `index.html` — المشاهد العامة، دون أي منطق سيارة.
- **Car Selfie Physics Studio:** `car-selfie.html` — مختبر مستقل بوضعين متنافيين:
  - تصوير سيلفي داخل السيارة.
  - تصوير ذاتي بالخارج بجانب السيارة.

الرابط المنشور:

https://emadaden77.github.io/-physics-prompt-studio/

مختبر السيارة:

https://emadaden77.github.io/-physics-prompt-studio/car-selfie.html

## مبادئ مشتركة

- Deterministic: لا `Math.random()` ولا اعتماد على الوقت الحالي في Data/Core.
- Physical Light Causality: الضوء الفيزيائي يحدد ما يضاء؛ Exposure/HDR/WB لا يخلق ضوءًا.
- Camera Geometry Authority: العدسة + المسافة + Yaw/Pitch/Roll هي السلطة الهندسية.
- Strict Validation: الأخطاء الفيزيائية تمنع في Strict وتظهر كتنبيه في Auto.
- Controlled Imperfection: ضوضاء، edge softness، mixed WB وتفاوتات طبيعية بدون تجميل اصطناعي.

## بنية السيارات V7

### Data

- `data/carSelfieCommonCatalog.js`
- `data/carSelfieInsideCatalog.js`
- `data/carSelfieOutsideCatalog.js`

### Core

- `core/carSelfieValidation.js`
- `core/carSelfieInsideValidation.js`
- `core/carSelfieOutsideValidation.js`
- `core/carSelfieCompiler.js`
- `core/carSelfieInsideCompiler.js`
- `core/carSelfieOutsideCompiler.js`

### UI

- `car-selfie.html`
- `car-selfie.css`
- `car-selfie.js`

التفاصيل في `docs/architecture.md`.

## الاختبار

```bash
npm test
```

يشغّل Syntax Checks، اختبارات الوحدات، الحتمية، فصل الوضعين، فيزياء Xiaomi/الضوء/الانعكاسات/القماش/الشعر/الوجه، وStatic Integrity الذي يمنع تسرب منطق السيارة إلى الصفحة العامة أو تسرب وضع داخل السيارة إلى الخارج والعكس.
