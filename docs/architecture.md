# Architecture V9 — Narrative-First Car Selfie Studio

## الفكرة

قسم السيارات لا يرسل قائمة تقنية طويلة إلى مولّد الصورة. الحالة تبقى دقيقة وحتمية داخليًا، لكن النص المرسل للنموذج أصبح وصفًا سرديًا قصيرًا يصف الصورة كما لو أنها موجودة فعلًا.

البنية ما زالت بثلاث طبقات:

1. **ENGINEERING SPEC** — داخلية فقط، لا تُرسل للنموذج.
2. **NARRATIVE PROMPT** — المخرج الافتراضي، نحو 200–280 كلمة وبحد أقصى 300.
3. **ACCEPTANCE** — تحقق بصري بعد التوليد.

## Narrative Compiler

الملف: `core/carSelfieNarrativeCompiler.js`

الدالة `compileNarrative(state, mode)` تبني فقرة واحدة مترابطة من الحالة. تصف الشخص، الكاميرا، البيئة، السيارة، الضوء، الأنسجة، الشعر، الفوضى أو الوقوف، ثم تضيف Visual Anchor واحدًا فقط.

Anchors:

- السائق: نافذة السائق يمين الإطار، حافة المقود أسفل-منتصف-يسار، الراكب يسار، والمقصورة غير معكوسة.
- الراكب: نافذة الراكب يسار الإطار، والكونسول يمين الإطار، والمقصورة غير معكوسة.
- الخارج: الشخص بجانب السيارة مع تماس أرضي حقيقي، وإطارات وظلال تماس.

كلمة `mandatory` لا تظهر داخل النص السردي رغم أن الـAnchor إلزامي برمجيًا، لأن V9 يمنع نبرة `MUST / MANDATORY / FAIL` داخل المخرج السردي.

## Clutter Budget

داخل السيارة تتحول الفوضى إلى جملة قصيرة حسب المستوى:

- clean: لا عناصر سائبة ظاهرة.
- minimal: عنصر صغير واحد خارج مركز الإطار.
- light: عنصر واضح واحد كحد أقصى.
- moderate: عنصران واضحان كحد أقصى.
- heavy: ثلاثة عناصر واضحة كحد أقصى، كلها مدعومة فيزيائيًا.

## الضغط التلقائي

إذا تجاوز الوصف 300 كلمة، يختصر المحرك حتميًا بهذا الترتيب:

1. Camera processing.
2. Place details.
3. Clothing description.

Visual Anchor لا يُحذف أبدًا. الملاحظات الحرة تُقص إلى 24 كلمة قبل التجميع لمنع كسر الميزانية.

## Compiler Routing

`compileCarSelfieDetailed()` أصبح يستدعي `compileNarrative()`.

النسخة التقنية القديمة لم تُحذف؛ انتقلت إلى `compileCarSelfieTechnicalSpec()` وتظهر فقط في تبويب **Technical Spec (legacy)**.

`compileCarSelfieNegative()` يعيد قائمة سلبية موحدة قصيرة، بينما `compileCarSelfieJson()` يحتفظ بالحالة الكاملة ومخرجات narrative/concise/negative/legacy.

## الواجهة

الافتراضي في `car-selfie.js` و`car-selfie.html` هو **سردي**.

Step 6 يعرض:

- سردي — الافتراضي.
- مضغوط — نسخة V8 الأقصر.
- Technical Spec (legacy) — للمقارنة فقط.
- مواصفات هندسية.
- قائمة تحقق.

## الحتمية والاختبار

لا `Math.random()` ولا `Date.now()` في Data/Core. نفس normalized state ينتج نفس السرد حرفيًا.

`npm test` يتحقق من:

- السرد ≤ 300 كلمة.
- Anchor مناسب لكل وضع/مقعد.
- غياب `MUST / MANDATORY / FAIL` من السرد.
- القائمة السلبية الموحدة.
- الحتمية.
- بقاء Technical Spec كمسار legacy منفصل.
- استمرار Engineering/Acceptance وفصل inside/outside.
