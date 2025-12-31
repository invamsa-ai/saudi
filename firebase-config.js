// firebase-config.js - الإصدار المعدل للإصدار 9 المتوافق (compat)

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
    console.log("🔥 محاولة تهيئة Firebase مع الإصدار 9 المتوافق...");
    
    if (typeof firebase === 'undefined') {
      console.error("❌ Firebase SDK غير محمل");
      return false;
    }
    
    // التحقق مما إذا تم تهيئة Firebase مسبقاً
    if (!firebase.apps || firebase.apps.length === 0) {
      firebaseApp = firebase.initializeApp(firebaseConfig);
      console.log("✅ Firebase تم تهيئته بنجاح");
    } else {
      firebaseApp = firebase.app();
      console.log("✅ Firebase متهيئ بالفعل");
    }
    
    // استخدام التوافق مع الإصدار 8 (compat) - الواجهة القديمة
    if (firebase.firestore) {
      db = firebase.firestore();
      console.log("✅ Firestore جاهز");
    }
    
    if (firebase.database) {
      realtimeDb = firebase.database();
      console.log("✅ Realtime Database جاهز");
    }
    
    if (firebase.auth) {
      auth = firebase.auth();
      console.log("✅ Authentication جاهز");
    }
    
    return true;
    
  } catch (error) {
    console.error("❌ خطأ في تهيئة Firebase:", error);
    return false;
  }
}

// دالة للتحقق من الاتصال
async function checkFirebaseConnection() {
  console.log("🔍 بدء اختبار اتصال Firebase...");
  
  // تهيئة Firebase أولاً
  if (!initializeFirebase()) {
    return {
      connected: false,
      error: "فشل تهيئة Firebase",
      details: "تأكد من تحميل مكتبات Firebase"
    };
  }
  
  try {
    // اختبار بسيط: محاولة الحصول على timestamp من Firestore
    if (db) {
      console.log("📝 اختبار اتصال Firestore...");
      const testDocRef = db.collection('test_connection').doc('ping');
      await testDocRef.set({
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        test: true
      });
      console.log("✅ Firestore يعمل بنجاح");
      
      // قراءة البيانات للتحقق
      const doc = await testDocRef.get();
      console.log("✅ تمت قراءة البيانات:", doc.exists);
    }
    
    // اختبار Realtime Database إذا كان متاحاً
    if (realtimeDb) {
      console.log("📡 اختبار Realtime Database...");
      await realtimeDb.ref('test_connection').set({
        timestamp: Date.now(),
        test: true
      });
      console.log("✅ Realtime Database يعمل بنجاح");
    }
    
    return {
      connected: true,
      message: "✅ تم الاتصال بنجاح!",
      projectId: firebaseConfig.projectId,
      timestamp: new Date().toISOString(),
      services: {
        firestore: !!db,
        database: !!realtimeDb,
        auth: !!auth
      }
    };
    
  } catch (error) {
    console.error("❌ خطأ في اختبار الاتصال:", error);
    
    // تقديم نصائح استكشافية للأخطاء
    let suggestion = "تحقق من قواعد الأمان في Firebase Console";
    
    if (error.code === 'permission-denied') {
      suggestion = "قواعد الأمان تمنع الوصول. اضبط القواعد مؤقتًا على: allow read, write: if true;";
    } else if (error.code === 'not-found') {
      suggestion = "المشروع غير موجود أو غير نشط. تحقق من Firebase Console";
    }
    
    return {
      connected: false,
      error: error.message,
      code: error.code,
      projectId: firebaseConfig.projectId,
      suggestion: suggestion
    };
  }
}

// تصدير الوظائف للاستخدام العالمي
window.firebaseConfig = firebaseConfig;
window.initializeFirebase = initializeFirebase;
window.checkFirebaseConnection = checkFirebaseConnection;

console.log("✅ firebase-config.js محمل وجاهز");
console.log("🔧 إصدار Firebase:", firebase.SDK_VERSION);

// تهيئة تلقائية
setTimeout(() => {
  if (typeof firebase !== 'undefined') {
    initializeFirebase();
  }
}, 1000);
