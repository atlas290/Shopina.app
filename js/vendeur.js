/* ============================================================
   Shopina — vendeur.js (Version Finale et Complète)
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

  const SHOP = { name: '', slug: '', whatsapp: '', color: '#E91E63', colorSoft: '#FCE4EC', hours: '', delivery: '', deliveryPrice1: 0, deliveryPrice2: 0, deliveryPrice3: 0, categories: [], email: '', password: '' };
  
  const TAB_NAMES = { dashboard: 'Dashboard', produits: 'Produits', commandes: 'Commandes', lea: 'Léa', reglages: 'Réglages' };

  const leaData = {
    video: { local: `<h2 class="lea-content-title">🎥 Faire une vidéo TikTok/Reels</h2><div class="lea-advice-card"><h3>Le trend du changement de tenue</h3><p>Commence en pyjama ou en tenue simple. <strong>Claque des doigts</strong> et apparais avec la tenue à vendre.</p></div>` },
    whatsapp: { local: `<h2 class="lea-content-title">📱 Vendre sur WhatsApp</h2><div class="lea-advice-card"><h3>La stratégie des statuts</h3><p>Poste <strong>1 photo par jour</strong>, pas 10 d'un coup.</p></div>` },
    photos: { local: `<h2 class="lea-content-title">📸 Prendre de belles photos</h2><div class="lea-advice-card"><h3>La lumière naturelle</h3><p>Ne mets <strong>JAMAIS</strong> le flash.</p></div>` },
    prix: { local: `<h2 class="lea-content-title">💰 Fixer ses prix</h2><div class="lea-advice-card"><h3>La formule magique</h3><p>Prix d'achat + Transport + Marge (40%) = Ton prix de vente.</p></div>` }
  };

  let currentTags = [], selectedCat = '', selectedStatus = 'available', selectedColor = { value: '#E91E63', soft: '#FCE4EC' }, currentImageBlob = null;
  
  // Variables pour la modification
  let editingProductId = null;
  let existingPhotoUrl = null; 

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
     UI MISE À JOUR
     ============================================================ */
  function updateUIWithShopData() {
    document.querySelector('#view-dashboard .shop-name').textContent = SHOP.name;
    document.querySelector('#view-dashboard .shop-logo').textContent = (SHOP.name.charAt(0) || 'H').toUpperCase();
    
    const sloganEl = document.getElementById('dashSlogan');
    if (sloganEl) sloganEl.textContent = SHOP.categories.length > 0 ? SHOP.categories.join(' · ') : 'Bienvenue sur ma boutique';

    document.querySelector('#view-dashboard .link-code').textContent = 'shopina.shop/' + SHOP.slug;
    
    document.getElementById('setName').value = SHOP.name;
    document.getElementById('setWhatsapp').value = SHOP.whatsapp;
    document.getElementById('setHours').value = SHOP.hours || '';
    document.getElementById('setDelivery').value = SHOP.delivery || '';
    document.getElementById('setDeliveryPrice1').value = SHOP.deliveryPrice1 || '';
    document.getElementById('setDeliveryPrice2').value = SHOP.deliveryPrice2 || '';
    document.getElementById('setDeliveryPrice3').value = SHOP.deliveryPrice3 || '';
    
    document.getElementById('setSlug').textContent = SHOP.slug;
    document.getElementById('setColorDot').style.backgroundColor = SHOP.color;
    document.getElementById('setColorHex').textContent = SHOP.color.toUpperCase();
    document.documentElement.style.setProperty('--accent', SHOP.color);
    document.documentElement.style.setProperty('--accent-soft', SHOP.colorSoft);

    const catContainer = document.getElementById('productCategoriesContainer');
    if (catContainer && SHOP.categories.length > 0) {
      catContainer.innerHTML = SHOP.categories.map((c, i) => `<button type="button" class="radio-pill ${i === 0 ? 'selected' : ''}" data-cat="${escapeHtml(c)}">${escapeHtml(c)}</button>`).join('');
      selectedCat = SHOP.categories[0];
      
      catContainer.querySelectorAll('.radio-pill').forEach(btn => {
        btn.addEventListener('click', () => {
          catContainer.querySelectorAll('.radio-pill').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          selectedCat = btn.dataset.cat;
        });
      });
    }
  }

  /* ============================================================
     AUTHENTIFICATION & SESSION
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
      try { await auth.signInWithEmailAndPassword(email, password); } catch (error) { alert('Email ou mot de passe incorrect.'); }
    });
  }

  document.getElementById('btnLogout').addEventListener('click', () => { auth.signOut().then(() => { window.location.reload(); }); });

  auth.onAuthStateChanged(async (user) => {
    if (user) {
      try {
        const doc = await db.collection('vendeurs').doc(user.uid).get();
        if (doc.exists) {
          const v = doc.data();
          SHOP.email = v.email; SHOP.name = v.nom_boutique; SHOP.slug = v.slug; SHOP.whatsapp = v.numero_whatsapp;
          SHOP.color = v.couleur_accent; SHOP.colorSoft = '#FCE4EC'; SHOP.hours = v.horaires; SHOP.delivery = v.zone_livraison;
          SHOP.deliveryPrice1 = v.deliveryPrice1 || 0; SHOP.deliveryPrice2 = v.deliveryPrice2 || 0; SHOP.deliveryPrice3 = v.deliveryPrice3 || 0;
          SHOP.categories = v.categories || ['Divers']; 
          
          updateUIWithShopData();
          document.querySelector('.bottom-nav').style.display = 'flex';
          switchTab('dashboard');
        }
      } catch (error) { console.error("Erreur chargement session", error); }
    } else {
      document.querySelector('.bottom-nav').style.display = 'none';
      viewLogin.classList.remove('active');
      viewOnboarding.classList.add('active');
    }
  });

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
        
        grid.insertAdjacentHTML('beforeend', `
          <div class="product-card">
            <div class="product-img ${p.statut === 'Épuisé' ? 'soldout' : ''}" style="${imgStyle}">
              ${!p.photo_url ? p.nom.charAt(0).toUpperCase() : ''}
              ${p.statut === 'Épuisé' ? '<span class="soldout-badge">Épuisé</span>' : ''}
            </div>
            <div class="product-info">
              <div class="product-name">${escapeHtml(p.nom)}</div>
              <div class="product-price">${formatPrice(p.prix)}</div>
              <button type="button" class="btn-edit" data-id="${doc.id}">Modifier</button>
            </div>
          </div>
        `);
      });
      
      document.querySelector('#view-produits .products-header p').textContent = `${snapshot.size} produit(s) enregistré(s)`;

      grid.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          openProductOverlay(btn.dataset.id);
        });
      });

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
          const qty = art.quantity || 1;
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

      list.querySelectorAll('.order-status-select').forEach(select => {
        select.addEventListener('change', async function() {
          const orderId = this.dataset.orderId, newStatus = this.value;
          const dot = this.closest('.order-item').querySelector('.order-dot');
          if (dot) dot.className = 'order-dot status-' + newStatus;
          try { await db.collection('commandes').doc(orderId).update({ statut: newStatus }); showToast('Statut mis à jour'); } catch (error) { alert("Erreur."); }
        });
      });

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
     ACTIONS DASHBOARD & RÉGLAGES
     ============================================================ */
  function copyLink() {
    const link = 'https://shopina.vercel.app/boutique.html?shop=' + SHOP.slug; 
    const done = () => showToast('Lien copié !');
    const fallback = () => { try { const ta = document.createElement('textarea'); ta.value = link; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); done(); } catch(e) { done(); } };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(link).then(done).catch(fallback); else fallback();
  }

  async function shareLink() {
    const link = 'https://shopina.vercel.app/boutique.html?shop=' + SHOP.slug;
    if (navigator.share) {
      try { await navigator.share({ title: 'Découvrez ' + SHOP.name + ' sur Shopina', text: 'Retrouvez tous mes produits en ligne et commandez directement sur WhatsApp !', url: link }); } catch (error) {}
    } else { copyLink(); showToast('Lien copié !'); }
  }

  document.getElementById('btnCopyLink').addEventListener('click', copyLink);
  document.getElementById('btnShareLink').addEventListener('click', shareLink);

  document.getElementById('btnSaveSettings').addEventListener('click', async () => {
    const user = auth.currentUser;
    if (!user) return alert("Vous devez être connecté.");

    const newName = document.getElementById('setName').value.trim();
    const newWhatsapp = document.getElementById('setWhatsapp').value.trim();
    const newHours = document.getElementById('setHours').value.trim();
    const newDelivery = document.getElementById('setDelivery').value.trim();
    const newPrice1 = parseInt(document.getElementById('setDeliveryPrice1').value, 10) || 0;
    const newPrice2 = parseInt(document.getElementById('setDeliveryPrice2').value, 10) || 0;
    const newPrice3 = parseInt(document.getElementById('setDeliveryPrice3').value, 10) || 0;

    if (!newName || !newWhatsapp) return alert("Le nom et le numéro WhatsApp sont obligatoires.");

    const btn = document.getElementById('btnSaveSettings');
    btn.textContent = "Enregistrement...";
    btn.disabled = true;

    try {
      await db.collection('vendeurs').doc(user.uid).update({
        nom_boutique: newName, numero_whatsapp: newWhatsapp, horaires: newHours,
        zone_livraison: newDelivery, deliveryPrice1: newPrice1, deliveryPrice2: newPrice2, deliveryPrice3: newPrice3
      });

      SHOP.name = newName; SHOP.whatsapp = newWhatsapp; SHOP.hours = newHours;
      SHOP.delivery = newDelivery; SHOP.deliveryPrice1 = newPrice1; SHOP.deliveryPrice2 = newPrice2; SHOP.deliveryPrice3 = newPrice3;

      updateUIWithShopData();
      showToast('✓ Modifications enregistrées !');
    } catch (error) {
      console.error(error); alert("Erreur : " + error.message);
    } finally {
      btn.textContent = "Enregistrer les modifications"; btn.disabled = false;
    }
  });

  /* ============================================================
     OVERLAY PRODUIT (CRÉATION & MODIFICATION)
     ============================================================ */
  function openProductOverlay(id = null) { 
    editingProductId = id;
    document.getElementById('product-form-overlay').classList.add('open'); 
    document.body.style.overflow = 'hidden'; 
    
    const titleEl = document.getElementById('overlayTitle');
    const saveBtn = document.getElementById('overlaySaveBtn');

    if (id) {
      titleEl.textContent = "Modifier le produit";
      saveBtn.textContent = "Mettre à jour";
      
      db.collection('produits').doc(id).get().then(doc => {
        if(doc.exists) {
          const p = doc.data();
          document.getElementById('pName').value = p.nom;
          document.getElementById('pPrice').value = p.prix;
          document.getElementById('pDesc').value = p.description || '';
          document.querySelector('#product-form-overlay .char-count').textContent = (p.description || '').length + '/140';
          
          selectedCat = p.categorie;
          document.querySelectorAll('#productCategoriesContainer .radio-pill').forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.cat === selectedCat);
          });

          currentTags = p.variantes || [];
          renderTags();

          selectedStatus = p.statut === 'Épuisé' ? 'soldout' : 'available';
          document.querySelectorAll('#product-form-overlay .status-pill').forEach((b, i) => {
            b.classList.toggle('selected', (i === 0 && selectedStatus === 'available') || (i === 1 && selectedStatus === 'soldout'));
          });

          const photoPreview = document.getElementById('photoPreview');
          if (p.photo_url) {
            photoPreview.style.backgroundImage = `url('${p.photo_url}')`;
            photoPreview.textContent = '';
            existingPhotoUrl = p.photo_url; 
          } else {
            photoPreview.style.backgroundImage = '';
            photoPreview.textContent = 'Aucune photo';
            existingPhotoUrl = null;
          }
        }
      });

    } else {
      titleEl.textContent = "Ajouter un produit";
      saveBtn.textContent = "Enregistrer";
      resetProductForm();
    }
  }

  function closeProductOverlay() { 
    document.getElementById('product-form-overlay').classList.remove('open'); 
    document.body.style.overflow = ''; 
    editingProductId = null;
  }

  document.querySelectorAll('.fab, #dashAddBtn').forEach(btn => btn.addEventListener('click', () => openProductOverlay()));
  document.querySelector('#product-form-overlay .overlay-close').addEventListener('click', closeProductOverlay);
  document.querySelector('#product-form-overlay .overlay-footer .btn-secondary').addEventListener('click', closeProductOverlay);

  function resetProductForm() {
    document.getElementById('pName').value = ''; 
    document.getElementById('pPrice').value = ''; 
    document.getElementById('pDesc').value = '';
    document.querySelector('#product-form-overlay .char-count').textContent = '0/140'; 
    document.querySelector('#product-form-overlay .tag-input').value = '';
    document.querySelector('#product-form-overlay .tags-list').innerHTML = '';
    currentTags = []; 
    selectedStatus = 'available'; 
    currentImageBlob = null;
    existingPhotoUrl = null;
    document.querySelectorAll('#product-form-overlay .status-pill').forEach((b, i) => b.classList.toggle('selected', i === 0));
    const photoPreview = document.querySelector('#product-form-overlay .photo-preview'); 
    if (photoPreview) { photoPreview.textContent = 'Aucune photo'; photoPreview.style.backgroundImage = ''; }
    if(cameraInput) cameraInput.value = ''; 
    if(galleryInput) galleryInput.value = '';
  }

  const btnCamera = document.getElementById('btnCamera'), btnGallery = document.getElementById('btnGallery');
  const cameraInput = document.getElementById('cameraInput'), galleryInput = document.getElementById('galleryInput');
  if(btnCamera) btnCamera.addEventListener('click', () => cameraInput.click());
  if(btnGallery) btnGallery.addEventListener('click', () => galleryInput.click());

  async function compresserImage(file) { 
    return new Promise((resolve) => { 
      const reader = new FileReader(); 
      reader.readAsDataURL(file); 
      reader.onload = (event) => { 
        const img = new Image(); 
        img.src = event.target.result; 
        img.onload = () => { 
          const canvas = document.createElement('canvas'); 
          const MAX_WIDTH = 800; 
          let width = img.width, height = img.height; 
          if (width > MAX_WIDTH) { height = Math.round((height * MAX_WIDTH) / width); width = MAX_WIDTH; } 
          canvas.width = width; canvas.height = height; 
          canvas.getContext('2d').drawImage(img, 0, 0, width, height); 
          canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.7); 
        }; 
      }; 
    }); 
  }

  async function handleImageSelect(event) { 
    const file = event.target.files[0]; 
    if (!file) return; 
    const previewEl = document.getElementById('photoPreview'); 
    if (previewEl) previewEl.textContent = "Compression..."; 
    try { 
      const compressedBlob = await compresserImage(file); 
      currentImageBlob = compressedBlob; 
      existingPhotoUrl = null;
      if (previewEl) { previewEl.style.backgroundImage = `url('${URL.createObjectURL(compressedBlob)}')`; previewEl.textContent = ''; } 
    } catch (error) { alert("Impossible de lire l'image."); } 
  }
  if(cameraInput) cameraInput.addEventListener('change', handleImageSelect);
  if(galleryInput) galleryInput.addEventListener('change', handleImageSelect);

  document.getElementById('pDesc').addEventListener('input', function () { document.querySelector('#product-form-overlay .char-count').textContent = this.value.length + '/140'; });

  document.querySelector('#product-form-overlay .tag-input').addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(this.value); this.value = ''; }
  });

  function addTag(text) { text = text.trim(); if (!text || currentTags.indexOf(text) !== -1) return; currentTags.push(text); renderTags(); }
  function renderTags() {
    const tagsList = document.querySelector('#product-form-overlay .tags-list');
    tagsList.innerHTML = currentTags.map((t, i) => `<span class="tag">${escapeHtml(t)}<button type="button" data-remove-tag="${i}" aria-label="Retirer">×</button></span>`).join('');
  }

  document.querySelector('#product-form-overlay .tags-list').addEventListener('click', function (e) {
    const btn = e.target.closest('[data-remove-tag]'); if (!btn) return;
    currentTags.splice(parseInt(btn.dataset.removeTag, 10), 1); renderTags();
  });

  document.querySelectorAll('#product-form-overlay .status-pill').forEach((btn) => {
    btn.addEventListener('click', () => { 
      document.querySelectorAll('#product-form-overlay .status-pill').forEach((b) => b.classList.remove('selected')); 
      btn.classList.add('selected'); 
      selectedStatus = btn.textContent.trim().toLowerCase() === 'disponible' ? 'available' : 'soldout'; 
    });
  });

  document.getElementById('overlaySaveBtn').addEventListener('click', async () => {
    const user = auth.currentUser; if (!user) return alert("Connectez-vous.");
    const name = document.getElementById('pName').value.trim(), price = parseInt(document.getElementById('pPrice').value, 10);
    if (!name || !price || price <= 0) return alert('Nom et prix valides requis.');
    if (!selectedCat) selectedCat = SHOP.categories[0] || 'Divers';

    const saveBtn = document.getElementById('overlaySaveBtn'); 
    const originalText = saveBtn.textContent;
    saveBtn.textContent = "Envoi..."; 
    saveBtn.disabled = true;

    try {
      let photoUrl = null;
      
      if (currentImageBlob) { 
        const formData = new FormData(); 
        formData.append('file', currentImageBlob); 
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET); 
        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, { method: 'POST', body: formData }); 
        const data = await res.json(); 
        if (data.secure_url) photoUrl = data.secure_url; 
        else throw new Error("Upload échoué"); 
      } else if (existingPhotoUrl) {
        photoUrl = existingPhotoUrl;
      }

      const productData = { 
        vendeur_id: user.uid, nom: name, prix: price, description: document.getElementById('pDesc').value.trim(), 
        categorie: selectedCat, statut: selectedStatus === 'available' ? 'Disponible' : 'Épuisé', 
        variantes: currentTags, photo_url: photoUrl, bgColor: '#F8BBD0'
      };

      if (editingProductId) {
        await db.collection('produits').doc(editingProductId).update(productData);
        showToast('✓ Produit mis à jour !');
      } else {
        productData.created_at = firebase.firestore.FieldValue.serverTimestamp();
        await db.collection('produits').add(productData);
        showToast('✓ Produit enregistré !');
      }

      closeProductOverlay(); 
      loadProducts(); 
      switchTab('produits');
      
    } catch (e) { alert("Erreur: " + e.message); } 
    finally { saveBtn.textContent = originalText; saveBtn.disabled = false; }
  });

