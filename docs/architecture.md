# Architecture V6 — Strict Xiaomi 15 Ultra Car Selfie Physics

## النطاق

يبقى التطبيق مقسومًا إلى نطاقين مستقلين: General Studio وCar Selfie Physics Lab. هذا التحديث يلمس نطاق السيارة فقط ولا يعيد أي منطق مركبات إلى الصفحة الرئيسية.

## سلطة الكاميرا

- الجهاز ثابت: Xiaomi 15 Ultra.
- السيلفي الأمامي: OV32B بدقة 32MP وفتحة f/2.0 وFixed Focus وEIS/HDR.
- العدسات الخلفية الممثلة: 23mm f/1.63، 70mm f/1.8، 100mm f/2.6.
- لا توجد عدسة 75mm في الكتالوج؛ محلل الطلب يحول طلب 75mm حتميًا إلى 70mm.
- Leica Authentic/Vibrant يسمح بهما فقط لمسار الكاميرا الخلفية.
- focalLength/aperture مشتقان من cameraLens ويُمنع تجاوزهما يدويًا.

## الفيزياء

1. Arm-Reach Gate للسيلفي اليدوي: 30–50cm مع حدود Yaw/Pitch/Roll.
2. Motion Gate يمنع الهاتف الممسوك بيد السائق أثناء الحركة ويمنع المعالجة الليلية متعددة الإطارات على مشهد متحرك.
3. Physical Light Causality يفصل externalLight وcabinEmitter عن Exposure/HDR/WB.
4. Reflection Law للزجاج والمرآة الداخلية والأسطح اللامعة.
5. Saudi Place Physics يربط المكان بالأسفلت/الرصيف/النباتات/الطقس/خصوصية المارة.
6. Fabric Physics يربط كل قطعة بملف roughness/wrinkle/light/compression.
7. Hair Density Lock يثبت خط الشعر والكثافة ويجعل الحركة مرتبطة فعليًا بحالة النافذة والمركبة.
8. Facial Anatomy يربط كل تعبير بحركة عضلية مع Skin Micro-Realism.
9. Clutter Physics يحدد مجموعات حتمية من الأغراض ويطبق gravity/contact/inertia/material reflection.
10. Strict يمنع fatal/error، بينما Auto يعرض التعارضات ولا يمنع الإخراج.

## الواجهة

أضيفت/وُسعت الحقول:
- الأماكن.
- الطقس/الهواء.
- عدسة Xiaomi 15 Ultra.
- بصمة الألوان.
- معالجة الإضاءة المنخفضة.
- الشعر.
- حالة النوافذ.
- الفوضى داخل السيارة.
- الإضاءة الخارجية.
- المصدر الداخلي.

## الاختبارات

`tests/car-selfie.test.mjs` يغطي قفل مواصفات Xiaomi، تصحيح 75→70، توافق Leica، مسافة الذراع، الحركة والغالق، الأماكن السعودية، الطقس، الإضاءة، الأقمشة، الشعر، الوجه، المرآة، الفوضى، Strict/Auto، LHD، L494، Negative Prompt والحتمية.
