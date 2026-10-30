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

  // ⚠️ METS TON EMAIL ICI POUR SÉCURISER L'ACCÈS
  const ADMIN_EMAIL = "atlasstudio216@gmail.com";

  const $ = (sel) => document.querySelector(sel);

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
      loadVendors();
    } else {
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
      
      $('#totalVendors').textContent = snapshot.size;
      listEl.innerHTML = '';

      if (snapshot.empty) {
        listEl.innerHTML = '<div style="text-align:center; padding:20px;">Aucune vendeuse pour le moment.</div>';
        return;
      }

      snapshot.forEach(doc => {
        const v = doc.data();
        listEl.innerHTML += `
          <div class="vendor-card">
            <div>
              <div class="vendor-name">${v.nom_boutique || 'Sans nom'}</div>
              <div class="vendor-info">${v.email} · ${v.numero_whatsapp || 'Pas de numéro'}</div>
              <div class="vendor-info" style="font-size: 11px; margin-top: 4px;">Slug : shopina.shop/${v.slug}</div>
            </div>
            <div class="vendor-badge">Vendeuse</div>
          </div>
        `;
      });

    } catch (error) {
      console.error(error);
      listEl.innerHTML = '<div style="color: red; padding:20px;">Erreur de chargement.</div>';
    }
  }

})();