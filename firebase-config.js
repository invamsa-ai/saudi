// firebase-config.js - الإصدار المصحح
// تأكد من أن جميع Firebase SDKs تم تحميلها أولاً

const firebaseConfig = {
  apiKey: "AIzaSyAk27c6KL77QbnXa_bNeWzUsBph5o7I9A8",
  authDomain: "uaewep-ce954.firebaseapp.com",
  databaseURL: "https://uaewep-ce954-default-rtdb.firebaseio.com",
  projectId: "uaewep-ce954",
  storageBucket: "uaewep-ce954.firebasestorage.app",
  messagingSenderId: "679277016812",
  appId: "1:679277016812:web:ab78a6d55b4a153b8a97c9",
  measurementId: "G-NE9HXPPM9P"
};

// متغيرات Firebase
let firebaseApp, db, realtimeDb, auth;

// دالة تهيئة Firebase
function initializeFirebase() {
  try {
    console.log("🔥 محاولة تهيئة Firebase...");
    
    if (typeof firebase === 'undefined') {
      console.error("❌ Firebase SDK غير محمل");
      return false;
    }
    
    // التحقق مما إذا تم تهيئة Firebase مسبقاً
    if (!firebase.apps.length) {
      firebaseApp = firebase.initializeApp(firebaseConfig);
      console.log("✅ Firebase تم تهيئته بنجاح");
    } else {
      firebaseApp = firebase.app();
      console.log("✅ Firebase متهيئ بالفعل");
    }
    
    // تهيئة الخدمات مع التحقق من وجودها
    if (typeof firebase.firestore === 'function') {
      db = firebase.firestore();
      console.log("✅ Firestore جاهز");
    } else {
      console.warn("⚠️ Firestore غير متاح");
    }
    
    if (typeof firebase.database === 'function') {
      realtimeDb = firebase.database();
      console.log("✅ Realtime Database جاهز");
    } else {
      console.warn("⚠️ Realtime Database غير متاح");
    }
    
    if (typeof firebase.auth === 'function') {
      auth = firebase.auth();
      console.log("✅ Authentication جاهز");
    } else {
      console.warn("⚠️ Authentication غير متاح - تأكد من تحميل firebase-auth-compat.js");
    }
    
    return true;
    
  } catch (error) {
    console.error("❌ خطأ في تهيئة Firebase:", error);
    return false;
  }
}

// دالة للتحقق من الاتصال
async function checkFirebaseConnection() {
  try {
    console.log("🔍 التحقق من اتصال Firebase...");
    
    // محاولة التهيئة أولاً
    if (!db && !initializeFirebase()) {
      return { 
        connected: false, 
        error: "فشل تهيئة Firebase",
        details: "تأكد من تحميل جميع SDKs"
      };
    }
    
    if (!db) {
      return { 
        connected: false, 
        error: "Firestore غير متاح",
        details: "تأكد من تحميل firebase-firestore-compat.js"
      };
    }
    
    // اختبار اتصال Firestore
    console.log("📝 جاري اختبار الكتابة إلى Firestore...");
    const testRef = db.collection('connection_tests');
    await testRef.add({
      test: 'connection_test',
      timestamp: new Date().toISOString(),
      browser: navigator.userAgent.substring(0, 50)
    });
    
    console.log("✅ اختبار Firestore ناجح");
    
    // اختبار Realtime Database إذا كان متاحاً
    if (realtimeDb) {
      console.log("📡 جاري اختبار Realtime Database...");
      await realtimeDb.ref('connection_tests/' + Date.now()).set({
        test: 'realtime_test',
        timestamp: new Date().toISOString()
      });
      console.log("✅ اختبار Realtime Database ناجح");
    }
    
    return { 
      connected: true, 
      message: "Firebase متصل ويعمل",
      projectId: firebaseConfig.projectId,
      services: {
        firestore: !!db,
        realtime: !!realtimeDb,
        auth: !!auth
      }
    };
    
  } catch (error) {
    console.error("❌ فشل اختبار الاتصال:", error);
    return { 
      connected: false, 
      error: error.message,
      projectId: firebaseConfig.projectId,
      suggestion: "تحقق من قواعد الأمان (يجب أن تكون if true)"
    };
  }
}

// تصدير المتغيرات العالمية
window.firebaseApp = firebaseApp;
window.firebaseDb = db;
window.firebaseRealtimeDb = realtimeDb;
window.firebaseAuth = auth;
window.firebaseConfig = firebaseConfig;
window.initializeFirebase = initializeFirebase;
window.checkFirebaseConnection = checkFirebaseConnection;

console.log("🔥 firebase-config.js تم تحميله بنجاح");

// تهيئة Firebase تلقائياً بعد تأخير قصير
setTimeout(() => {
  if (typeof firebase !== 'undefined') {
    initializeFirebase();
  } else {
    console.warn("⚠️ Firebase SDK غير محمل بعد. تأكد من ترتيب تحميل السكريبتات.");
  }
}, 500);
