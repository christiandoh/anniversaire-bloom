/**
 * ===============================
 *  CONFIGURATION & CONSTANTES
 * ===============================
 *
 * À personnaliser selon votre environnement.
 */

// Nom de la feuille principale
const SHEET_NAME = 'Anniversaires'

// Optionnel : feuille de logs
const LOG_SHEET_NAME = 'Logs'

// ID du dossier Google Drive où seront stockées les photos
// (créez un dossier dans Drive, puis copiez son ID dans les Propriétés du script ou ici)
const DRIVE_FOLDER_ID = PropertiesService.getScriptProperties().getProperty(
  'DRIVE_FOLDER_ID',
)

// Clé API minimale pour sécuriser les appels depuis le front
const API_KEY = PropertiesService.getScriptProperties().getProperty('API_KEY')

// Token du bot Telegram (à stocker dans les Propriétés)
const TELEGRAM_BOT_TOKEN = PropertiesService.getScriptProperties().getProperty(
  'TELEGRAM_BOT_TOKEN',
)

// Configuration WhatsApp Cloud API (Meta) – à stocker dans les Propriétés du script
const WHATSAPP_TOKEN = PropertiesService.getScriptProperties().getProperty(
  'WHATSAPP_TOKEN',
)
const WHATSAPP_PHONE_ID = PropertiesService.getScriptProperties().getProperty(
  'WHATSAPP_PHONE_ID',
)
// Par exemple : 'https://graph.facebook.com/v19.0'
const WHATSAPP_API_BASE_URL =
  PropertiesService.getScriptProperties().getProperty('WHATSAPP_API_BASE_URL') ||
  'https://graph.facebook.com/v19.0'

/**
 * ===============================
 *  API HTTP : RÉCEPTION FORMULAIRE
 * ===============================
 *
 * Le front envoie un POST multipart/form-data avec :
 * - fullName
 * - day
 * - month
 * - whatsapp (optionnel)
 * - photo (fichier)
 * - apiKey (optionnel, recommandé)
 */

/**
 * Point d'entrée HTTP pour le front React.
 * Déployer ce script en Web App (voir README) et utiliser l'URL retournée.
 *
 * @param {GoogleAppsScript.Events.DoPost} e
 * @returns {GoogleAppsScript.Content.TextOutput}
 */
function doPost(e) {
  try {
    if (!e) {
      return jsonResponse(
        {
          status: 'error',
          message: 'Requête invalide',
        },
        400,
      )
    }

    const params = e.parameter || {}

    // Vérification de la clé API minimale
    const apiKey = params.apiKey
    if (API_KEY && apiKey !== API_KEY) {
      return jsonResponse(
        {
          status: 'error',
          message: 'Clé API invalide',
        },
        403,
      )
    }

    const fullName = (params.fullName || '').trim()
    const day = Number(params.day || 0)
    const month = Number(params.month || 0)
    const whatsapp = (params.whatsapp || '').trim()

    if (!fullName || !day || day < 1 || day > 31 || !month || month < 1 || month > 12) {
      return jsonResponse(
        {
          status: 'error',
          message: 'Champs obligatoires manquants ou invalides.',
        },
        400,
      )
    }

    // Récupération du fichier photo via e.files
    let photoUrl = ''
    if (e.files && e.files.photo) {
      const file = e.files.photo
      const folder = getOrCreateFolder(DRIVE_FOLDER_ID)
      const blob = Utilities.newBlob(file.contents, file.mimeType, file.fileName)
      const createdFile = folder.createFile(blob)
      createdFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW)
      photoUrl = createdFile.getUrl()
    }

    const sheet = getOrCreateSheet(SHEET_NAME)
    const now = new Date()

    // Structure : DateAjout | Nom | Jour | Mois | PhotoURL | TelegramChatId | WhatsAppNumber
    sheet.appendRow([
      now,
      fullName,
      day,
      month,
      photoUrl,
      '', // TelegramChatId (réservé pour le futur)
      whatsapp,
    ])

    logEvent('NEW_ENTRY', `Nouvel anniversaire enregistré pour ${fullName}`)

    return jsonResponse({
      status: 'success',
      message: 'Anniversaire enregistré avec succès.',
    })
  } catch (error) {
    logEvent('ERROR', `doPost: ${error}`)
    return jsonResponse(
      {
        status: 'error',
        message: 'Erreur interne lors du traitement de la demande.',
      },
      500,
    )
  }
}

