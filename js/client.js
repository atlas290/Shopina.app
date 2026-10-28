/* ============================================================
   Shopina — client.js
   Vitrine publique avec gestion des quantités, frais de livraison
   et message WhatsApp incluant Mobile Money.
   ============================================================ */

(function () {
  'use strict';

  /* ============================================================
     1. DONNÉES
     ============================================================ */
  const SHOP = {
    name: 'Havana Shop',
    slug: 'havana-shop',
    whatsapp: '22967020586',
    hours: 'Lun-Sam 9h-19h',
    delivery: 'Cotonou, Calavi',
    momo: '+229 67 02 05 86'
  };

  const DELIVERY_FEES = {
    'Cotonou': 1000,
    'Calavi': 1500,
    'Autre': 2000
  };

  const products = [
    { id: 1, name: 'Robe wax imprimée', price: 15000, category: 'Vêtement',
      variants: ['S', 'M', 'L', 'XL'],
      description: 'Robe longue en wax authentique, coupe ajustée et finitions soignées.',
      soldout: false, bgColor: '#F8BBD0' },
    { id: 2, name: 'Chemisier en dentelle', price: 8500, category: 'Vêtement',
      variants: ['S', 'M', 'L', 'XL'],
      description: 'Chemisier léger en dentelle, parfait pour le bureau comme pour les sorties.',
      soldout: false, bgColor: '#D1C4E9' },
    { id: 3, name: 'Ensemble pagne 2 pièces', price: 22000, category: 'Vêtement',
      variants: ['S', 'M', 'L', 'XL'],
      description: 'Ensemble top et jupe en pagne, taillé avec soin par nos couturières.',
      soldout: false, bgColor: '#B2DFDB' },
    { id: 4, name: 'T-shirt coton brodé', price: 5000, category: 'Vêtement',
      variants: ['S', 'M', 'L', 'XL'],
      description: 'T-shirt 100 % coton orné d\'une broderie artisanale béninoise.',
      soldout: false, bgColor: '#FFE0B2' },
    { id: 5, name: 'Jupe longue fluide', price: 12000, category: 'Vêtement',
      variants: ['S', 'M', 'L', 'XL'],
      description: 'Jupe longue fluide à taille haute, idéale pour les journées chaudes.',
      soldout: false, bgColor: '#C5CAE9' },
    { id: 6, name: 'Rouge à lèvres mat', price: 3500, category: 'Cosmétique',
      variants: ['Rouge passion', 'Nude', 'Prune'],
      description: 'Rouge à lèvres mat longue tenue, texture crémeuse et confortable.',
      soldout: false, bgColor: '#FFCDD2' },
    { id: 7, name: 'Fond de teint liquide', price: 6500, category: 'Cosmétique',
      variants: ['Clair', 'Medium', 'Foncé'],
      description: 'Fond de teint liquide à couvrance modulable, fini naturel toute la journée.',
      soldout: false, bgColor: '#F0D9C0' },
    { id: 8, name: 'Huile de coco vierge', price: 2000, category: 'Cosmétique',
      variants: ['100 ml', '250 ml'],
      description: 'Huile de coco pure pressée à froid, pour la peau et les cheveux.',
      soldout: false, bgColor: '#DCEDC8' },
    { id: 9, name: 'Savon noir africain', price: 1500, category: 'Cosmétique',
      variants: ['Nature', 'Miel', 'Karité'],
      description: 'Savon noir traditionnel enrichi au beurre de karité, peau douce garantie.',
      soldout: false, bgColor: '#D7CCC8' },
    { id: 10, name: 'Palette fard à paupières', price: 7800, category: 'Cosmétique',
      variants: ['Nude', 'Smoky', 'Colorée'],
      description: 'Palette de 12 fards mats et satinés, fortement pigmentés.',
      soldout: true, bgColor: '#CFD8DC' },
    { id: 11, name: 'Mixeur blender', price: 25000, category: 'Électroménager',
      variants: [],
      description: 'Mixeur blender 1,5 L, 3 vitesses, bol en verre résistant.',
      soldout: false, bgColor: '#B0BEC5' }
  ];

  /* ============================================================
     2. ÉTAT
     ============================================================ */
  let cart = [];
  let currentProduct = null;
  let selectedVariant = null;
  let activeFilter = 'Tout';
  let selectedZone = '';

  /* ============================================================
     3. RÉFÉRENCES DOM
     ============================================================ */
  const $  = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const gridEl          = $('.grid');
  const filtersEl       = $('.filters');
  const cartBtn         = $('.cart-btn');
  const cartCountEl     = $('.cart-count');

  const drawerEl        = $('#cart-drawer');
  const drawerBodyEl    = $('#cart-drawer .drawer-body');
  const zoneSelect      = $('#delivery-zone');
  const subtotalEl      = $('#cart-subtotal');
  const deliveryEl      = $('#cart-delivery');
  const totalEl         = $('#cart-total');
  const drawerCloseBtn  = $('#cart-drawer .drawer-head button');
  const whatsappBtn     = $('#cart-drawer .btn-whatsapp');
  const backdropEl      = $('#cart-backdrop');

  const overlayEl       = $('#product-overlay');
  const overlayImgEl    = $('#product-overlay .overlay-img');
  const overlayBodyEl   = $('#product-overlay .overlay-body');
  const overlayAddBtn   = $('#product-overlay .btn-primary');
  const overlayBackBtn  = $('#product-overlay .back-btn');

  /* ============================================================
     4. HELPERS
     ============================================================ */
  function formatPrice(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA';
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;',
      '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  function getProductById(id) {
    return products.find((p) => p.id === id) || null;
  }

  function defaultVariantOf(product) {
    return product.variants.length > 0 ? product.variants[0] : '';
  }

  function bumpCartIcon() {
    cartBtn.classList.remove('cart-bump');
    void cartBtn.offsetWidth;
    cartBtn.classList.add('cart-bump');
    setTimeout(() => cartBtn.classList.remove('cart-bump'), 300);
  }

  function showToast(message) {
    let toast = document.getElementById('toast-succes');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast-succes';
      toast.className = 'toast-succes';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    void toast.offsetWidth;
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('show'), 2000);
  }

  function refreshAll() {
    renderCart();
    renderGrid();
  }

  function renderShopInfo() {
    const el = document.getElementById('shopInfoBadges');
    if (!el) return;
    const parts = [];
    if (SHOP.delivery) parts.push('📍 ' + SHOP.delivery);
    if (SHOP.hours)    parts.push('🕒 ' + SHOP.hours);
    el.textContent = parts.join(' · ');
  }

  /* ============================================================
     5. GRILLE PRODUITS
     ============================================================ */
  function renderGrid() {
    const list = products.filter((p) =>
      activeFilter === 'Tout' || p.category === activeFilter
    );

    gridEl.innerHTML = list.map((p) => {
      const sold = !!p.soldout;
      let actionHtml;

      if (sold) {
        actionHtml = '<button class="add-btn" disabled>Épuisé</button>';
      } else {
        const def = defaultVariantOf(p);
        const inCart = cart.find((it) => it.id === p.id && it.variant === def);

        if (inCart) {
          actionHtml = `
            <div class="qty-control">
              <button type="button" class="qty-btn minus"
                      data-id="${p.id}"
                      data-variant="${escapeHtml(def)}"
                      aria-label="Diminuer">−</button>
              <span class="qty-value">${inCart.quantity}</span>
              <button type="button" class="qty-btn plus"
                      data-id="${p.id}"
                      data-variant="${escapeHtml(def)}"
                      aria-label="Augmenter">+</button>
            </div>
          `;
        } else {
          actionHtml = '<button class="add-btn">Ajouter</button>';
        }
      }

      return `
        <article class="product-card${sold ? ' soldout' : ''}" data-id="${p.id}">
          <div class="product-img" style="background:${p.bgColor}">
            ${sold ? '<span class="soldout-badge">Épuisé</span>' : ''}
            <span class="ph-name">${escapeHtml(p.name)}</span>
          </div>
          <div class="product-body">
            <div class="product-name">${escapeHtml(p.name)}</div>
            <div class="product-price">${formatPrice(p.price)}</div>
            ${actionHtml}
          </div>
        </article>
      `;
    }).join('');
  }

  /* ============================================================
     6. FILTRES
     ============================================================ */
  filtersEl.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter');
    if (!btn) return;
    activeFilter = btn.dataset.filter || 'Tout';
    $$('.filter').forEach((b) => b.classList.toggle('active', b === btn));
    renderGrid();
  });

  /* ============================================================
     7. CLIC SUR LA GRILLE
     ============================================================ */
  gridEl.addEventListener('click', (e) => {
    const addBtn = e.target.closest('.add-btn');
    if (addBtn && !addBtn.disabled) {
      e.stopPropagation();
      const card = addBtn.closest('.product-card');
      if (!card) return;
      const p = getProductById(parseInt(card.dataset.id, 10));
      if (!p) return;
      addToCart(p, defaultVariantOf(p));
      bumpCartIcon();
      showToast('✓ Ajouté !');
      refreshAll();
      return;
    }

    const qtyBtn = e.target.closest('.qty-btn');
    if (qtyBtn) {
      e.stopPropagation();
      const id = parseInt(qtyBtn.dataset.id, 10);
      const variant = qtyBtn.dataset.variant;
      const delta = qtyBtn.classList.contains('plus') ? 1 : -1;
      updateQuantity(id, variant, delta);
      return;
    }

    const card = e.target.closest('.product-card');
    if (!card || card.classList.contains('soldout')) return;
    openDetail(parseInt(card.dataset.id, 10));
  });

  /* ============================================================
     8. FICHE PRODUIT
     ============================================================ */
  function openDetail(id) {
    const p = getProductById(id);
    if (!p || p.soldout) return;

    currentProduct = p;
    selectedVariant = null;

    overlayImgEl.style.background = p.bgColor;
    overlayImgEl.querySelector('.ph-name').textContent = p.name;

    const hasVariants = p.variants.length > 0;

    overlayBodyEl.innerHTML = `
      <span class="detail-cat">${escapeHtml(p.category)}</span>
      <h2 class="detail-name">${escapeHtml(p.name)}</h2>
      <div class="detail-price">${formatPrice(p.price)}</div>
      <p class="detail-desc">${escapeHtml(p.description)}</p>
      ${hasVariants ? `
        <div class="variant-label">Variantes <span>— choisissez une option</span></div>
        <div class="variants">
          ${p.variants.map((v) => `
            <button type="button" class="variant" data-variant="${escapeHtml(v)}">${escapeHtml(v)}</button>
          `).join('')}
        </div>
      ` : ''}
    `;

    overlayAddBtn.disabled = hasVariants;
    overlayAddBtn.textContent = 'Ajouter au panier';

    overlayEl.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeDetail() {
    overlayEl.classList.remove('open');
    document.body.style.overflow = '';
    currentProduct = null;
    selectedVariant = null;
  }

  overlayBodyEl.addEventListener('click', (e) => {
    const btn = e.target.closest('.variant');
    if (!btn) return;
    $$('#product-overlay .variant').forEach((b) =>
      b.classList.toggle('selected', b === btn)
    );
    selectedVariant = btn.dataset.variant;
    overlayAddBtn.disabled = false;
  });

  overlayAddBtn.addEventListener('click', () => {
    if (!currentProduct) return;
    const hasVariants = currentProduct.variants.length > 0;
    if (hasVariants && !selectedVariant) return;
    const variant = hasVariants ? selectedVariant : '';
    addToCart(currentProduct, variant);
    closeDetail();
    bumpCartIcon();
    showToast('✓ Ajouté !');
    refreshAll();
  });

  overlayBackBtn.addEventListener('click', closeDetail);

  overlayEl.addEventListener('click', (e) => {
    if (e.target === overlayEl) closeDetail();
  });

  /* ============================================================
     9. PANIER
     ============================================================ */
  function addToCart(product, variant) {
    variant = variant || '';
    const existing = cart.find(
      (item) => item.id === product.id && item.variant === variant
    );

    if (existing) {
      existing.quantity += 1;
      return existing;
    }

    const item = {
      id: product.id,
      name: product.name,
      price: product.price,
      variant: variant,
      bgColor: product.bgColor,
      quantity: 1
    };
    cart.push(item);
    return item;
  }

  function updateQuantity(id, variant, delta) {
    variant = variant || '';
    const idx = cart.findIndex(
      (item) => item.id === id && item.variant === variant
    );
    if (idx === -1) return;

    cart[idx].quantity += delta;

    if (cart[idx].quantity <= 0) {
      cart.splice(idx, 1);
    }
    refreshAll();
  }

  function removeFromCart(index) {
    cart.splice(index, 1);
    refreshAll();
  }

  function changeCartVariant(index, newVariant) {
    const item = cart[index];
    if (!item || item.variant === newVariant) return;

    const dupIdx = cart.findIndex(
      (it, i) => i !== index && it.id === item.id && it.variant === newVariant
    );

    if (dupIdx !== -1) {
      cart[dupIdx].quantity += item.quantity;
      cart.splice(index, 1);
    } else {
      cart[index].variant = newVariant;
    }
    refreshAll();
  }

  function renderCart() {
    const count = cart.reduce((n, item) => n + item.quantity, 0);

    cartCountEl.textContent = count;
    cartCountEl.dataset.empty = count === 0 ? 'true' : 'false';

    if (cart.length === 0) {
      drawerBodyEl.innerHTML = '<div class="empty-cart">Votre panier est vide.</div>';
    } else {
      drawerBodyEl.innerHTML = cart.map((item, idx) => {
        const p = getProductById(item.id);
        const variants = p && p.variants ? p.variants : [];
        const subtotal = item.price * item.quantity;

        const variantsHtml = variants.length > 0
          ? `<div class="ci-variants-wrap">
               ${variants.map((v) => `
                 <button type="button"
                         class="ci-variant-btn${v === item.variant ? ' active' : ''}"
                         data-idx="${idx}"
                         data-variant="${escapeHtml(v)}">
                   ${escapeHtml(v)}
                 </button>
               `).join('')}
             </div>`
          : '';

        return `
          <div class="cart-item">
            <div class="ci-swatch" style="background:${item.bgColor}"></div>
            <div class="ci-info">
              <div class="ci-name">${escapeHtml(item.name)}</div>
              ${variantsHtml}
            </div>
            <div class="ci-right">
              <div class="ci-price">${formatPrice(subtotal)}</div>
              <div class="ci-qty-info">${item.quantity} × ${formatPrice(item.price)}</div>
              <button type="button" class="ci-remove" data-remove="${idx}">Retirer</button>
            </div>
          </div>
        `;
      }).join('');
    }

    const subtotal = cart.reduce(
      (sum, item) => sum + item.price * item.quantity, 0
    );
    const deliveryFee = selectedZone ? DELIVERY_FEES[selectedZone] : 0;
    const total = subtotal + deliveryFee;

    if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal);
    if (deliveryEl) deliveryEl.textContent = selectedZone ? formatPrice(deliveryFee) : '—';
    if (totalEl)    totalEl.textContent    = formatPrice(total);
    
    whatsappBtn.disabled = cart.length === 0;
  }

  drawerBodyEl.addEventListener('click', (e) => {
    const removeBtn = e.target.closest('[data-remove]');
    if (removeBtn) {
      removeFromCart(parseInt(removeBtn.dataset.remove, 10));
      return;
    }
    const variantBtn = e.target.closest('.ci-variant-btn');
    if (variantBtn) {
      e.stopPropagation();
      changeCartVariant(
        parseInt(variantBtn.dataset.idx, 10),
        variantBtn.dataset.variant
      );
    }
  });

  /* Gestion du select de livraison */
  if (zoneSelect) {
    zoneSelect.addEventListener('change', function () {
      selectedZone = this.value;
      renderCart();
    });
  }

  /* ============================================================
     10. OUVERTURE / FERMETURE DU PANIER
     ============================================================ */
  function openCart() {
    drawerEl.classList.add('open');
    backdropEl.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeCart() {
    drawerEl.classList.remove('open');
    backdropEl.classList.remove('open');
    document.body.style.overflow = '';
  }

  cartBtn.addEventListener('click', openCart);
  backdropEl.addEventListener('click', closeCart);
  if (drawerCloseBtn) drawerCloseBtn.addEventListener('click', closeCart);

  /* ============================================================
     11. MESSAGE WHATSAPP
     ============================================================ */
  function buildMessage() {
    const lines = [`Bonjour ${SHOP.name}, je veux commander :`];
    
    cart.forEach((item) => {
      const varPart = item.variant ? ` — ${item.variant}` : '';
      const subtotal = item.price * item.quantity;
      lines.push(`• ${item.quantity} x ${item.name}${varPart} — ${formatPrice(subtotal)}`);
    });

    const subtotal = cart.reduce((s, item) => s + item.price * item.quantity, 0);
    const deliveryFee = selectedZone ? DELIVERY_FEES[selectedZone] : 0;
    const total = subtotal + deliveryFee;

    lines.push(`SOUS-TOTAL : ${formatPrice(subtotal)}`);
    if (selectedZone) {
      lines.push(`LIVRAISON (${selectedZone}) : ${formatPrice(deliveryFee)}`);
    }
    lines.push(`TOTAL : ${formatPrice(total)}`);
    lines.push(`Lien boutique : shopina.shop/${SHOP.slug}`);
    lines.push(`Paiement Mobile Money : MTN MoMo ${SHOP.momo} (${SHOP.name})`);

    return lines.join('\n');
  }

  whatsappBtn.addEventListener('click', () => {
    if (cart.length === 0) return;
    if (!selectedZone) {
      showToast('⚠️ Veuillez choisir une zone de livraison.');
      return;
    }
    const message = buildMessage();
    window.alert(message);
    console.log('[Shopina] Message WhatsApp :\n' + message);
  });

  /* ============================================================
     12. RACCOURCI CLAVIER
     ============================================================ */
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (overlayEl.classList.contains('open')) closeDetail();
    else if (drawerEl.classList.contains('open')) closeCart();
  });

  /* ============================================================
     13. INITIALISATION
     ============================================================ */
  function init() {
    renderShopInfo();
    renderGrid();
    renderCart();
  }

  init();
})();
