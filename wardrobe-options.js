// Extended realistic wardrobe and eyewear positions.
const EXTRA_CLOTHING = {
  "navy-shirt-black-trousers":"a deep navy cotton-poplin long-sleeve shirt tucked naturally into tailored black trousers with a simple matte black leather belt; realistic collar structure, sleeve creases, waist tension and seated fabric compression",
  "charcoal-shirt-black-trousers":"a charcoal grey cotton work shirt with tailored black trousers and a restrained black leather belt; matte fabric, practical seams and natural joint wrinkles",
  "sage-shirt-beige-chinos":"a muted sage-green Oxford shirt with beige cotton chinos and a dark brown leather belt; breathable cotton texture and ordinary seated folds",
  "burgundy-shirt-charcoal-trousers":"a restrained burgundy poplin shirt with charcoal trousers and a black belt; realistic color response without satin shine",
  "white-linen-navy-trousers":"a slightly relaxed white linen shirt with deep navy trousers and a medium-brown leather belt; natural linen slubs, irregular wrinkles and soft drape",
  "micro-check-shirt":"a small-scale blue micro-check cotton shirt with dark navy trousers; pattern follows body curvature, folds and perspective without warping",
  "black-suit":"a properly fitted matte black wool-blend suit with a white cotton shirt and no tie; natural lapel roll, shoulder structure and seated creases",
  "brown-blazer":"a textured tobacco-brown casual blazer over an off-white crew-neck T-shirt with dark navy trousers; realistic woven texture and relaxed tailoring",
  "grey-blazer-black-shirt":"a medium-grey unstructured blazer over a plain black cotton shirt with charcoal trousers; believable layered fabric thickness and compression",
  "navy-cardigan":"a fine-gauge navy cardigan over a light grey T-shirt with beige chinos; realistic knit tension, ribbing and soft fold weight",
  "cream-knit":"a medium-weight cream crew-neck knit sweater with dark charcoal trousers; visible knit scale, restrained pilling and gravity-driven folds",
  "track-jacket":"a plain dark forest-green zip track jacket with black tapered trousers; matte technical fabric, realistic zipper and restrained seam highlights",
  "denim-jacket":"a medium-blue denim jacket over a plain white T-shirt with black jeans; authentic denim stiffness, seam wear and elbow creasing",
  "field-jacket":"a matte olive cotton field jacket over a charcoal T-shirt with dark trousers; practical pocket structure and natural layered bulk",
  "thobe-grey":"a medium-grey Saudi thobe with clean tailoring, matte fabric, realistic collar structure and gravity-driven folds",
  "thobe-olive":"a restrained dark olive Saudi thobe with realistic textile weight, sleeve creasing and seated compression",
  "thobe-brown":"a warm dark-brown Saudi winter thobe in medium-weight matte fabric with natural drape and no glossy finish",
  "thobe-navy-shemagh":"a deep navy Saudi thobe with a red-and-white shemagh and black agal arranged in a youthful but physically stable style; weighted cloth drape and natural asymmetry",
  "thobe-white-loose-shemagh":"a clean white Saudi thobe with a loosely draped red-and-white shemagh and black agal; one end may rest over a shoulder while the other falls naturally at the chest",
  "thobe-white-ghutra-casual":"a clean white Saudi thobe with a white ghutra and black agal in a relaxed everyday arrangement; realistic cloth weight, crown contact and non-symmetrical folds"
};

