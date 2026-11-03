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
      // C'est bien l'admin : on affiche le dashboard et on charge les données
      $('#login-section').classList.add('hidden');
      $('#dashboard-section').classList.remove('hidden');
      loadVendors();
    } else {
      // Pas connecté : on affiche le login
      $('#login-section').classList.remove('hidden');
      $('#dashboard-section').classList.add('hidden');
    }
  });

 // Charger la liste des vendeuses
  async function loadVendors() {
    const listEl = $('#vendors-list');
    listEl.innerHTML = '<div style="text-align:center; padding:20px;">Chargement des données...</div>';

    try {
      const snapshot = await db.collection('vendeurs').get();
      
      // Mise à jour du compteur
      $('#totalVendors').textContent = snapshot.size;
      listEl.innerHTML = '';

      if (snapshot.empty) {
        listEl.innerHTML = '<div style="text-align:center; padding:20px;">Aucune vendeuse pour le moment.</div>';
        return;
      }

      // Affichage de chaque vendeuse
      snapshot.forEach(doc => {
        const v = doc.data();
        
        const nomSafe = escapeHtml(v.nom_boutique || 'Sans nom');
        const emailSafe = escapeHtml(v.email || 'Pas d\'email');
        const numSafe = escapeHtml(v.numero_whatsapp || 'Pas de numéro');
        const slugSafe = escapeHtml(v.slug || '—');

        // On prépare le lien vers la boutique
        const shopUrl = `client.html?shop=${slugSafe}`;

        listEl.innerHTML += `
          <div class="vendor-card" style="flex-direction: column; align-items: flex-start; gap: 12px; padding: 16px; margin-bottom: 12px; background: var(--bg-card); border-radius: 8px; border: 1px solid var(--border-color);">
            <div style="width: 100%; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div class="vendor-name" style="font-weight: bold; font-size: 16px;">${nomSafe}</div>
                <div class="vendor-info" style="font-size: 13px; color: var(--text-muted); margin-top: 4px;">${emailSafe} · ${numSafe}</div>
                <div class="vendor-info" style="font-size: 11px; margin-top: 4px;">Slug : shopina.shop/${slugSafe}</div>
              </div>
              <div class="vendor-badge" style="background: var(--accent-soft); color: var(--accent); padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 700;">Vendeuse</div>
            </div>
            
            <!-- BOUTONS D'ACTION -->
            <div style="display: flex; gap: 8px; width: 100%; margin-top: 8px;">
              <a href="${shopUrl}" target="_blank" class="btn-secondary" style="flex: 1; text-decoration: none; padding: 8px; font-size: 13px; text-align: center; border-radius: 6px;">Voir la vitrine</a>
              <button onclick="voirProduits('${doc.id}')" class="btn-secondary" style="flex: 1; padding: 8px; font-size: 13px; cursor: pointer; border-radius: 6px;">Voir les produits</button>
            </div>
          </div>
        `;
      });

    } catch (error) {
      console.error(error);
      listEl.innerHTML = '<div style="color: red; padding:20px;">Erreur de chargement des données.</div>';
    }
  }

  // NOUVELLE FONCTION : Voir les produits d'une vendeuse
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
  
})();
