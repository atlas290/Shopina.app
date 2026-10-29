/* ============================================================
   Shopina — vendeur.js (Version Firebase + Livraison)
   ============================================================ */

(function () {
  'use strict';

  /* ============================================================
     0. CONNEXION FIREBASE
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

  /* ============================================================
     1. DONNÉES
     ============================================================ */
  const SHOP = {
    name: 'Havana Shop',
    slug: 'havana-shop',
    whatsapp: '+229 67 02 05 86',
    color: '#E91E63',
    colorSoft: '#FCE4EC',
    hours: '',
    delivery: '',
    deliveryPrice1: 0,
    deliveryPrice2: 0,
    deliveryPrice3: 0,
    type: 'mode_locale',
    email: '',
    password: ''
  };

  const TAB_NAMES = {
    dashboard: 'Dashboard',
    produits:  'Produits',
    commandes: 'Commandes',
    lea:       'Léa',
    reglages:  'Réglages'
  };

  /* Contenu des conseils de Léa */
  const leaData = {
    video: {
      local: `
        <h2 class="lea-content-title">🎥 Faire une vidéo TikTok/Reels</h2>
        <div class="lea-advice-card">
          <h3>Le trend du changement de tenue</h3>
          <p>Commence en pyjama ou en tenue simple. <strong>Claque des doigts</strong> et apparais avec la tenue à vendre.</p>
          <ul>
            <li>Filme verticalement (format 9:16).</li>
            <li>Nettoie ton objectif avec un t-shirt propre avant de filmer, ça change tout.</li>
            <li>Utilise la fonction "Minuterie" pour te placer.</li>
          </ul>
        </div>
        <div class="lea-advice-card">
          <h3>Les 3 premières secondes</h3>
          <p>C'est ce qui décide si la personne reste ou scrolle. <strong>Ne perds pas de temps.</strong></p>
          <ul>
            <li>Commence TOUJOURS par montrer le produit.</li>
            <li>Ou pose une question choc : <em>"Tu cherches la tenue parfaite pour ce week-end ?"</em></li>
          </ul>
        </div>
        <div class="lea-advice-card">
          <h3>L'audio et le montage</h3>
          <p>Utilise un <strong>son tendance</strong> (repère la petite flèche en bas à droite sur TikTok).</p>
          <ul>
            <li>Baisse le volume du son original pour mettre ta voix par-dessus.</li>
            <li>Parle fort et distinctement, comme si tu parlais à une amie.</li>
          </ul>
        </div>
      `,
      import: `
        <h2 class="lea-content-title">🎥 Faire une vidéo TikTok/Reels</h2>
        <div class="lea-advice-card">
          <h3>Filme le produit en action</h3>
          <p>Pour l'électroménager ou les sacs, une photo ne suffit pas. <strong>Montre-le en vrai.</strong></p>
          <ul>
            <li>Allume le mixeur, mets le sac au bras, fais tourner le gadget.</li>
            <li>Les gens veulent voir comment ça marche avant d'acheter.</li>
          </ul>
        </div>
        <div class="lea-advice-card">
          <h3>La preuve par le détail</h3>
          <p>Pour justifier le prix, <strong>montre les finitions de près.</strong></p>
          <ul>
            <li>Zoome sur les coutures du sac, le métal du blender, la solidité du plastique.</li>
            <li>Fais un test de résistance à l'écran (tire un peu sur la couture, etc.).</li>
          </ul>
        </div>
        <div class="lea-advice-card">
          <h3>Le Hook (Accroche) qui marche</h3>
          <p>Ne dis pas juste "Regardez ce sac". Crée la surprise.</p>
          <div class="lea-script-box">
            <strong>Exemples de phrases :</strong>
            "Tu cherches un sac qui ne casse pas au bout de 2 semaines ? Regarde ça."<br>
            "Ce mixeur à 25 000 FCFA fait le boulot de ceux à 50 000. Preuve en vidéo."
          </div>
        </div>
      `
    },
    whatsapp: {
      local: `
        <h2 class="lea-content-title">📱 Vendre sur WhatsApp</h2>
        <div class="lea-advice-card">
          <h3>La stratégie des statuts</h3>
          <p>Poste <strong>1 photo par jour</strong>, pas 10 d'un coup. C'est moins fatiguant pour tes contacts et tu restes visible.</p>
          <ul>
            <li>Mets le prix VISIBLE sur l'image (utilise Canva ou l'appareil photo).</li>
            <li>Ajoute un texte du genre : <em>"Réponds à ce statut pour commander"</em>.</li>
          </ul>
        </div>
        <div class="lea-advice-card">
          <h3>Le script de relance (Sans être lourde)</h3>
          <p>Ne dis jamais juste <em>"Alors ?"</em>. Utilise la technique de l'attention personnalisée.</p>
          <div class="lea-script-box">
            <strong>Le script prêt à copier :</strong>
            "Coucou [Prénom], je viens de recevoir une nouvelle couleur de [Produit], je pensais à toi. Ça te dit que je te garde ta taille ?"
          </div>
        </div>
        <div class="lea-advice-card">
          <h3>La règle des 24h</h3>
          <p>Relance <strong>TOUJOURS</strong> un client qui a vu le statut mais n'a pas répondu.</p>
          <ul>
            <li>Attends exactement 24h (le lendemain à la même heure).</li>
            <li>Rappelle-toi que le client est occupé, ce n'est pas un "non" définitif.</li>
          </ul>
        </div>
      `,
      import: `
        <h2 class="lea-content-title">📱 Vendre sur WhatsApp</h2>
        <div class="lea-advice-card">
          <h3>Rassurer sur la qualité</h3>
          <p>Pour l'import ou l'électroménager, le client a <strong>peur que ça casse.</strong> Ton rôle est de le rassurer.</p>
          <div class="lea-script-box">
            <strong>Ce que tu dois dire :</strong>
            "C'est du costaud, je l'utilise moi-même depuis 6 mois sans aucun problème. Tu peux y aller les yeux fermés."
          </div>
        </div>
        <div class="lea-advice-card">
          <h3>Le statut "Preuve Sociale"</h3>
          <p>Poste des captures d'écran de clients satisfaits ou des vidéos de toi en train d'utiliser le produit.</p>
          <ul>
            <li>Floute les noms des clients pour la confidentialité.</li>
            <li>Ajoute un texte : <em>"Encore une cliente satisfaite de son blender !"</em></li>
          </ul>
        </div>
        <div class="lea-advice-card">
          <h3>Gérer la garantie</h3>
          <p>Sois claire sur les conditions dès le départ. <strong>Pas de mauvaise surprise.</strong></p>
          <ul>
            <li>Dis : "Je te donne 7 jours pour tester. Si ça ne marche pas, je te rembourse."</li>
            <li>Ça enlève la peur de l'arnaque et ça ferme la vente.</li>
          </ul>
        </div>
      `
    },
    photos: {
      local: `
        <h2 class="lea-content-title">📸 Prendre de belles photos</h2>
        <div class="lea-advice-card">
          <h3>La lumière naturelle (Gratuit & Pro)</h3>
          <p>Ne mets <strong>JAMAIS</strong> le flash de ton téléphone. C'est le meilleur moyen de faire fuir les clientes.</p>
          <ul>
            <li>Mets-toi face à une fenêtre ouverte.</li>
            <li>Le meilleur moment : entre <strong>15h et 17h</strong> pour une lumière douce.</li>
          </ul>
        </div>
        <div class="lea-advice-card">
          <h3>Le fond (Fais le vide)</h3>
          <p>Débarrasse ton lit ou ta chambre. <strong>Le désordre tue la vente.</strong></p>
          <ul>
            <li>Le meilleur fond : un mur blanc.</li>
            <li>Sinon, épingle un drap uni propre au mur.</li>
          </ul>
        </div>
        <div class="lea-advice-card">
          <h3>Les 3 angles obligatoires</h3>
          <p>Prends toujours 3 photos différentes pour que la cliente visualise bien le produit.</p>
          <ul>
            <li><strong>1. De face :</strong> Pour voir la coupe globale.</li>
            <li><strong>2. De dos :</strong> Pour montrer le dos du vêtement.</li>
            <li><strong>3. De près :</strong> Pour montrer la qualité du tissu ou un détail.</li>
          </ul>
        </div>
      `,
      import: `
        <h2 class="lea-content-title">📸 Prendre de belles photos</h2>
        <div class="lea-advice-card">
          <h3>La mise en scène</h3>
          <p>Ne pose pas juste le produit par terre. <strong>Mets-le en contexte.</strong></p>
          <ul>
            <li>Porte le sac à ton bras avec une tenue assortie.</li>
            <li>Pose le mixeur sur un plan de travail propre avec des fruits à côté.</li>
          </ul>
        </div>
        <div class="lea-advice-card">
          <h3>Les photos de détails</h3>
          <p>Ce qui rassure sur l'import, c'est le détail. <strong>Fais des gros plans.</strong></p>
          <ul>
            <li>La fermeture éclair du sac, le logo, les coutures.</li>
            <li>Les accessoires inclus (les lames du blender, la télécommande).</li>
          </ul>
        </div>
        <div class="lea-advice-card">
          <h3>Montre l'échelle</h3>
          <p>Le client ne se rend pas compte de la taille sur une photo seule.</p>
          <ul>
            <li>Prends le produit en main pour montrer sa taille réelle.</li>
            <li>Ou place un objet connu à côté (une bouteille, un téléphone).</li>
          </ul>
        </div>
      `
    },
    prix: {
      local: `
        <h2 class="lea-content-title">💰 Fixer ses prix & gérer clients</h2>
        <div class="lea-advice-card">
          <h3>La formule magique</h3>
          <p>Ne fixe pas tes prix au hasard. Utilise cette règle simple :</p>
          <div class="lea-script-box">
            <strong>Calcul :</strong>
            Prix d'achat + Transport + Marge (40%) = Ton prix de vente.
          </div>
        </div>
        <div class="lea-advice-card">
          <h3>La règle d'or face à "C'est trop cher"</h3>
          <p>Ne baisse <strong>JAMAIS</strong> ton prix au premier "C'est trop cher". Propose plutôt une alternative.</p>
          <div class="lea-script-box">
            <strong>Ce que tu dois dire :</strong>
            "Je comprends. Si tu prends 2 pièces, je te fais une réduction de 1000 FCFA. Qu'est-ce que t'en dis ?"
          </div>
        </div>
        <div class="lea-advice-card">
          <h3>L'objection prix (Justifie la qualité)</h3>
          <p>Quand on te dit que c'est cher, c'est que la valeur n'est pas encore claire. <strong>Éduque ton client.</strong></p>
          <ul>
            <li><em>"C'est du vrai wax, il ne déteint pas au lavage."</em></li>
            <li><em>"Regarde la doublure, c'est cousu main."</em></li>
            <li>Rappelle-lui la durabilité par rapport aux produits bas de gamme.</li>
          </ul>
        </div>
      `,
      import: `
        <h2 class="lea-content-title">💰 Fixer ses prix & gérer clients</h2>
        <div class="lea-advice-card">
          <h3>Justifie par la durée de vie</h3>
          <p>Pour l'import, le client compare souvent avec le "moins cher" du marché. <strong>Change son calcul.</strong></p>
          <div class="lea-script-box">
            <strong>Ce que tu dois dire :</strong>
            "Ça te fera 2 ans minimum, alors qu'un modèle bas de gamme casse en 2 mois. Au final, tu économises."
          </div>
        </div>
        <div class="lea-advice-card">
          <h3>La technique du "Coût par utilisation"</h3>
          <p>Divise le prix par le nombre de fois où le client va l'utiliser.</p>
          <ul>
            <li>"Un sac à 15 000 FCFA que tu portes tous les jours pendant 1 an, ça te fait 41 FCFA par jour."</li>
            <li>Ça rend le prix psychologiquement très petit.</li>
          </ul>
        </div>
        <div class="lea-advice-card">
          <h3>Ne casse pas tes prix</h3>
          <p>Si tu baisses trop, le client pensera que la qualité est mauvaise.</p>
          <ul>
            <li>Propose plutôt un petit cadeau (un accessoire, une housse) au lieu d'une réduction.</li>
            <li>Ça garde la valeur du produit intacte.</li>
          </ul>
        </div>
      `
    }
  };

  /* ============================================================
     2. ÉTAT
     ============================================================ */
  let currentTags = [];
  let selectedCat = 'Vêtement';
  let selectedStatus = 'available';
  let selectedColor = { value: '#E91E63', soft: '#FCE4EC' };

  /* ============================================================
     3. HELPERS
     ============================================================ */
  const $  = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;',
      '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  let toastEl = null;
  let toastTimer = null;

  function showToast(message) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast';
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = message;
    void toastEl.offsetWidth;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2000);
  }

  function simulate() {
    alert('Simulation — Fonctionnalité à venir');
  }

  /* ============================================================
     4. NAVIGATION
     ============================================================ */
  function switchTab(tab) {
    $$('.app-view.section').forEach((s) => s.classList.remove('active'));
    const target = document.getElementById('view-' + tab);
    if (target) target.classList.add('active');

    $$('.nav-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.tab === tab);
    });

    const banner = $('.demo-banner');
    if (banner) banner.textContent = 'Démo Shopina — ' + (TAB_NAMES[tab] || tab);

    if (tab === 'lea') {
      showLeaCategories();
    }

    window.scrollTo(0, 0);
  }

  $$('.nav-btn').forEach((btn) => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  /* ============================================================
     5. AUTHENTIFICATION
     ============================================================ */
  const goToLoginBtn = document.getElementById('goToLoginBtn');
  const goToOnboardingBtn = document.getElementById('goToOnboardingBtn');
  const viewLogin = document.getElementById('view-login');
  const viewOnboarding = document.getElementById('view-onboarding');
  
  if (goToLoginBtn && viewLogin && viewOnboarding) {
    goToLoginBtn.addEventListener('click', (e) => {
      e.preventDefault();
      viewOnboarding.classList.remove('active');
      viewLogin.classList.add('active');
      const banner = $('.demo-banner');
      if (banner) banner.textContent = 'Démo Shopina — Connexion';
    });
  }

  if (goToOnboardingBtn && viewLogin && viewOnboarding) {
    goToOnboardingBtn.addEventListener('click', (e) => {
      e.preventDefault();
      viewLogin.classList.remove('active');
      viewOnboarding.classList.add('active');
      const banner = $('.demo-banner');
      if (banner) banner.textContent = 'Démo Shopina — Onboarding';
    });
  }

  const loginSubmitBtn = document.getElementById('loginSubmitBtn');
  if (loginSubmitBtn) {
    loginSubmitBtn.addEventListener('click', async () => {
      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value.trim();

      if (!email || !password) {
        alert('Veuillez remplir tous les champs.');
        return;
      }

      try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;

        const doc = await db.collection('vendeurs').doc(user.uid).get();
        
        if (!doc.exists) {
          throw new Error("Profil vendeur introuvable.");
        }

        const vendeurData = doc.data();
        SHOP.email = vendeurData.email;
        SHOP.name = vendeurData.nom_boutique;
        SHOP.slug = vendeurData.slug;
        SHOP.whatsapp = vendeurData.numero_whatsapp;
        SHOP.color = vendeurData.couleur_accent;
        SHOP.colorSoft = '#FCE4EC';
        SHOP.hours = vendeurData.horaires;
        SHOP.delivery = vendeurData.zone_livraison;
        SHOP.type = vendeurData.type_boutique;
        SHOP.deliveryPrice1 = vendeurData.deliveryPrice1 || 0;
        SHOP.deliveryPrice2 = vendeurData.deliveryPrice2 || 0;
        SHOP.deliveryPrice3 = vendeurData.deliveryPrice3 || 0;

        updateUIWithShopData();

        const nav = document.querySelector('.bottom-nav');
        if (nav) nav.style.display = 'flex';
        switchTab('dashboard');
        showToast("Connexion réussie !");

      } catch (error) {
        console.error("Erreur de connexion:", error);
        alert('Erreur : ' + error.message);
      }
    });
  }

  function goToStep(n) {
    const step1 = document.getElementById('obStep1');
    const step2 = document.getElementById('obStep2');
    const dots  = $$('#view-onboarding .ob-step-dot');
    if (!step1 || !step2) return;

    if (n === 2) {
      const emailEl = document.getElementById('obEmail');
      const passwordEl = document.getElementById('obPassword');
      const nameEl = document.getElementById('obName');
      const slugEl = document.getElementById('obSlug');
      const waEl   = document.getElementById('obWhatsapp');
      const typeEl = document.getElementById('obShopType');

      if (!emailEl.value.trim() || !passwordEl.value.trim()) {
        alert('Veuillez remplir l\'email et le mot de passe.');
        return;
      }
      if (passwordEl.value.length < 6) {
        alert('Le mot de passe doit contenir au moins 6 caractères.');
        return;
      }

      SHOP.email = emailEl.value.trim();
      SHOP.password = passwordEl.value.trim();
      if (nameEl) SHOP.name     = nameEl.value.trim() || SHOP.name;
      if (slugEl) SHOP.slug     = slugEl.value.trim() || SHOP.slug;
      if (waEl)   SHOP.whatsapp = waEl.value.trim() || SHOP.whatsapp;
      if (typeEl) SHOP.type     = typeEl.value;

      step1.style.display = 'none';
      step2.style.display = '';
      if (dots[0]) { dots[0].classList.remove('active'); dots[0].textContent = '✓'; }
      if (dots[1]) dots[1].classList.add('active');
    } else {
      step1.style.display = '';
      step2.style.display = 'none';
      if (dots[0]) { dots[0].classList.add('active'); dots[0].textContent = '1'; }
      if (dots[1]) dots[1].classList.remove('active');
    }
  }

  async function createShop() {
    document.documentElement.style.setProperty('--accent', selectedColor.value);
    document.documentElement.style.setProperty('--accent-soft', selectedColor.soft);
    SHOP.color     = selectedColor.value;
    SHOP.colorSoft = selectedColor.soft;

    const hoursEl    = document.getElementById('obHours');
    const deliveryEl = document.getElementById('obDelivery');
    const price1El   = document.getElementById('obDeliveryPrice1');
    const price2El   = document.getElementById('obDeliveryPrice2');
    const price3El   = document.getElementById('obDeliveryPrice3');

    if (hoursEl)    SHOP.hours    = hoursEl.value.trim();
    if (deliveryEl) SHOP.delivery = deliveryEl.value.trim();
    
    SHOP.deliveryPrice1 = price1El ? parseInt(price1El.value, 10) || 0 : 0;
    SHOP.deliveryPrice2 = price2El ? parseInt(price2El.value, 10) || 0 : 0;
    SHOP.deliveryPrice3 = price3El ? parseInt(price3El.value, 10) || 0 : 0;

    try {
      const userCredential = await auth.createUserWithEmailAndPassword(SHOP.email, SHOP.password);
      const user = userCredential.user;

      await db.collection('vendeurs').doc(user.uid).set({
        email: SHOP.email,
        nom_boutique: SHOP.name,
        slug: SHOP.slug,
        numero_whatsapp: SHOP.whatsapp,
        couleur_accent: SHOP.color,
        horaires: SHOP.hours,
        zone_livraison: SHOP.delivery,
        deliveryPrice1: SHOP.deliveryPrice1,
        deliveryPrice2: SHOP.deliveryPrice2,
        deliveryPrice3: SHOP.deliveryPrice3,
        type_boutique: SHOP.type,
        created_at: firebase.firestore.FieldValue.serverTimestamp()
      });

      updateUIWithShopData();

      const nav = document.querySelector('.bottom-nav');
      if (nav) nav.style.display = 'flex';
      switchTab('dashboard');
      showToast("Compte créé avec succès !");

    } catch (error) {
      console.error("Erreur d'inscription:", error);
      
      if (error.code === 'auth/email-already-in-use') {
        alert("Cet email est déjà utilisé. Essayez de vous connecter ou utilisez un autre email.");
      } else if (error.code === 'auth/weak-password') {
        alert("Le mot de passe est trop faible (6 caractères minimum).");
      } else if (error.code === 'auth/invalid-email') {
        alert("Le format de l'email n'est pas valide.");
      } else {
        alert("Erreur : " + error.message);
      }
    }
  }

  function updateUIWithShopData() {
    const dashName = document.querySelector('#view-dashboard .shop-name');
    const dashLogo = document.querySelector('#view-dashboard .shop-logo');
    const dashLink = document.querySelector('#view-dashboard .link-code');
    if (dashName) dashName.textContent = SHOP.name;
    if (dashLogo) dashLogo.textContent = (SHOP.name.charAt(0) || 'H').toUpperCase();
    if (dashLink) dashLink.textContent = 'shopina.shop/' + SHOP.slug;

    const setHoursEl    = document.getElementById('setHours');
    const setDeliveryEl = document.getElementById('setDelivery');
    if (setHoursEl)    setHoursEl.textContent    = SHOP.hours    || '—';
    if (setDeliveryEl) setDeliveryEl.textContent = SHOP.delivery || '—';

    const setColorDot = document.getElementById('setColorDot');
    const setColorHex = document.getElementById('setColorHex');
    if (setColorDot) setColorDot.style.backgroundColor = SHOP.color;
    if (setColorHex) setColorHex.textContent           = SHOP.color.toUpperCase();

    const setPrice1 = document.getElementById('setDeliveryPrice1');
    const setPrice2 = document.getElementById('setDeliveryPrice2');
    const setPrice3 = document.getElementById('setDeliveryPrice3');
    if (setPrice1) setPrice1.textContent = SHOP.deliveryPrice1 ? SHOP.deliveryPrice1 + ' FCFA' : '—';
    if (setPrice2) setPrice2.textContent = SHOP.deliveryPrice2 ? SHOP.deliveryPrice2 + ' FCFA' : '—';
    if (setPrice3) setPrice3.textContent = SHOP.deliveryPrice3 ? SHOP.deliveryPrice3 + ' FCFA' : '—';

    document.documentElement.style.setProperty('--accent', SHOP.color);
    document.documentElement.style.setProperty('--accent-soft', SHOP.colorSoft);
  }

  const nextBtn = document.getElementById('obNextBtn');
  if (nextBtn) nextBtn.addEventListener('click', () => goToStep(2));

  const prevBtn = document.getElementById('obPrevBtn');
  if (prevBtn) prevBtn.addEventListener('click', () => goToStep(1));

  const createBtn = document.getElementById('obCreateBtn');
  if (createBtn) createBtn.addEventListener('click', createShop);

  const logoBtn   = document.getElementById('obLogoBtn');
  const logoInput = document.getElementById('obLogoInput');
  const logoName  = document.getElementById('obLogoName');
  if (logoBtn && logoInput) {
    logoBtn.addEventListener('click', () => logoInput.click());
    logoInput.addEventListener('change', function () {
      if (this.files && this.files[0]) {
        logoName.textContent = this.files[0].name;
      }
    });
  }

  $$('#colorPicker .color-swatch').forEach((sw) => {
    sw.addEventListener('click', () => {
      $$('#colorPicker .color-swatch').forEach((s) => s.classList.remove('selected'));
      sw.classList.add('selected');
      selectedColor = { value: sw.dataset.color, soft: sw.dataset.soft };
      document.documentElement.style.setProperty('--accent', selectedColor.value);
      document.documentElement.style.setProperty('--accent-soft', selectedColor.soft);
    });
  });

  /* ============================================================
     6. DASHBOARD & CATALOGUE
     ============================================================ */
  function copyLink() {
    const link = 'shopina.shop/' + SHOP.slug;
    const done = () => showToast('Lien copié !');
    const fallback = () => {
      try {
        const ta = document.createElement('textarea');
        ta.value = link;
        ta.setAttribute('readonly', '');
        ta.style.position = 'absolute';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        done();
      } catch (e) { done(); }
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(link).then(done).catch(fallback);
    } else {
      fallback();
    }
  }

  $$('#view-dashboard .btn-secondary').forEach((btn) => {
    if (btn.textContent.trim() === 'Copier') {
      btn.addEventListener('click', copyLink);
    } else if (btn.id !== 'catalogBtn') {
      btn.addEventListener('click', simulate);
    }
  });

  const dashAddBtn = document.querySelector('#view-dashboard .btn-primary');
  if (dashAddBtn) dashAddBtn.addEventListener('click', openProductOverlay);

  const catalogBtn = document.getElementById('catalogBtn');
  const catalogOverlay = document.getElementById('catalog-image-overlay');
  const catalogCloseBtn = document.getElementById('catalogCloseBtn');
  const catalogDownloadBtn = document.getElementById('catalogDownloadBtn');

  if (catalogBtn && catalogOverlay) {
    catalogBtn.addEventListener('click', () => {
      const cardName = catalogOverlay.querySelector('.catalog-title');
      if (cardName) cardName.textContent = SHOP.name;
      const cardLink = catalogOverlay.querySelector('.catalog-link');
      if (cardLink) cardLink.textContent = 'shopina.shop/' + SHOP.slug;
      
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
      alert('Simulation : Image téléchargée');
    });
  }

  /* ============================================================
     7. OVERLAY PRODUIT
     ============================================================ */
  function openProductOverlay() {
    const overlay = document.getElementById('product-form-overlay');
    if (!overlay) return;
    resetProductForm();
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeProductOverlay() {
    const overlay = document.getElementById('product-form-overlay');
    if (!overlay) return;
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  const fabBtn = document.querySelector('.fab');
  if (fabBtn) fabBtn.addEventListener('click', openProductOverlay);

  const overlayCloseBtn = document.querySelector('#product-form-overlay .overlay-close');
  if (overlayCloseBtn) overlayCloseBtn.addEventListener('click', closeProductOverlay);

  const overlayCancelBtn = document.querySelector('#product-form-overlay .overlay-footer .btn-secondary');
  if (overlayCancelBtn) overlayCancelBtn.addEventListener('click', closeProductOverlay);

  const overlaySaveBtn = document.querySelector('#product-form-overlay .overlay-footer .btn-primary');
  if (overlaySaveBtn) overlaySaveBtn.addEventListener('click', saveProduct);

  /* ============================================================
     8. FORMULAIRE PRODUIT
     ============================================================ */
  function resetProductForm() {
    const nameEl   = document.getElementById('pName');
    const priceEl  = document.getElementById('pPrice');
    const descEl   = document.getElementById('pDesc');
    const countEl  = document.querySelector('#product-form-overlay .char-count');
    const tagInput = document.querySelector('#product-form-overlay .tag-input');
    const tagsList = document.querySelector('#product-form-overlay .tags-list');

    if (nameEl) nameEl.value = '';
    if (priceEl) priceEl.value = '';
    if (descEl) descEl.value = '';
    if (countEl) countEl.textContent = '0/140';
    if (tagInput) tagInput.value = '';
    if (tagsList) tagsList.innerHTML = '';

    currentTags = [];
    selectedCat = 'Vêtement';
    selectedStatus = 'available';

    $$('#product-form-overlay .radio-pill').forEach((b, i) => {
      b.classList.toggle('selected', i === 0);
    });
    $$('#product-form-overlay .status-pill').forEach((b, i) => {
      b.classList.toggle('selected', i === 0);
    });

    const photoPreview = document.querySelector('#product-form-overlay .photo-preview');
    if (photoPreview) {
      photoPreview.textContent = 'Aucune photo';
      photoPreview.style.backgroundImage = '';
    }
  }

  const descEl      = document.getElementById('pDesc');
  const charCountEl = document.querySelector('#product-form-overlay .char-count');
  if (descEl && charCountEl) {
    descEl.addEventListener('input', function () {
      charCountEl.textContent = this.value.length + '/140';
    });
  }

  const tagInput = document.querySelector('#product-form-overlay .tag-input');
  const tagsList = document.querySelector('#product-form-overlay .tags-list');

  if (tagInput) {
    tagInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        addTag(this.value);
        this.value = '';
      }
    });
  }

  function addTag(text) {
    text = text.trim();
    if (!text) return;
    if (currentTags.indexOf(text) !== -1) return;
    currentTags.push(text);
    renderTags();
  }

  function renderTags() {
    if (!tagsList) return;
    tagsList.innerHTML = currentTags.map((t, i) =>
      '<span class="tag">' + escapeHtml(t) +
      '<button type="button" data-remove-tag="' + i + '" aria-label="Retirer">×</button></span>'
    ).join('');
  }

  if (tagsList) {
    tagsList.addEventListener('click', function (e) {
      const btn = e.target.closest('[data-remove-tag]');
      if (!btn) return;
      currentTags.splice(parseInt(btn.dataset.removeTag, 10), 1);
      renderTags();
    });
  }

  $$('#product-form-overlay .radio-pill').forEach((btn) => {
    btn.addEventListener('click', () => {
      $$('#product-form-overlay .radio-pill').forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedCat = btn.textContent.trim();
    });
  });

  $$('#product-form-overlay .status-pill').forEach((btn) => {
    btn.addEventListener('click', () => {
      $$('#product-form-overlay .status-pill').forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedStatus = btn.textContent.trim().toLowerCase() === 'disponible'
        ? 'available' : 'soldout';
    });
  });

  function saveProduct() {
    const nameEl  = document.getElementById('pName');
    const priceEl = document.getElementById('pPrice');
    if (!nameEl || !priceEl) return;

    const name  = nameEl.value.trim();
    const price = parseInt(priceEl.value, 10);

    if (!name || !price || price <= 0) {
      alert('Veuillez renseigner un nom et un prix valide.');
      return;
    }
    showToast('✓ Produit enregistré !');
    closeProductOverlay();
  }

  /* ============================================================
     9. COMMANDES
     ============================================================ */
  $$('.order-status-select').forEach((select) => {
    select.addEventListener('change', function () {
      const dot = this.closest('.order-item').querySelector('.order-dot');
      if (dot) {
        dot.className = 'order-dot status-' + this.value;
      }
      showToast('Statut mis à jour');
    });
  });

  $$('.btn-copy-confirm').forEach((btn) => {
    btn.addEventListener('click', function () {
      const message = `Bonjour, votre commande chez ${SHOP.name} est bien confirmée ! Livraison prévue. Merci !`;
      const done = () => showToast('Message copié !');
      
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(message).then(done).catch(() => {
          fallbackCopy(message, done);
        });
      } else {
        fallbackCopy(message, done);
      }
    });
  });

  function fallbackCopy(text, callback) {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'absolute';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      callback();
    } catch (e) {
      alert('Erreur lors de la copie');
    }
  }

  /* ============================================================
     10. LÉA (Coach)
     ============================================================ */
  const leaCategories = document.getElementById('lea-categories');
  const leaContent = document.getElementById('lea-content');

  function showLeaCategories() {
    if (leaCategories && leaContent) {
      leaCategories.style.display = 'flex';
      leaContent.style.display = 'none';
      leaContent.innerHTML = '';
    }
  }

  function getAdviceGroup() {
    if (SHOP.type === 'import_chine' || SHOP.type === 'electromenager') {
      return 'import';
    }
    return 'local';
  }

  function openLeaCategory(catKey) {
    const group = getAdviceGroup();
    const data = leaData[catKey];
    
    if (!data || !data[group] || !leaCategories || !leaContent) return;

    leaCategories.style.display = 'none';
    leaContent.style.display = 'block';

    leaContent.innerHTML = `
      <button type="button" class="lea-back-btn" id="leaBackBtn">← Retour aux catégories</button>
      ${data[group]}
    `;

    const backBtn = document.getElementById('leaBackBtn');
    if (backBtn) {
      backBtn.addEventListener('click', showLeaCategories);
    }
    
    window.scrollTo(0, 0);
  }

  $$('.lea-category-card').forEach((card) => {
    card.addEventListener('click', () => {
      openLeaCategory(card.dataset.cat);
    });
  });

  /* ============================================================
     11. RÉGLAGES — boutons de simulation
     ============================================================ */
  $$('#view-reglages .btn-secondary, #view-reglages .btn-danger').forEach((btn) => {
    btn.addEventListener('click', simulate);
  });

  /* ============================================================
     12. RACCOURCI CLAVIER
     ============================================================ */
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    
    const overlay = document.getElementById('product-form-overlay');
    if (overlay && overlay.classList.contains('open')) {
      closeProductOverlay();
      return;
    }
    
    if (catalogOverlay && catalogOverlay.classList.contains('open')) {
      catalogOverlay.classList.remove('open');
      document.body.style.overflow = '';
    }
  });

  /* ============================================================
     13. INIT
     ============================================================ */
  function init() {
    const nav = document.querySelector('.bottom-nav');
    if (nav) nav.style.display = 'none';

    const banner = $('.demo-banner');
    if (banner) banner.textContent = 'Démo Shopina — Onboarding';
  }

  init();
})();
