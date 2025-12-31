// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA1c9ft1XJrmjKIwhdxixJ1KM5Q3VL9HvQ",
  authDomain: "uaewep-38378.firebaseapp.com",
  projectId: "uaewep-38378",
  storageBucket: "uaewep-38378.firebasestorage.app",
  messagingSenderId: "366757774392",
  appId: "1:366757774392:web:32da696c806184709ed2cd",
  measurementId: "G-XNZC0GHCMM"
};

let firebaseApp;
let db;
let auth;
let storage;
let realtimeDb;

try {
    // التحقق من أن firebase متاح
    if (typeof firebase !== 'undefined') {
        firebaseApp = firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        auth = firebase.auth();
        storage = firebase.storage();
        realtimeDb = firebase.database();
        
        console.log('Firebase تم تهيئته بنجاح');
    } else {
        console.error('Firebase SDK غير محمل');
    }
} catch (error) {
    console.error('خطأ في تهيئة Firebase:', error);
}

// تصدير المكونات
window.firebaseConfig = {
    db,
    auth,
    storage,
    realtimeDb,
    firebase: firebaseApp
};