const EXTRA_GLASSES = {
  "reference-on-head":"Use the exact eyeglasses from the identity reference, resting naturally on top of the head. Both temples are open and supported above the ears; the frame follows skull curvature, slightly compresses nearby hair and casts a small contact shadow. Do not leave a second pair over the eyes.",
  "black-on-head":"Simple black full-rim rectangular optical glasses resting naturally on top of the head, proportionate to the face. Open temples follow the skull and create slight hair compression and contact shadows; no duplicate eyewear.",
  "sunglasses-black":"Realistic matte-black sunglasses worn correctly over the eyes, with frame size proportional to the face, temples aligned with both ears, coherent lens reflections and no warped bridge.",
  "sunglasses-on-head":"Realistic matte-black sunglasses resting on top of the head with both temples open, stable skull contact, slight hair compression and reflections consistent with the environment. No second pair on the face.",
  "aviator":"Restrained metal-frame aviator sunglasses worn over the eyes, correctly aligned to the nose bridge and ears, with physically coherent tinted-lens reflections and no fashion-ad gloss.",
  "aviator-on-head":"Metal-frame aviator sunglasses resting stably on top of the head; temples remain open, nose pads do not float, hair compresses subtly at contact points and no duplicate glasses appear.",
  "clear-brown":"Thin translucent-brown rectangular optical frames worn naturally over the eyes, correctly seated on the nose and ears with subtle lens reflections and visible eyes.",
  "silver-optical":"Thin silver metal optical frames worn naturally over the eyes, with realistic nose-pad contact, temple alignment and restrained reflections.",
  "collar-hook":"Black rectangular glasses folded once and hooked securely at the shirt opening or thobe placket. They hang under gravity, slightly pull the fabric and cast a small contact shadow; no eyewear remains on the face or head.",
  "breast-pocket":"Black rectangular glasses partially stored in a real chest pocket, with one folded temple visible and slight fabric displacement. Do not invent a pocket when the selected garment has none; in that case hook them at the neckline instead."
};

Object.assign(values.clothing,EXTRA_CLOTHING);
Object.assign(values.glasses,EXTRA_GLASSES);

function appendOptionGroup(selectId,label,options){
  const select=$(selectId),group=document.createElement('optgroup');
  group.label=label;
  options.forEach(([value,text])=>{const option=document.createElement('option');option.value=value;option.textContent=text;group.appendChild(option)});
  select.appendChild(group);
}

appendOptionGroup('clothing','تشكيلة موسعة — قمصان وبناطيل',[
  ['navy-shirt-black-trousers','قميص كحلي + بنطال أسود + حزام'],['charcoal-shirt-black-trousers','قميص فحمي + بنطال أسود'],['sage-shirt-beige-chinos','قميص أخضر هادئ + تشينو بيج'],['burgundy-shirt-charcoal-trousers','قميص عنابي + بنطال فحمي'],['white-linen-navy-trousers','قميص كتان أبيض + بنطال كحلي'],['micro-check-shirt','قميص كاروهات دقيقة + بنطال كحلي']
]);
appendOptionGroup('clothing','تشكيلة موسعة — رسمي وطبقات',[
  ['black-suit','بدلة سوداء وقميص أبيض'],['brown-blazer','بليزر بني وتيشيرت أوف وايت'],['grey-blazer-black-shirt','بليزر رمادي وقميص أسود'],['navy-cardigan','كارديغان كحلي وتشينو بيج'],['cream-knit','كنزة كريمية وبنطال فحمي'],['track-jacket','جاكيت رياضي أخضر داكن'],['denim-jacket','جاكيت دنيم وتيشيرت أبيض'],['field-jacket','جاكيت ميداني زيتوني']
]);
appendOptionGroup('clothing','تشكيلة موسعة — أثواب',[
  ['thobe-grey','ثوب سعودي رمادي'],['thobe-olive','ثوب سعودي زيتوني داكن'],['thobe-brown','ثوب شتوي بني'],['thobe-navy-shemagh','ثوب كحلي مع شماغ وعقال'],['thobe-white-loose-shemagh','ثوب أبيض وشماغ منسدل'],['thobe-white-ghutra-casual','ثوب أبيض وغترة بترسيمة عفوية']
]);
appendOptionGroup('glasses','مواضع وأنواع إضافية',[
  ['reference-on-head','نظارة المرجع فوق الرأس'],['black-on-head','نظارة سوداء فوق الرأس'],['sunglasses-black','نظارة شمسية سوداء على العين'],['sunglasses-on-head','نظارة شمسية فوق الرأس'],['aviator','نظارة أفياتور على العين'],['aviator-on-head','نظارة أفياتور فوق الرأس'],['clear-brown','إطار بني شفاف طبي'],['silver-optical','إطار فضي رفيع طبي'],['collar-hook','نظارة معلّقة بفتحة القميص أو الثوب'],['breast-pocket','نظارة داخل جيب الصدر']
]);

if(typeof render==='function')render();
