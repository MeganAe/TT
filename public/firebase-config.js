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

const QUARTIERS = [
    "Kadutu","Ibanda","Bagira","Nyalukemba",
    "Kasha","Panzi","Ciherano","Essence","Nyawera","Kasali","Autre"
];

const CATEGORIES = {
    securite: { label:"Sécurité",  icon:"shield",            color:"#FF3D71", bg:"#FFF0F5" },
    eau:      { label:"Eau",       icon:"water_drop",        color:"#840015", bg:"#ffdad8" },
    routes:   { label:"Routes",    icon:"traffic",           color:"#FF9F43", bg:"#FFF5EC" },
    sante:    { label:"Santé",     icon:"medical_services",  color:"#00C48C", bg:"#E6FAF5" },
    meteo:    { label:"Météo",     icon:"thunderstorm",      color:"#761f24", bg:"#ffdad8" },
    autre:    { label:"Autre",     icon:"more_horiz",        color:"#5b403e", bg:"#f0eded" }
};

const URGENCES = {
    faible:   { label:"FAIBLE",   color:"#00C48C", bg:"#E6FAF5", border:"#00C48C" },
    moyen:    { label:"MOYEN",    color:"#FF9F43", bg:"#FFF5EC", border:"#FF9F43" },
    critique: { label:"CRITIQUE", color:"#FF3D71", bg:"#FFF0F5", border:"#FF3D71" }
};

function tempsRelatif(ts) {
    const diff = Date.now() - ts;
    const min = Math.floor(diff/60000);
    if (min < 1) return "à l'instant";
    if (min < 60) return `il y a ${min} min`;
    const h = Math.floor(min/60);
    if (h < 24) return `il y a ${h}h`;
    return `il y a ${Math.floor(h/24)}j`;
}

function requireAuth() {
    return new Promise(resolve => {
        auth.onAuthStateChanged(user => {
            if (!user) window.location.href = 'login.html';
            else resolve(user);
        });
    });
}

function redirectIfAuth() {
    auth.onAuthStateChanged(user => {
        if (user) window.location.href = 'index.html';
    });
}

function showToast(msg, type="success") {
    const colors = { success:"#840015", error:"#FF3D71", info:"#5d5f5f" };
    const t = document.createElement("div");
    t.style.cssText = `position:fixed;bottom:80px;left:50%;transform:translateX(-50%);
        background:${colors[type]||colors.success};color:white;padding:12px 24px;
        border-radius:8px;font-weight:700;font-size:14px;z-index:9999;
        box-shadow:0 4px 20px rgba(132,0,21,.3);white-space:nowrap;
        font-family:'Inter',sans-serif;transition:opacity .3s;`;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(()=>{ t.style.opacity="0"; setTimeout(()=>t.remove(),300); },3000);
}

function escHtml(str) {
    if (!str) return '';
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// Génère un avatar SVG data URI avec initiales
function genererAvatar(nom, taille=40) {
    const initiales = nom ? nom.trim().split(' ').map(p=>p[0]||'').join('').substring(0,2).toUpperCase() : 'U';
    const couleurs = ['#840015','#761f24','#b00020','#5d5f5f','#906f6d'];
    const couleur = couleurs[nom ? nom.charCodeAt(0) % couleurs.length : 0];
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${taille}" height="${taille}" viewBox="0 0 ${taille} ${taille}">
        <circle cx="${taille/2}" cy="${taille/2}" r="${taille/2}" fill="${couleur}"/>
        <text x="${taille/2}" y="${taille/2+taille*0.14}" text-anchor="middle" fill="white"
            font-family="Inter,sans-serif" font-weight="800" font-size="${taille*0.38}">${initiales}</text>
    </svg>`;
    return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
}
