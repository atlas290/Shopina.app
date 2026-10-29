/* ============================================================
   Shopina — client.js (Version Firebase)
   ============================================================ */

(function () {
  'use strict';

  // Configuration Firebase
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

  // Variables globales
  let SHOP = { name: 'Boutique', slug: '', whatsapp: '', color: '#E91E63' };
  let products = []; // Les produits viendront de Firebase
  let cart = [];
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
     1. INITIALISATION (Chargement de la boutique)
     ============================================================ */
  async function initBoutique() {
    // 1. Récupérer le slug dans l'URL (ex: boutique.html?shop=sessi-shop)
    const urlParams = new URLSearchParams(window.location.search);
    const slug = urlParams.get('shop');

    if (!slug) {
      // Si pas de slug, on affiche un message d'erreur propre
      document.querySelector('.grid').innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px;">Erreur : Aucune boutique spécifiée dans le lien.</div>';
      return;
    }

    try {
      // 2. Chercher la vendeuse dans Firebase
      const vendeurSnapshot = await db.collection('vendeurs').where('slug', '==', slug).get();
      
      if (vendeurSnapshot.empty) {
        document.querySelector('.grid').innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px;">Boutique introuvable.</div>';
        return;
      }

      const vendeurData = vendeurSnapshot.docs[0].data();
      const vendeurId = vendeurSnapshot.docs[0].id;
      
      // Mettre à jour les infos de la boutique
      SHOP.name = vendeurData.nom_boutique;
      SHOP.slug = vendeurData.slug;
      SHOP.whatsapp = vendeurData.numero_whatsapp;
      SHOP.color = vendeurData.couleur_accent;

      // Mettre à jour le design (Header)
      document.querySelector('.shop-name').textContent = SHOP.name;
      document.querySelector('.shop-slogan').textContent = vendeurData.horaires ? `Horaires : ${vendeurData.horaires}` : 'Bienvenue !';
      document.querySelector('.logo').textContent = SHOP.name.charAt(0).toUpperCase();
      document.documentElement.style.setProperty('--accent', SHOP.color);
      
      // Mettre à jour le lien WhatsApp
      const waBtn = document.querySelector('.wa-btn');
      if (waBtn) waBtn.href = `https://wa.me/${SHOP.whatsapp.replace(/\s/g, '')}`;

      // 3. Charger les produits de cette vendeuse
      const produitsSnapshot = await db.collection('produits').where('vendeur_id', '==', vendeurId).get();
      
      products = [];
      produitsSnapshot.forEach((doc) => {
        const p = doc.data();
        products.push({
          id: doc.id,
          name: p.nom,
          price: p.prix,
          category: p.categorie,
          description: p.description,
          variants: p.variantes || [],
          soldout: p.statut === 'Épuisé',
          photo_url: p.photo_url,
          bgColor: p.bgColor || '#F8BBD0'
        });
      });

      // 4. Afficher la grille
      renderGrid();
      renderCart();

    } catch (error) {
      console.error("Erreur de chargement:", error);
      document.querySelector('.grid').innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px;">Erreur de connexion à la base de données.</div>';
    }
  }

  /* ============================================================
     2. AFFICHAGE DES PRODUITS
     ============================================================ */
  function renderGrid() {
    const gridEl = $('.grid');
    const list = products.filter((p) => activeFilter === 'Tout' || p.category === activeFilter);

    if (list.length === 0) {
      gridEl.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 40px;">Aucun produit disponible pour le moment.</div>';
      return;
    }

    gridEl.innerHTML = list.map((p) => {
      const sold = !!p.soldout;
      // Si on a une photo, on l'affiche, sinon on met la couleur de fond
      const imgStyle = p.photo_url 
        ? `background-image: url('${p.photo_url}'); background-size: cover; background-position: center;` 
        : `background: ${p.bgColor};`;

      return `
        <article class="product-card${sold ? ' soldout' : ''}" data-id="${p.id}">
          <div class="product-img" style="${imgStyle}">
            ${sold ? '<span class="soldout-badge">Épuisé</span>' : ''}
            ${!p.photo_url ? `<span class="ph-name">${escapeHtml(p.name)}</span>` : ''}
          </div>
          <div class="product-body">
            <div class="product-name">${escapeHtml(p.name)}</div>
            <div class="product-price">${formatPrice(p.price)}</div>
            ${sold
              ? '<button class="add-btn" disabled>Épuisé</button>'
              : '<button class="add-btn">Ajouter</button>'}
          </div>
        </article>
      `;
    }).join('');
  }

  /* ============================================================
     3. FILTRES
     ============================================================ */
  const filtersEl = document.querySelector('.filters');
  if (filtersEl) {
    filtersEl.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter');
      if (!btn) return;
      activeFilter = btn.dataset.filter || 'Tout';
      $$('.filter').forEach((b) => b.classList.toggle('active', b === btn));
      renderGrid();
    });
  }

  /* ============================================================
     4. CLIC SUR UNE CARTE (Overlay)
     ============================================================ */
  const gridEl = document.querySelector('.grid');
  if (gridEl) {
    gridEl.addEventListener('click', (e) => {
      const addBtn = e.target.closest('.add-btn');
      if (addBtn && !addBtn.disabled) {
        e.stopPropagation();
        const card = addBtn.closest('.product-card');
        if (!card) return;
        quickAdd(card.dataset.id);
        return;
      }

      const card = e.target.closest('.product-card');
      if (!card || card.classList.contains('soldout')) return;
      openDetail(card.dataset.id);
    });
  }

  function quickAdd(id) {
    const p = products.find(item => item.id === id);
    if (!p || p.soldout) return;
    const variant = p.variants.length > 0 ? p.variants[0] : "";
    const added = addToCart(p, variant);
    if (added) {
      bumpCartIcon();
      showToast('✓ Ajouté !');
      renderGrid(); // Met à jour le bouton +/-
    } else {
      showToast('Déjà dans le panier');
    }
  }

  /* ============================================================
     5. GESTION DU PANIER
     ============================================================ */
  const overlayEl = document.getElementById('product-overlay');
  const overlayImgEl = overlayEl ? overlayEl.querySelector('.overlay-img') : null;
  const overlayBodyEl = overlayEl ? overlayEl.querySelector('.overlay-body') : null;
  const overlayAddBtn = overlayEl ? overlayEl.querySelector('.btn-primary') : null;
  const overlayBackBtn = overlayEl ? overlayEl.querySelector('.back-btn') : null;

  function openDetail(id) {
    const p = products.find(item => item.id === id);
    if (!p || p.soldout || !overlayEl) return;

    currentProduct = p;
    selectedVariant = null;

    if (p.photo_url) {
      overlayImgEl.style.backgroundImage = `url('${p.photo_url}')`;
      overlayImgEl.style.backgroundSize = 'cover';
      overlayImgEl.style.backgroundPosition = 'center';
      const phName = overlayImgEl.querySelector('.ph-name'); if (phName) phName.textContent = '';
    } else {
      overlayImgEl.style.background = p.bgColor;
      overlayImgEl.style.backgroundImage = 'none';
      const phName = overlayImgEl.querySelector('.ph-name'); if (phName) phName.textContent = p.name;
    }

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
    if (!overlayEl) return;
    overlayEl.classList.remove('open');
    document.body.style.overflow = '';
    currentProduct = null;
    selectedVariant = null;
  }

  if (overlayBodyEl) {
    overlayBodyEl.addEventListener('click', (e) => {
      const btn = e.target.closest('.variant');
      if (!btn) return;
      $$('#product-overlay .variant').forEach((b) => b.classList.toggle('selected', b === btn));
      selectedVariant = btn.dataset.variant;
      if (overlayAddBtn) overlayAddBtn.disabled = false;
    });
  }

  if (overlayAddBtn) {
    overlayAddBtn.addEventListener('click', () => {
      if (!currentProduct) return;
      const hasVariants = currentProduct.variants.length > 0;
      if (hasVariants && !selectedVariant) return;
      const variant = hasVariants ? selectedVariant : "";
      const added = addToCart(currentProduct, variant);
      closeDetail();
      if (added) {
        bumpCartIcon();
        showToast('✓ Ajouté !');
        renderGrid();
      }
    });
  }

  if (overlayBackBtn) overlayBackBtn.addEventListener('click', closeDetail);
  if (overlayEl) {
    overlayEl.addEventListener('click', (e) => {
      if (e.target === overlayEl) closeDetail();
    });
  }

  // PANIER LOGIC
  const drawerEl = document.getElementById('cart-drawer');
  const drawerBodyEl = drawerEl ? drawerEl.querySelector('.drawer-body') : null;
  const drawerTotalEl = drawerEl ? drawerEl.querySelector('.total-row strong') : null;
  const drawerCloseBtn = drawerEl ? drawerEl.querySelector('.drawer-head button') : null;
  const whatsappBtn = drawerEl ? drawerEl.querySelector('.btn-whatsapp') : null;
  const backdropEl = document.getElementById('cart-backdrop');
  const cartCountEl = document.querySelector('.cart-count');

  function addToCart(product, variant) {
    const existing = cart.find(item => item.id === product.id && item.variant === variant);
    if (existing) return false;
    
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      variant: variant,
      bgColor: product.bgColor,
      photo_url: product.photo_url
    });
    renderCart();
    return true;
  }

  function removeFromCart(index) {
    cart.splice(index, 1);
    renderCart();
    renderGrid();
  }

  function renderCart() {
    const count = cart.length;
    if (cartCountEl) {
      cartCountEl.textContent = count;
      cartCountEl.dataset.empty = count === 0 ? 'true' : 'false';
    }

    if (!drawerBodyEl) return;

    if (count === 0) {
      drawerBodyEl.innerHTML = '<div class="empty-cart">Votre panier est vide.</div>';
    } else {
      drawerBodyEl.innerHTML = cart.map((item, idx) => {
        const p = products.find(prod => prod.id === item.id);
        const variants = p && p.variants ? p.variants : [];
        
        const swatchStyle = item.photo_url 
          ? `background-image: url('${item.photo_url}'); background-size: cover; background-position: center;`
          : `background: ${item.bgColor};`;

        const variantsHtml = variants.length > 0
          ? `<div class="ci-variants-wrap">
               ${variants.map((v) => `
                 <button type="button" class="ci-variant-btn${v === item.variant ? ' active' : ''}" data-idx="${idx}" data-variant="${escapeHtml(v)}">
                   ${escapeHtml(v)}
                 </button>
               `).join('')}
             </div>`
          : '';

        return `
          <div class="cart-item">
            <div class="ci-swatch" style="${swatchStyle}"></div>
            <div class="ci-info">
              <div class="ci-name">${escapeHtml(item.name)}</div>
              ${variantsHtml}
            </div>
            <div class="ci-right">
              <div class="ci-price">${formatPrice(item.price)}</div>
              <button type="button" class="ci-remove" data-remove="${idx}">Retirer</button>
            </div>
          </div>
        `;
      }).join('');
    }

    const total = cart.reduce((sum, item) => sum + item.price, 0);
    if (drawerTotalEl) drawerTotalEl.textContent = formatPrice(total);
    if (whatsappBtn) whatsappBtn.disabled = count === 0;
  }

  if (drawerBodyEl) {
    drawerBodyEl.addEventListener('click', (e) => {
      const removeBtn = e.target.closest('[data-remove]');
      if (removeBtn) {
        removeFromCart(parseInt(removeBtn.dataset.remove, 10));
        return;
      }
      const variantBtn = e.target.closest('.ci-variant-btn');
      if (variantBtn) {
        e.stopPropagation();
        const idx = parseInt(variantBtn.dataset.idx, 10);
        const newVariant = variantBtn.dataset.variant;
        if (cart[idx]) {
          cart[idx].variant = newVariant;
          renderCart();
        }
      }
    });
  }

  function openCart() {
    if (!drawerEl || !backdropEl) return;
    drawerEl.classList.add('open');
    backdropEl.classList.open;
    document.body.style.overflow = 'hidden';
  }
  function closeCart() {
    if (!drawerEl || !backdropEl) return;
    drawerEl.classList.remove('open');
    backdropEl.classList.remove('open');
    document.body.style.overflow = '';
  }

  const cartBtn = document.querySelector('.cart-btn');
  if (cartBtn) cartBtn.addEventListener('click', openCart);
  if (backdropEl) backdropEl.addEventListener('click', closeCart);
  if (drawerCloseBtn) drawerCloseBtn.addEventListener('click', closeCart);

  // WHATSAPP MESSAGE
  if (whatsappBtn) {
    whatsappBtn.addEventListener('click', () => {
      if (cart.length === 0) return;
      
      const lines = [`Bonjour ${SHOP.name}, je veux commander :`];
      cart.forEach((item) => {
        const varPart = item.variant ? ` — ${item.variant}` : '';
        lines.push(`• ${item.name}${varPart} — ${formatPrice(item.price)}`);
      });
      const total = cart.reduce((s, i) => s + i.price, 0);
      lines.push(`TOTAL : ${formatPrice(total)}`);
      
      const message = encodeURIComponent(lines.join('\n'));
      const phone = SHOP.whatsapp.replace(/\s/g, '');
      window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
    });
  }

  // LANCEMENT
  initBoutique();

})();
