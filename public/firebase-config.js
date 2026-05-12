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

// ==== CLOUDINARY CONFIG ====
// Remplace par tes vraies valeurs après création du compte
const CLOUDINARY_CLOUD_NAME = 'duxhbgs3d';
const CLOUDINARY_UPLOAD_PRESET = 'alertbukavu_unsigned';

// Upload image vers Cloudinary
async function uploadImage(file, folder = 'alertbukavu') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', folder);

    const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: 'POST', body: formData }
    );
    if (!response.ok) throw new Error('Erreur upload image');
    const data = await response.json();
    return data.secure_url;
}

// ==== DONNÉES ====
const QUARTIERS = [
    "Kadutu","Ibanda","Bagira","Nyalukemba",
    "Kasha","Panzi","Ciherano","Essence","Nyawera","Kasali","Autre"
];

const CATEGORIES = {
    securite: { label:"Sécurité",  icon:"shield",           color:"#FF3D71", bg:"#FFF0F5" },
    eau:      { label:"Eau",       icon:"water_drop",       color:"#840015", bg:"#ffdad8" },
    routes:   { label:"Routes",    icon:"traffic",          color:"#FF9F43", bg:"#FFF5EC" },
    sante:    { label:"Santé",     icon:"medical_services", color:"#00C48C", bg:"#E6FAF5" },
    meteo:    { label:"Météo",     icon:"thunderstorm",     color:"#761f24", bg:"#ffdad8" },
    autre:    { label:"Autre",     icon:"more_horiz",       color:"#5b403e", bg:"#f0eded" }
};

const URGENCES = {
    faible:   { label:"FAIBLE",   color:"#00C48C", bg:"#E6FAF5", border:"#00C48C" },
    moyen:    { label:"MOYEN",    color:"#FF9F43", bg:"#FFF5EC", border:"#FF9F43" },
    critique: { label:"CRITIQUE", color:"#FF3D71", bg:"#FFF0F5", border:"#FF3D71" }
};

// ==== VALIDATION ====
function validerTelephoneRDC(tel) {
    // Nettoyer le numéro
    const clean = tel.replace(/[\s\-\(\)]/g, '');
    // Formats valides RDC: +243XXXXXXXXX ou 0XXXXXXXXX ou 243XXXXXXXXX
    const regex = /^(\+243|243|0)(8[1-9]|9[0-9])\d{7}$/;
    return regex.test(clean);
}

function normaliserTelephone(tel) {
    const clean = tel.replace(/[\s\-\(\)]/g, '');
    if (clean.startsWith('+243')) return clean;
    if (clean.startsWith('243')) return '+' + clean;
    if (clean.startsWith('0')) return '+243' + clean.substring(1);
    return '+243' + clean;
}

async function usernameDisponible(username) {
    const snap = await db.collection('users').where('username', '==', username.toLowerCase()).get();
    return snap.empty;
}

function validerUsername(username) {
    // 3-20 caractères, lettres/chiffres/underscore uniquement
    return /^[a-zA-Z0-9_]{3,20}$/.test(username);
}

// ==== AUTH ====
function requireAuth() {
    return new Promise(resolve => {
        auth.onAuthStateChanged(async user => {
            if (!user) { window.location.href = 'login.html'; return; }
            // Vérifier si compte bloqué
            try {
                const doc = await db.collection('users').doc(user.uid).get();
                if (doc.exists && doc.data().estBloque) {
                    await auth.signOut();
                    window.location.href = 'login.html?bloque=1';
                    return;
                }
            } catch(e) {}
            resolve(user);
        });
    });
}

function redirectIfAuth() {
    auth.onAuthStateChanged(user => {
        if (user) window.location.href = 'index.html';
    });
}

// ==== UTILITAIRES ====
function tempsRelatif(ts) {
    const diff = Date.now() - ts;
    const min = Math.floor(diff / 60000);
    if (min < 1) return "à l'instant";
    if (min < 60) return `il y a ${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24) return `il y a ${h}h`;
    return `il y a ${Math.floor(h/24)}j`;
}

function escHtml(str) {
    if (!str) return '';
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function genererAvatar(nom, taille = 40) {
    const initiales = nom
        ? nom.trim().split(' ').map(p => p[0] || '').join('').substring(0, 2).toUpperCase()
        : 'U';
    const couleurs = ['#840015','#761f24','#b00020','#5d5f5f','#906f6d'];
    const couleur = couleurs[nom ? nom.charCodeAt(0) % couleurs.length : 0];
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${taille}" height="${taille}" viewBox="0 0 ${taille} ${taille}">
        <circle cx="${taille/2}" cy="${taille/2}" r="${taille/2}" fill="${couleur}"/>
        <text x="${taille/2}" y="${taille/2 + taille*0.14}" text-anchor="middle" fill="white"
            font-family="Inter,sans-serif" font-weight="800" font-size="${taille*0.38}">${initiales}</text>
    </svg>`;
    return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
}

function getPhotoUrl(userData, taille = 40) {
    if (userData && userData.photoUrl) return userData.photoUrl;
    return genererAvatar(userData?.nom || userData?.username || 'U', taille);
}

// ==== SWEETALERT2 CONFIG ====
const Toast = Swal.mixin({
    toast: true,
    position: 'bottom',
    showConfirmButton: false,
    timer: 3500,
    timerProgressBar: true,
    customClass: { popup: 'swal-toast-custom' }
});

function showToast(msg, type = 'success') {
    const icons = { success:'success', error:'error', info:'info', warning:'warning' };
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
