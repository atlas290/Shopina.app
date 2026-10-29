/* ============================================================
   Shopina — client.js (Version Finale + Quantités)
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
  let cart = []; // Maintenant, chaque item aura une propriété "quantity"
  let currentProduct = null;
  let selectedVariant = null;
  let activeFilter = 'Tout';

  const $  = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  function formatPrice(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA'; }
  function escapeHtml(str) { return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

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

  /* ============================================================
     1. INITIALISATION
     ============================================================ */
  async function initBoutique() {
    const urlParams = new URLSearchParams(window.location.search);
    const slug = urlParams.get('shop');

    if (!slug) {
      $('.grid').innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px;">Erreur : Aucune boutique spécifiée.</div>';
      return;
    }

    try {
      const vendeurSnapshot = await db.collection('vendeurs').where('slug', '==', slug).get();
      
      if (vendeurSnapshot.empty) {
        $('.grid').innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px;">Boutique introuvable.</div>';
        return;
      }

      const vendeurDoc = vendeurSnapshot.docs[0];
      SHOP_ID = vendeurDoc.id;
      const vendeurData = vendeurDoc.data();
      
      SHOP.name = vendeurData.nom_boutique;
      SHOP.slug = vendeurData.slug;
      SHOP.whatsapp = vendeurData.numero_whatsapp;
      SHOP.color = vendeurData.couleur_accent;

      $('.shop-name').textContent = SHOP.name;
      $('.shop-slogan').textContent = vendeurData.horaires ? `Horaires : ${vendeurData.horaires}` : 'Bienvenue !';
      $('.logo').textContent = SHOP.name.charAt(0).toUpperCase();
      document.documentElement.style.setProperty('--accent', SHOP.color);
      
      const shopUrlEl = $('.shop-url');
      if (shopUrlEl) shopUrlEl.textContent = `shopina.shop/${SHOP.slug}`;

      const waBtn = $('.wa-btn');
      if (waBtn) waBtn.href = `https://wa.me/${SHOP.whatsapp.replace(/\s/g, '')}`;

      const produitsSnapshot = await db.collection('produits').where('vendeur_id', '==', SHOP_ID).get();
      products = [];
      produitsSnapshot.forEach((doc) => {
        const p = doc.data();
        products.push({ id: doc.id, name: p.nom, price: p.prix, category: p.categorie, description: p.description, variants: p.variantes || [], soldout: p.statut === 'Épuisé', photo_url: p.photo_url, bgColor: p.bgColor || '#F8BBD0' });
      });

      renderGrid();
      renderCart();

    } catch (error) {
      console.error("Erreur:", error);
    }
  }

  /* ============================================================
     2. AFFICHAGE & FILTRES
     ============================================================ */
  function renderGrid() {
    const gridEl = $('.grid');
    const list = products.filter((p) => activeFilter === 'Tout' || p.category === activeFilter);

    if (list.length === 0) {
      gridEl.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px;">Aucun produit disponible.</div>';
      return;
    }

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

  const filtersEl = document.querySelector('.filters');
  if (filtersEl) {
    filtersEl.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter'); if (!btn) return;
      activeFilter = btn.dataset.filter || 'Tout';
      $$('.filter').forEach((b) => b.classList.toggle('active', b === btn));
      renderGrid();
    });
  }

  /* ============================================================
     3. OVERLAY & AJOUT AU PANIER
     ============================================================ */
  const gridEl = document.querySelector('.grid');
  if (gridEl) {
    gridEl.addEventListener('click', (e) => {
      const addBtn = e.target.closest('.add-btn');
      if (addBtn && !addBtn.disabled) {
        e.stopPropagation(); quickAdd(addBtn.closest('.product-card').dataset.id); return;
      }
      const card = e.target.closest('.product-card');
      if (!card || card.classList.contains('soldout')) return;
      openDetail(card.dataset.id);
    });
  }

  function quickAdd(id) {
    const p = products.find(item => item.id === id); if (!p || p.soldout) return;
    const variant = p.variants.length > 0 ? p.variants[0] : "";
    addToCart(p, variant);
    bumpCartIcon(); showToast('✓ Ajouté !');
  }

  function openDetail(id) {
    const p = products.find(item => item.id === id); if (!p || p.soldout) return;
    currentProduct = p; selectedVariant = null;
    
    const overlayEl = document.getElementById('product-overlay');
    const overlayImgEl = overlayEl.querySelector('.overlay-img');
    const overlayBodyEl = overlayEl.querySelector('.overlay-body');
    const overlayAddBtn = overlayEl.querySelector('.btn-primary');

    if (p.photo_url) {
      overlayImgEl.style.backgroundImage = `url('${p.photo_url}')`; overlayImgEl.style.backgroundSize = 'cover'; overlayImgEl.style.backgroundPosition = 'center';
      overlayImgEl.querySelector('.ph-name').textContent = '';
    } else {
      overlayImgEl.style.background = p.bgColor; overlayImgEl.style.backgroundImage = 'none';
      overlayImgEl.querySelector('.ph-name').textContent = p.name;
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
    if (e.target.closest('.back-btn') || e.target === overlayEl) {
      overlayEl.classList.remove('open'); document.body.style.overflow = '';
    }
    const variantBtn = e.target.closest('.variant');
    if (variantBtn) {
      $$('#product-overlay .variant').forEach((b) => b.classList.toggle('selected', b === variantBtn));
      selectedVariant = variantBtn.dataset.variant;
      overlayEl.querySelector('.btn-primary').disabled = false;
    }
    const addBtn = e.target.closest('#product-overlay .btn-primary');
    if (addBtn && !addBtn.disabled && currentProduct) {
      const hasVariants = currentProduct.variants.length > 0;
      if (hasVariants && !selectedVariant) return;
      addToCart(currentProduct, hasVariants ? selectedVariant : "");
      overlayEl.classList.remove('open'); document.body.style.overflow = '';
      bumpCartIcon(); showToast('✓ Ajouté !');
    }
  });

  /* ============================================================
     4. PANIER (AVEC QUANTITÉS)
     ============================================================ */
  const drawerEl = document.getElementById('cart-drawer');
  const drawerBodyEl = drawerEl ? drawerEl.querySelector('.drawer-body') : null;
  const drawerTotalEl = drawerEl ? drawerEl.querySelector('.total-row strong') : null;
  const whatsappBtn = drawerEl ? drawerEl.querySelector('.btn-whatsapp') : null;
  const backdropEl = document.getElementById('cart-backdrop');
  const cartCountEl = document.querySelector('.cart-count');

  function addToCart(product, variant) {
    const existing = cart.find(item => item.id === product.id && item.variant === variant);
    
    if (existing) {
      // Si le produit est déjà là, on augmente la quantité
      existing.quantity += 1;
    } else {
      // Sinon, on l'ajoute avec une quantité de 1
      cart.push({ 
        id: product.id, 
        name: product.name, 
        price: product.price, 
        variant: variant, 
        bgColor: product.bgColor, 
        photo_url: product.photo_url,
        quantity: 1
      });
    }
    renderCart(); 
  }

  function renderCart() {
    let totalArticles = 0;
    cart.forEach(item => totalArticles += item.quantity);

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
              
              <!-- BOUTONS + ET - -->
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

  // Gérer les clics dans le panier (retirer, +, -)
  if (drawerBodyEl) {
    drawerBodyEl.addEventListener('click', (e) => {
      const removeBtn = e.target.closest('[data-remove]');
      if (removeBtn) { cart.splice(parseInt(removeBtn.dataset.remove, 10), 1); renderCart(); return; }
      
      const minusBtn = e.target.closest('[data-minus]');
      if (minusBtn) { 
        const idx = parseInt(minusBtn.dataset.minus, 10);
        if (cart[idx].quantity > 1) { cart[idx].quantity -= 1; } 
        else { cart.splice(idx, 1); }
        renderCart(); return; 
      }
      
      const plusBtn = e.target.closest('[data-plus]');
      if (plusBtn) { 
        const idx = parseInt(plusBtn.dataset.plus, 10);
        cart[idx].quantity += 1; 
        renderCart(); return; 
      }
      
      const variantBtn = e.target.closest('.ci-variant-btn');
      if (variantBtn) { const idx = parseInt(variantBtn.dataset.idx, 10); if (cart[idx]) { cart[idx].variant = variantBtn.dataset.variant; renderCart(); } }
    });
  }

  // Ouvrir / Fermer
  const cartBtn = document.querySelector('.cart-btn');
  if (cartBtn) cartBtn.addEventListener('click', () => { drawerEl.classList.add('open'); if(backdropEl) backdropEl.classList.add('open'); document.body.style.overflow = 'hidden'; });
  if (backdropEl) backdropEl.addEventListener('click', () => { drawerEl.classList.remove('open'); if(backdropEl) backdropEl.classList.remove('open'); document.body.style.overflow = ''; });
  if (drawerEl) { const closeBtn = drawerEl.querySelector('.drawer-head button'); if(closeBtn) closeBtn.addEventListener('click', () => { drawerEl.classList.remove('open'); if(backdropEl) backdropEl.classList.remove('open'); document.body.style.overflow = ''; }); }

  // WhatsApp (Sauvegarde avec quantités)
  if (whatsappBtn) {
    whatsappBtn.addEventListener('click', async () => {
      if (cart.length === 0 || !SHOP_ID) return;
      whatsappBtn.textContent = "Enregistrement..."; whatsappBtn.disabled = true;

      try {
        const lines = [`Bonjour ${SHOP.name}, je veux commander :`];
        cart.forEach((item) => {
          const varPart = item.variant ? ` (${item.variant})` : '';
          lines.push(`• ${item.quantity}x ${item.name}${varPart} — ${formatPrice(item.price * item.quantity)}`);
        });
        const total = cart.reduce((s, i) => s + (i.price * i.quantity), 0);
        lines.push(`TOTAL : ${formatPrice(total)}`);
        
        await db.collection('commandes').add({
          vendeur_id: SHOP_ID,
          articles: cart, 
          total: total,
          statut: 'nouvelle',
          created_at: firebase.firestore.FieldValue.serverTimestamp()
        });

        window.location.href = `https://wa.me/${SHOP.whatsapp.replace(/\s/g, '')}?text=${encodeURIComponent(lines.join('\n'))}`;
        
        cart = []; renderCart();
        drawerEl.classList.remove('open'); if(backdropEl) backdropEl.classList.remove('open'); document.body.style.overflow = '';

      } catch (error) {
        console.error(error); alert("Erreur d'enregistrement.");
      } finally {
        whatsappBtn.textContent = "Envoyer la commande sur WhatsApp"; whatsappBtn.disabled = false;
      }
    });
  }

  initBoutique();
})();