/**
 * ===============================
 *  AUTOMATISATION ANNIVERSAIRES
 * ===============================
 *
 * Créez un trigger horaire pour exécuter `checkBirthdaysAndNotify`
 * tous les jours à 22h30 (heure de votre fuseau).
 */

/**
 * Fonction principale appelée par un trigger horaire.
 * - Lit la feuille Anniversaires
 * - Cherche les anniversaires de demain
 * - Envoie des notifications Telegram et/ou WhatsApp
 */
function checkBirthdaysAndNotify() {
  const sheet = getOrCreateSheet(SHEET_NAME)
  const data = sheet.getDataRange().getValues()

  if (data.length <= 1) {
    // seulement l'en-tête
    return
  }

  const today = new Date()
  const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
  const tomorrowDay = tomorrow.getDate()
  const tomorrowMonth = tomorrow.getMonth() + 1

  const header = data[0]
  const idxNom = header.indexOf('Nom')
  const idxJour = header.indexOf('Jour')
  const idxMois = header.indexOf('Mois')
  const idxPhotoUrl = header.indexOf('PhotoURL')
  const idxTelegramChatId = header.indexOf('TelegramChatId')
  const idxWhatsApp = header.indexOf('WhatsAppNumber')

  for (let i = 1; i < data.length; i++) {
    const row = data[i]
    const nom = row[idxNom]
    const jour = Number(row[idxJour])
    const mois = Number(row[idxMois])
    const photoUrl = row[idxPhotoUrl]
    const telegramChatId = row[idxTelegramChatId]
    const whatsappNumber = row[idxWhatsApp]

    if (jour === tomorrowDay && mois === tomorrowMonth) {
      const message = buildBirthdayMessage(nom, jour, mois)

      if (telegramChatId && TELEGRAM_BOT_TOKEN) {
        try {
          sendTelegramPhoto(telegramChatId, photoUrl, message)
          logEvent('TELEGRAM_SENT', `Message Telegram envoyé à ${nom}`)
        } catch (error) {
          logEvent('TELEGRAM_ERROR', `Erreur Telegram pour ${nom}: ${error}`)
        }
      }

      if (whatsappNumber && WHATSAPP_TOKEN && WHATSAPP_PHONE_ID) {
        try {
          sendWhatsAppMessage(whatsappNumber, message, photoUrl)
          logEvent('WHATSAPP_SENT', `Message WhatsApp envoyé à ${nom}`)
        } catch (error) {
          logEvent('WHATSAPP_ERROR', `Erreur WhatsApp pour ${nom}: ${error}`)
        }
      }
    }
  }
}

/**
 * Construit un message d'anniversaire chaleureux et spirituel.
 * Personnalisez ici le ton et le contenu.
 */
function buildBirthdayMessage(nom, jour, mois) {
  const base =
    "Shalom {{NOM}} 🌸\n\nAujourd'hui, la famille Bloom ATC célèbre la grâce de Dieu sur ta vie. " +
    "Que cette nouvelle année soit marquée par la faveur, la paix et une croissance spirituelle profonde.\n\n" +
    '“Car je connais les projets que j’ai formés sur vous, dit l’Éternel, projets de paix et non de malheur, ' +
    'afin de vous donner un avenir et de l’espérance.” (Jérémie 29:11)\n\n' +
    'Avec amour, honneur et joie,\nLa communauté Bloom ATC ✨'

  return base.replace('{{NOM}}', nom)
}

/**
 * ===============================
 *  ENVOI TELEGRAM
 * ===============================
 */

/**
 * Envoie une photo avec légende via Telegram Bot API.
 */
