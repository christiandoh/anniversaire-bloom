## Anniversaires Bloom ATC

Application React + Google Apps Script pour collecter les anniversaires des Bloomers ATC, stocker les données dans Google Sheets & Drive, et envoyer des notifications automatiques Telegram et WhatsApp la veille des anniversaires à 22h30.

---

### 1. Installation locale

**Prérequis**

- Node.js + npm (version récente LTS)
- Un compte Google avec accès Google Sheets / Drive / Apps Script

**Installation**

```bash
cd google_forme
npm install
npm run dev
```

L’application sera accessible sur `http://localhost:5173` (par défaut).

---

### 2. Structure principale du projet

- `src/main.jsx` : point d’entrée React, charge Bootstrap + thème glassmorphism.
- `src/App.jsx` : routeur simple vers `Home`.
- `src/pages/Home.jsx` : page principale (Header, GlassCard, BirthdayForm, Footer).
- `src/components/GlassCard.jsx` : carte glassmorphism réutilisable.
- `src/components/Header.jsx` : en-tête avec logo/titre.
- `src/components/Footer.jsx` : pied de page.
- `src/components/BirthdayForm.jsx` : formulaire de collecte (nom, jour, mois, photo, WhatsApp).
- `src/services/api.js` : appel à l’endpoint Google Apps Script.
- `src/styles/theme.css` : design system + glassmorphism.
- `apps-script/birthdays.gs` : script Google Apps Script (API + automatisation).

---

### 3. Configuration Google Sheets & Drive

1. **Créer le Google Sheet**
   - Crée une nouvelle feuille de calcul Google Sheets.
   - Renomme l’onglet principal en `Anniversaires`.
   - Assure-toi que la première ligne contient exactement :
     - `DateAjout | Nom | Jour | Mois | PhotoURL | TelegramChatId | WhatsAppNumber`
   - Tu peux ajouter un second onglet `Logs` (facultatif, il sera créé automatiquement si nécessaire).

2. **Créer le script Google Apps Script**
   - Dans Google Sheets : `Extensions` → `Apps Script`.
   - Remplace le contenu du projet par le code de `apps-script/birthdays.gs`.
   - Enregistre.

3. **Lien avec Google Drive**
   - Au premier enregistrement d’une photo, le script crée automatiquement un dossier `Anniversaires Bloom ATC - Photos` si `DRIVE_FOLDER_ID` n’est pas encore défini.
   - Ce dossier est mis en partage “Toute personne disposant du lien peut afficher” pour permettre l’envoi des images dans Telegram / WhatsApp.
   - Tu peux également créer ce dossier toi-même et mettre son ID dans les Propriétés du script (voir section suivante).

---

### 4. Configuration des Propriétés du script (tokens & IDs)

Dans l’éditeur Apps Script :

- Menu `Fichier` → `Propriétés du projet` → onglet `Propriétés du script`.
- Ajoute les clés suivantes selon tes besoins :

- `API_KEY` : clé privée utilisée par le front (champ `apiKey`).
- `DRIVE_FOLDER_ID` : (optionnel) ID du dossier Drive de stockage photos.
- `TELEGRAM_BOT_TOKEN` : token du bot Telegram.
- `WHATSAPP_TOKEN` : token API WhatsApp Cloud (Meta).
- `WHATSAPP_PHONE_ID` : ID du numéro WhatsApp Cloud.
- `WHATSAPP_API_BASE_URL` : ex. `https://graph.facebook.com/v19.0`.

Le script lit ces valeurs via `PropertiesService.getScriptProperties()`.

---

### 5. Déploiement de l’API Google Apps Script (Web App)

1. Dans l’éditeur Apps Script :
   - Clique sur `Déployer` → `Déployer en tant qu’application Web`.
2. Paramètres :
   - **Version** : crée une nouvelle version.
   - **Exécuter en tant que** : `Moi`.
   - **Qui a accès** : `Toute personne disposant du lien` (ou plus restrictif si tu as une stratégie d’authentification différente).
3. Valide le déploiement.
4. Récupère l’URL de l’application Web (ce sera ton `GAS_ENDPOINT_URL`).

---

### 6. Configuration du frontend (variables d’environnement)

Dans la racine du projet React, crée un fichier `.env.local` (non commité) avec :

```bash
VITE_GAS_ENDPOINT_URL="URL_DE_TON_WEB_APP_APPS_SCRIPT"
VITE_GAS_API_KEY="TA_CLE_API_OPTIONNELLE"
```

- `VITE_GAS_ENDPOINT_URL` : l’URL copiée au déploiement de l’application Web Apps Script.
- `VITE_GAS_API_KEY` : la même valeur que `API_KEY` dans les Propriétés du script (si utilisée).

Le service `src/services/api.js` utilise ces variables via `import.meta.env`.

---

### 7. Configuration Telegram

1. **Créer un bot**
   - Ouvre Telegram, parle avec `@BotFather`.
   - Commande : `/newbot` puis suis les instructions.
   - Récupère le **token** du bot et colle-le dans `TELEGRAM_BOT_TOKEN` (Propriétés du script).

