# AlertBukavu

## Installation

```bash
npm install
npm start
```

## Variables d'environnement

Ces variables sont a ajouter dans Vercel, dans :

```text
Project > Settings > Environment Variables
```

### Email SMTP

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=email@gmail.com
SMTP_PASS=mot-de-passe-application
MAIL_FROM="AlertBukavu <email@gmail.com>"
```

### Firebase Admin

```bash
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

En local, tu peux aussi utiliser un fichier JSON telecharge depuis Firebase :

```bash
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
```

Le serveur charge automatiquement un fichier `.env` a la racine du projet en local. Tu peux copier `.env.example` vers `.env`, puis remplacer les valeurs d'exemple.

### Emails des autorites

Les alertes sont envoyees aux habitants du quartier concerne et aussi aux autorites configurees ici.

Liste generale, envoyee pour toutes les alertes :

```bash
AUTHORITY_EMAILS=autorite1@example.com,autorite2@example.com
```

Listes specialisees par categorie :

```bash
AUTHORITY_EMAILS_SECURITE=police@example.com
AUTHORITY_EMAILS_EAU=regideso@example.com
AUTHORITY_EMAILS_ROUTES=voirie@example.com
AUTHORITY_EMAILS_SANTE=sante@example.com
AUTHORITY_EMAILS_METEO=meteo@example.com
AUTHORITY_EMAILS_AUTRE=administration@example.com
```

Liste speciale pour les alertes critiques :

```bash
AUTHORITY_EMAILS_CRITIQUE=urgence@example.com
```

Tu peux mettre plusieurs emails dans une meme variable en les separant par des virgules.

## Redploiement Vercel

Apres avoir ajoute ou modifie une variable d'environnement dans Vercel, il faut redeployer le projet.

```text
Deployments > trois points du dernier deployement > Redeploy
```
