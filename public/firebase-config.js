const firebaseConfig = {
    apiKey: "AIzaSyBKbLuFjnPi6EyVMI6IqHO1gUKfJcTSdr8",
    authDomain: "alertbukavu-c38bb.firebaseapp.com",
    databaseURL: "https://alertbukavu-c38bb-default-rtdb.firebaseio.com",
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
    securite: { label:"Sécurité", icon:"shield",            color:"#FF3D71", bg:"#FFF0F5" },
    eau:      { label:"Eau",      icon:"water_drop",        color:"#183ce6", bg:"#E8EBFF" },
    routes:   { label:"Routes",  icon:"traffic",            color:"#FF9F43", bg:"#FFF5EC" },
    sante:    { label:"Santé",   icon:"medical_services",   color:"#00C48C", bg:"#E6FAF5" },
    meteo:    { label:"Météo",   icon:"thunderstorm",       color:"#8B5CF6", bg:"#F3EEFF"  },
    autre:    { label:"Autre",   icon:"more_horiz",         color:"#6B7280", bg:"#F3F4F6"  }
};

const URGENCES = {
    faible:   { label:"FAIBLE",   border:"#00C48C", badgeBg:"#E6FAF5", badgeColor:"#00C48C" },
    moyen:    { label:"MOYEN",    border:"#FF9F43", badgeBg:"#FFF5EC", badgeColor:"#FF9F43" },
    critique: { label:"CRITIQUE", border:"#FF3D71", badgeBg:"#FFF0F5", badgeColor:"#FF3D71" }
};

function tempsRelatif(timestamp) {
    const diff = Date.now() - timestamp;
    const min = Math.floor(diff / 60000);
    if (min < 1) return "à l'instant";
    if (min < 60) return `il y a ${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24) return `il y a ${h}h`;
    return `il y a ${Math.floor(h/24)}j`;
}

function requireAuth() {
    return new Promise(resolve => {
        auth.onAuthStateChanged(user => {
            if (!user) window.location.href = "login.html";
            else resolve(user);
        });
    });
}

function redirectIfAuth() {
    auth.onAuthStateChanged(user => {
        if (user) window.location.href = "index.html";
    });
}

function showToast(msg, type="success") {
    const t = document.createElement("div");
    const bg = type==="error"?"#FF3D71":type==="info"?"#183ce6":"#00C48C";
    t.style.cssText = `position:fixed;bottom:90px;left:50%;transform:translateX(-50%);
        background:${bg};color:white;padding:12px 24px;border-radius:12px;
        font-weight:600;font-size:14px;z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,0.15);
        transition:opacity .3s;white-space:nowrap;`;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(()=>{ t.style.opacity="0"; setTimeout(()=>t.remove(),300); }, 3000);
}
