(function () {
  'use strict';

  var D = window.TAZILA || {};
  var MAIL = 'richard@tdi.co.za';

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function mailLink(subject, label, cls) {
    var a = el('a', cls || 'btn btn-line btn-sm', label);
    a.href = 'mailto:' + MAIL + '?subject=' + encodeURIComponent(subject);
    return a;
  }
  function slug(s) {
    return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  /* ---------- mobile menu ---------- */
  var burger = document.querySelector('.burger');
  var menu = document.getElementById('menu');
  if (burger && menu) {
    burger.addEventListener('click', function () {
      var open = menu.classList.toggle('open');
      burger.setAttribute('aria-expanded', open);
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    menu.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        menu.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- enquiry forms: open the visitor's email app ---------- */
  document.querySelectorAll('form[data-mailto]').forEach(function (form) {
    var status = form.querySelector('.status');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var lines = [], who = '', ok = true;
      Array.prototype.forEach.call(form.elements, function (f) {
        if (!f.name || f.type === 'submit') return;
        var v = (f.value || '').trim();
        if (f.required && !v) ok = false;
        if (f.type === 'email' && v && v.indexOf('@') < 1) ok = false;
        if (v) lines.push(f.name + ': ' + v);
        if (f.name === 'Name' && v) who = v;
      });
      if (!ok) {
        if (status) status.textContent = 'Fill in the required fields and a valid email address, then send again.';
        return;
      }
      var subject = (form.getAttribute('data-subject') || 'Website enquiry') + (who ? ' from ' + who : '');
      window.location.href = 'mailto:' + form.getAttribute('data-mailto') +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(lines.join('\n'));
      if (status) status.textContent = 'Your email app should open with the enquiry ready to send.';
    });
  });

  /* =====================================================
     Products, cart and quote request
     ===================================================== */
  var CAT = {
    ink: 'Ink cartridges', toner: 'Toner cartridges', drums: 'Drum units',
    accessories: 'Accessories', printers: 'Printers', desktops: 'Desktop computers'
  };
  var catLabel = function (c) { return CAT[c] || c || ''; };

  var products = (D.products || []).map(function (p) {
    p.id = slug(p.name || '');
    return p;
  });
  var byId = {};
  products.forEach(function (p) { byId[p.id] = p; });

  /* cart: remembered in this browser only */
  var STORE = 'tazila-cart';
  var cart = {};
  try {
    var saved = JSON.parse(localStorage.getItem(STORE) || '{}');
    Object.keys(saved).forEach(function (id) {
      var n = parseInt(saved[id], 10);
      if (byId[id] && n > 0) cart[id] = Math.min(n, 999);
    });
  } catch (e) { cart = {}; }

  var listeners = [];
  function persist() {
    try { localStorage.setItem(STORE, JSON.stringify(cart)); } catch (e) { /* private mode */ }
    listeners.forEach(function (fn) { fn(); });
  }
  function qty(id) { return cart[id] || 0; }
  function setQty(id, n) {
    n = parseInt(n, 10);
    if (!(n > 0)) delete cart[id]; else cart[id] = Math.min(n, 999);
    persist();
  }
  function totalCount() {
    return Object.keys(cart).reduce(function (a, id) { return a + cart[id]; }, 0);
  }

  /* ---------- illustrated placeholder for products without a photo ---------- */
  var SVGNS = 'http://www.w3.org/2000/svg';
  function svg(tag, attrs, text) {
    var n = document.createElementNS(SVGNS, tag);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (text != null) n.textContent = text;
    return n;
  }
  function colourOf(name) {
    var n = name.toLowerCase();
    if (/tri[\s-]?colou?r/.test(n)) return 'tri';
    if (/cyan/.test(n)) return '#00A3E0';
    if (/magenta/.test(n)) return '#E6007E';
    if (/yellow/.test(n)) return '#FFC800';
    if (/black/.test(n)) return '#14161A';
    return '#2a3d66';
  }
  function tokenOf(name) {
    var m = name.replace(/^No\s+/i, '').match(/[A-Z]{0,4}\d{2,4}[A-Z]{0,3}/);
    return m ? m[0] : '';
  }
  function fit(tok, max, width) { return Math.round(Math.min(max, width / (tok.length * 0.64)) * 10) / 10; }
  function art(p) {
    var s = svg('svg', { viewBox: '0 0 200 160', role: 'img', 'aria-label': p.name });
    var c = colourOf(p.name), tok = tokenOf(p.name);
    var ink = '#0F1E3C';
    var defs = svg('defs');
    var g = svg('linearGradient', { id: 'tri-' + p.id, x1: '0', x2: '1', y1: '0', y2: '0' });
    [['0', '#00A3E0'], ['.5', '#E6007E'], ['1', '#FFC800']].forEach(function (st) {
      g.appendChild(svg('stop', { offset: st[0], 'stop-color': st[1] }));
    });
    defs.appendChild(g); s.appendChild(defs);
    var fill = c === 'tri' ? 'url(#tri-' + p.id + ')' : c;
    var cat = p.category;
    if (cat === 'toner') {
      s.appendChild(svg('rect', { x: 30, y: 52, width: 140, height: 62, rx: 16, fill: '#fff', stroke: ink, 'stroke-width': 3 }));
      s.appendChild(svg('rect', { x: 30, y: 52, width: 38, height: 62, rx: 16, fill: ink }));
      s.appendChild(svg('rect', { x: 52, y: 52, width: 16, height: 62, fill: ink }));
      s.appendChild(svg('rect', { x: 78, y: 96, width: 80, height: 10, rx: 5, fill: fill }));
      s.appendChild(svg('rect', { x: 78, y: 40, width: 60, height: 14, rx: 7, fill: '#fff', stroke: ink, 'stroke-width': 3 }));
      if (tok) s.appendChild(svg('text', { x: 118, y: 84, 'text-anchor': 'middle', 'font-size': fit(tok, 22, 66), 'font-weight': 700, fill: ink, 'font-family': 'inherit' }, tok));
    } else if (cat === 'drums') {
      s.appendChild(svg('rect', { x: 36, y: 48, width: 128, height: 70, rx: 12, fill: '#fff', stroke: ink, 'stroke-width': 3 }));
      s.appendChild(svg('ellipse', { cx: 100, cy: 83, rx: 46, ry: 26, fill: '#e8edf5', stroke: ink, 'stroke-width': 3 }));
      s.appendChild(svg('ellipse', { cx: 100, cy: 83, rx: 14, ry: 8, fill: ink }));
      if (tok) s.appendChild(svg('text', { x: 100, y: 138, 'text-anchor': 'middle', 'font-size': fit(tok, 20, 110), 'font-weight': 700, fill: ink, 'font-family': 'inherit' }, tok));
    } else if (cat === 'accessories') {
      s.appendChild(svg('path', { d: 'M100 28c-26 0-40 18-40 42v32c0 24 16 40 40 40s40-16 40-40V70c0-24-14-42-40-42z', fill: '#fff', stroke: ink, 'stroke-width': 3 }));
      s.appendChild(svg('path', { d: 'M60 76h80M100 28v48', fill: 'none', stroke: ink, 'stroke-width': 3 }));
      s.appendChild(svg('rect', { x: 94, y: 40, width: 12, height: 24, rx: 6, fill: ink }));
    } else {
      /* ink cartridge */
      s.appendChild(svg('rect', { x: 62, y: 22, width: 76, height: 112, rx: 12, fill: '#fff', stroke: ink, 'stroke-width': 3 }));
      s.appendChild(svg('rect', { x: 62, y: 96, width: 76, height: 38, rx: 12, fill: fill }));
      s.appendChild(svg('rect', { x: 62, y: 96, width: 76, height: 14, fill: fill }));
      s.appendChild(svg('rect', { x: 84, y: 134, width: 32, height: 12, rx: 3, fill: ink }));
      if (tok) s.appendChild(svg('text', { x: 100, y: 68, 'text-anchor': 'middle', 'font-size': fit(tok, 24, 62), 'font-weight': 700, fill: ink, 'font-family': 'inherit' }, tok));
    }
    return s;
  }
  function media(p, cls) {
    var box = el('div', cls || 'pmedia');
    var useArt = function () { box.textContent = ''; box.appendChild(art(p)); };
    var src = p.image || (D.useImageFiles ? 'images/' + p.id + '.jpg' : '');
    if (src) {
      var im = el('img'); im.alt = p.name; im.loading = 'lazy'; im.src = src;
      im.addEventListener('error', useArt);
      box.appendChild(im);
    } else {
      useArt();
    }
    return box;
  }

  /* ---------- cart drawer (on every page that has products) ---------- */
  var cartBtns = document.querySelectorAll('[data-cart]');
  var drawer, overlay, lastFocus, listEl, emptyEl, formEl, statusEl, live;

  function announce(msg) { if (live) { live.textContent = ''; setTimeout(function () { live.textContent = msg; }, 30); } }

  function cartText() {
    return Object.keys(cart).map(function (id) { return '- ' + cart[id] + ' x ' + byId[id].name; }).join('\n');
  }

  function renderBadges() {
    var n = totalCount();
    cartBtns.forEach(function (b) {
      var c = b.querySelector('.cart-count');
      if (c) { c.textContent = n; c.setAttribute('data-n', n); }
      b.setAttribute('aria-label', n ? 'Open cart, ' + n + (n === 1 ? ' item' : ' items') : 'Open cart, empty');
    });
  }

  function stepper(p, onChange) {
    var wrap = el('div', 'stepper');
    var minus = el('button', '', '−'); minus.type = 'button'; minus.setAttribute('aria-label', 'Decrease quantity of ' + p.name);
    var inp = el('input'); inp.type = 'number'; inp.min = '0'; inp.max = '999'; inp.value = qty(p.id);
    inp.setAttribute('aria-label', 'Quantity of ' + p.name);
    var plus = el('button', '', '+'); plus.type = 'button'; plus.setAttribute('aria-label', 'Increase quantity of ' + p.name);
    minus.addEventListener('click', function () { setQty(p.id, qty(p.id) - 1); if (onChange) onChange(); });
    plus.addEventListener('click', function () { setQty(p.id, qty(p.id) + 1); if (onChange) onChange(); });
    inp.addEventListener('change', function () { setQty(p.id, inp.value); if (onChange) onChange(); });
    wrap.appendChild(minus); wrap.appendChild(inp); wrap.appendChild(plus);
    return wrap;
  }

  function renderDrawer() {
    if (!drawer) return;
    listEl.textContent = '';
    var ids = Object.keys(cart);
    emptyEl.hidden = ids.length > 0;
    formEl.hidden = ids.length === 0;
    ids.forEach(function (id) {
      var p = byId[id];
      var li = el('li', 'cart-line');
      var th = media(p, 'thumb-s');
      var info = el('div');
      info.appendChild(el('h3', '', p.name));
      info.appendChild(el('p', 'meta', [p.brand, catLabel(p.category)].filter(Boolean).join('  ·  ')));
      var side = el('div', 'qty');
      side.appendChild(stepper(p));
      var rm = el('button', 'linkbtn', 'Remove'); rm.type = 'button';
      rm.setAttribute('aria-label', 'Remove ' + p.name + ' from cart');
      rm.addEventListener('click', function () { setQty(id, 0); });
      side.appendChild(rm);
      li.appendChild(th); li.appendChild(info); li.appendChild(side);
      listEl.appendChild(li);
    });
    var t = drawer.querySelector('.cart-total');
    var n = totalCount();
    t.textContent = ids.length ? ids.length + (ids.length === 1 ? ' product' : ' products') + ', ' + n + (n === 1 ? ' item' : ' items') : '';
  }

  function openDrawer() {
    if (!drawer) return;
    lastFocus = document.activeElement;
    renderDrawer();
    overlay.classList.add('open'); drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    drawer.querySelector('.drawer-close').focus();
  }
  function closeDrawer() {
    if (!drawer) return;
    overlay.classList.remove('open'); drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function buildDrawer() {
    overlay = el('div', 'drawer-overlay');
    overlay.addEventListener('click', closeDrawer);
    drawer = el('aside', 'drawer');
    drawer.id = 'cart-drawer';
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-modal', 'true');
    drawer.setAttribute('aria-labelledby', 'cart-title');
    drawer.setAttribute('aria-hidden', 'true');

    var head = el('header');
    var hh = el('div');
    var h2 = el('h2', '', 'Your cart'); h2.id = 'cart-title';
    hh.appendChild(h2); hh.appendChild(el('p', 'cart-total meta'));
    var close = el('button', 'drawer-close'); close.type = 'button'; close.setAttribute('aria-label', 'Close cart');
    close.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
    close.addEventListener('click', closeDrawer);
    head.appendChild(hh); head.appendChild(close);

    var body = el('div', 'drawer-body');
    listEl = el('ul', 'cart-list');
    emptyEl = el('div', 'cart-empty');
    emptyEl.appendChild(el('p', '', 'Your cart is empty. Add the cartridges you need, then request a quote from the team.'));
    var browse = el('a', 'btn btn-solid btn-sm', 'Browse the catalogue'); browse.href = 'catalogue.html';
    emptyEl.appendChild(browse);

    formEl = document.createElement('form');
    formEl.noValidate = true;
    formEl.className = 'cart-form';
    formEl.innerHTML =
      '<h3>Request a quote</h3>' +
      '<div class="f2"><label>Name<input name="Name" autocomplete="name" required></label>' +
      '<label>Email<input type="email" name="Email" autocomplete="email" required></label></div>' +
      '<div class="f2"><label><span>Phone <span class="opt">(optional)</span></span><input type="tel" name="Phone" autocomplete="tel"></label>' +
      '<label><span>Company <span class="opt">(optional)</span></span><input name="Company" autocomplete="organization"></label></div>' +
      '<label><span>Notes <span class="opt">(optional)</span></span><textarea name="Notes" style="min-height:90px" placeholder="Delivery area, printer models, anything we should know"></textarea></label>' +
      '<button class="btn btn-solid" type="submit">Request a quote</button>' +
      '<div class="cart-extra"><button class="linkbtn" type="button" data-copy>Copy list</button>' +
      '<button class="linkbtn" type="button" data-clear>Clear cart</button></div>' +
      '<p class="fine status" role="status">This opens your email app with your list addressed to Richard.</p>';
    statusEl = formEl.querySelector('.status');

    formEl.querySelector('[data-clear]').addEventListener('click', function () {
      cart = {}; persist(); statusEl.textContent = 'Cart cleared.';
    });
    formEl.querySelector('[data-copy]').addEventListener('click', function () {
      copy(cartText()).then(function (ok) {
        statusEl.textContent = ok ? 'Your list is copied. Paste it into an email to ' + MAIL + '.' : 'Copying is not available in this browser. Select the items and copy them by hand.';
      });
    });
    formEl.addEventListener('submit', function (e) {
      e.preventDefault();
      var f = formEl.elements, name = f.Name.value.trim(), email = f.Email.value.trim();
      if (!name || !email || email.indexOf('@') < 1) {
        statusEl.textContent = 'Add your name and a valid email address, then request the quote again.';
        return;
      }
      var lines = ['Quote request', '', 'Name: ' + name, 'Email: ' + email];
      if (f.Phone.value.trim()) lines.push('Phone: ' + f.Phone.value.trim());
      if (f.Company.value.trim()) lines.push('Company: ' + f.Company.value.trim());
      lines.push('', 'Items:', cartText());
      if (f.Notes.value.trim()) lines.push('', 'Notes: ' + f.Notes.value.trim());
      var url = 'mailto:' + MAIL + '?subject=' + encodeURIComponent('Quote request from ' + name) +
        '&body=' + encodeURIComponent(lines.join('\n'));
      window.location.href = url;
      if (url.length > 1900) {
        copy(lines.join('\n'));
        statusEl.textContent = 'Large list: some email apps cut long messages short, so we copied it. If the email looks incomplete, paste the list in.';
      } else {
        statusEl.textContent = 'Your email app should open with the quote request ready to send.';
      }
    });

    body.appendChild(listEl); body.appendChild(emptyEl); body.appendChild(formEl);
    drawer.appendChild(head); drawer.appendChild(body);
    live = el('div', 'sr-only'); live.setAttribute('aria-live', 'polite');
    document.body.appendChild(overlay); document.body.appendChild(drawer); document.body.appendChild(live);

    document.addEventListener('keydown', function (e) {
      if (!drawer.classList.contains('open')) return;
      if (e.key === 'Escape') { closeDrawer(); return; }
      if (e.key === 'Tab') {
        var f = drawer.querySelectorAll('button,a[href],input,textarea,select');
        f = Array.prototype.filter.call(f, function (x) { return !x.disabled && x.offsetParent !== null; });
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }
  function copy(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return false; });
    }
    return Promise.resolve(false);
  }

  if (products.length) {
    buildDrawer();
    cartBtns.forEach(function (b) { b.hidden = false; b.addEventListener('click', openDrawer); });
    listeners.push(renderBadges, renderDrawer);
    renderBadges();
  }

  /* ---------- catalogue page ---------- */
  var listing = document.getElementById('listing');
  if (listing && products.length) {
    listing.hidden = false;
    var pl = document.getElementById('product-list');
    var q = document.getElementById('q');
    var fc = document.getElementById('f-cat');
    var fb = document.getElementById('f-brand');
    var count = document.getElementById('count');
    var more = document.getElementById('more');
    var PAGE = 24, shown = PAGE;

    var uniq = function (key) {
      var out = [];
      products.forEach(function (p) { if (p[key] && out.indexOf(p[key]) < 0) out.push(p[key]); });
      return out.sort();
    };
    uniq('category').forEach(function (c) { var o = el('option', '', catLabel(c)); o.value = c; fc.appendChild(o); });
    uniq('brand').forEach(function (b) { var o = el('option', '', b); o.value = b; fb.appendChild(o); });

    var params = new URLSearchParams(window.location.search);
    if (params.get('cat')) fc.value = params.get('cat');
    if (params.get('brand')) fb.value = params.get('brand');
    if (params.get('q')) q.value = params.get('q');

    var matches = function () {
      var terms = q.value.toLowerCase().split(/\s+/).filter(Boolean);
      return products.filter(function (p) {
        if (fc.value && p.category !== fc.value) return false;
        if (fb.value && p.brand !== fb.value) return false;
        var hay = [p.name, p.code, p.brand, p.detail, catLabel(p.category)].join(' ').toLowerCase();
        return terms.every(function (t) { return hay.indexOf(t) > -1; });
      });
    };

    var actions = function (p, box) {
      box.textContent = '';
      if (!qty(p.id)) {
        var add = el('button', 'btn btn-solid btn-sm', 'Add to cart'); add.type = 'button';
        add.addEventListener('click', function () { setQty(p.id, 1); announce(p.name + ' added to cart.'); });
        box.appendChild(add);
      } else {
        box.appendChild(stepper(p));
        var open = el('button', 'linkbtn', 'View cart'); open.type = 'button';
        open.addEventListener('click', openDrawer);
        box.appendChild(open);
      }
    };

    var render = function () {
      var list = matches();
      pl.textContent = '';
      list.slice(0, shown).forEach(function (p) {
        var card = el('article', 'pcard');
        card.appendChild(media(p));
        var body = el('div', 'pbody');
        body.appendChild(el('h3', '', p.name));
        var meta = [p.code, p.brand, catLabel(p.category)].filter(Boolean).join('  ·  ');
        if (meta) body.appendChild(el('p', 'meta', meta));
        if (p.detail) body.appendChild(el('p', 'meta', p.detail));
        if (p.price) body.appendChild(el('p', 'pprice', p.price));
        var act = el('div', 'pactions'); act.setAttribute('data-id', p.id);
        actions(p, act);
        body.appendChild(act);
        card.appendChild(body);
        pl.appendChild(card);
      });
      if (!list.length) pl.appendChild(el('p', 'no-match', 'Nothing matches that search. Try fewer words, or send us the model and we will find it.'));
      count.textContent = list.length + (list.length === 1 ? ' product' : ' products');
      more.hidden = list.length <= shown;
    };
    /* refresh only the add/stepper area when the cart changes */
    listeners.push(function () {
      Array.prototype.forEach.call(pl.querySelectorAll('.pactions'), function (box) {
        var p = byId[box.getAttribute('data-id')];
        var focused = document.activeElement && box.contains(document.activeElement);
        var wasInput = focused && document.activeElement.tagName === 'BUTTON' ? document.activeElement.textContent : '';
        actions(p, box);
        if (wasInput === '+' || wasInput === '−') {
          var b = Array.prototype.filter.call(box.querySelectorAll('button'), function (x) { return x.textContent === wasInput; })[0];
          if (b) b.focus();
        } else if (focused) {
          var n = box.querySelector('button,input'); if (n) n.focus();
        }
      });
    });
    var reset = function () { shown = PAGE; render(); };
    q.addEventListener('input', reset);
    fc.addEventListener('change', reset);
    fb.addEventListener('change', reset);
    more.addEventListener('click', function () { shown += PAGE; render(); });
    render();
  }

  /* ---------- specials, downloads and blog come from data.js ---------- */
  var sp = document.getElementById('specials-list');
  if (sp && D.specials && D.specials.length) {
    var empty = document.getElementById('specials-empty');
    if (empty) empty.hidden = true;
    var tb = document.getElementById('specials-filter');
    var brands = [];
    D.specials.forEach(function (s) { if (s.brand && brands.indexOf(s.brand) < 0) brands.push(s.brand); });

    var paint = function (brand) {
      sp.textContent = '';
      D.specials.forEach(function (s) {
        if (brand && s.brand !== brand) return;
        var row = el('article', 'item');
        var left = el('div');
        left.appendChild(el('h3', '', s.title || ''));
        if (s.detail) left.appendChild(el('p', '', s.detail));
        var meta = [s.brand, s.valid ? 'Valid until ' + s.valid : ''].filter(Boolean).join('  ·  ');
        if (meta) left.appendChild(el('p', 'meta', meta));
        var side = el('div', 'side');
        if (s.price) side.appendChild(el('span', 'price', s.price));
        side.appendChild(mailLink('Special: ' + (s.title || ''), 'Request this special'));
        row.appendChild(left);
        row.appendChild(side);
        sp.appendChild(row);
      });
    };
    if (tb && brands.length > 1) {
      var mk = function (label, val) {
        var b = el('button', '', label);
        b.type = 'button';
        b.setAttribute('aria-pressed', val === '' ? 'true' : 'false');
        b.addEventListener('click', function () {
          Array.prototype.forEach.call(tb.children, function (c) { c.setAttribute('aria-pressed', 'false'); });
          b.setAttribute('aria-pressed', 'true');
          paint(val);
        });
        tb.appendChild(b);
      };
      mk('All', '');
      brands.forEach(function (b) { mk(b, b); });
    }
    paint('');
  }

  var dl = document.getElementById('downloads-list');
  if (dl && D.downloads && D.downloads.length) {
    var e2 = document.getElementById('downloads-empty');
    if (e2) e2.hidden = true;
    D.downloads.forEach(function (d) {
      var row = el('article', 'item');
      var left = el('div');
      left.appendChild(el('h3', '', d.title || 'Document'));
      if (d.description) left.appendChild(el('p', '', d.description));
      var side = el('div', 'side');
      var a = el('a', 'btn btn-solid btn-sm', 'Download PDF');
      a.href = d.file || '#';
      a.setAttribute('download', '');
      side.appendChild(a);
      row.appendChild(left);
      row.appendChild(side);
      dl.appendChild(row);
    });
  }

  var bl = document.getElementById('blog-list');
  if (bl && D.posts && D.posts.length) {
    var e3 = document.getElementById('blog-empty');
    if (e3) e3.hidden = true;
    D.posts.forEach(function (p) {
      var det = el('details', 'post');
      var sum = el('summary');
      sum.appendChild(el('h3', '', p.title || 'Untitled'));
      if (p.date) sum.appendChild(el('span', 'meta', p.date));
      if (p.summary) sum.appendChild(el('p', '', p.summary));
      det.appendChild(sum);
      if (p.body) {
        var box = el('div', 'body');
        String(p.body).split(/\n\s*\n/).forEach(function (para) {
          var lines = para.split('\n');
          if (lines.length > 1 && lines[0].length < 40 && !/[.:;]$/.test(lines[0])) {
            box.appendChild(el('h4', '', lines.shift()));
          }
          if (lines.join(' ').trim()) box.appendChild(el('p', '', lines.join(' ')));
        });
        det.appendChild(box);
      }
      bl.appendChild(det);
    });
  }
})();
