const firebaseConfig = {
    apiKey: "AIzaSyBKbLuFjnPi6EyVMI6IqHO1gUKfJcTSdr8",
    authDomain: "alertbukavu-c38bb.firebaseapp.com",
    projectId: "alertbukavu-c38bb",
    storageBucket: "alertbukavu-c38bb.firebasestorage.app",
    messagingSenderId: "984257572001",
    appId: "1:984257572001:android:6f1f668d5151be5cd494e0"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Les proprietaires/admins principaux sont definis ici directement dans le code.
// Remplace les valeurs vides par les UID Firebase Auth des 5 comptes proprietaires.
const ADMIN_UIDS = [
    'xofFgfRyh8QdhMp8fUYNfKrFv843',
    '',
    '',
    '',
    ''
].filter(Boolean);
const MAX_ADMINS = 5;

async function userEstAdmin(user) {
    if (!user) return false;
    if (ADMIN_UIDS.includes(user.uid)) return true;
    return false;
}

async function afficherMenuAdmin(active = false, user = auth.currentUser) {
    const nav = document.querySelector('.bottom-nav');
    if (!nav || !user || document.getElementById('adminNavItem')) return;
    const isAdmin = await userEstAdmin(user);
    if (!isAdmin) return;

    const link = document.createElement('a');
    link.href = 'admin.html';
    link.id = 'adminNavItem';
    link.className = active ? 'nav-item active' : 'nav-item';
    link.innerHTML = `<span class="material-symbols-outlined ${active ? '' : 'ms-o'}" style="font-size:22px;font-variation-settings:'FILL' ${active ? 1 : 0},'wght' 400,'GRAD' 0,'opsz' 24;">admin_panel_settings</span><span>Moderation</span>`;
    nav.appendChild(link);
}

const CLOUDINARY_CLOUD_NAME = 'duxhbgs3d';
const CLOUDINARY_UPLOAD_PRESET = 'alertbukavu_unsigned';

async function uploadImage(file, folder = 'alertbukavu') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', folder);

    const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: 'POST', body: formData }
    );
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data?.error?.message || 'Erreur upload image');
    }
    return data.secure_url;
}

const QUARTIERS = [
    "Kadutu", "Ibanda", "Bagira", "Nyalukemba",
    "Kasha", "Panzi", "Ciherano", "Essence", "Nyawera", "Kasali", "Autre"
];

const CATEGORIES = {
    securite: { label: "Sécurité", icon: "shield", color: "#FF3D71", bg: "#FFF0F5" },
    eau: { label: "Eau", icon: "water_drop", color: "#840015", bg: "#ffdad8" },
    routes: { label: "Routes", icon: "traffic", color: "#FF9F43", bg: "#FFF5EC" },
    sante: { label: "Santé", icon: "medical_services", color: "#00C48C", bg: "#E6FAF5" },
    meteo: { label: "Météo", icon: "thunderstorm", color: "#761f24", bg: "#ffdad8" },
    autre: { label: "Autre", icon: "more_horiz", color: "#5b403e", bg: "#f0eded" }
};

const URGENCES = {
    faible: { label: "FAIBLE", color: "#00C48C", bg: "#E6FAF5", border: "#00C48C" },
    moyen: { label: "MOYEN", color: "#FF9F43", bg: "#FFF5EC", border: "#FF9F43" },
    critique: { label: "CRITIQUE", color: "#FF3D71", bg: "#FFF0F5", border: "#FF3D71" }
};

function validerTelephoneRDC(tel) {
    const clean = tel.replace(/[\s\-\(\)]/g, '');
    return /^\+243[0-9]{9}$/.test(clean);
}

function normaliserTelephone(digits9) {
    const clean = String(digits9).replace(/\D/g, '');
    return '+243' + clean;
}

async function usernameDisponible(username) {
    const clean = username.toLowerCase();
    const [userSnap, usernameDoc] = await Promise.all([
        db.collection('users').where('username', '==', clean).limit(1).get(),
        db.collection('usernames').doc(clean).get()
    ]);
    return userSnap.empty && !usernameDoc.exists;
}

function validerUsername(username) {
    return /^[a-zA-Z0-9_]{3,20}$/.test(username);
}

function requireAuth() {
    return new Promise(resolve => {
        auth.onAuthStateChanged(async user => {
            if (!user) { window.location.href = 'login.html'; return; }
            try {
                const doc = await db.collection('users').doc(user.uid).get();
                if (doc.exists && doc.data().estBloque) {
                    await auth.signOut();
                    window.location.href = 'login.html?bloque=1';
                    return;
                }
            } catch (e) { }
            resolve(user);
        });
    });
}

function redirectIfAuth() {
    auth.onAuthStateChanged(user => {
        if (user) window.location.href = 'index.html';
    });
}

function tempsRelatif(ts) {
    const diff = Date.now() - ts;
    const min = Math.floor(diff / 60000);
    if (min < 1) return "à l'instant";
    if (min < 60) return `il y a ${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24) return `il y a ${h}h`;
    return `il y a ${Math.floor(h / 24)}j`;
}

function escHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function genererAvatar(nom, taille = 40) {
    const initiales = nom
        ? nom.trim().split(' ').map(p => p[0] || '').join('').substring(0, 2).toUpperCase()
        : 'U';
    const couleurs = ['#840015', '#761f24', '#b00020', '#5d5f5f', '#906f6d'];
    const couleur = couleurs[nom ? nom.charCodeAt(0) % couleurs.length : 0];
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${taille}" height="${taille}" viewBox="0 0 ${taille} ${taille}">
        <circle cx="${taille / 2}" cy="${taille / 2}" r="${taille / 2}" fill="${couleur}"/>
        <text x="${taille / 2}" y="${taille / 2 + taille * 0.14}" text-anchor="middle" fill="white"
            font-family="Inter,sans-serif" font-weight="800" font-size="${taille * 0.38}">${initiales}</text>
    </svg>`;
    return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
}

function getPhotoUrl(userData, taille = 40) {
    if (userData && userData.photoUrl) return userData.photoUrl;
    return genererAvatar(userData?.nom || userData?.username || 'U', taille);
}

const Toast = Swal.mixin({
    toast: true,
    position: 'bottom',
    showConfirmButton: false,
    timer: 3500,
    timerProgressBar: true,
    customClass: { popup: 'swal-toast-custom' }
});

function showToast(msg, type = 'success') {
    const icons = { success: 'success', error: 'error', info: 'info', warning: 'warning' };
    Toast.fire({ icon: icons[type] || 'success', title: msg });
}

function showConfirm(title, text, confirmText = 'Confirmer', icon = 'question') {
    return Swal.fire({
        title, text, icon,
        showCancelButton: true,
        confirmButtonColor: '#840015',
        cancelButtonColor: '#906f6d',
        confirmButtonText: confirmText,
        cancelButtonText: 'Annuler',
        borderRadius: '12px'
    });
}

function showAlert(title, text, icon = 'info') {
    return Swal.fire({
        title, text, icon,
        confirmButtonColor: '#840015',
        confirmButtonText: 'OK'
    });
}

function showBloqueAlert() {
    return Swal.fire({
        title: 'Compte suspendu',
        html: `Votre compte a été suspendu suite à la publication d'une fausse alerte.<br><br>
               <small style="color:#906f6d;">Contactez l'administration pour faire appel.</small>`,
        icon: 'error',
        confirmButtonColor: '#840015',
        confirmButtonText: 'Compris',
        allowOutsideClick: false
    });
}
