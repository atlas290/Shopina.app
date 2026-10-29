/* ============================================================
   Shopina — vendeur.js (Version Finale Cloudinary)
   ============================================================ */

(function () {
  'use strict';

  /* ============================================================
     0. CONNEXION FIREBASE & CLOUDINARY
     ============================================================ */
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

  // Configuration Cloudinary
  const CLOUDINARY_CLOUD_NAME = 'jaifaim-app';
  const CLOUDINARY_UPLOAD_PRESET = 'plats_resto';

  /* ============================================================
     1. DONNÉES
     ============================================================ */
  const SHOP = { name: 'Havana Shop', slug: 'havana-shop', whatsapp: '+229 67 02 05 86', color: '#E91E63', colorSoft: '#FCE4EC', hours: '', delivery: '', deliveryPrice1: 0, deliveryPrice2: 0, deliveryPrice3: 0, type: 'mode_locale', email: '', password: '' };
  const TAB_NAMES = { dashboard: 'Dashboard', produits: 'Produits', commandes: 'Commandes', lea: 'Léa', reglages: 'Réglages' };

  const leaData = {
    video: { local: `<h2 class="lea-content-title">🎥 Faire une vidéo TikTok/Reels</h2><div class="lea-advice-card"><h3>Le trend du changement de tenue</h3><p>Commence en pyjama ou en tenue simple. <strong>Claque des doigts</strong> et apparais avec la tenue à vendre.</p></div>`, import: `<h2 class="lea-content-title">🎥 Faire une vidéo TikTok/Reels</h2><div class="lea-advice-card"><h3>Filme le produit en action</h3><p>Pour l'électroménager ou les sacs, une photo ne suffit pas. <strong>Montre-le en vrai.</strong></p></div>` },
    whatsapp: { local: `<h2 class="lea-content-title">📱 Vendre sur WhatsApp</h2><div class="lea-advice-card"><h3>La stratégie des statuts</h3><p>Poste <strong>1 photo par jour</strong>, pas 10 d'un coup.</p></div>`, import: `<h2 class="lea-content-title">📱 Vendre sur WhatsApp</h2><div class="lea-advice-card"><h3>Rassurer sur la qualité</h3><p>C'est du costaud, je l'utilise moi-même.</p></div>` },
    photos: { local: `<h2 class="lea-content-title">📸 Prendre de belles photos</h2><div class="lea-advice-card"><h3>La lumière naturelle</h3><p>Ne mets <strong>JAMAIS</strong> le flash.</p></div>`, import: `<h2 class="lea-content-title">📸 Prendre de belles photos</h2><div class="lea-advice-card"><h3>La mise en scène</h3><p>Ne pose pas juste le produit par terre. <strong>Mets-le en contexte.</strong></p></div>` },
    prix: { local: `<h2 class="lea-content-title">💰 Fixer ses prix</h2><div class="lea-advice-card"><h3>La formule magique</h3><p>Prix d'achat + Transport + Marge (40%) = Ton prix de vente.</p></div>`, import: `<h2 class="lea-content-title">💰 Fixer ses prix</h2><div class="lea-advice-card"><h3>Justifie par la durée de vie</h3><p>Ça te fera 2 ans minimum, alors qu'un modèle bas de gamme casse en 2 mois.</p></div>` }
  };

  /* ============================================================
     2. ÉTAT
     ============================================================ */
  let currentTags = [];
  let selectedCat = 'Vêtement';
  let selectedStatus = 'available';
  let selectedColor = { value: '#E91E63', soft: '#FCE4EC' };
  let currentImageBlob = null;

  /* ============================================================
     3. HELPERS
     ============================================================ */
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  function escapeHtml(str) { return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

  let toastEl = null, toastTimer = null;
  function showToast(message) {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'toast'; document.body.appendChild(toastEl); }
    toastEl.textContent = message; void toastEl.offsetWidth; toastEl.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2000);
  }

  function simulate() { alert('Simulation — Fonctionnalité à venir'); }

  /* ============================================================
     4. NAVIGATION
     ============================================================ */
  function switchTab(tab) {
    $$('.app-view.section').forEach((s) => s.classList.remove('active'));
    const target = document.getElementById('view-' + tab);
    if (target) target.classList.add('active');
    $$('.nav-btn').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
    const banner = $('.demo-banner');
    if (banner) banner.textContent = 'Démo Shopina — ' + (TAB_NAMES[tab] || tab);
    if (tab === 'lea') { showLeaCategories(); }
    if (tab === 'produits') { loadProducts(); }
    window.scrollTo(0, 0);
  }

  $$('.nav-btn').forEach((btn) => { btn.addEventListener('click', () => switchTab(btn.dataset.tab)); });

  /* ============================================================
     5. AUTHENTIFICATION & CHARGEMENT DES PRODUITS
     ============================================================ */
  const goToLoginBtn = document.getElementById('goToLoginBtn');
  const goToOnboardingBtn = document.getElementById('goToOnboardingBtn');
  const viewLogin = document.getElementById('view-login');
  const viewOnboarding = document.getElementById('view-onboarding');
  
  if (goToLoginBtn && viewLogin && viewOnboarding) {
    goToLoginBtn.addEventListener('click', (e) => {
      e.preventDefault(); viewOnboarding.classList.remove('active'); viewLogin.classList.add('active');
      const banner = $('.demo-banner'); if (banner) banner.textContent = 'Démo Shopina — Connexion';
    });
  }
  if (goToOnboardingBtn && viewLogin && viewOnboarding) {
    goToOnboardingBtn.addEventListener('click', (e) => {
      e.preventDefault(); viewLogin.classList.remove('active'); viewOnboarding.classList.add('active');
      const banner = $('.demo-banner'); if (banner) banner.textContent = 'Démo Shopina — Onboarding';
    });
  }

  async function loadProducts() {
    const user = auth.currentUser;
    if (!user) return;
    const grid = document.querySelector('#view-produits .products-grid');
    if (!grid) return;

    try {
      const snapshot = await db.collection('produits').where('vendeur_id', '==', user.uid).get();
      grid.innerHTML = '';

      if (snapshot.empty) {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 20px;">Aucun produit pour le moment. Cliquez sur le + pour ajouter.</div>';
        return;
      }

      snapshot.forEach((doc) => {
        const p = doc.data();
        const isSoldout = p.statut === 'Épuisé';
        const imgStyle = p.photo_url ? `background-image: url('${p.photo_url}'); background-size: cover; background-position: center;` : `background: ${p.bgColor || '#F8BBD0'};`;
        
        const card = `
          <div class="product-card">
            <div class="product-img ${isSoldout ? 'soldout' : ''}" style="${imgStyle}">
              ${!p.photo_url ? p.nom.charAt(0).toUpperCase() : ''}
              ${isSoldout ? '<span class="soldout-badge">Épuisé</span>' : ''}
              <button type="button" class="more-btn" aria-label="Actions">⋯</button>
            </div>
            <div class="product-info">
              <div class="product-name">${escapeHtml(p.nom)}</div>
              <div class="product-price">${p.prix} FCFA</div>
            </div>
          </div>`;
        grid.insertAdjacentHTML('beforeend', card);
      });

      const countEl = document.querySelector('#view-produits .products-header p');
      if (countEl) countEl.textContent = `${snapshot.size} produit${snapshot.size > 1 ? 's' : ''} enregistré${snapshot.size > 1 ? 's' : ''}`;
    } catch (error) { console.error("Erreur de chargement des produits:", error); }
  }

  const loginSubmitBtn = document.getElementById('loginSubmitBtn');
  if (loginSubmitBtn) {
    loginSubmitBtn.addEventListener('click', async () => {
      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value.trim();
      if (!email || !password) { alert('Veuillez remplir tous les champs.'); return; }

      try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        const doc = await db.collection('vendeurs').doc(user.uid).get();
        
        if (!doc.exists) throw new Error("Profil vendeur introuvable.");
        const vendeurData = doc.data();
        
        SHOP.email = vendeurData.email; SHOP.name = vendeurData.nom_boutique; SHOP.slug = vendeurData.slug;
        SHOP.whatsapp = vendeurData.numero_whatsapp; SHOP.color = vendeurData.couleur_accent;
        SHOP.colorSoft = '#FCE4EC'; SHOP.hours = vendeurData.horaires; SHOP.delivery = vendeurData.zone_livraison;
        SHOP.type = vendeurData.type_boutique; SHOP.deliveryPrice1 = vendeurData.deliveryPrice1 || 0;
        SHOP.deliveryPrice2 = vendeurData.deliveryPrice2 || 0; SHOP.deliveryPrice3 = vendeurData.deliveryPrice3 || 0;

        updateUIWithShopData();
        await loadProducts();
        const nav = document.querySelector('.bottom-nav'); if (nav) nav.style.display = 'flex';
        switchTab('dashboard'); showToast("Connexion réussie !");
      } catch (error) {
        console.error("Erreur de connexion:", error);
        alert('Erreur : ' + error.message);
      }
    });
  }

  function goToStep(n) {
    const step1 = document.getElementById('obStep1');
    const step2 = document.getElementById('obStep2');
    const dots = $$('#view-onboarding .ob-step-dot');
    if (!step1 || !step2) return;

    if (n === 2) {
      const emailEl = document.getElementById('obEmail'), passwordEl = document.getElementById('obPassword');
      if (!emailEl.value.trim() || !passwordEl.value.trim()) { alert('Veuillez remplir l\'email et le mot de passe.'); return; }
      if (passwordEl.value.length < 6) { alert('Le mot de passe doit contenir au moins 6 caractères.'); return; }

      SHOP.email = emailEl.value.trim(); SHOP.password = passwordEl.value.trim();
      SHOP.name = document.getElementById('obName').value.trim() || SHOP.name;
      SHOP.slug = document.getElementById('obSlug').value.trim() || SHOP.slug;
      SHOP.whatsapp = document.getElementById('obWhatsapp').value.trim() || SHOP.whatsapp;
      SHOP.type = document.getElementById('obShopType').value;

      step1.style.display = 'none'; step2.style.display = '';
      if (dots[0]) { dots[0].classList.remove('active'); dots[0].textContent = '✓'; }
      if (dots[1]) dots[1].classList.add('active');
    } else {
      step1.style.display = ''; step2.style.display = 'none';
      if (dots[0]) { dots[0].classList.add('active'); dots[0].textContent = '1'; }
      if (dots[1]) dots[1].classList.remove('active');
    }
  }

  async function createShop() {
    document.documentElement.style.setProperty('--accent', selectedColor.value);
    document.documentElement.style.setProperty('--accent-soft', selectedColor.soft);
    SHOP.color = selectedColor.value; SHOP.colorSoft = selectedColor.soft;
    SHOP.hours = document.getElementById('obHours').value.trim();
    SHOP.delivery = document.getElementById('obDelivery').value.trim();
    SHOP.deliveryPrice1 = parseInt(document.getElementById('obDeliveryPrice1').value, 10) || 0;
    SHOP.deliveryPrice2 = parseInt(document.getElementById('obDeliveryPrice2').value, 10) || 0;
    SHOP.deliveryPrice3 = parseInt(document.getElementById('obDeliveryPrice3').value, 10) || 0;

    try {
      const userCredential = await auth.createUserWithEmailAndPassword(SHOP.email, SHOP.password);
      const user = userCredential.user;

      await db.collection('vendeurs').doc(user.uid).set({
        email: SHOP.email, nom_boutique: SHOP.name, slug: SHOP.slug, numero_whatsapp: SHOP.whatsapp,
        couleur_accent: SHOP.color, horaires: SHOP.hours, zone_livraison: SHOP.delivery,
        deliveryPrice1: SHOP.deliveryPrice1, deliveryPrice2: SHOP.deliveryPrice2, deliveryPrice3: SHOP.deliveryPrice3,
        type_boutique: SHOP.type, created_at: firebase.firestore.FieldValue.serverTimestamp()
      });

      updateUIWithShopData(); await loadProducts();
      const nav = document.querySelector('.bottom-nav'); if (nav) nav.style.display = 'flex';
      switchTab('dashboard'); showToast("Compte créé avec succès !");
    } catch (error) {
      console.error("Erreur d'inscription:", error);
      if (error.code === 'auth/email-already-in-use') alert("Cet email est déjà utilisé. Essayez de vous connecter.");
      else if (error.code === 'auth/weak-password') alert("Le mot de passe est trop faible (6 caractères min).");
      else alert("Erreur : " + error.message);
    }
  }

  function updateUIWithShopData() {
    const dashName = document.querySelector('#view-dashboard .shop-name'), dashLogo = document.querySelector('#view-dashboard .shop-logo'), dashLink = document.querySelector('#view-dashboard .link-code');
    if (dashName) dashName.textContent = SHOP.name; if (dashLogo) dashLogo.textContent = (SHOP.name.charAt(0) || 'H').toUpperCase(); if (dashLink) dashLink.textContent = 'shopina.shop/' + SHOP.slug;
    document.getElementById('setName').textContent = SHOP.name; document.getElementById('setSlug').textContent = SHOP.slug; document.getElementById('setWhatsapp').textContent = SHOP.whatsapp;
    document.getElementById('setHours').textContent = SHOP.hours || '—'; document.getElementById('setDelivery').textContent = SHOP.delivery || '—';
    const setColorDot = document.getElementById('setColorDot'), setColorHex = document.getElementById('setColorHex');
    if (setColorDot) setColorDot.style.backgroundColor = SHOP.color; if (setColorHex) setColorHex.textContent = SHOP.color.toUpperCase();
    document.getElementById('setDeliveryPrice1').textContent = SHOP.deliveryPrice1 ? SHOP.deliveryPrice1 + ' FCFA' : '—';
    document.getElementById('setDeliveryPrice2').textContent = SHOP.deliveryPrice2 ? SHOP.deliveryPrice2 + ' FCFA' : '—';
    document.getElementById('setDeliveryPrice3').textContent = SHOP.deliveryPrice3 ? SHOP.deliveryPrice3 + ' FCFA' : '—';
    document.documentElement.style.setProperty('--accent', SHOP.color); document.documentElement.style.setProperty('--accent-soft', SHOP.colorSoft);
  }

  const nextBtn = document.getElementById('obNextBtn'); if (nextBtn) nextBtn.addEventListener('click', () => goToStep(2));
  const prevBtn = document.getElementById('obPrevBtn'); if (prevBtn) prevBtn.addEventListener('click', () => goToStep(1));
  const createBtn = document.getElementById('obCreateBtn'); if (createBtn) createBtn.addEventListener('click', createShop);

  const logoBtn = document.getElementById('obLogoBtn'), logoInput = document.getElementById('obLogoInput'), logoName = document.getElementById('obLogoName');
  if (logoBtn && logoInput) {
    logoBtn.addEventListener('click', () => logoInput.click());
    logoInput.addEventListener('change', function () { if (this.files && this.files[0]) logoName.textContent = this.files[0].name; });
  }

  $$('#colorPicker .color-swatch').forEach((sw) => {
    sw.addEventListener('click', () => {
      $$('#colorPicker .color-swatch').forEach((s) => s.classList.remove('selected'));
      sw.classList.add('selected'); selectedColor = { value: sw.dataset.color, soft: sw.dataset.soft };
      document.documentElement.style.setProperty('--accent', selectedColor.value); document.documentElement.style.setProperty('--accent-soft', selectedColor.soft);
    });
  });

  /* ============================================================
     6. DASHBOARD
     ============================================================ */
  function copyLink() {
    const link = 'shopina.shop/' + SHOP.slug; const done = () => showToast('Lien copié !');
    const fallback = () => { try { const ta = document.createElement('textarea'); ta.value = link; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); done(); } catch(e) { done(); } };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(link).then(done).catch(fallback); else fallback();
  }

  $$('#view-dashboard .btn-secondary').forEach((btn) => {
    if (btn.textContent.trim() === 'Copier') btn.addEventListener('click', copyLink);
    else if (btn.id !== 'catalogBtn') btn.addEventListener('click', simulate);
  });

  const dashAddBtn = document.querySelector('#view-dashboard .btn-primary'); if (dashAddBtn) dashAddBtn.addEventListener('click', openProductOverlay);

  const catalogBtn = document.getElementById('catalogBtn'), catalogOverlay = document.getElementById('catalog-image-overlay');
  const catalogCloseBtn = document.getElementById('catalogCloseBtn'), catalogDownloadBtn = document.getElementById('catalogDownloadBtn');

  if (catalogBtn && catalogOverlay) {
    catalogBtn.addEventListener('click', () => {
      const cardName = catalogOverlay.querySelector('.catalog-title'); if (cardName) cardName.textContent = SHOP.name;
      const cardLink = catalogOverlay.querySelector('.catalog-link'); if (cardLink) cardLink.textContent = 'shopina.shop/' + SHOP.slug;
      catalogOverlay.classList.add('open'); document.body.style.overflow = 'hidden';
    });
  }
  if (catalogCloseBtn) catalogCloseBtn.addEventListener('click', () => { catalogOverlay.classList.remove('open'); document.body.style.overflow = ''; });
  if (catalogDownloadBtn) catalogDownloadBtn.addEventListener('click', () => alert('Simulation : Image téléchargée'));

  /* ============================================================
     7. GESTION DES PHOTOS & OVERLAY PRODUIT
     ============================================================ */
  function openProductOverlay() {
    const overlay = document.getElementById('product-form-overlay'); if (!overlay) return;
    resetProductForm(); overlay.classList.add('open'); document.body.style.overflow = 'hidden';
  }
  function closeProductOverlay() {
    const overlay = document.getElementById('product-form-overlay'); if (!overlay) return;
    overlay.classList.remove('open'); document.body.style.overflow = '';
  }

  const fabBtn = document.querySelector('.fab'); if (fabBtn) fabBtn.addEventListener('click', openProductOverlay);
  const overlayCloseBtn = document.querySelector('#product-form-overlay .overlay-close'); if (overlayCloseBtn) overlayCloseBtn.addEventListener('click', closeProductOverlay);
  const overlayCancelBtn = document.querySelector('#product-form-overlay .overlay-footer .btn-secondary'); if (overlayCancelBtn) overlayCancelBtn.addEventListener('click', closeProductOverlay);
  const overlaySaveBtn = document.getElementById('overlaySaveBtn'); if (overlaySaveBtn) overlaySaveBtn.addEventListener('click', saveProduct);

  const btnCamera = document.getElementById('btnCamera'), btnGallery = document.getElementById('btnGallery');
  const cameraInput = document.getElementById('cameraInput'), galleryInput = document.getElementById('galleryInput');

  if(btnCamera && cameraInput) btnCamera.addEventListener('click', () => cameraInput.click());
  if(btnGallery && galleryInput) btnGallery.addEventListener('click', () => galleryInput.click());

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
          let width = img.width;
          let height = img.height;

          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            resolve(blob);
          }, 'image/jpeg', 0.7);
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
      const imageUrl = URL.createObjectURL(compressedBlob);
      if (previewEl) {
        previewEl.style.backgroundImage = `url('${imageUrl}')`;
        previewEl.textContent = '';
      }
    } catch (error) {
      console.error("Erreur de compression:", error);
      alert("Impossible de lire l'image.");
    }
  }

  if(cameraInput) cameraInput.addEventListener('change', handleImageSelect);
  if(galleryInput) galleryInput.addEventListener('change', handleImageSelect);

  /* ============================================================
     8. FORMULAIRE PRODUIT & UPLOAD CLOUDINARY
     ============================================================ */
  function resetProductForm() {
    document.getElementById('pName').value = ''; document.getElementById('pPrice').value = ''; document.getElementById('pDesc').value = '';
    document.querySelector('#product-form-overlay .char-count').textContent = '0/140'; document.querySelector('#product-form-overlay .tag-input').value = '';
    document.querySelector('#product-form-overlay .tags-list').innerHTML = '';
    currentTags = []; selectedCat = 'Vêtement'; selectedStatus = 'available'; currentImageBlob = null;
    $$('#product-form-overlay .radio-pill').forEach((b, i) => b.classList.toggle('selected', i === 0));
    $$('#product-form-overlay .status-pill').forEach((b, i) => b.classList.toggle('selected', i === 0));
    const photoPreview = document.querySelector('#product-form-overlay .photo-preview'); if (photoPreview) { photoPreview.textContent = 'Aucune photo'; photoPreview.style.backgroundImage = ''; }
    if(document.getElementById('cameraInput')) document.getElementById('cameraInput').value = '';
    if(document.getElementById('galleryInput')) document.getElementById('galleryInput').value = '';
  }

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

  $$('#product-form-overlay .radio-pill').forEach((btn) => {
    btn.addEventListener('click', () => { $$('#product-form-overlay .radio-pill').forEach((b) => b.classList.remove('selected')); btn.classList.add('selected'); selectedCat = btn.textContent.trim(); });
  });
  $$('#product-form-overlay .status-pill').forEach((btn) => {
    btn.addEventListener('click', () => { $$('#product-form-overlay .status-pill').forEach((b) => b.classList.remove('selected')); btn.classList.add('selected'); selectedStatus = btn.textContent.trim().toLowerCase() === 'disponible' ? 'available' : 'soldout'; });
  });

  async function saveProduct() {
    const user = auth.currentUser; if (!user) { alert("Vous devez être connecté."); return; }
    const name = document.getElementById('pName').value.trim(), price = parseInt(document.getElementById('pPrice').value, 10), desc = document.getElementById('pDesc').value.trim();
    if (!name || !price || price <= 0) { alert('Veuillez renseigner un nom et un prix valide.'); return; }

    const saveBtn = document.getElementById('overlaySaveBtn');
    if(saveBtn) { saveBtn.textContent = "Envoi en cours..."; saveBtn.disabled = true; }

    try {
      let photoUrl = null;

      // 1. Upload vers Cloudinary si une photo est sélectionnée
      if (currentImageBlob) {
        const formData = new FormData();
        formData.append('file', currentImageBlob);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
          method: 'POST',
          body: formData
        });
        
        const data = await response.json();
        if (data.secure_url) {
          photoUrl = data.secure_url;
        } else {
          throw new Error("Échec de l'upload de l'image sur Cloudinary.");
        }
      }

      // 2. Sauvegarde des données du produit dans Firebase
      const newProduct = { 
        vendeur_id: user.uid, 
        nom: name, 
        prix: price, 
        description: desc, 
        categorie: selectedCat, 
        statut: selectedStatus === 'available' ? 'Disponible' : 'Épuisé', 
        variantes: currentTags, 
        photo_url: photoUrl, 
        bgColor: '#F8BBD0', 
        created_at: firebase.firestore.FieldValue.serverTimestamp() 
      };
      
      await db.collection('produits').add(newProduct); 
      showToast('✓ Produit enregistré !'); 
      closeProductOverlay(); 
      await loadProducts(); 
      switchTab('produits'); 

    } catch (error) { 
      console.error("Erreur d'ajout:", error); 
      alert("Erreur : " + error.message); 
    } finally {
      if(saveBtn) { saveBtn.textContent = "Enregistrer"; saveBtn.disabled = false; }
    }
  }

  /* ============================================================
     9. COMMANDES (Simulé)
     ============================================================ */
  $$('.order-status-select').forEach((select) => {
    select.addEventListener('change', function () { const dot = this.closest('.order-item').querySelector('.order-dot'); if (dot) dot.className = 'order-dot status-' + this.value; showToast('Statut mis à jour'); });
  });
  $$('.btn-copy-confirm').forEach((btn) => {
    btn.addEventListener('click', function () { const message = `Bonjour, votre commande chez ${SHOP.name} est bien confirmée ! Livraison prévue. Merci !`; const done = () => showToast('Message copié !'); if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(message).then(done).catch(() => fallbackCopy(message, done)); else fallbackCopy(message, done); });
  });
  function fallbackCopy(text, callback) { try { const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); callback(); } catch (e) { alert('Erreur copie'); } }

  /* ============================================================
     10. LÉA
     ============================================================ */
  const leaCategories = document.getElementById('lea-categories'), leaContent = document.getElementById('lea-content');
  function showLeaCategories() { if (leaCategories && leaContent) { leaCategories.style.display = 'flex'; leaContent.style.display = 'none'; leaContent.innerHTML = ''; } }
  function getAdviceGroup() { return (SHOP.type === 'import_chine' || SHOP.type === 'electromenager') ? 'import' : 'local'; }
  function openLeaCategory(catKey) {
    const group = getAdviceGroup(), data = leaData[catKey]; if (!data || !data[group] || !leaCategories || !leaContent) return;
    leaCategories.style.display = 'none'; leaContent.style.display = 'block';
    leaContent.innerHTML = `<button type="button" class="lea-back-btn" id="leaBackBtn">← Retour aux catégories</button>${data[group]}`;
    document.getElementById('leaBackBtn').addEventListener('click', showLeaCategories); window.scrollTo(0, 0);
  }
  $$('.lea-category-card').forEach((card) => { card.addEventListener('click', () => openLeaCategory(card.dataset.cat)); });

  /* ============================================================
     11. RÉGLAGES SIMULÉS & RACCOURCIS
     ============================================================ */
  $$('#view-reglages .btn-secondary, #view-reglages .btn-danger').forEach((btn) => { btn.addEventListener('click', simulate); });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const overlay = document.getElementById('product-form-overlay'); if (overlay && overlay.classList.contains('open')) { closeProductOverlay(); return; }
    if (catalogOverlay && catalogOverlay.classList.contains('open')) { catalogOverlay.classList.remove('open'); document.body.style.overflow = ''; }
  });

  /* ============================================================
     12. INIT
     ============================================================ */
  function init() {
    const nav = document.querySelector('.bottom-nav'); if (nav) nav.style.display = 'none';
    const banner = $('.demo-banner'); if (banner) banner.textContent = 'Démo Shopina — Onboarding';
  }
  init();
})();
