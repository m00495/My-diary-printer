(function() {
  /* ══════════════════════════════════════════════
     ✦ تعريف العلامات (Tags) – يمكنك التعديل هنا
     كل علامة: tid, emoji, label, printChar
  ═══════════════════════════════════════════════ */
  const TAGS = [
    { tid: 'star',  emoji: '⭐',  label: 'إنجاز أو هدف تم تحقيقه',       printChar: '★' },
    { tid: 'pause', emoji: '⏸️',  label: 'إجازة أو توقف مؤقت',           printChar: '‖' },
    { tid: 'x',     emoji: '❌',  label: 'خطأ أو مشكلة واجهتها',         printChar: '✕' },
    { tid: 'frame', emoji: '🖼️',  label: 'عنصر مرئي أو تصميم',            printChar: '▭' },
    { tid: 'out',   emoji: '📍',  label: 'موقع أو خروج',                 printChar: '▭' },
  ];

  /* ══════════════════════════════════════════════
     ✦ الخطوط المتاحة
  ═══════════════════════════════════════════════ */
  const FONTS = [
    { id: 'scheherazade', label: 'شهرزاد',  family: '"Scheherazade New", serif', preview: 'شهرزاد' },
    { id: 'amiri',        label: 'أميري',    family: '"Amiri", serif', preview: 'أميري' },
    { id: 'lateef',       label: 'لطيف',     family: '"Lateef", serif', preview: 'لطيف' },
    { id: 'reemkufi',     label: 'ريم كوفي', family: '"Reem Kufi", sans-serif', preview: 'ريم' },
    { id: 'tajawal',      label: 'تجوال',    family: '"Tajawal", sans-serif', preview: 'تجوال' },
  ];

  /* ══════════════════════════════════════════════
     ✦ متغيرات عامة
  ═══════════════════════════════════════════════ */
  let messages = [];                  // قائمة الملاحظات
  let activeFont = FONTS[0].id;      // الخط النشط
  let activeSize = 'a4';             // حجم الورق النشط
  const tagStates = {};              // حالة العلامات لكل ملاحظة { msgId: { tid: bool } }

  // عناصر DOM الرئيسية
  const fBody = document.getElementById('fBody');
  const fDate = document.getElementById('fDate');
  const ratingInput = document.getElementById('ratingInput');
  const canvas = document.getElementById('canvas');
  const msgList = document.getElementById('msgList');
  const emptyState = document.getElementById('emptyState');
  const livePreview = document.getElementById('livePreview');
  const lpText = document.getElementById('lpText');
  const toastEl = document.getElementById('toast');
  const splash = document.getElementById('splash');
  const mainContent = document.getElementById('mainContent');
  const fontBar = document.getElementById('fontBar');
  const brandSub = document.getElementById('brandSub');

  /* ══════════════════════════════════════════════
     ✦ مؤشر الفأرة المخصص
  ═══════════════════════════════════════════════ */
  const dot = document.getElementById('cursorDot');
  const ring = document.getElementById('cursorRing');
  let mx = 0, my = 0, rx = 0, ry = 0;
  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; dot.style.left = mx+'px'; dot.style.top = my+'px'; });
  document.querySelectorAll('button,input,textarea,a,.m-del').forEach(el => {
    el.addEventListener('mouseenter', () => ring.classList.add('hovered'));
    el.addEventListener('mouseleave', () => ring.classList.remove('hovered'));
  });
  function animRing() {
    rx += (mx - rx) * 0.12; ry += (my - ry) * 0.12;
    ring.style.left = rx+'px'; ring.style.top = ry+'px';
    requestAnimationFrame(animRing);
  }
  animRing();

  /* ══════════════════════════════════════════════
     ✦ الجزيئات المتحركة في الخلفية
  ═══════════════════════════════════════════════ */
  (function initParticles() {
    const container = document.getElementById('particles');
    const colors = ['rgba(37,99,235,', 'rgba(8,145,178,', 'rgba(96,165,250,', 'rgba(6,182,212,'];
    for (let i = 0; i < 22; i++) {
      const p = document.createElement('div');
      p.className = 'p-dot';
      const size = Math.random() * 3 + 1;
      const c = colors[Math.floor(Math.random() * colors.length)];
      const op = Math.random() * 0.4 + 0.1;
      p.style.cssText = `width:${size}px;height:${size}px;background:${c}${op});left:${Math.random()*100}%;animation-duration:${Math.random()*15+10}s;animation-delay:-${Math.random()*15}s;box-shadow:0 0 ${size*2}px ${c}0.5);`;
      container.appendChild(p);
    }
  })();

  /* ══════════════════════════════════════════════
     ✦ شاشة البداية
  ═══════════════════════════════════════════════ */
  document.getElementById('enterBtn').addEventListener('click', () => {
    splash.style.opacity = '0';
    setTimeout(() => {
      splash.style.display = 'none';
      mainContent.style.display = 'block';
      mainContent.style.animation = 'fadeInUp 0.8s ease';
    }, 800);
  });

  /* ══════════════════════════════════════════════
     ✦ بناء شريط الخطوط
  ═══════════════════════════════════════════════ */
  function buildFontBar() {
    FONTS.forEach((f, i) => {
      const chip = document.createElement('button');
      chip.className = 'font-chip' + (f.id === activeFont ? ' active' : '');
      chip.id = 'fc-' + f.id;
      chip.innerHTML = `<span class="font-chip-preview" style="font-family:${f.family}">${f.preview}</span><span class="font-chip-name">${f.label}</span>`;
      chip.onclick = () => setFont(f.id);
      fontBar.appendChild(chip);
      if (i < FONTS.length - 1) {
        const sep = document.createElement('div'); sep.className = 'font-bar-sep';
        fontBar.appendChild(sep);
      }
    });
  }

  /* ══════════════════════════════════════════════
     ✦ تبديل الخط
  ═══════════════════════════════════════════════ */
  function setFont(id) {
    activeFont = id;
    const f = FONTS.find(x => x.id === id);
    if (!f) return;
    document.querySelectorAll('.font-chip').forEach(c => c.classList.remove('active'));
    const chip = document.getElementById('fc-' + id);
    if (chip) chip.classList.add('active');
    document.querySelectorAll('.c-body').forEach(el => el.style.fontFamily = f.family);
    showToast('✦ الخط: ' + f.label);
  }

  /* ══════════════════════════════════════════════
     ✦ تبديل حجم الورق (A4/A6)
  ═══════════════════════════════════════════════ */
  function setSize(s) {
    activeSize = s;
    document.getElementById('sc-a4').classList.toggle('active', s === 'a4');
    document.getElementById('sc-a6').classList.toggle('active', s === 'a6');
    canvas.classList.toggle('mode-a6', s === 'a6');
    if (brandSub) brandSub.textContent = s === 'a4' ? 'A4 · ٤ ملاحظات لكل صفحة' : 'A6 · ملاحظة واحدة لكل ورقة';
    render();
    showToast(s === 'a4' ? 'A4' : 'A6');
  }

  /* ══════════════════════════════════════════════
     ✦ تحويل الأرقام إلى عربية
  ═══════════════════════════════════════════════ */
  const toAr = n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);

  /* ══════════════════════════════════════════════
     ✦ دالة escape للنصوص
  ═══════════════════════════════════════════════ */
  function esc(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>'); }

  /* ══════════════════════════════════════════════
     ✦ إدارة حالة العلامات
  ═══════════════════════════════════════════════ */
  function getTagState(msgId) {
    if (!tagStates[msgId]) {
      tagStates[msgId] = {};
      TAGS.forEach(t => { tagStates[msgId][t.tid] = false; });
    }
    return tagStates[msgId];
  }

  function toggleTag(msgId, tid, btnEl) {
    const state = getTagState(msgId);
    state[tid] = !state[tid];
    btnEl.classList.toggle('on', state[tid]);
    btnEl.classList.remove('pop');
    void btnEl.offsetWidth;
    btnEl.classList.add('pop');
    btnEl.addEventListener('animationend', () => btnEl.classList.remove('pop'), { once: true });
  }

  /* ══════════════════════════════════════════════
     ✦ إضافة ملاحظة جديدة
  ═══════════════════════════════════════════════ */
  function addMessage() {
    const body = fBody.value.trim();
    if (!body) { showToast('⚠ اكتب نص الملاحظة أولاً'); shakeInput(); return; }
    const id = Date.now();
    const rating = parseInt(ratingInput.value);
    const validRating = (rating >= 1 && rating <= 11) ? rating : null;
    messages.push({
      id,
      body,
      date: fDate.value.trim(),
      rating: validRating
    });
    getTagState(id);

    // تأثير على الزر
    const btn = document.getElementById('addBtn');
    btn.textContent = '✓ تمت الإضافة';
    btn.classList.add('success');
    setTimeout(() => { btn.innerHTML = '＋&nbsp; إضافة الملاحظة'; btn.classList.remove('success'); }, 1400);

    // شرارات
    const r = btn.getBoundingClientRect();
    spawnSparkles(r.left + r.width/2, r.top + r.height/2);

    // أنيميشن العداد
    const countNum = document.getElementById('countNum');
    countNum.classList.remove('bump');
    void countNum.offsetWidth;
    countNum.classList.add('bump');

    // تفريغ الحقول
    fBody.value = '';
    fDate.value = '';
    ratingInput.value = '';
    livePreview.classList.remove('show');
    fBody.focus();
    render();
    showToast('✓ تمت إضافة الملاحظة');
  }

  function shakeInput() {
    fBody.style.animation = 'none'; void fBody.offsetWidth;
    fBody.style.animation = 'shake 0.4s ease';
    fBody.style.borderColor = 'var(--danger)';
    setTimeout(() => { fBody.style.borderColor = ''; fBody.style.animation = ''; }, 600);
  }

  /* ══════════════════════════════════════════════
     ✦ حذف ملاحظة
  ═══════════════════════════════════════════════ */
  function deleteMessage(id) {
    messages = messages.filter(m => m.id !== id);
    delete tagStates[id];
    render();
  }

  function clearAll() {
    if (!messages.length) return;
    if (!confirm('هل تريد مسح جميع الملاحظات؟')) return;
    messages = [];
    Object.keys(tagStates).forEach(k => delete tagStates[k]);
    render();
    showToast('تم المسح');
  }

  /* ══════════════════════════════════════════════
     ✦ بناء أزرار العلامات للخلية
  ═══════════════════════════════════════════════ */
  function buildTagsHTML(msgId) {
    const state = getTagState(msgId);
    let html = `<div class="c-tags" data-msgid="${msgId}">`;
    TAGS.forEach(t => {
      const on = state[t.tid] ? ' on' : '';
      html += `<button class="c-tag${on}" data-tid="${t.tid}" data-msgid="${msgId}" data-tip="${t.label}" title="${t.label}" onclick="window.handleTagClick(event, ${msgId}, '${t.tid}')">${t.emoji}</button>`;
    });
    html += `</div>`;
    return html;
  }

  // معالج النقر على العلامة (يُستدعى من الـ HTML)
  window.handleTagClick = function(e, msgId, tid) {
    e.stopPropagation();
    toggleTag(msgId, tid, e.currentTarget);
  };

  /* ══════════════════════════════════════════════
     ✦ توليد HTML الصفحات (المعاينة)
  ═══════════════════════════════════════════════ */
  function renderPagesHTML() {
    const total = messages.length;
    if (!total) return null;
    const fontStyle = FONTS.find(x => x.id === activeFont)?.family || '';
    let html = '';

    if (activeSize === 'a4') {
      const chunks = [];
      for (let i = 0; i < total; i += 4) chunks.push(messages.slice(i, i+4));
      chunks.forEach((chunk, pi) => {
        html += `<div class="pg-tag">الصفحة ${toAr(pi+1)} من ${toAr(chunks.length)}</div><div class="a4">`;
        for (let ci = 0; ci < 4; ci++) {
          const msg = chunk[ci];
          if (msg) {
            const rStr = msg.rating ? `${toAr(msg.rating)}/١١` : '';
            html += `<div class="cell">
              <input class="c-num" type="text" placeholder="الملاحظة رقم ${toAr(ci+1)}">
              ${rStr ? `<div class="c-rating">${rStr}</div>` : ''}
              ${buildTagsHTML(msg.id)}
              <div class="c-body" style="font-family:${fontStyle}">${esc(msg.body)}</div>
              ${msg.date ? `<div class="c-date">${esc(msg.date)}</div>` : ''}
            </div>`;
          } else {
            html += `<div class="cell empty"><div class="c-empty-lbl">· · ·</div></div>`;
          }
        }
        html += `</div>`;
      });
    } else {
      messages.forEach((msg, i) => {
        const rStr = msg.rating ? `${toAr(msg.rating)}/١١` : '';
        html += `
          <div class="pg-tag" style="align-self:flex-start;margin-bottom:-14px">ملاحظة ${toAr(i+1)} من ${toAr(total)}</div>
          <div class="a6">
            <div class="cell">
              <input class="c-num" type="text" placeholder="الملاحظة رقم ${toAr(i+1)}">
              ${rStr ? `<div class="c-rating">${rStr}</div>` : ''}
              ${buildTagsHTML(msg.id)}
              <div class="c-body" style="font-family:${fontStyle}">${esc(msg.body)}</div>
              ${msg.date ? `<div class="c-date">${esc(msg.date)}</div>` : ''}
            </div>
          </div>`;
      });
    }
    return html;
  }

  /* ══════════════════════════════════════════════
     ✦ دالة التصيير الرئيسية
  ═══════════════════════════════════════════════ */
  function render() {
    const total = messages.length;
    const pages = activeSize === 'a4' ? (Math.ceil(total / 4) || 0) : total;
    document.getElementById('countNum').textContent = toAr(total);
    document.getElementById('pagesBadge').textContent = toAr(pages) + ' ' + (activeSize === 'a4' ? 'صفحات' : 'ورقة');
    const pct = activeSize === 'a4'
      ? (total === 0 ? 0 : ((total % 4 || 4) / 4 * 100))
      : (total > 0 ? 100 : 0);
    document.getElementById('trackFill').style.width = pct + '%';

    canvas.classList.toggle('mode-a6', activeSize === 'a6');

    // قائمة الرسائل في الشريط الجانبي
    if (!total) {
      msgList.innerHTML = '';
    } else {
      let h = '';
      messages.forEach((msg, i) => {
        if (activeSize === 'a4' && i % 4 === 0) h += `<div class="pg-sep">— صفحة ${toAr(Math.floor(i/4)+1)} —</div>`;
        if (activeSize === 'a6') h += `<div class="pg-sep">— ملاحظة ${toAr(i+1)} —</div>`;
        const rStr = msg.rating ? `★ ${toAr(msg.rating)}/١١` : '';
        const state = getTagState(msg.id);
        const activeTags = TAGS.filter(t => state[t.tid]).map(t => t.emoji).join(' ');
        h += `<div class="m-card" style="animation-delay:${(i%4)*0.06}s">
          <div class="m-badge">${toAr(i+1)}</div>
          <div class="m-info">
            <div class="m-preview">${esc(msg.body)}</div>
            <div class="m-meta">
              ${msg.date   ? `<span class="m-date">${esc(msg.date)}</span>` : ''}
              ${rStr       ? `<span class="m-rating">${rStr}</span>` : ''}
              ${activeTags ? `<span style="font-size:.72rem">${activeTags}</span>` : ''}
            </div>
          </div>
          <button class="m-del" onclick="window.deleteMessage(${msg.id})">✕</button>
        </div>`;
      });
      msgList.innerHTML = h;
      msgList.scrollTop = msgList.scrollHeight;
    }

    // لوحة المعاينة
    if (!total) {
      canvas.innerHTML = '';
      canvas.appendChild(emptyState);
    } else {
      canvas.innerHTML = renderPagesHTML() || '';
    }

    // تحديث المعاينة في الشيت المنبثق
    const sc = document.getElementById('sheetCanvas');
    if (sc) {
      sc.innerHTML = total ? (renderPagesHTML() || '') : '<div class="empty-state" style="height:200px;color:#999">لا توجد ملاحظات بعد</div>';
      sc.classList.toggle('mode-a6', activeSize === 'a6');
    }

    // ضبط أحجام الخطوط تلقائياً
    requestAnimationFrame(autofitCells);
  }

  /* ══════════════════════════════════════════════
     ✦ ضبط حجم الخط تلقائياً داخل الخلايا
  ═══════════════════════════════════════════════ */
  function autofitCells() {
    document.querySelectorAll('.cell:not(.empty)').forEach(cell => {
      const body = cell.querySelector('.c-body');
      if (!body) return;
      const cellH = cell.clientHeight;
      const isA6 = cell.closest('.a6') !== null;
      const topOff = isA6 ? 44 : 50;
      const botOff = isA6 ? 36 : 44;
      const available = cellH - topOff - botOff;
      if (available <= 0) return;
      const maxSize = isA6 ? 1.12 : 1.08;
      let size = maxSize;
      body.style.fontSize = size + 'rem';
      body.style.lineHeight = '1.9';
      while (body.scrollHeight > available && size > 0.46) {
        size = Math.round((size - 0.04) * 100) / 100;
        body.style.fontSize = size + 'rem';
        body.style.lineHeight = size < 0.7 ? 1.45 : size < 0.85 ? 1.6 : 1.75;
      }
    });
  }

  /* ══════════════════════════════════════════════
     ✦ المعاينة المباشرة أثناء الكتابة
  ═══════════════════════════════════════════════ */
  fBody.addEventListener('input', () => {
    const v = fBody.value.trim();
    if (v) {
      livePreview.classList.add('show');
      lpText.innerHTML = esc(v) + '<span class="cursor-blink"></span>';
    } else {
      livePreview.classList.remove('show');
    }
  });

  /* ══════════════════════════════════════════════
     ✦ شرارات
  ═══════════════════════════════════════════════ */
  function spawnSparkles(x, y) {
    const colors = ['#2563eb','#06b6d4','#f59e0b','#0891b2','#0284c7'];
    for (let i = 0; i < 14; i++) {
      const s = document.createElement('div');
      s.className = 'sparkle';
      const angle = (i / 14) * Math.PI * 2;
      const dist = 40 + Math.random() * 60;
      s.style.setProperty('--tx', Math.cos(angle)*dist+'px');
      s.style.setProperty('--ty', Math.sin(angle)*dist+'px');
      s.style.left = x+'px'; s.style.top = y+'px';
      s.style.background = colors[i % colors.length];
      s.style.animationDelay = Math.random()*0.1+'s';
      document.body.appendChild(s);
      setTimeout(() => s.remove(), 900);
    }
  }

  /* ══════════════════════════════════════════════
     ✦ نافذة المعاينة المنبثقة (للهاتف)
  ═══════════════════════════════════════════════ */
  window.openSheet = function() {
    document.getElementById('overlay').classList.add('open');
    document.getElementById('sheet').classList.add('open');
    render();
  };
  window.closeSheet = function() {
    document.getElementById('overlay').classList.remove('open');
    document.getElementById('sheet').classList.remove('open');
  };

  /* ══════════════════════════════════════════════
     ✦ تبويبات الجوال
  ═══════════════════════════════════════════════ */
  window.switchTab = function(tab, btn) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const fp = document.getElementById('formPanel');
    if (window.innerWidth <= 700) fp.style.display = tab === 'form' ? '' : 'none';
  };

  /* ══════════════════════════════════════════════
     ✦ إشعار التوست
  ═══════════════════════════════════════════════ */
  function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    setTimeout(() => toastEl.classList.remove('show'), 2500);
  }

  /* ══════════════════════════════════════════════
     ✦ اختصار لوحة المفاتيح
  ═══════════════════════════════════════════════ */
  fBody.addEventListener('keydown', e => { if (e.key === 'Enter' && e.ctrlKey) addMessage(); });

  /* ══════════════════════════════════════════════
     ✦ بدء التشغيل
  ═══════════════════════════════════════════════ */
  buildFontBar();
  render();

  // إضافة نمط shake للرسوم المتحركة
  const shakeStyle = document.createElement('style');
  shakeStyle.textContent = `@keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)} 40%{transform:translateX(6px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)} }`;
  document.head.appendChild(shakeStyle);

  // تعريض بعض الدوال إلى النطاق العام كي تعمل من onclick في HTML
  window.setSize = setSize;
  window.setFont = setFont;
  window.addMessage = addMessage;
  window.deleteMessage = deleteMessage;
  window.clearAll = clearAll;

})();