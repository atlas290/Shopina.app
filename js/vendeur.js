/* ============================================================
   Shopina — vendeur.js (Version Finale - Session Persistante)
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

  const SHOP = { name: 'Havana Shop', slug: 'havana-shop', whatsapp: '', color: '#E91E63', colorSoft: '#FCE4EC', hours: '', delivery: '', deliveryPrice1: 0, deliveryPrice2: 0, deliveryPrice3: 0, type: 'mode_locale', email: '', password: '' };
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
     AUTHENTIFICATION & SESSION
     ============================================================ */
  const goToLoginBtn = document.getElementById('goToLoginBtn'), goToOnboardingBtn = document.getElementById('goToOnboardingBtn');
  const viewLogin = document.getElementById('view-login'), viewOnboarding = document.getElementById('view-onboarding');
  if (goToLoginBtn) goToLoginBtn.addEventListener('click', (e) => { e.preventDefault(); viewOnboarding.classList.remove('active'); viewLogin.classList.add('active'); });
  if (goToOnboardingBtn) goToOnboardingBtn.addEventListener('click', (e) => { e.preventDefault(); viewLogin.classList.remove('active'); viewOnboarding.classList.add('active'); });

  // Connexion
  const loginSubmitBtn = document.getElementById('loginSubmitBtn');
  if (loginSubmitBtn) {
    loginSubmitBtn.addEventListener('click', async () => {
      const email = document.getElementById('loginEmail').value.trim(), password = document.getElementById('loginPassword').value.trim();
      if (!email || !password) return alert('Remplissez tous les champs.');
      try {
        await auth.signInWithEmailAndPassword(email, password);
      } catch (error) { alert('Email ou mot de passe incorrect.'); }
    });
  }

  // Déconnexion
  document.getElementById('btnLogout').addEventListener('click', () => {
    auth.signOut().then(() => {
      window.location.reload();
    });
  });

  // LE MIRACLE : L'écouteur d'état d'authentification
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      // La vendeuse est connectée (ou vient de se connecter)
      try {
        const doc = await db.collection('vendeurs').doc(user.uid).get();
        if (doc.exists) {
          const v = doc.data();
          SHOP.email = v.email; SHOP.name = v.nom_boutique; SHOP.slug = v.slug; SHOP.whatsapp = v.numero_whatsapp;
          SHOP.color = v.couleur_accent; SHOP.colorSoft = '#FCE4EC'; SHOP.hours = v.horaires; SHOP.delivery = v.zone_livraison;
          SHOP.type = v.type_boutique; SHOP.deliveryPrice1 = v.deliveryPrice1 || 0; SHOP.deliveryPrice2 = v.deliveryPrice2 || 0; SHOP.deliveryPrice3 = v.deliveryPrice3 || 0;
          
          updateUIWithShopData();
          document.querySelector('.bottom-nav').style.display = 'flex';
          switchTab('dashboard');
        }
      } catch (error) { console.error("Erreur chargement session", error); }
    } else {
      // La vendeuse n'est pas connectée
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
     UI & INSCRIPTION
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

  function copyLink() {
    const link = 'shopina.shop/' + SHOP.slug; const done = () => showToast('Lien copié !');
    const fallback = () => { try { const ta = document.createElement('textarea'); ta.value = link; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); done(); } catch(e) { done(); } };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(link).then(done).catch(fallback); else fallback();
  }

  async function shareLink() {
    const link = 'shopina.shop/' + SHOP.slug;
    if (navigator.share) {
      try { await navigator.share({ title: 'Ma boutique ' + SHOP.name, text: 'Découvrez mes produits !', url: 'https://' + link }); } catch (error) {}
    } else { copyLink(); showToast('Lien copié !'); }
  }

  document.getElementById('btnCopyLink').addEventListener('click', copyLink);
  document.getElementById('btnShareLink').addEventListener('click', shareLink);

  // Gestion Onboarding
  function goToStep(n) {
    const step1 = document.getElementById('obStep1'), step2 = document.getElementById('obStep2'), dots = $$('#view-onboarding .ob-step-dot');
    if (n === 2) {
      const emailEl = document.getElementById('obEmail'), passwordEl = document.getElementById('obPassword');
      if (!emailEl.value.trim() || !passwordEl.value.trim()) { alert('Remplissez l\'email et le mot de passe.'); return; }
      if (passwordEl.value.length < 6) { alert('Le mot de passe doit contenir au moins 6 caractères.'); return; }

      SHOP.email = emailEl.value.trim(); SHOP.password = passwordEl.value.trim();
      SHOP.name = document.getElementById('obName').value.trim() || 'Ma Boutique';
      SHOP.slug = document.getElementById('obSlug').value.trim() || 'ma-boutique';
      SHOP.whatsapp = document.getElementById('obWhatsapp').value.trim();
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
        type_boutique: SHOP.type, created_at: firebase.firestore.FieldValue.serverTimestamp()
      });
      showToast("Compte créé !");
      // L'écouteur auth.onAuthStateChanged fera le reste automatiquement
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') alert("Cet email est déjà utilisé.");
      else alert("Erreur : " + error.message);
    }
  });

  // Couleurs
  $$('#colorPicker .color-swatch').forEach((sw) => {
    sw.addEventListener('click', () => {
      $$('#colorPicker .color-swatch').forEach((s) => s.classList.remove('selected'));
      sw.classList.add('selected'); selectedColor = { value: sw.dataset.color, soft: sw.dataset.soft };
      document.documentElement.style.setProperty('--accent', selectedColor.value); document.documentElement.style.setProperty('--accent-soft', selectedColor.soft);
    });
  });

  // Léa
  function showLeaCategories() { document.getElementById('lea-categories').style.display = 'flex'; document.getElementById('lea-content').style.display = 'none'; }
  function openLeaCategory(catKey) {
    const group = (SHOP.type === 'import_chine' || SHOP.type === 'electromenager') ? 'import' : 'local';
    document.getElementById('lea-categories').style.display = 'none'; document.getElementById('lea-content').style.display = 'block';
    document.getElementById('lea-content').innerHTML = `<button type="button" class="lea-back-btn" onclick="document.getElementById('lea-categories').style.display='flex';document.getElementById('lea-content').style.display='none';">← Retour</button>${leaData[catKey][group]}`;
  }
  $$('.lea-category-card').forEach(card => card.addEventListener('click', () => openLeaCategory(card.dataset.cat)));

  // Placeholders pour les boutons de réglages (à venir)
  document.getElementById('btnEditInfo').addEventListener('click', simulate);
  document.getElementById('btnManageSub').addEventListener('click', simulate);

  function init() { document.querySelector('.bottom-nav').style.display = 'none'; }
  init();
})();