function sendTelegramPhoto(chatId, photoUrl, caption) {
  if (!TELEGRAM_BOT_TOKEN) {
    throw new Error('TELEGRAM_BOT_TOKEN non configuré')
  }

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`

  const payload = {
    chat_id: chatId,
    photo: photoUrl,
    caption: caption,
    parse_mode: 'Markdown',
  }

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  }

  const response = UrlFetchApp.fetch(url, options)
  const code = response.getResponseCode()
  if (code < 200 || code >= 300) {
    throw new Error('Erreur Telegram: ' + response.getContentText())
  }
}

/**
 * ===============================
 *  ENVOI WHATSAPP (Cloud API Meta)
 * ===============================
 *
 * Implémentation simple avec le endpoint /messages.
 * Voir la doc officielle Meta pour adapter selon vos besoins.
 */

function sendWhatsAppMessage(phoneNumber, message, imageUrl) {
  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) {
    throw new Error('Configuration WhatsApp manquante')
  }

  const url = `${WHATSAPP_API_BASE_URL}/${WHATSAPP_PHONE_ID}/messages`

  const payload = {
    messaging_product: 'whatsapp',
    to: phoneNumber,
    type: imageUrl ? 'image' : 'text',
  }

  if (imageUrl) {
    payload.image = {
      link: imageUrl,
      caption: message,
    }
  } else {
    payload.text = {
      preview_url: false,
      body: message,
    }
  }

  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      Authorization: 'Bearer ' + WHATSAPP_TOKEN,
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  }

  const response = UrlFetchApp.fetch(url, options)
  const code = response.getResponseCode()
  if (code < 200 || code >= 300) {
    throw new Error('Erreur WhatsApp: ' + response.getContentText())
  }
}

/**
 * ===============================
 *  HELPERS UTILITAIRES
 * ===============================
 */

function jsonResponse(obj, statusCode) {
  const output = ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  )
  if (statusCode) {
    // ContentService ne permet pas de changer le code HTTP,
    // mais pour certains environnements (Execution API) cela peut être pris en compte.
  }
  return output
}

function getOrCreateSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  let sheet = ss.getSheetByName(name)
  if (!sheet) {
    sheet = ss.insertSheet(name)
    sheet.appendRow([
      'DateAjout',
      'Nom',
      'Jour',
      'Mois',
      'PhotoURL',
      'TelegramChatId',
      'WhatsAppNumber',
    ])
  }
  return sheet
}

function getOrCreateFolder(folderId) {
  if (folderId) {
    try {
      return DriveApp.getFolderById(folderId)
    } catch (e) {
      // ignore et crée un nouveau dossier
    }
  }

  const folder = DriveApp.createFolder('Anniversaires Bloom ATC - Photos')
  folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW)
  PropertiesService.getScriptProperties().setProperty(
    'DRIVE_FOLDER_ID',
    folder.getId(),
  )
  return folder
}

function logEvent(type, message) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet()
    let sheet = ss.getSheetByName(LOG_SHEET_NAME)
    if (!sheet) {
      sheet = ss.insertSheet(LOG_SHEET_NAME)
      sheet.appendRow(['Horodatage', 'Type', 'Message'])
    }
    sheet.appendRow([new Date(), type, String(message)])
  } catch (e) {
    Logger.log('LOG_ERROR: ' + e)
  }
}

/**
 * ===============================
 *  INSTALLATION DES TRIGGERS
 * ===============================
 *
 * Exécutez manuellement `createDailyTrigger()` une fois
 * pour créer un trigger horaire à 22h30.
 */

function createDailyTrigger() {
  // Supprime d'abord les triggers existants pour éviter les doublons
  const triggers = ScriptApp.getProjectTriggers()
  triggers.forEach((t) => {
    if (t.getHandlerFunction() === 'checkBirthdaysAndNotify') {
      ScriptApp.deleteTrigger(t)
    }
  })

  ScriptApp.newTrigger('checkBirthdaysAndNotify')
    .timeBased()
    .everyDays(1)
    .atHour(22) // heure locale
    .create()
}