/* ============================================================
     OVERLAY CATALOGUE (GÉNÉRATION D'IMAGE)
     ============================================================ */
  const catalogBtn = document.getElementById('catalogBtn');
  const catalogOverlay = document.getElementById('catalog-image-overlay');
  const catalogCloseBtn = document.getElementById('catalogCloseBtn');
  const catalogDownloadBtn = document.getElementById('catalogDownloadBtn');
  
  if (catalogBtn && catalogOverlay) {
    catalogBtn.addEventListener('click', async () => {
      // 1. Remplir les infos de base
      document.getElementById('cat-shop-name').textContent = SHOP.name;
      document.getElementById('cat-shop-link').textContent = 'shopina.shop/' + SHOP.slug;
      
      // 2. Aller chercher les 2 premiers produits
      const container = document.getElementById('cat-products-container');
      container.innerHTML = '<div style="color:white; font-size:12px;">Chargement...</div>';
      
      try {
        const user = auth.currentUser;
        if (!user) throw new Error("Non connecté");
        const snap = await db.collection('produits').where('vendeur_id', '==', user.uid).limit(2).get();
        let html = '';
        
        if (snap.empty) {
          html = '<div style="color:white; text-align:center; font-size:12px; margin-top:20px;">Aucun produit à afficher.</div>';
        } else {
          snap.forEach(doc => {
            const p = doc.data();
            const bg = p.photo_url ? `background-image: url('${p.photo_url}'); background-size: cover; background-position: center;` : `background: ${p.bgColor || '#fff'};`;
            html += `
              <div class="catalog-product">
                <div class="catalog-product-img" style="${bg}"></div>
                <div class="catalog-product-name">${p.nom}</div>
                <div class="catalog-product-price">${p.prix} F</div>
              </div>
            `;
          });
        }
        container.innerHTML = html;
      } catch(e) { console.error(e); }

      // 3. Afficher l'overlay
      catalogOverlay.classList.add('open'); 
      document.body.style.overflow = 'hidden';
    });
  }

  if (catalogCloseBtn) {
    catalogCloseBtn.addEventListener('click', () => { 
      catalogOverlay.classList.remove('open'); 
      document.body.style.overflow = ''; 
    });
  }

  if (catalogDownloadBtn) {
    catalogDownloadBtn.addEventListener('click', () => {
      const card = document.getElementById('catalog-card');
      catalogDownloadBtn.textContent = "Création...";
      catalogDownloadBtn.disabled = true;

      // Utilisation de html2canvas pour transformer la div en image
      html2canvas(card, { scale: 2, backgroundColor: null }).then(canvas => {
        // Créer un lien de téléchargement
        const link = document.createElement('a');
        link.download = `catalogue-${SHOP.slug}.jpg`;
        link.href = canvas.toDataURL('image/jpeg', 0.9);
        link.click();
        
        catalogDownloadBtn.textContent = "Télécharger l'image";
        catalogDownloadBtn.disabled = false;
      }).catch(err => {
        alert("Erreur lors de la création de l'image.");
        catalogDownloadBtn.textContent = "Télécharger l'image";
        catalogDownloadBtn.disabled = false;
      });
    });
  }

  document.getElementById('obNextBtn').addEventListener('click', () => goToStep(2));
  document.getElementById('obPrevBtn').addEventListener('click', () => goToStep(1));

  document.getElementById('obCreateBtn').addEventListener('click', async () => {
    SHOP.hours = document.getElementById('obHours').value.trim();
    SHOP.delivery = document.getElementById('obDelivery').value.trim();
    SHOP.deliveryPrice1 = parseInt(document.getElementById('obDeliveryPrice1').value, 10) || 0;
    SHOP.deliveryPrice2 = parseInt(document.getElementById('obDeliveryPrice2').value, 10) || 0;
    SHOP.deliveryPrice3 = parseInt(document.getElementById('obDeliveryPrice3').value, 10) || 0;
    SHOP.color = selectedColor.value; SHOP.colorSoft = selectedColor.soft;

    try {
      const userCredential = await auth.createUserWithEmailAndPassword(SHOP.email, SHOP.password);
      await db.collection('vendeurs').doc(userCredential.user.uid).set({
        email: SHOP.email, nom_boutique: SHOP.name, slug: SHOP.slug, numero_whatsapp: SHOP.whatsapp,
        couleur_accent: SHOP.color, horaires: SHOP.hours, zone_livraison: SHOP.delivery,
        deliveryPrice1: SHOP.deliveryPrice1, deliveryPrice2: SHOP.deliveryPrice2, deliveryPrice3: SHOP.deliveryPrice3,
        categories: SHOP.categories, created_at: firebase.firestore.FieldValue.serverTimestamp()
      });
      showToast("Compte créé !");
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') alert("Cet email est déjà utilisé.");
      else alert("Erreur : " + error.message);
    }
  });

  $$('#colorPicker .color-swatch').forEach((sw) => {
    sw.addEventListener('click', () => {
      $$('#colorPicker .color-swatch').forEach((s) => s.classList.remove('selected'));
      sw.classList.add('selected'); selectedColor = { value: sw.dataset.color, soft: sw.dataset.soft };
      document.documentElement.style.setProperty('--accent', selectedColor.value); document.documentElement.style.setProperty('--accent-soft', selectedColor.soft);
    });
  });

  function showLeaCategories() { document.getElementById('lea-categories').style.display = 'flex'; document.getElementById('lea-content').style.display = 'none'; }
  function openLeaCategory(catKey) {
    document.getElementById('lea-categories').style.display = 'none'; document.getElementById('lea-content').style.display = 'block';
    document.getElementById('lea-content').innerHTML = `<button type="button" class="lea-back-btn" onclick="document.getElementById('lea-categories').style.display='flex';document.getElementById('lea-content').style.display='none';">← Retour</button>${leaData[catKey].local}`;
  }
  $$('.lea-category-card').forEach(card => card.addEventListener('click', () => openLeaCategory(card.dataset.cat)));

  document.getElementById('btnManageSub').addEventListener('click', simulate);

  function init() { document.querySelector('.bottom-nav').style.display = 'none'; }
  init();
})();
