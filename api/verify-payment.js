// api/verify-payment.js
// Fonction Serverless Vercel pour vérifier le paiement en toute sécurité

export default async function handler(req, res) {
  // Autoriser les requêtes depuis ton site (CORS)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Récupérer la référence de la transaction envoyée par le site
  const { reference } = req.query;

  if (!reference) {
    return res.status(400).json({ success: false, error: "Référence manquante" });
  }

  // Tes identifiants secrets (invisibles pour les visiteurs)
  const idMarchand = 'PP-F92897';
  const apiPassword = '04781'; 

  try {
    // Appel à l'API de PaiementPro pour vérifier
    const url = `https://www.paiementpro.net/webservice/onlinepayment/check/${idMarchand}/${apiPassword}/${reference}`;
    
    const response = await fetch(url);
    const textResult = await response.text();

    // Si PaiementPro répond avec succès
    if (response.ok) {
        // On vérifie si la réponse contient un mot-clé de succès (à ajuster selon la vraie réponse de PaiementPro)
        // Pour l'instant, on considère que si le statut est OK et que ça ne dit pas "error", c'est bon.
        const isSuccess = !textResult.toLowerCase().includes('error') && !textResult.toLowerCase().includes('failed');
        
        if (isSuccess) {
            return res.status(200).json({ success: true, message: "Paiement validé" });
        }
    }
    
    return res.status(400).json({ success: false, error: "Paiement non reconnu", details: textResult });

  } catch (error) {
    return res.status(500).json({ success: false, error: "Erreur serveur", details: error.message });
  }
}
