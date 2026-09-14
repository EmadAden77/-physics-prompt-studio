# Physics Prompt Studio V8

تطبيق ويب ثابت وحتمي لبناء برومبتات صور واقعية مع Conflict Checker وفيزياء كاميرا/إضاءة/مواد صارمة.

## الصفحات

- **General Studio:** `index.html` — المشاهد العامة، دون أي منطق سيارة.
- **Car Selfie Physics Studio:** `car-selfie.html` — مختبر مستقل بوضعين متنافيين: داخل السيارة وخارجها بجانب السيارة.

الرابط المنشور:

https://emadaden77.github.io/-physics-prompt-studio/

مختبر السيارة:

https://emadaden77.github.io/-physics-prompt-studio/car-selfie.html

## بنية السيارات V8

بدل إرسال برومبت طويل جدًا، V8 يفصل العمل إلى ثلاث طبقات:

1. `core/carSelfieEngineeringSpec.js` — مواصفات هندسية داخلية JSON لا تُرسل للنموذج.
2. `core/carSelfieMinimalPrompt.js` — البرومبت الافتراضي المضغوط بحد أقصى 250 كلمة.
3. `core/carSelfieAcceptance.js` — قائمة تحقق بعد التوليد مع تقرير ACCEPT / REJECT / INCOMPLETE.

النسخة التفصيلية القديمة باقية في `core/carSelfieCompiler.js` للتجارب فقط.

## الواجهة

Step 6 يعرض أربعة تبويبات:

- برومبت مضغوط.
- برومبت تفصيلي.
- مواصفات هندسية.
- قائمة تحقق.

وتوجد قائمة تحقق تفاعلية ✓ / ✗ وزر **تقرير قبول الصورة**.

## الحتمية

- لا `Math.random()` ولا `Date.now()` داخل Data/Core.
- نفس normalized state = نفس Minimal Prompt + نفس Engineering Spec + نفس Acceptance list.
- Visual Anchor للسائق يثبت نافذة السائق يمين الإطار وحافة المقود أسفل-منتصف-يسار والمقصورة غير معكوسة.

## الاختبار

```bash
npm test
```

يتحقق من حد 250 كلمة، Visual Anchor، ربط Engineering Spec بالـAcceptance، الحتمية، فصل الوضعين، Xiaomi optics، وقواعد الفيزياء السابقة.

التفاصيل الكاملة: `docs/architecture.md`.
