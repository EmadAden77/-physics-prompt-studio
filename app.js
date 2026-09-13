(() => {
  const $ = (id) => document.getElementById(id);
  const form = $('promptForm');
  const output = $('output');
  const copy = $('copy');
  const referenceImage = $('referenceImage');
  const fileStatus = $('fileStatus');
  const warnings = $('warnings');
  const checklist = $('checklist');

  function value(id) {
    const el = $(id);
    return el ? String(el.value || '').trim() : '';
  }

  function buildPrompt() {
    const fields = [
      ['Capture type', value('captureType')],
      ['Time', value('time')],
      ['Seat / position', value('seat')],
      ['Camera angle', value('angle')],
      ['Pose', value('pose')],
      ['Expression', value('expression')],
      ['Aspect ratio', value('ratio')],
      ['Location', value('place')],
      ['Apparent age', value('age')],
      ['Hair', value('hair')],
      ['Clothing', value('clothing')],
      ['Glasses', value('glasses')],
    ].filter(([, v]) => v);

    const lines = ['Create one image using only the selections and details below.'];
    for (const [label, val] of fields) lines.push(`${label}: ${val}`);

    const notes = value('notes');
    if (notes) lines.push(`Additional details: ${notes}`);

    if (referenceImage && referenceImage.files && referenceImage.files.length) {
      lines.push('A reference image is attached for visual reference.');
    }

    return lines.join('\n');
  }

  function renderStatus() {
    if (warnings) warnings.textContent = '';
    if (checklist) checklist.innerHTML = '<li>لا توجد قواعد تلقائية مفعلة.</li><li>لا توجد Locks أو Realism Engine أو أولوية مخفية.</li><li>الناتج يعتمد فقط على اختياراتك وملاحظاتك.</li>';
  }

  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    output.textContent = buildPrompt();
    renderStatus();
  });

  referenceImage?.addEventListener('change', () => {
    const file = referenceImage.files?.[0];
    if (!file) {
      fileStatus.textContent = 'الصورة تبقى على جهازك ولا تفرض أي قواعد على الـPrompt.';
      return;
    }
    fileStatus.textContent = `تم اختيار: ${file.name}`;
  });

  copy?.addEventListener('click', async () => {
    const text = output?.textContent || '';
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      const old = copy.textContent;
      copy.textContent = 'تم النسخ';
      setTimeout(() => { copy.textContent = old; }, 900);
    } catch {
      warnings.textContent = 'تعذر النسخ التلقائي. انسخ النص يدويًا.';
    }
  });

  renderStatus();
})();
