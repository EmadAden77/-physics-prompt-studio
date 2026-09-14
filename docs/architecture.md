# Architecture V8 — Layered Car Selfie Studio

## الفكرة الأساسية

قسم السيارات لم يعد يعتمد على برومبت ضخم لمحاولة فرض كل قانون فيزيائي على مولّد الصورة. تم فصل النظام إلى ثلاث طبقات مستقلة:

1. **ENGINEERING SPEC LAYER** — داخلية فقط، لا تُرسل للنموذج.
2. **PROMPT LAYER** — نص قصير ومركز بحد أقصى 250 كلمة.
3. **ACCEPTANCE LAYER** — قائمة تحقق بشرية بعد مشاهدة الصورة.

الوضعان `inside` و`outside` ما زالا منفصلين حتميًا كما في V7، لكن كلاهما يمر عبر هذه الطبقات الثلاث.

## 1. Engineering Spec Layer

الملف: `core/carSelfieEngineeringSpec.js`

يحوّل الحالة normalized state إلى JSON هندسي يتضمن:

- `camera_position`: x/y/z بالسنتيمتر بالنسبة لمرجع عين السائق/السيارة مع focal length وyaw/pitch/roll.
- `steering_wheel_visibility`: المنطقة المطلوبة في الإطار ونسبة الظهور المستهدفة.
- `window_view`: جهة النافذة والمحتوى البيئي الإلزامي.
- `subject_seat_anchors`: نقاط العين والكتفين والحوض أو نقاط الوقوف خارج السيارة.
- `vehicle_reference`: LHD وحالة المركبة.

كل requirement هندسي يحمل `acceptance_id` يربطه بنقطة تحقق بشرية. `model_delivery=false` يمنع اعتبار هذا JSON جزءًا من البرومبت.

## 2. Prompt Layer

الملف: `core/carSelfieMinimalPrompt.js`

المخرجات الافتراضية قصيرة، وهي فقط:

- SUBJECT
- MODE
- VEHICLE
- CAMERA
- ENVIRONMENT
- LIGHT
- VISUAL ANCHOR
- QUALITY

البرومبت المضغوط لا يحتوي Engineering JSON ولا قائمة Acceptance ولا الأقسام الطويلة القديمة. يوجد guard برمجي يرمي خطأ إذا تجاوز النص 250 كلمة، والاختبارات تقيس ذلك على عدة حالات.

Visual Anchor للسائق داخل السيارة يثبت صورة الإطار النهائية: نافذة السائق في النصف الأيمن، حافة المقود أسفل-منتصف-يسار، منطقة الراكب يسار، ولا يوجد mirroring.

النسخة القديمة الطويلة تبقى في `core/carSelfieCompiler.js` كتجربة عبر تبويب **برومبت تفصيلي** فقط.

## 3. Acceptance Layer

الملف: `core/carSelfieAcceptance.js`

يعيد 10–15 نقطة حسب الوضع. المستخدم يضع ✓ أو ✗ بعد رؤية الصورة. تتضمن نقاط الداخل:

- جهة نافذة السائق.
- ظهور حافة المقود.
- LHD غير معكوس.
- عدم وجود شعارات/نصوص مقروءة.
- مسام الجلد والشعيرات الشاردة.
- أسفلت/رصيف منطقي.
- حد أقصى عنصران واضحان من الفوضى.
- سببية الإضاءة والظلال.
- Roll طبيعي 1–3 درجات.

زر **تقرير قبول الصورة** يحول العلامات إلى `ACCEPT / REJECT / INCOMPLETE` بدون إرسالها للنموذج.

## واجهة V8

`car-selfie.js` أعيد تنظيمه حول الطبقات الثلاث بدل دوال output القديمة. Step 6 يعرض:

- برومبت مضغوط — الافتراضي.
- برومبت تفصيلي — النسخة القديمة للتجربة.
- مواصفات هندسية — JSON داخلي.
- قائمة تحقق — نص checklist.

وتوجد أسفلها قائمة تحقق تفاعلية ✓ / ✗ وتقرير قبول. خيار `promptMode` يسمح بتعيين المضغوط أو التفصيلي كافتراضي.

## الحتمية

- لا `Math.random()`.
- لا `Date.now()` في Data/Core.
- نفس normalized state ينتج نفس Minimal Prompt وEngineering Spec وAcceptance list.

## الاختبار

`npm test` يتحقق من:

- حد 250 كلمة.
- وجود Visual Anchor.
- تطابق كل requirement هندسي مع Acceptance ID.
- وجود 10–15 نقطة تحقق.
- عدم تسرب Engineering/Acceptance إلى البرومبت المضغوط.
- الحتمية.
- فصل inside/outside وقواعد V7/V7.1 السابقة.
