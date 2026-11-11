/* ============================================================
   Shopina — lea.js (Gestion de l'interface de chat)
   ============================================================ */

(function () {
  'use strict';

  const chatInput = document.getElementById('lea-chat-input');
  const chatSend = document.getElementById('lea-chat-send');
  const chatMessages = document.getElementById('lea-chat-messages');

  // Si on n'est pas sur la page avec le chat, on arrête tout
  if (!chatInput || !chatSend || !chatMessages) return;

  // Fonction pour ajouter un message dans le chat
  function ajouterMessage(texte, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'lea-message lea-message--' + type;
    messageDiv.textContent = texte;
    chatMessages.appendChild(messageDiv);
    // Scroll automatique vers le bas
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // Fonction appelée quand on clique sur Envoyer
  function envoyerMessage() {
    const texte = chatInput.value.trim();
    if (!texte) return; // Si c'est vide, on ne fait rien

    // 1. Afficher le message de la vendeuse
    ajouterMessage(texte, 'user');
    chatInput.value = ''; // Vider le champ

    // 2. Afficher un message d'attente
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'lea-message lea-message--bot';
    loadingDiv.textContent = 'Léa réfléchit...';
    loadingDiv.id = 'lea-loading-msg';
    chatMessages.appendChild(loadingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // 3. Appeler l'API sécurisée Vercel
    fetch('/api/lea-ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: texte })
    })
    .then(response => response.json())
    .then(data => {
      // Supprimer le message d'attente
      const loading = document.getElementById('lea-loading-msg');
      if (loading) loading.remove();

      if (data.reply) {
        ajouterMessage(data.reply, 'bot');
      } else {
        ajouterMessage("Oups, j'ai eu un petit souci. Réessaie dans un instant !", 'bot');
      }
    })
    .catch(error => {
      console.error("Erreur:", error);
      const loading = document.getElementById('lea-loading-msg');
      if (loading) loading.remove();
      ajouterMessage("Je n'arrive pas à me connecter. Vérifie ta connexion internet.", 'bot');
    });
  }
  // Événements
  chatSend.addEventListener('click', envoyerMessage);
  
  chatInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      envoyerMessage();
    }
  });

})();
