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

  // ⚠️ TON EMAIL ADMIN
  const ADMIN_EMAIL = "atlasstudio216@gmail.com";

  const $ = (sel) => document.querySelector(sel);

  // Petite fonction pour nettoyer le texte (évite les failles XSS)
  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  // Connexion
  $('#btnLoginAdmin').addEventListener('click', async () => {
    const email = $('#adminEmail').value.trim();
    const password = $('#adminPassword').value.trim();
    if (!email || !password) return alert("Remplissez les champs.");
    
    try {
      await auth.signInWithEmailAndPassword(email, password);
    } catch (error) {
      alert("Erreur : " + error.message);
    }
  });

  // Déconnexion
  $('#btnLogoutAdmin').addEventListener('click', () => {
    auth.signOut();
  });

  // Écouteur d'état (Sécurité)
  auth.onAuthStateChanged((user) => {
    if (user) {
      if (user.email !== ADMIN_EMAIL) {
        alert("Accès refusé. Vous n'êtes pas l'administrateur.");
        auth.signOut();
        return;
      }
      // C'est bien l'admin
      $('#login-section').classList.add('hidden');
      $('#dashboard-section').classList.remove('hidden');
      
      // On charge les statistiques globales ET la liste
      loadStats();
      loadVendors();
      
    } else {
      // Pas connecté
      $('#login-section').classList.remove('hidden');
      $('#dashboard-section').classList.add('hidden');
    }
  });

  // ============================================================
  // NOUVELLE FONCTION : Charger les statistiques globales
  // ============================================================
  async function loadStats() {
    try {
      // On lance les 3 requêtes en parallèle pour aller plus vite
      const [vendeursSnap, produitsSnap, commandesSnap] = await Promise.all([
        db.collection('vendeurs').get(),
        db.collection('produits').get(),
        db.collection('commandes').get()
      ]);

      $('#stat-vendors').textContent = vendeursSnap.size;
      $('#stat-products').textContent = produitsSnap.size;
      $('#stat-orders').textContent = commandesSnap.size;

    } catch (error) {
      console.error("Erreur stats:", error);
    }
  }

  // ============================================================
  // CHARGER LA LISTE DES VENDEUSES
  // ============================================================
  async function loadVendors() {
    const listEl = $('#vendors-list');
    listEl.innerHTML = '<div style="text-align:center; padding:20px;">Chargement des données...</div>';

    try {
      const snapshot = await db.collection('vendeurs').get();
      
      listEl.innerHTML = '';

      if (snapshot.empty) {
        listEl.innerHTML = '<div style="text-align:center; padding:20px;">Aucune vendeuse pour le moment.</div>';
        return;
      }

      snapshot.forEach(doc => {
        const v = doc.data();
        
        const nomSafe = escapeHtml(v.nom_boutique || 'Sans nom');
        const emailSafe = escapeHtml(v.email || 'Pas d\'email');
        const numSafe = escapeHtml(v.numero_whatsapp || 'Pas de numéro');
        const slugSafe = escapeHtml(v.slug || '—');

        // On prépare le lien vers la boutique
        const shopUrl = `client.html?shop=${slugSafe}`;

        // --- CALCUL DU STATUT ---
        let isExpired = false;
        if (v.date_fin_abonnement) {
          const dateFin = v.date_fin_abonnement.toDate();
          if (dateFin < new Date()) {
            isExpired = true;
          }
        }
        
        const badgeClass = isExpired ? 'badge-expired' : 'badge-active';
        const badgeText = isExpired ? 'Expiré' : 'Actif';

        listEl.innerHTML += `
          <div class="vendor-card">
            <div class="vendor-header">
              <div>
                <div class="vendor-name">${nomSafe}</div>
                <div class="vendor-info">${emailSafe} · ${numSafe}</div>
                <div class="vendor-info" style="font-size: 11px; margin-top: 4px;">Slug : shopina.shop/${slugSafe}</div>
              </div>
              <div class="vendor-badge ${badgeClass}">${badgeText}</div>
            </div>
            
            <div">
 class="vendor-actions              <a href="${shopUrl}" target="_blank" class="btn-action btn-action-view">Voir vitrine</a>
              <button onclick="voirProduits('${doc.id}')" class="btn-action btn-action-view">Voir produits</button>
              <button onclick="prolongerAbonnement('${doc.id}')" class="btn-action btn-action-renew">Prolonger +30j</button>
            </div>
          </div>
        `;
      });

    } catch (error) {
      console.error(error);
      listEl.innerHTML = '<div style="color: red; padding:20px;">Erreur de chargement des données.</div>';
    }
  }

  // ============================================================
  // VOIR LES PRODUITS D'UNE VENDEUSE
  // ============================================================
  window.voirProduits = async function(vendeurId) {
    try {
      const snapshot = await db.collection('produits').where('vendeur_id', '==', vendeurId).get();
      if (snapshot.empty) {
        alert("Cette vendeuse n'a pas encore ajouté de produits.");
        return;
      }
      
      let message = "Produits en ligne :\n\n";
      snapshot.forEach(doc => {
        const p = doc.data();
        message += `• ${p.nom} - ${p.prix} FCFA (${p.statut})\n`;
      });
      
      alert(message);
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la récupération des produits.");
    }
  };

  // ============================================================
  // NOUVELLE FONCTION : Prolonger l'abonnement manuellement
  // ============================================================
  window.prolongerAbonnement = async function(vendeurId) {
    const confirmation = confirm("Voulez-vous ajouter 30 jours d'abonnement à cette vendeuse ?");
    if (!confirmation) return;

    try {
      const docRef = db.collection('vendeurs').doc(vendeurId);
      const doc = await docRef.get();
      
      if (!doc.exists) return alert("Vendeuse introuvable.");

      const data = doc.data();
      let baseDate = new Date(); // Date de base : aujourd'hui

      // Si elle a déjà un abonnement en cours (dans le futur), on ajoute 30 jours à cette date future
      if (data.date_fin_abonnement) {
        const currentFin = data.date_fin_abonnement.toDate();
        if (currentFin > baseDate) {
          baseDate = currentFin;
        }
      }

      // On ajoute 30 jours
      baseDate.setDate(baseDate.getDate() + 30);

      // Mise à jour dans Firebase
      await docRef.update({
        date_fin_abonnement: firebase.firestore.Timestamp.fromDate(baseDate)
      });

      alert("✅ Abonnement prolongé de 30 jours avec succès !");
      
      // On recharge la liste pour voir le badge passer au vert
      loadVendors();

    } catch (error) {
      console.error(error);
      alert("Erreur lors de la prolongation : " + error.message);
    }
  };

})();
