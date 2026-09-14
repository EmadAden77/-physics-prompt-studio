export function buildCarSelfieAcceptance(state = {}) {
  const inside = state.mode !== 'outside';
  const driver = inside && state.seat === 'driver-left';

  if (inside) {
    const seatSideItem = driver
      ? { id: 'driver-window-right', label: 'نافذة السائق تظهر في النصف الأيمن من الإطار.' }
      : { id: 'seat-side-correct', label: 'موضع الراكب واتجاه المقصورة متوافقان مع سيارة LHD وغير معكوسين.' };
    const steeringItem = driver
      ? { id: 'steering-wheel-hint', label: 'حافة المقود أو أعلى العدادات ظاهرة أسفل يسار/منتصف الإطار.' }
      : { id: 'passenger-no-false-wheel', label: 'لا يظهر المقود كأنه أمام الراكب مباشرة.' };

    return [
      { id: 'camera-geometry', label: `منظور الكاميرا يطابق ${state.distance}cm وYaw ${state.yaw}° وPitch ${state.pitch}° وRoll ${state.roll}°.` },
      seatSideItem,
      steeringItem,
      { id: 'seat-anchor', label: driver ? 'الشخص مثبت بصريًا في مقعد السائق الأمامي الأيسر.' : 'الشخص مثبت بصريًا في مقعد الراكب الأمامي الأيمن.' },
      { id: 'cabin-not-mirrored', label: 'المقصورة غير معكوسة، واتجاه LHD متماسك بصريًا.' },
      { id: 'no-readable-brand', label: 'لا يوجد شعار أو نص مقروء على أي عنصر.' },
      { id: 'skin-pores', label: 'البشرة فيها مسام وتفاوتات دقيقة مرئية وليست ملساء بلاستيكيًا.' },
      { id: 'stray-hairs', label: 'الشعر فيه شعيرات منفصلة/شاردة طبيعية ولا يبدو كخوذة لامعة.' },
      { id: 'environment-grounding', label: 'المشهد الخارجي المرئي يحتوي أسفلتًا وحافة رصيف/طريق واقعية عند ظهور الشارع.' },
      { id: 'clutter-budget', label: 'لا يتجاوز عدد عناصر الفوضى الواضحة داخل المقصورة عنصرين.' },
      { id: 'single-light-causality', label: 'الإضاءة ناتجة عن مصدر أو مصادر محددة ومنطقية فقط.' },
      { id: 'no-unexplained-dual-shadow', label: 'لا يوجد ظل ثانٍ متعاكس بدون مصدر ضوء ثانٍ حقيقي.' },
      { id: 'roll-imperfection', label: 'الكادر مائل طبيعيًا 1-3 درجات وغير مستوٍ تمامًا.' },
      { id: 'natural-composition', label: 'التكوين غير متمركز بشكل مثالي ولا توجد عناصر عائمة أو تشريح مستحيل.' }
    ];
  }

  return [
    { id: 'camera-geometry', label: `منظور الكاميرا يطابق ${state.distance}cm وYaw ${state.yaw}° وPitch ${state.pitch}° وRoll ${state.roll}°.` },
    { id: 'outside-no-cabin', label: 'لا تظهر هندسة مقعد/مقود/فوضى مقصورة كأن المشهد داخل السيارة.' },
    { id: 'environment-grounding', label: 'الأرضية والشارع/الموقف والرصيف متماسكة مع البيئة السعودية العامة.' },
    { id: 'subject-grounding', label: 'القدم/الجسم لهما تماس واقعي مع الأرض أو هيكل السيارة بلا اختراق أو طفو.' },
    { id: 'vehicle-stationary', label: 'السيارة متوقفة فعليًا ولا توجد إشارات حركة متناقضة.' },
    { id: 'no-readable-brand', label: 'لا يوجد شعار أو نص مقروء على أي عنصر إلا إذا طُلب صراحة.' },
    { id: 'skin-pores', label: 'البشرة فيها مسام وتفاوتات دقيقة مرئية وليست ملساء بلاستيكيًا.' },
    { id: 'stray-hairs', label: 'الشعر فيه شعيرات منفصلة/شاردة طبيعية واستجابة ضوئية واقعية.' },
    { id: 'car-reflections', label: 'انعكاسات الطلاء والزجاج تطابق البيئة وزاوية السطح ومصدر الضوء.' },
    { id: 'single-light-causality', label: 'الإضاءة من مصدر أو مصادر خارجية منطقية ومحددة.' },
    { id: 'no-unexplained-dual-shadow', label: 'لا يوجد ظل ثانٍ متعاكس بدون مصدر ضوء ثانٍ حقيقي.' },
    { id: 'roll-imperfection', label: 'الكادر مائل طبيعيًا 1-3 درجات وغير مستوٍ تمامًا.' },
    { id: 'natural-composition', label: 'التكوين غير مثالي هندسيًا ولا توجد يد/قدم/عجلة مشوهة أو جسم عائم.' }
  ];
}

export function formatCarSelfieAcceptance(state = {}) {
  return buildCarSelfieAcceptance(state).map((item) => `[ ] ${item.label}`).join('\n');
}

export function createCarSelfieAcceptanceReport(state = {}, marks = {}) {
  const items = buildCarSelfieAcceptance(state);
  let passed = 0;
  let failed = 0;
  let unchecked = 0;
  const lines = items.map((item) => {
    const mark = marks[item.id];
    if (mark === 'pass') {
      passed += 1;
      return `✓ ${item.label}`;
    }
    if (mark === 'fail') {
      failed += 1;
      return `✗ ${item.label}`;
    }
    unchecked += 1;
    return `? ${item.label}`;
  });
  const verdict = failed > 0 ? 'REJECT' : unchecked > 0 ? 'INCOMPLETE' : 'ACCEPT';
  return [`IMAGE ACCEPTANCE REPORT: ${verdict}`, `passed=${passed} failed=${failed} unchecked=${unchecked}`, ...lines].join('\n');
}
