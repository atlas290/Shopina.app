/* ============================================================
   Shopina — vendeur.js (Version Finale - Finitions & Commandes)
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
  const auth = firebase.auth();
  const db = firebase.firestore();

  const CLOUDINARY_CLOUD_NAME = 'jaifaim-app';
  const CLOUDINARY_UPLOAD_PRESET = 'plats_resto';

  const SHOP = { name: 'Havana Shop', slug: 'havana-shop', whatsapp: '+229 67 02 05 86', color: '#E91E63', colorSoft: '#FCE4EC', hours: '', delivery: '', deliveryPrice1: 0, deliveryPrice2: 0, deliveryPrice3: 0, type: 'mode_locale', email: '', password: '' };
  const TAB_NAMES = { dashboard: 'Dashboard', produits: 'Produits', commandes: 'Commandes', lea: 'Léa', reglages: 'Réglages' };

  const leaData = {
    video: { local: `<h2 class="lea-content-title">🎥 Faire une vidéo TikTok/Reels</h2><div class="lea-advice-card"><h3>Le trend du changement de tenue</h3><p>Commence en pyjama ou en tenue simple. <strong>Claque des doigts</strong> et apparais avec la tenue à vendre.</p></div>`, import: `<h2 class="lea-content-title">🎥 Faire une vidéo TikTok/Reels</h2><div class="lea-advice-card"><h3>Filme le produit en action</h3><p>Pour l'électroménager ou les sacs, une photo ne suffit pas. <strong>Montre-le en vrai.</strong></p></div>` },
    whatsapp: { local: `<h2 class="lea-content-title">📱 Vendre sur WhatsApp</h2><div class="lea-advice-card"><h3>La stratégie des statuts</h3><p>Poste <strong>1 photo par jour</strong>, pas 10 d'un coup.</p></div>`, import: `<h2 class="lea-content-title">📱 Vendre sur WhatsApp</h2><div class="lea-advice-card"><h3>Rassurer sur la qualité</h3><p>C'est du costaud, je l'utilise moi-même.</p></div>` },
    photos: { local: `<h2 class="lea-content-title">📸 Prendre de belles photos</h2><div class="lea-advice-card"><h3>La lumière naturelle</h3><p>Ne mets <strong>JAMAIS</strong> le flash.</p></div>`, import: `<h2 class="lea-content-title">📸 Prendre de belles photos</h2><div class="lea-advice-card"><h3>La mise en scène</h3><p>Ne pose pas juste le produit par terre. <strong>Mets-le en contexte.</strong></p></div>` },
    prix: { local: `<h2 class="lea-content-title">💰 Fixer ses prix</h2><div class="lea-advice-card"><h3>La formule magique</h3><p>Prix d'achat + Transport + Marge (40%) = Ton prix de vente.</p></div>`, import: `<h2 class="lea-content-title">💰 Fixer ses prix</h2><div class="lea-advice-card"><h3>Justifie par la durée de vie</h3><p>Ça te fera 2 ans minimum, alors qu'un modèle bas de gamme casse en 2 mois.</p></div>` }
  };

  let currentTags = [], selectedCat = 'Vêtement', selectedStatus = 'available', selectedColor = { value: '#E91E63', soft: '#FCE4EC' }, currentImageBlob = null;

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);
  function escapeHtml(str) { return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function formatPrice(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA'; }

  let toastEl = null, toastTimer = null;
  function showToast(message) {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'toast'; document.body.appendChild(toastEl); }
    toastEl.textContent = message; void toastEl.offsetWidth; toastEl.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2000);
  }
  function simulate() { alert('Simulation — Fonctionnalité à venir'); }
  function fallbackCopy(text, callback) { try { const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); callback(); } catch (e) { alert('Erreur copie'); } }

  /* ============================================================
     NAVIGATION
     ============================================================ */
  function switchTab(tab) {
    $$('.app-view.section').forEach((s) => s.classList.remove('active'));
    const target = document.getElementById('view-' + tab);
    if (target) target.classList.add('active');
    $$('.nav-btn').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
    const banner = $('.demo-banner'); if (banner) banner.textContent = 'Démo Shopina — ' + (TAB_NAMES[tab] || tab);
    
    if (tab === 'lea') { showLeaCategories(); }
    if (tab === 'produits') { loadProducts(); }
    if (tab === 'commandes') { loadOrders(); }
    if (tab === 'dashboard') { loadDashboardStats(); }
    window.scrollTo(0, 0);
  }
  $$('.nav-btn').forEach((btn) => { btn.addEventListener('click', () => switchTab(btn.dataset.tab)); });

  /* ============================================================
     AUTHENTIFICATION
     ============================================================ */
  const goToLoginBtn = document.getElementById('goToLoginBtn'), goToOnboardingBtn = document.getElementById('goToOnboardingBtn');
  const viewLogin = document.getElementById('view-login'), viewOnboarding = document.getElementById('view-onboarding');
  if (goToLoginBtn) goToLoginBtn.addEventListener('click', (e) => { e.preventDefault(); viewOnboarding.classList.remove('active'); viewLogin.classList.add('active'); });
  if (goToOnboardingBtn) goToOnboardingBtn.addEventListener('click', (e) => { e.preventDefault(); viewLogin.classList.remove('active'); viewOnboarding.classList.add('active'); });

  const loginSubmitBtn = document.getElementById('loginSubmitBtn');
  if (loginSubmitBtn) {
    loginSubmitBtn.addEventListener('click', async () => {
      const email = document.getElementById('loginEmail').value.trim(), password = document.getElementById('loginPassword').value.trim();
      if (!email || !password) return alert('Remplissez tous les champs.');
      try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const doc = await db.collection('vendeurs').doc(userCredential.user.uid).get();
        if (!doc.exists) throw new Error("Profil introuvable.");
        
        const v = doc.data();
        SHOP.email = v.email; SHOP.name = v.nom_boutique; SHOP.slug = v.slug; SHOP.whatsapp = v.numero_whatsapp;
        SHOP.color = v.couleur_accent; SHOP.colorSoft = '#FCE4EC'; SHOP.hours = v.horaires; SHOP.delivery = v.zone_livraison;
        SHOP.type = v.type_boutique; SHOP.deliveryPrice1 = v.deliveryPrice1 || 0; SHOP.deliveryPrice2 = v.deliveryPrice2 || 0; SHOP.deliveryPrice3 = v.deliveryPrice3 || 0;

        updateUIWithShopData();
        document.querySelector('.bottom-nav').style.display = 'flex';
        switchTab('dashboard'); showToast("Connexion réussie !");
      } catch (error) { alert('Erreur : ' + error.message); }
    });
  }

  /* ============================================================
     CHARGEMENT DES DONNÉES
     ============================================================ */
  async function loadProducts() {
    const user = auth.currentUser; if (!user) return;
    const grid = document.querySelector('#view-produits .products-grid'); if (!grid) return;
    try {
      const snapshot = await db.collection('produits').where('vendeur_id', '==', user.uid).get();
      grid.innerHTML = '';
      if (snapshot.empty) { grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 20px;">Aucun produit.</div>'; return; }
      snapshot.forEach((doc) => {
        const p = doc.data();
        const imgStyle = p.photo_url ? `background-image: url('${p.photo_url}'); background-size: cover; background-position: center;` : `background: ${p.bgColor || '#F8BBD0'};`;
        grid.insertAdjacentHTML('beforeend', `<div class="product-card"><div class="product-img ${p.statut === 'Épuisé' ? 'soldout' : ''}" style="${imgStyle}">${!p.photo_url ? p.nom.charAt(0).toUpperCase() : ''}${p.statut === 'Épuisé' ? '<span class="soldout-badge">Épuisé</span>' : ''}</div><div class="product-info"><div class="product-name">${escapeHtml(p.nom)}</div><div class="product-price">${formatPrice(p.prix)}</div></div></div>`);
      });
      document.querySelector('#view-produits .products-header p').textContent = `${snapshot.size} produit(s) enregistré(s)`;
    } catch (error) { console.error(error); }
  }

  async function loadOrders() {
    const user = auth.currentUser; if (!user) return;
    const list = document.querySelector('#view-commandes .orders-list'); if (!list) return;
    list.innerHTML = '<div style="text-align:center; padding: 20px;">Chargement...</div>';

    try {
      const snapshot = await db.collection('commandes').where('vendeur_id', '==', user.uid).get();
      if (snapshot.empty) { list.innerHTML = '<div style="text-align:center; padding: 20px; color: var(--text-muted);">Aucune commande.</div>'; return; }

      const orders = []; snapshot.forEach(doc => orders.push({ id: doc.id, ...doc.data() }));
      orders.sort((a, b) => (b.created_at ? b.created_at.toMillis() : 0) - (a.created_at ? a.created_at.toMillis() : 0));

      list.innerHTML = '';
      orders.forEach(order => {
        const date = order.created_at ? new Date(order.created_at.toMillis()).toLocaleDateString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : 'Date inconnue';
        let articlesHtml = '';
        order.articles.forEach(art => {
          const qty = art.quantity || 1; // CORRECTION DU BUG UNDEFINED ICI
          articlesHtml += `<div style="font-size: 12px; color: var(--text-muted);">${qty}x ${art.name} ${art.variant ? '('+art.variant+')' : ''}</div>`;
        });

        list.insertAdjacentHTML('beforeend', `
          <div class="order-item">
            <div class="order-dot status-${order.statut}"></div>
            <div class="order-info">
              <div class="order-product">${articlesHtml}</div>
              <div class="order-actions">
                <select class="order-status-select" data-order-id="${order.id}">
                  <option value="nouvelle" ${order.statut === 'nouvelle' ? 'selected' : ''}>Nouvelle</option>
                  <option value="confirmee" ${order.statut === 'confirmee' ? 'selected' : ''}>Confirmée</option>
                  <option value="livree" ${order.statut === 'livree' ? 'selected' : ''}>Livrée</option>
                </select>
                <button type="button" class="btn-copy-confirm">Copier le message</button>
              </div>
            </div>
            <div class="order-meta">
              <div class="order-price">${formatPrice(order.total)}</div>
              <div class="order-time">${date}</div>
            </div>
          </div>
        `);
      });

      // Événements sur les selects (changement de statut)
      list.querySelectorAll('.order-status-select').forEach(select => {
        select.addEventListener('change', async function() {
          const orderId = this.dataset.orderId, newStatus = this.value;
          const dot = this.closest('.order-item').querySelector('.order-dot');
          if (dot) dot.className = 'order-dot status-' + newStatus;
          try { await db.collection('commandes').doc(orderId).update({ statut: newStatus }); showToast('Statut mis à jour'); } catch (error) { alert("Erreur."); }
        });
      });

      // Événements sur les boutons "Copier le message"
      list.querySelectorAll('.btn-copy-confirm').forEach(btn => {
        btn.addEventListener('click', function() {
          const message = `Bonjour, votre commande chez ${SHOP.name} est bien confirmée ! Elle sera livrée dès que possible. Merci pour votre confiance !`;
          const done = () => showToast('Message copié !');
          if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(message).then(done).catch(() => fallbackCopy(message, done));
          else fallbackCopy(message, done);
        });
      });

    } catch (error) { console.error(error); list.innerHTML = '<div style="text-align:center; padding: 20px; color: red;">Erreur.</div>'; }
  }

  async function loadDashboardStats() {
    const user = auth.currentUser; if (!user) return;
    try {
      const prodSnap = await db.collection('produits').where('vendeur_id', '==', user.uid).get();
      document.querySelector('#view-dashboard .stat-value').textContent = prodSnap.size;
      const cmdSnap = await db.collection('commandes').where('vendeur_id', '==', user.uid).get();
      document.querySelectorAll('#view-dashboard .stat-value')[1].textContent = cmdSnap.size;
    } catch (error) { console.error("Erreur stats:", error); }
  }

  /* ============================================================
     FORMULAIRES, UI & PARTAGE
     ============================================================ */
  function updateUIWithShopData() {
    document.querySelector('#view-dashboard .shop-name').textContent = SHOP.name;
    document.querySelector('#view-dashboard .shop-logo').textContent = (SHOP.name.charAt(0) || 'H').toUpperCase();
    document.querySelector('#view-dashboard .link-code').textContent = 'shopina.shop/' + SHOP.slug;
    document.getElementById('setName').textContent = SHOP.name; document.getElementById('setSlug').textContent = SHOP.slug; document.getElementById('setWhatsapp').textContent = SHOP.whatsapp;
    document.getElementById('setHours').textContent = SHOP.hours || '—'; document.getElementById('setDelivery').textContent = SHOP.delivery || '—';
    document.getElementById('setDeliveryPrice1').textContent = SHOP.deliveryPrice1 ? SHOP.deliveryPrice1 + ' FCFA' : '—';
    document.getElementById('setDeliveryPrice2').textContent = SHOP.deliveryPrice2 ? SHOP.deliveryPrice2 + ' FCFA' : '—';
    document.getElementById('setDeliveryPrice3').textContent = SHOP.deliveryPrice3 ? SHOP.deliveryPrice3 + ' FCFA' : '—';
    document.getElementById('setColorDot').style.backgroundColor = SHOP.color; document.getElementById('setColorHex').textContent = SHOP.color.toUpperCase();
    document.documentElement.style.setProperty('--accent', SHOP.color); document.documentElement.style.setProperty('--accent-soft', SHOP.colorSoft);
  }

  // Bouton Copier le lien
  function copyLink() {
    const link = 'shopina.shop/' + SHOP.slug; const done = () => showToast('Lien copié !');
    const fallback = () => { try { const ta = document.createElement('textarea'); ta.value = link; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); done(); } catch(e) { done(); } };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(link).then(done).catch(fallback); else fallback();
  }

  // Bouton Partager (Nouveau !)
  async function shareLink() {
    const link = 'shopina.shop/' + SHOP.slug;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Ma boutique ' + SHOP.name,
          text: 'Découvrez mes produits sur ma boutique en ligne !',
          url: 'https://' + link
        });
      } catch (error) {
        console.log('Partage annulé par l\'utilisateur');
      }
    } else {
      // Si le téléphone ne supporte pas le partage natif, on copie
      copyLink();
      showToast('Lien copié (partage non supporté)');
    }
  }

  // Écouteurs sur les boutons du Dashboard
  $$('#view-dashboard .btn-secondary').forEach((btn) => {
    if (btn.textContent.trim() === 'Copier') btn.addEventListener('click', copyLink);
    else if (btn.textContent.trim() === 'Partager') btn.addEventListener('click', shareLink);
    else if (btn.id !== 'catalogBtn') btn.addEventListener('click', simulate);
  });

  // Reste du code (Photos, Produits...)
  const btnCamera = document.getElementById('btnCamera'), btnGallery = document.getElementById('btnGallery');
  const cameraInput = document.getElementById('cameraInput'), galleryInput = document.getElementById('galleryInput');
  if(btnCamera) btnCamera.addEventListener('click', () => cameraInput.click());
  if(btnGallery) btnGallery.addEventListener('click', () => galleryInput.click());
  
  async function compresserImage(file) { /* ... (même code que la dernière fois) ... */ return new Promise((resolve) => { const reader = new FileReader(); reader.readAsDataURL(file); reader.onload = (event) => { const img = new Image(); img.src = event.target.result; img.onload = () => { const canvas = document.createElement('canvas'); const MAX_WIDTH = 800; let width = img.width, height = img.height; if (width > MAX_WIDTH) { height = Math.round((height * MAX_WIDTH) / width); width = MAX_WIDTH; } canvas.width = width; canvas.height = height; canvas.getContext('2d').drawImage(img, 0, 0, width, height); canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.7); }; }; }); }
  async function handleImageSelect(event) { const file = event.target.files[0]; if (!file) return; const previewEl = document.getElementById('photoPreview'); if (previewEl) previewEl.textContent = "Compression..."; try { const compressedBlob = await compresserImage(file); currentImageBlob = compressedBlob; if (previewEl) { previewEl.style.backgroundImage = `url('${URL.createObjectURL(compressedBlob)}')`; previewEl.textContent = ''; } } catch (error) { alert("Impossible de lire l'image."); } }
  if(cameraInput) cameraInput.addEventListener('change', handleImageSelect);
  if(galleryInput) galleryInput.addEventListener('change', handleImageSelect);

  function openProductOverlay() { document.getElementById('product-form-overlay').classList.add('open'); document.body.style.overflow = 'hidden'; resetProductForm(); }
  function closeProductOverlay() { document.getElementById('product-form-overlay').classList.remove('open'); document.body.style.overflow = ''; }
  document.querySelectorAll('.fab, #dashAddBtn').forEach(btn => btn.addEventListener('click', openProductOverlay));
  document.querySelector('#product-form-overlay .overlay-close').addEventListener('click', closeProductOverlay);
  document.querySelector('#product-form-overlay .overlay-footer .btn-secondary').addEventListener('click', closeProductOverlay);

  function resetProductForm() {
    document.getElementById('pName').value = ''; document.getElementById('pPrice').value = ''; document.getElementById('pDesc').value = '';
    document.querySelector('#product-form-overlay .char-count').textContent = '0/140'; document.querySelector('#product-form-overlay .tag-input').value = '';
    document.querySelector('#product-form-overlay .tags-list').innerHTML = '';
    currentTags = []; selectedCat = 'Vêtement'; selectedStatus = 'available'; currentImageBlob = null;
    $$('#product-form-overlay .radio-pill').forEach((b, i) => b.classList.toggle('selected', i === 0));
    $$('#product-form-overlay .status-pill').forEach((b, i) => b.classList.toggle('selected', i === 0));
    const photoPreview = document.querySelector('#product-form-overlay .photo-preview'); if (photoPreview) { photoPreview.textContent = 'Aucune photo'; photoPreview.style.backgroundImage = ''; }
    if(cameraInput) cameraInput.value = ''; if(galleryInput) galleryInput.value = '';
  }

  document.getElementById('overlaySaveBtn').addEventListener('click', async () => {
    const user = auth.currentUser; if (!user) return alert("Connectez-vous.");
    const name = document.getElementById('pName').value.trim(), price = parseInt(document.getElementById('pPrice').value, 10);
    if (!name || !price || price <= 0) return alert('Nom et prix valides requis.');
    const saveBtn = document.getElementById('overlaySaveBtn'); saveBtn.textContent = "Envoi..."; saveBtn.disabled = true;
    try {
      let photoUrl = null;
      if (currentImageBlob) { const formData = new FormData(); formData.append('file', currentImageBlob); formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET); const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, { method: 'POST', body: formData }); const data = await res.json(); if (data.secure_url) photoUrl = data.secure_url; else throw new Error("Upload échoué"); }
      await db.collection('produits').add({ vendeur_id: user.uid, nom: name, prix: price, description: document.getElementById('pDesc').value.trim(), categorie: selectedCat, statut: selectedStatus === 'available' ? 'Disponible' : 'Épuisé', variantes: currentTags, photo_url: photoUrl, bgColor: '#F8BBD0', created_at: firebase.firestore.FieldValue.serverTimestamp() });
      showToast('✓ Produit enregistré !'); closeProductOverlay(); loadProducts(); switchTab('produits');
    } catch (e) { alert("Erreur: " + e.message); } finally { saveBtn.textContent = "Enregistrer"; saveBtn.disabled = false; }
  });

  // Léa
  function showLeaCategories() { document.getElementById('lea-categories').style.display = 'flex'; document.getElementById('lea-content').style.display = 'none'; }
  function openLeaCategory(catKey) {
    const group = (SHOP.type === 'import_chine' || SHOP.type === 'electromenager') ? 'import' : 'local';
    document.getElementById('lea-categories').style.display = 'none'; document.getElementById('lea-content').style.display = 'block';
    document.getElementById('lea-content').innerHTML = `<button type="button" class="lea-back-btn" onclick="document.getElementById('lea-categories').style.display='flex';document.getElementById('lea-content').style.display='none';">← Retour</button>${leaData[catKey][group]}`;
  }
  $$('.lea-category-card').forEach(card => card.addEventListener('click', () => openLeaCategory(card.dataset.cat)));

  function init() {
    const nav = document.querySelector('.bottom-nav'); if (nav) nav.style.display = 'none';
    const banner = $('.demo-banner'); if (banner) banner.textContent = 'Démo Shopina — Onboarding';
  }
  init();
})();