2. **Récupérer un `chatId` de test**
   - Parle avec ton bot depuis ton compte Telegram.
   - Tu peux écrire un petit script Apps Script ou utiliser une API externe pour récupérer les mises à jour (`getUpdates`) et lire le `chat.id`, ou configurer manuellement ce champ dans la feuille `Anniversaires`.
   - Dans la colonne `TelegramChatId`, mets le `chatId` pour les personnes à qui tu veux envoyer les notifications.

3. **Message et format**
   - Le message d’anniversaire est construit dans la fonction `buildBirthdayMessage` de `birthdays.gs`.
   - Modifie le texte, la citation, le style à ton goût (ton spirituel/festif).

---

### 8. Configuration WhatsApp (Cloud API Meta)

1. **Meta Developer**
   - Va sur la plateforme développeur Meta (WhatsApp Cloud API).
   - Crée une application / un numéro de test.
   - Récupère :
     - Un **token permanent** ou de longue durée.
     - Un **Phone Number ID**.
     - L’URL de base de l’API, par ex. `https://graph.facebook.com/v19.0`.

2. **Configurer les propriétés du script**
   - `WHATSAPP_TOKEN` = ton token.
   - `WHATSAPP_PHONE_ID` = ton Phone Number ID.
   - `WHATSAPP_API_BASE_URL` = par ex. `https://graph.facebook.com/v19.0`.

3. **Numéros des destinataires**
   - Dans la colonne `WhatsAppNumber` du Google Sheet, mets les numéros au format international (ex : `+2250700000000`).

4. **Format du message**
   - La fonction `sendWhatsAppMessage` envoie :
     - une image (si `PhotoURL` est renseigné) + une légende `message`, ou
     - un texte seul si pas d’image.

---

### 9. Automatisation à 22h30 (triggers Apps Script)

Dans l’éditeur Apps Script, exécute une fois la fonction `createDailyTrigger()` :

- Cela supprime d’anciens triggers liés à `checkBirthdaysAndNotify`.
- Et crée un trigger horaire qui appelle `checkBirthdaysAndNotify` tous les jours à 22h (heure locale du script), soit 22h00.  
  Tu peux ajuster cette heure au besoin (dans `createDailyTrigger`).

La fonction :

- Calcule la date de demain.
- Parcourt la feuille `Anniversaires`.
- Pour chaque ligne dont `Jour`/`Mois` correspondent à demain :
  - Construit un message personnalisé.
  - Envoie Telegram (si `TelegramChatId` + token définis).
  - Envoie WhatsApp (si `WhatsAppNumber` + config définies).
  - Enregistre les logs dans l’onglet `Logs`.

---

### 10. Déploiement GitHub Pages

**Build**

```bash
npm run build
```

Le build statique est généré dans le dossier `dist/`.

**Déploiement GitHub Pages (simplifié)**

- Crée un dépôt GitHub.
- Pousse le code.
- Utilise soit :
  - la branche `gh-pages` avec la lib `gh-pages`, ou
  - GitHub Actions (workflow de déploiement).

Configuration typique avec GitHub Pages :

- Dans `vite.config.js`, ajuste la propriété `base` si ton projet est servi sous un sous-chemin (ex : `/anniversaires-bloom-atc/`).
- Dans GitHub, `Settings` → `Pages` → choisis la branche contenant le build.

---

### 11. Personnalisation des messages & du thème

- **Messages d’anniversaire**
  - Modifie la fonction `buildBirthdayMessage` dans `apps-script/birthdays.gs`.
  - Ajoute des variables supplémentaires si besoin (`{{JOUR}}`, `{{MOIS}}`, etc.).

- **Thème & design**
  - Toutes les couleurs et styles principaux sont centralisés dans `src/styles/theme.css`.
  - Palette actuelle :
    - Jaune : `#FFD700`
    - Or : `#D4AF37`
    - Bleu nuit : `#0B1C2D`
  - Effet glassmorphism :
    - `backdrop-filter: blur(20px);`
    - `background: rgba(255, 255, 255, 0.15);`
    - `border: 1px solid rgba(255, 255, 255, 0.25);`

---

### 12. Préparation pour Flutter & Email (extensions futures)

- **API pensée pour être réutilisée**
  - Le front communique avec Apps Script via un endpoint HTTP classique.
  - Une future app Flutter pourra consommer la même API (`doPost`) pour enregistrer les anniversaires.

- **Extension Email (TODO)**
  - Tu peux ajouter une fonction `sendEmailNotification` dans `birthdays.gs` utilisant `GmailApp` ou `MailApp`.
  - Ajoute un champ `Email` dans la feuille, puis appelle cette fonction dans `checkBirthdaysAndNotify`.

---

### 13. Choix techniques (Vite vs CRA)

- Vite a été choisi plutôt que CRA pour :
  - une expérience de développement plus rapide (HMR ultra-rapide),
  - un build plus léger et optimisé,
  - une configuration plus simple pour un projet moderne.
- CRA reste possible, mais nécessiterait plus de configuration manuelle pour atteindre un niveau similaire de performance.

