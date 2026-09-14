# Physics Prompt Studio V5

تطبيق ويب ثابت وحتمي لبناء برومبتات صور واقعية مع فحص للتعارضات الفيزيائية. منذ V5 يوجد فصل معماري كامل بين المشاهد العامة ومختبر سيلفي السيارة.

## الصفحات

- **المشاهد العامة:** `index.html` — بورتريه، شوارع، مجالس، منازل، مقاهٍ، لقطات عفوية وغيرها. لا يحتوي على أي منطق سيارة.
- **Car Selfie Physics Lab:** `car-selfie.html` — نطاق مستقل للسيلفي داخل المقصورة، LHD، الانعكاسات، الحركة، اليدين، الخامات والإضاءة المحلية.

الرابط المنشور:

https://emadaden77.github.io/-physics-prompt-studio/

مختبر السيارة مباشرة:

https://emadaden77.github.io/-physics-prompt-studio/car-selfie.html

## مبادئ مشتركة

- **Deterministic:** لا `Math.random()` ولا اعتماد على الوقت الحالي داخل Core/Data.
- **Physical Light Causality:** مصدر الضوء الفيزيائي وحده يحدد ما يضاء، والـExposure/HDR/WB لا يخلق ضوءًا.
- **Camera Geometry Authority:** البعد البؤري والمسافة وYaw/Pitch/Roll هي المرجع الهندسي.
- **Strict Validation:** الأخطاء البنيوية تمنع دائمًا، والأخطاء الفيزيائية تمنع في الوضع الصارم.
- **Controlled Imperfection:** ضوضاء حساس، edge softness، WB غير مثالي وتفاوتات طبيعية بدون تجميل اصطناعي.

## بنية الملفات

### General Studio

- `index.html`
- `styles.css`
- `app.js`
- `data/catalog.js`
- `data/presets.js`
- `core/state.js`
- `core/geometry.js`
- `core/validation.js`
- `core/compiler.js`

### Car Selfie Physics Lab

- `car-selfie.html`
- `car-selfie.css`
- `car-selfie.js`
- `data/carSelfieCatalog.js`
- `core/carSelfieValidation.js`
- `core/carSelfieCompiler.js`

التفاصيل المعمارية في `docs/architecture.md`.

## الاختبار

```bash
npm test
```

يشغّل Syntax Checks، اختبارات الوحدات، اختبارات الحتمية، اختبارات فيزياء السيارة، واختبار Static Integrity الذي يمنع تسرب منطق السيارة إلى النطاق العام.
