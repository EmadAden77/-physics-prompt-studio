# Architecture V5 — General Studio + Isolated Car Selfie Lab

## الفصل

تم تقسيم التطبيق إلى نطاقين مستقلين: General Studio (`index.html`, `app.js`, `data/catalog.js`, `core/*`) وCar Selfie Physics Lab (`car-selfie.html`, `car-selfie.js`, `car-selfie.css`, `data/carSelfieCatalog.js`, `core/carSelfieValidation.js`, `core/carSelfieCompiler.js`). الرابط بينهما ملاحي فقط.

## ما أزيل من النطاق العام

- `vehicleScene` كاملًا من الواجهة والحالة.
- Presets المركبات.
- قواعد parkable وحالة المركبة من الكتالوج العام.
- `vehiclePrompt` من المترجم العام.
- `validateVehicle` وأخطاء توافق المركبة من التحقق العام.
- أي مسارات اختبار تربط الـCore العام بالمركبات.

## مختبر السيارة الجديد

1. LHD Spatial Lock ثابت: السائق أمامي يسار، المقود والعدادات يسار، الكونسول يمين السائق.
2. Capture Support Physics: الهاتف ممسوك فعليًا أو مثبت فعليًا.
3. Motion Gate: أثناء الحركة يمنع السيلفي اليدوي في Strict.
4. Near-field Light Falloff: شاشة الهاتف والعدادات مصادر ضعيفة محلية.
5. Reflection Ray Consistency للمرآة والزجاج والأسطح اللامعة.
6. Period-correct Cabin لملف L494 2017.
7. Material Physics للجلد والخشب والمعدن والزجاج.
8. فصل Exposure/HDR/WB عن الإضاءة الفيزيائية.
9. محلل Intent حتمي بقواعد ثابتة وبدون عشوائية.
10. Compatibility Filtering يخفي أو يعطل الخيارات غير المتناسقة.

## الإثبات

`npm test` يشغّل Syntax Checks واختبارات الحتمية والفيزياء وStatic Integrity. الاختبار الساكن يثبت أن الصفحة الرئيسية لا تستورد أي وحدة سيارة وأن كل صفحة تحمل ملف JS الخاص بها فقط، ويمنع رجوع `vehicleScene` أو Range Rover/L494 أو تعليمات المقود إلى Core العام.
