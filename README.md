# Physics Prompt Studio

نسخة V1 من **Prompt Optimizer** تعمل محليًا داخل المتصفح بدون مكتبات خارجية.

## ما الذي تم بناؤه؟

- الحفاظ على `original_prompt` كما أُدخل.
- تحديد `target_surface`: Codex / ChatGPT / OpenAI API / Other / Unknown.
- بناء السجلات السبعة الرسمية بالترتيب:
  1. outcome
  2. relevant_context
  3. must_preserve_constraints
  4. evidence_and_success
  5. output_contract
  6. task_shape_routing
  7. final_verification
- `constraint_map` للقيود المكتشفة.
- فصل authority إلى local / external / scope_expansion.
- Scope-drift checks.
- Validator وحالة `ready` أو `invalid`.
- Ledger وJSON packet قابل للتنزيل.
- واجهة عربية متجاوبة للجوال والكمبيوتر.

## تشغيل الاختبارات

```bash
npm test
```

## ملاحظة معمارية

المحرك الحالي deterministic/local ولا يستدعي نموذج ذكاء اصطناعي أو ينفذ الطلب الأصلي. لذلك فهو آمن كطبقة compiler أولية، لكن الفهم الدلالي العميق للبرومبتات المعقدة سيحتاج لاحقًا Adapter اختياريًا لنموذج، مع إبقاء validator وauthority checks كطبقة مستقلة لا يحق للنموذج تجاوزها.

قسم السيارات القديم ما زال موجودًا ولم تتم إزالته في هذه المرحلة.
