// Point d'entrée HTTP de votre script Google Apps Script
// À personnaliser dans le README / configuration
const GAS_ENDPOINT_URL = import.meta.env.VITE_GAS_ENDPOINT_URL

// Clé d'API minimale pour sécuriser l'accès (définie côté Apps Script)
const GAS_API_KEY = import.meta.env.VITE_GAS_API_KEY

/**
 * Envoie les données d'anniversaire vers Google Apps Script.
 * Utilise FormData pour permettre l'upload de la photo (multipart/form-data).
 */
export async function submitBirthday({ fullName, day, month, whatsapp, photo }) {
  if (!GAS_ENDPOINT_URL) {
    throw new Error(
      'VITE_GAS_ENDPOINT_URL est manquant. Configurez-le dans le fichier .env.local.',
    )
  }

  const formData = new FormData()
  formData.append('fullName', fullName)
  formData.append('day', day)
  formData.append('month', month)
  if (whatsapp) {
    formData.append('whatsapp', whatsapp)
  }
  if (photo) {
    formData.append('photo', photo)
  }

  if (GAS_API_KEY) {
    formData.append('apiKey', GAS_API_KEY)
  }

  const response = await fetch(GAS_ENDPOINT_URL, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error(`Erreur serveur (${response.status})`)
  }

  const data = await response.json().catch(() => null)

  if (!data || data.status !== 'success') {
    throw new Error(data?.message || 'Réponse inattendue du serveur')
  }

  return data
}

