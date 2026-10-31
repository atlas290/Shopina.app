/* ============================================================
   Shopina — client.js (Version Finale Corrigée)
   ============================================================ */

(function () {
  'use strict';

  const firebaseConfig = {
    apiKey: "AIzaSyCuge89Ct4HX-r4wUnaCqb3qdToL9H-3O0",
    authDomain: "shopina-6172d.firebaseapp.com",
    projectId: "shopina-6172d",
    storageBucket: "shopina-6172d.firebasestorage.app",
    messagingSenderId: "1068229855736",
    appId: "1:1068229855736:web:7583e82691e8a0eeb72e0d"
  };
  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();

  let SHOP = { name: 'Boutique', slug: '', whatsapp: '', color: '#E91E63' };
  let SHOP_ID = null;
  let products = [];
  let cart = [];
  let currentProduct = null;
  let selectedVariant = null;
  let activeFilter = 'Tout';

  const $  = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  function formatPrice(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA'; }
  function escapeHtml(str) { return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

  // FONCTION INTELLIGENTE : Gère tous les formats de numéros Béninois
  function cleanWhatsAppNumber(phone) {
    if (!phone) return '';
    
    // 1. Supprime tout ce qui n'est pas un chiffre (espaces, +, -, etc.)
    let clean = phone.replace(/\D/g, '');

    // 2. Si le numéro est déjà au format international complet (229...)
    if (clean.startsWith('229')) {
      return clean;
    }

    // 3. Si le numéro commence par 01 (le nouveau format standard)
    if (clean.startsWith('01')) {
      return '229' + clean;
    }

    // 4. Si l'utilisateur a tapé 10 chiffres sans le 229
    if (clean.length === 10) {
      return '229' + clean;
    }

    // 5. Si l'utilisateur a oublié le 0 du 01 (ex: 143327643 -> 0143327643)
    if (clean.length === 9 && clean.startsWith('1')) {
      return '2290' + clean;
    }

    // 6. Ancien format à 8 chiffres (ex: 97000000)
    if (clean.length === 8) {
      return '229' + clean;
    }

    // 7. Si ça commence par 0 mais pas 01 (ex: 097000000)
    if (clean.startsWith('0')) {
      return '229' + clean.substring(1);
    }

    // Sécurité : au pire on ajoute 229
    return '229' + clean;
  }

  let toastEl = null;
  function showToast(message) {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'toast-succes'; document.body.appendChild(toastEl); }
    toastEl.textContent = message; void toastEl.offsetWidth; toastEl.classList.add('show');
    setTimeout(() => toastEl.classList.remove('show'), 2000);
  }

  function bumpCartIcon() {
    const cartBtn = $('.cart-btn'); if (!cartBtn) return;
    cartBtn.classList.remove('cart-bump'); void cartBtn.offsetWidth; cartBtn.classList.add('cart-bump');
    setTimeout(() => cartBtn.classList.remove('cart-bump'), 300);
  }

  async function initBoutique() {
    const urlParams = new URLSearchParams(window.location.search);
    const slug = urlParams.get('shop');
    if (!slug) { $('.grid').innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px;">Erreur : Aucune boutique spécifiée.</div>'; return; }

    try {
      const vendeurSnapshot = await db.collection('vendeurs').where('slug', '==', slug).get();
      if (vendeurSnapshot.empty) { $('.grid').innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px;">Boutique introuvable.</div>'; return; }

      const vendeurDoc = vendeurSnapshot.docs[0];
      SHOP_ID = vendeurDoc.id;
      const vendeurData = vendeurDoc.data();
      
      SHOP.name = vendeurData.nom_boutique;
      SHOP.slug = vendeurData.slug;
      SHOP.whatsapp = vendeurData.numero_whatsapp;
      SHOP.color = vendeurData.couleur_accent;
      
      $('.shop-name').textContent = SHOP.name;
      $('.shop-slogan').textContent = vendeurData.horaires ? `Horaires : ${vendeurData.horaires}` : 'Bienvenue !';
      
      // Affichage du logo
      if (vendeurData.logo_url) {
        $('.logo').textContent = '';
        $('.logo').style.backgroundImage = `url('${vendeurData.logo_url}')`;
        $('.logo').style.backgroundSize = 'cover';
        $('.logo').style.backgroundPosition = 'center';
      } else {
        $('.logo').textContent = SHOP.name.charAt(0).toUpperCase();
      }
      
      document.documentElement.style.setProperty('--accent', SHOP.color);
      $('.shop-url').textContent = `shopina.shop/${SHOP.slug}`;

      const waBtn = $('.wa-btn');
      if (waBtn) waBtn.href = `https://wa.me/${cleanWhatsAppNumber(SHOP.whatsapp)}`;

      const produitsSnapshot = await db.collection('produits').where('vendeur_id', '==', SHOP_ID).get();
      products = [];
      produitsSnapshot.forEach((doc) => {
        const p = doc.data();
        products.push({ id: doc.id, name: p.nom, price: p.prix, category: p.categorie, description: p.description, variants: p.variantes || [], soldout: p.statut === 'Épuisé', photo_url: p.photo_url, bgColor: p.bgColor || '#F8BBD0' });
      });

      generateFilters();
      renderGrid();
      renderCart();

    } catch (error) { console.error("Erreur:", error); }
  }

  function generateFilters() {
    const filtersEl = document.querySelector('.filters');
    if (!filtersEl) return;

    const categories = ['Tout'];
    products.forEach(p => {
      if (p.category && !categories.includes(p.category)) {
        categories.push(p.category);
      }
    });

    filtersEl.innerHTML = categories.map(cat => `
      <button class="filter ${cat === 'Tout' ? 'active' : ''}" data-filter="${escapeHtml(cat)}">${escapeHtml(cat)}</button>
    `).join('');

    filtersEl.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter'); if (!btn) return;
      activeFilter = btn.dataset.filter;
      $$('.filter').forEach((b) => b.classList.toggle('active', b === btn));
      renderGrid();
    });
  }

  function renderGrid() {
    const gridEl = $('.grid');
    const list = products.filter((p) => activeFilter === 'Tout' || p.category === activeFilter);

    if (list.length === 0) { gridEl.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px;">Aucun produit disponible.</div>'; return; }

    gridEl.innerHTML = list.map((p) => {
      const sold = !!p.soldout;
      const imgStyle = p.photo_url ? `background-image: url('${p.photo_url}'); background-size: cover; background-position: center;` : `background: ${p.bgColor};`;
      return `
        <article class="product-card${sold ? ' soldout' : ''}" data-id="${p.id}">
          <div class="product-img" style="${imgStyle}">
            ${sold ? '<span class="soldout-badge">Épuisé</span>' : ''}
            ${!p.photo_url ? `<span class="ph-name">${escapeHtml(p.name)}</span>` : ''}
          </div>
          <div class="product-body">
            <div class="product-name">${escapeHtml(p.name)}</div>
            <div class="product-price">${formatPrice(p.price)}</div>
            ${sold ? '<button class="add-btn" disabled>Épuisé</button>' : '<button class="add-btn">Ajouter</button>'}
          </div>
        </article>
      `;
    }).join('');
  }

  const gridEl = document.querySelector('.grid');
  if (gridEl) {
    gridEl.addEventListener('click', (e) => {
      const addBtn = e.target.closest('.add-btn');
      if (addBtn && !addBtn.disabled) { e.stopPropagation(); quickAdd(addBtn.closest('.product-card').dataset.id); return; }
      const card = e.target.closest('.product-card');
      if (!card || card.classList.contains('soldout')) return;
      openDetail(card.dataset.id);
    });
  }

  function quickAdd(id) {
    const p = products.find(item => item.id === id); if (!p || p.soldout) return;
    const variant = p.variants.length > 0 ? p.variants[0] : "";
    if (addToCart(p, variant)) { bumpCartIcon(); showToast('✓ Ajouté !'); renderGrid(); } else { showToast('Déjà dans le panier'); }
  }

  function openDetail(id) {
    const p = products.find(item => item.id === id); if (!p || p.soldout) return;
    currentProduct = p; selectedVariant = null;
    
    const overlayEl = document.getElementById('product-overlay');
    const overlayImgEl = overlayEl.querySelector('.overlay-img');
    const overlayBodyEl = overlayEl.querySelector('.overlay-body');
    const overlayAddBtn = overlayEl.querySelector('.btn-primary');

    if (p.photo_url) {
      overlayImgEl.style.backgroundImage = `url('${p.photo_url}')`; overlayImgEl.style.backgroundSize = 'cover'; overlayImgEl.style.backgroundPosition = 'center'; overlayImgEl.querySelector('.ph-name').textContent = '';
    } else {
      overlayImgEl.style.background = p.bgColor; overlayImgEl.style.backgroundImage = 'none'; overlayImgEl.querySelector('.ph-name').textContent = p.name;
    }

    const hasVariants = p.variants.length > 0;
    overlayBodyEl.innerHTML = `
      <span class="detail-cat">${escapeHtml(p.category)}</span>
      <h2 class="detail-name">${escapeHtml(p.name)}</h2>
      <div class="detail-price">${formatPrice(p.price)}</div>
      <p class="detail-desc">${escapeHtml(p.description)}</p>
      ${hasVariants ? `<div class="variant-label">Variantes</div><div class="variants">${p.variants.map((v) => `<button type="button" class="variant" data-variant="${escapeHtml(v)}">${escapeHtml(v)}</button>`).join('')}</div>` : ''}
    `;

    overlayAddBtn.disabled = hasVariants; overlayAddBtn.textContent = 'Ajouter au panier';
    overlayEl.classList.add('open'); document.body.style.overflow = 'hidden';
  }

  document.addEventListener('click', (e) => {
    const overlayEl = document.getElementById('product-overlay');
    if (!overlayEl) return;
    if (e.target.closest('.back-btn') || e.target === overlayEl) { overlayEl.classList.remove('open'); document.body.style.overflow = ''; }
    const variantBtn = e.target.closest('.variant');
    if (variantBtn) { $$('#product-overlay .variant').forEach((b) => b.classList.toggle('selected', b === variantBtn)); selectedVariant = variantBtn.dataset.variant; overlayEl.querySelector('.btn-primary').disabled = false; }
    const addBtn = e.target.closest('#product-overlay .btn-primary');
    if (addBtn && !addBtn.disabled && currentProduct) {
      const hasVariants = currentProduct.variants.length > 0;
      if (hasVariants && !selectedVariant) return;
      addToCart(currentProduct, hasVariants ? selectedVariant : "");
      overlayEl.classList.remove('open'); document.body.style.overflow = ''; bumpCartIcon(); showToast('✓ Ajouté !'); renderGrid();
    }
  });

  const drawerEl = document.getElementById('cart-drawer');
  const drawerBodyEl = drawerEl ? drawerEl.querySelector('.drawer-body') : null;
  const drawerTotalEl = drawerEl ? drawerEl.querySelector('.total-row strong') : null;
  const whatsappBtn = drawerEl ? drawerEl.querySelector('.btn-whatsapp') : null;
  const backdropEl = document.getElementById('cart-backdrop');
  const cartCountEl = document.querySelector('.cart-count');

  function addToCart(product, variant) {
    const existing = cart.find(item => item.id === product.id && item.variant === variant);
    if (existing) { existing.quantity += 1; } else { cart.push({ id: product.id, name: product.name, price: product.price, variant: variant, bgColor: product.bgColor, photo_url: product.photo_url, quantity: 1 }); }
    renderCart(); return true;
  }

  function renderCart() {
    let totalArticles = 0;
    cart.forEach(item => totalArticles += item.quantity);

    const floatingBar = document.getElementById('floating-cart-bar');
    if (floatingBar) {
      if (cart.length > 0) {
        let totalCheck = 0;
        cart.forEach(item => totalCheck += (item.price * item.quantity));
        floatingBar.querySelector('.floating-cart-count').textContent = `${cart.length} article${cart.length > 1 ? 's' : ''}`;
        floatingBar.querySelector('.floating-cart-total').textContent = formatPrice(totalCheck);
        floatingBar.classList.add('visible');
      } else {
        floatingBar.classList.remove('visible');
      }
    }

    if (cartCountEl) { cartCountEl.textContent = totalArticles; cartCountEl.dataset.empty = totalArticles === 0 ? 'true' : 'false'; }
    if (!drawerBodyEl) return;

    if (cart.length === 0) {
      drawerBodyEl.innerHTML = '<div class="empty-cart">Votre panier est vide.</div>';
    } else {
      drawerBodyEl.innerHTML = cart.map((item, idx) => {
        const p = products.find(prod => prod.id === item.id);
        const variants = p && p.variants ? p.variants : [];
        const swatchStyle = item.photo_url ? `background-image: url('${item.photo_url}'); background-size: cover; background-position: center;` : `background: ${item.bgColor};`;
        const variantsHtml = variants.length > 0 ? `<div class="ci-variants-wrap">${variants.map((v) => `<button type="button" class="ci-variant-btn${v === item.variant ? ' active' : ''}" data-idx="${idx}" data-variant="${escapeHtml(v)}">${escapeHtml(v)}</button>`).join('')}</div>` : '';
        
        return `
          <div class="cart-item">
            <div class="ci-swatch" style="${swatchStyle}"></div>
            <div class="ci-info">
              <div class="ci-name">${escapeHtml(item.name)}</div>
              ${variantsHtml}
            </div>
            <div class="ci-right">
              <div class="ci-price">${formatPrice(item.price * item.quantity)}</div>
              <div class="ci-qty-controls">
                <button type="button" class="ci-qty-btn" data-minus="${idx}">−</button>
                <span class="ci-qty-val">${item.quantity}</span>
                <button type="button" class="ci-qty-btn" data-plus="${idx}">+</button>
              </div>
              <button type="button" class="ci-remove" data-remove="${idx}">Retirer</button>
            </div>
          </div>
        `;
      }).join('');
    }

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    if (drawerTotalEl) drawerTotalEl.textContent = formatPrice(total);
    if (whatsappBtn) whatsappBtn.disabled = cart.length === 0;
  }

  if (drawerBodyEl) {
    drawerBodyEl.addEventListener('click', (e) => {
      const removeBtn = e.target.closest('[data-remove]'); if (removeBtn) { cart.splice(parseInt(removeBtn.dataset.remove, 10), 1); renderCart(); return; }
      const minusBtn = e.target.closest('[data-minus]'); if (minusBtn) { const idx = parseInt(minusBtn.dataset.minus, 10); if (cart[idx].quantity > 1) { cart[idx].quantity -= 1; } else { cart.splice(idx, 1); } renderCart(); return; }
      const plusBtn = e.target.closest('[data-plus]'); if (plusBtn) { const idx = parseInt(plusBtn.dataset.plus, 10); cart[idx].quantity += 1; renderCart(); return; }
      const variantBtn = e.target.closest('.ci-variant-btn'); if (variantBtn) { const idx = parseInt(variantBtn.dataset.idx, 10); if (cart[idx]) { cart[idx].variant = variantBtn.dataset.variant; renderCart(); } }
    });
  }

  function openCart() {
    if (drawerEl && backdropEl) {
      drawerEl.classList.add('open');
      backdropEl.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeCart() {
    if (drawerEl && backdropEl) {
      drawerEl.classList.remove('open');
      backdropEl.classList.remove('open');
      document.body.style.overflow = '';
    }
  }

  const cartBtn = document.querySelector('.cart-btn');
  if (cartBtn) cartBtn.addEventListener('click', openCart);

  const floatBtn = document.querySelector('.floating-cart-btn');
  if (floatBtn) floatBtn.addEventListener('click', openCart);

  if (backdropEl) backdropEl.addEventListener('click', closeCart);
  if (drawerEl) { 
    const closeBtn = drawerEl.querySelector('.drawer-head button'); 
    if(closeBtn) closeBtn.addEventListener('click', closeCart); 
  }

  if (whatsappBtn) {
    whatsappBtn.addEventListener('click', async () => {
      if (cart.length === 0 || !SHOP_ID) return;
      whatsappBtn.textContent = "Enregistrement..."; whatsappBtn.disabled = true;
      try {
        const lines = [`Bonjour ${SHOP.name}, je veux commander :`];
        cart.forEach((item) => { const varPart = item.variant ? ` (${item.variant})` : ''; lines.push(`• ${item.quantity}x ${item.name}${varPart} — ${formatPrice(item.price * item.quantity)}`); });
        const total = cart.reduce((s, i) => s + (i.price * i.quantity), 0);
        lines.push(`TOTAL : ${formatPrice(total)}`);
        
        await db.collection('commandes').add({ vendeur_id: SHOP_ID, articles: cart, total: total, statut: 'nouvelle', created_at: firebase.firestore.FieldValue.serverTimestamp() });
        
        window.location.href = `https://wa.me/${cleanWhatsAppNumber(SHOP.whatsapp)}?text=${encodeURIComponent(lines.join('\n'))}`;
        
        cart = []; renderCart(); closeCart();
      } catch (error) { console.error(error); alert("Erreur d'enregistrement."); } 
      finally { whatsappBtn.textContent = "Envoyer la commande sur WhatsApp"; whatsappBtn.disabled = false; }
    });
  }

  initBoutique();
})();
