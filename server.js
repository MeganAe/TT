const express = require('express');
const cors = require('cors');
const path = require('path');
const nodemailer = require('nodemailer');
const admin = require('firebase-admin');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

function initFirebaseAdmin() {
  if (admin.apps.length) return;

  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON))
    });
    return;
  }

  admin.initializeApp({
    credential: admin.credential.applicationDefault()
  });
}

function getMailTransporter() {
  const required = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'MAIL_FROM'];
  const missing = required.filter(key => !process.env[key]);
  if (missing.length) {
    throw new Error(`Configuration email manquante: ${missing.join(', ')}`);
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildAlertEmail(alert) {
  const title = escapeHtml(alert.titre);
  const quartier = escapeHtml(alert.quartier);
  const urgence = escapeHtml(alert.niveauUrgence);
  const categorie = escapeHtml(alert.categorie);
  const description = escapeHtml(alert.description);
  const auteur = escapeHtml(alert.userNom || 'Un habitant');

  return `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#1c1b1b">
      <h2 style="color:#840015;margin-bottom:8px">Nouvelle alerte AlertBukavu</h2>
      <p><strong>${title}</strong></p>
      <p>
        <strong>Quartier:</strong> ${quartier}<br>
        <strong>Urgence:</strong> ${urgence}<br>
        <strong>Categorie:</strong> ${categorie}<br>
        <strong>Publiee par:</strong> ${auteur}
      </p>
      <p>${description}</p>
      <p style="font-size:12px;color:#5b403e">
        Message automatique envoye aux habitants inscrits dans le quartier concerne.
      </p>
    </div>
  `;
}

app.post('/api/notify-alert', async (req, res) => {
  const alert = req.body || {};
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!alert.titre || !alert.description || !alert.quartier) {
    return res.status(400).json({ error: 'titre, description et quartier sont requis' });
  }

  try {
    initFirebaseAdmin();

    if (!token) {
      return res.status(401).json({ error: 'Authentification requise' });
    }

    await admin.auth().verifyIdToken(token);

    const snapshot = await admin.firestore()
      .collection('users')
      .where('quartier', '==', alert.quartier)
      .where('estBloque', '==', false)
      .get();

    const emails = [...new Set(snapshot.docs
      .map(doc => doc.data().email)
      .filter(Boolean))];

    if (!emails.length) {
      return res.json({ sent: 0, message: 'Aucun email trouve pour ce quartier' });
    }

    const transporter = getMailTransporter();

    await transporter.sendMail({
      from: process.env.MAIL_FROM,
      bcc: emails,
      subject: `[AlertBukavu] ${alert.titre}`,
      html: buildAlertEmail(alert)
    });

    res.json({ sent: emails.length });
  } catch (error) {
    console.error('Erreur notification email:', error);
    res.status(500).json({ error: 'Impossible d envoyer les emails' });
  }
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`AlertBukavu server running on http://localhost:${PORT}`);
});
