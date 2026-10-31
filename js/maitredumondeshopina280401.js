// On attend que la page HTML soit complètement chargée
window.onload = function () {
  alert("1. Le fichier admin.js est bien chargé !");

  if (typeof firebase === 'undefined') {
    alert("ERREUR : Firebase n'est pas chargé dans le HTML. Vérifie les balises <script> dans ton fichier HTML.");
    return;
  }

  const firebaseConfig = {
    apiKey: "AIzaSyCuge89Ct4HX-r4wUnaCqb3qdToL9H-3O0",
    authDomain: "shopina-6172d.firebaseapp.com",
    projectId: "shopina-6172d",
    storageBucket: "shopina-6172d.firebasestorage.app",
    messagingSenderId: "1068229855736",
    appId: "1:1068229855736:web:7583e82691e8a0eeb72e0d"
  };

  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    const auth = firebase.auth();

    // On cherche le bouton
    const btn = document.getElementById('btnLoginAdmin');
    if (!btn) {
      alert("ERREUR : Impossible de trouver le bouton 'Se connecter'. Vérifie que l'ID 'btnLoginAdmin' existe bien dans le HTML.");
      return;
    }

    // On active le bouton
    btn.addEventListener('click', async function() {
      alert("2. Le clic sur le bouton fonctionne ! Je contacte Firebase...");
      
      const email = document.getElementById('adminEmail').value.trim();
      const password = document.getElementById('adminPassword').value.trim();
      
      if (!email || !password) {
        alert("3. ERREUR : Tu n'as pas rempli l'email ou le mot de passe.");
        return;
      }

      try {
        await auth.signInWithEmailAndPassword(email, password);
        alert("4. SUCCÈS : Tu es connecté !");
        // Une fois connecté, on cache le login et on affiche le dashboard
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('dashboard-section').style.display = 'block';
        document.getElementById('dashboard-section').classList.remove('hidden');
      } catch (error) {
        alert("3. ERREUR FIREBASE : " + error.message);
      }
    });

    auth.onAuthStateChanged(function(user) {
      if (user) {
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('dashboard-section').classList.remove('hidden');
      } else {
        document.getElementById('login-section').style.display = 'block';
        document.getElementById('dashboard-section').classList.add('hidden');
      }
    });

  } catch (error) {
    alert("ERREUR GRAVE JS : " + error.message);
  }
};
