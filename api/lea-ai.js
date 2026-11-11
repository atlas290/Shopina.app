// api/lea-ai.js
// Fonction Serverless Vercel pour discuter avec Groq en toute sécurité

export default async function handler(req, res) {
  // Autoriser les requêtes depuis ton site (CORS)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message manquant" });
  }

  // ⚠️ C'EST ICI QUE TU METTRAS TA CLÉ GROQ
  const GROQ_API_KEY = process.env.GROQ_API_KEY; 

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama3-8b-8192", // Modèle rapide et gratuit
        messages: [
          { 
            role: "system", 
            content: "Tu es Léa, une coach e-commerce bienveillante pour Shopina. Tu aides les vendeuses au Bénin à vendre sur WhatsApp et TikTok. Tes conseils sont courts, directs, et adaptés au contexte africain (Mobile Money, FCFA, livraison locale)." 
          },
          { 
            role: "user", 
            content: message 
          }
        ],
        temperature: 0.7,
        max_tokens: 250
      })
    });

    const data = await response.json();

    if (data.choices && data.choices.length > 0) {
      return res.status(200).json({ reply: data.choices[0].message.content });
    } else {
      return res.status(500).json({ error: "L'IA n'a pas renvoyé de réponse." });
    }

  } catch (error) {
    console.error("Erreur Groq:", error);
    return res.status(500).json({ error: "Erreur de connexion à l'IA." });
  }
}