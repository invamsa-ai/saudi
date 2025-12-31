// firebase-config.js - الإصدار النهائي المتكامل
// الإصدار: v16 (محدث)
// تاريخ التحديث: 2025

// ========== إعدادات Firebase ==========
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

// ========== متغيرات النظام ==========
let firebaseAppInstance = null;
let firestoreDbService = null;
let realtimeDbService = null;
let authService = null;
let isFirebaseInitialized = false;

// ========== خدمات Firebase ==========
const firebaseServices = {
    
    // تهيئة Firebase
    initialize: function() {
        try {
            console.log("🔥 جاري تهيئة Firebase...");
            
            if (typeof firebase === 'undefined') {
                console.error("❌ Firebase SDK غير محمل");
                throw new Error("Firebase SDK غير محمل. تأكد من تحميل مكتبات Firebase أولاً.");
            }
            
            // التحقق من التهيئة السابقة
            if (firebase.apps && firebase.apps.length > 0) {
                firebaseAppInstance = firebase.apps[0];
                console.log("✅ Firebase متهيئ بالفعل");
            } else {
                firebaseAppInstance = firebase.initializeApp(firebaseConfig);
                console.log("✅ Firebase تم تهيئته بنجاح");
            }
            
            // تهيئة الخدمات
            this.initializeServices();
            
            isFirebaseInitialized = true;
            return true;
            
        } catch (error) {
            console.error("❌ خطأ في تهيئة Firebase:", error);
            isFirebaseInitialized = false;
            return false;
        }
    },
    
    // تهيئة الخدمات
    initializeServices: function() {
        try {
            // Firestore Database
            if (firebase.firestore && !firestoreDbService) {
                firestoreDbService = firebase.firestore();
                
                // إعدادات Firestore (فقط إذا لم يتم تهيئته مسبقاً)
                try {
                    if (firestoreDbService.settings) {
                        firestoreDbService.settings({
                            cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED,
                            merge: true
                        });
                    }
                } catch (settingsError) {
                    console.warn("⚠️ إعدادات Firestore متهيئة بالفعل:", settingsError.message);
                }
                
                console.log("✅ Firestore Database جاهز");
            }
            
            // Realtime Database
            if (firebase.database && !realtimeDbService) {
                realtimeDbService = firebase.database();
                console.log("✅ Realtime Database جاهز");
            }
            
            // Authentication
            if (firebase.auth && !authService) {
                authService = firebase.auth();
                console.log("✅ Authentication جاهز");
            }
            
        } catch (error) {
            console.error("❌ خطأ في تهيئة خدمات Firebase:", error);
        }
    },
    // دالة لحفظ رقم المصادقة لمستخدم محدد
saveAuthNumberForUser: async function(authNumber, recordId, idNumber = null, action = 'approve') {
    try {
        if (!realtimeDbService) {
            this.realtimeDb();
            if (!realtimeDbService) {
                throw new Error("Realtime Database غير متاح");
            }
        }
        
        const formattedNumber = authNumber < 10 ? '0' + authNumber : authNumber.toString();
        const authData = {
            number: authNumber,
            formattedNumber: formattedNumber,
            timestamp: Date.now(),
            date: new Date().toISOString(),
            source: 'admin_panel',
            idNumber: idNumber,
            recordId: recordId,
            action: action,
            status: 'active',
            userSpecific: true // علامة أن هذا الرقم خاص بمستخدم معين
        };
        
        // حفظ في Realtime Database في مسار خاص بالمستخدم
        const userAuthPath = `user_auth_numbers/${recordId}`;
        await realtimeDbService.ref(userAuthPath).set(authData);
        
        // أيضًا حفظ في المسار العام للتوافق مع الشاشات القديمة
        await realtimeDbService.ref('current_auth_number').set(authData);
        
        // أيضًا حفظ في Firestore للتسجيل
        if (firestoreDbService) {
            await firestoreDbService.collection('auth_logs').add({
                ...authData,
                logType: 'auth_number_update',
                adminAction: true,
                userSpecific: true
            });
        }
        
        console.log(`✅ تم حفظ رقم المصادقة ${formattedNumber} للمستخدم ${recordId}`);
        return {
            success: true,
            number: formattedNumber,
            data: authData,
            userPath: userAuthPath
        };
        
    } catch (error) {
        console.error("❌ خطأ في حفظ رقم المصادقة للمستخدم:", error);
        return {
            success: false,
            error: error.message
        };
    }
},

// دالة للاستماع لرقم مصادقة مستخدم محدد
listenForUserAuthUpdates: function(recordId, callback) {
    try {
        if (!realtimeDbService) {
            this.realtimeDb();
            if (!realtimeDbService) {
                throw new Error("Realtime Database غير متاح");
            }
        }
        
        const userAuthPath = `user_auth_numbers/${recordId}`;
        
        return realtimeDbService.ref(userAuthPath)
            .on('value', (snapshot) => {
                const data = snapshot.val();
                if (data && callback) {
                    callback(data);
                }
            }, (error) => {
                console.error("❌ خطأ في مستمع المستخدم:", error);
                if (callback) {
                    callback(null, error);
                }
            });
            
    } catch (error) {
        console.error("❌ خطأ في إعداد مستمع المستخدم:", error);
        return null;
    }
},

// دالة للتحقق من رقم مصادقة مستخدم محدد
checkUserAuthNumber: async function(recordId) {
    try {
        if (!realtimeDbService) {
            this.realtimeDb();
            if (!realtimeDbService) {
                throw new Error("Realtime Database غير متاح");
            }
        }
        
        const userAuthPath = `user_auth_numbers/${recordId}`;
        const snapshot = await realtimeDbService.ref(userAuthPath).once('value');
        const authData = snapshot.val();
        
        if (authData && authData.number !== undefined) {
            return {
                success: true,
                hasAuthNumber: true,
                authNumber: authData.number,
                formattedNumber: authData.formattedNumber,
                data: authData
            };
        }
        
        return {
            success: true,
            hasAuthNumber: false
        };
        
    } catch (error) {
        console.error("❌ خطأ في التحقق من رقم مصادقة المستخدم:", error);
        return {
            success: false,
            error: error.message
        };
    }
},
    
    // الحصول على Firestore
    firestore: function() {
        if (!firestoreDbService && firebase.firestore) {
            firestoreDbService = firebase.firestore();
        }
        return firestoreDbService;
    },
    
    // الحصول على Realtime Database
    realtimeDb: function() {
        if (!realtimeDbService && firebase.database) {
            realtimeDbService = firebase.database();
        }
        return realtimeDbService;
    },
    
    // الحصول على Authentication
    auth: function() {
        if (!authService && firebase.auth) {
            authService = firebase.auth();
        }
        return authService;
    },
    
    // التحقق من حالة الاتصال
    checkConnection: async function() {
        try {
            console.log("🔍 جاري اختبار اتصال Firebase...");
            
            if (!isFirebaseInitialized) {
                if (!this.initialize()) {
                    throw new Error("فشل تهيئة Firebase");
                }
            }
            
            const connectionResults = {
                firestore: false,
                realtimeDb: false,
                timestamp: new Date().toISOString(),
                projectId: firebaseConfig.projectId
            };
            
            // اختبار Firestore
            if (firestoreDbService) {
                try {
                    const testDocRef = firestoreDbService.collection('system_tests').doc('connection_test');
                    await testDocRef.set({
                        test: "connection_test",
                        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                        status: "active"
                    }, { merge: true });
                    
                    const doc = await testDocRef.get();
                    connectionResults.firestore = doc.exists;
                    console.log("✅ Firestore متصل");
                } catch (firestoreError) {
                    console.warn("⚠️ Firestore غير متصل:", firestoreError.message);
                }
            }
            
            // اختبار Realtime Database
            if (realtimeDbService) {
                try {
                    await realtimeDbService.ref('.info/connected').once('value', (snapshot) => {
                        connectionResults.realtimeDb = snapshot.val() === true;
                    });
                    console.log("✅ Realtime Database متصل");
                } catch (rtdbError) {
                    console.warn("⚠️ Realtime Database غير متصل:", rtdbError.message);
                }
            }
            
            return {
                connected: connectionResults.firestore || connectionResults.realtimeDb,
                details: connectionResults,
                message: "تم اختبار الاتصال بنجاح"
            };
            
        } catch (error) {
            console.error("❌ خطأ في اختبار الاتصال:", error);
            return {
                connected: false,
                error: error.message,
                code: error.code,
                suggestion: this.getErrorSuggestion(error)
            };
        }
    },
    
    // اقتراحات استكشاف الأخطاء
    getErrorSuggestion: function(error) {
        const suggestions = {
            'permission-denied': 'تحقق من قواعد الأمان في Firebase Console. قد تحتاج إلى تعديل القواعد.',
            'not-found': 'المشروع غير موجود. تحقق من إعدادات المشروع في Firebase Console.',
            'unavailable': 'الاتصال غير متوفر. تحقق من اتصال الإنترنت.',
            'already-exists': 'التطبيق متهيئ بالفعل.',
            'invalid-api-key': 'مفتاح API غير صالح. تحقق من إعدادات Firebase Config.',
            'network-request-failed': 'فشل طلب الشبكة. تحقق من اتصال الإنترنت.',
            'failed-precondition': 'قاعدة البيانات غير متاحة. تحقق من حالة قاعدة البيانات في Firebase Console.'
        };
        
        return suggestions[error.code] || 'حدث خطأ غير معروف. تحقق من وحدة تحكم المتصفح لمزيد من التفاصيل.';
    },
    
    // حفظ رقم المصادقة في Realtime Database
    saveAuthNumber: async function(authNumber, idNumber = null, action = 'approve') {
        try {
            if (!realtimeDbService) {
                this.realtimeDb();
                if (!realtimeDbService) {
                    throw new Error("Realtime Database غير متاح");
                }
            }
            
            const formattedNumber = authNumber < 10 ? '0' + authNumber : authNumber.toString();
            const authData = {
                number: authNumber,
                formattedNumber: formattedNumber,
                timestamp: Date.now(),
                date: new Date().toISOString(),
                source: 'admin_panel',
                idNumber: idNumber,
                action: action,
                status: 'active'
            };
            
            // حفظ في Realtime Database
            await realtimeDbService.ref('current_auth_number').set(authData);
            
            // أيضًا حفظ في Firestore للتسجيل
            if (firestoreDbService) {
                await firestoreDbService.collection('auth_logs').add({
                    ...authData,
                    logType: 'auth_number_update',
                    adminAction: true
                });
            }
            
            console.log(`✅ تم حفظ رقم المصادقة ${formattedNumber} بنجاح`);
            return {
                success: true,
                number: formattedNumber,
                data: authData
            };
            
        } catch (error) {
            console.error("❌ خطأ في حفظ رقم المصادقة:", error);
            return {
                success: false,
                error: error.message
            };
        }
    },
    
    // جلب بيانات ID Numbers من Firestore
    fetchIdNumbers: async function() {
        try {
            if (!firestoreDbService) {
                this.firestore();
                if (!firestoreDbService) {
                    throw new Error("Firestore غير متاح");
                }
            }
            
            const snapshot = await firestoreDbService.collection('id_numbers')
                .orderBy('created_at', 'desc')
                .limit(100)
                .get();
            
            const data = [];
            snapshot.forEach(doc => {
                data.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            console.log(`✅ تم جلب ${data.length} سجل بنجاح`);
            return {
                success: true,
                data: data,
                count: data.length
            };
            
        } catch (error) {
            console.error("❌ خطأ في جلب بيانات ID Numbers:", error);
            return {
                success: false,
                error: error.message,
                data: []
            };
        }
    },
    
    // تحديث حالة سجل معين
    updateRecordStatus: async function(recordId, newStatus, authNumber = null) {
        try {
            if (!firestoreDbService) {
                this.firestore();
                if (!firestoreDbService) {
                    throw new Error("Firestore غير متاح");
                }
            }
            
            const updateData = {
                status: newStatus,
                updated_at: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            if (authNumber !== null) {
                updateData.auth_number = authNumber;
                updateData.auth_timestamp = new Date().toISOString();
            }
            
            await firestoreDbService.collection('id_numbers')
                .doc(recordId)
                .update(updateData);
            
            console.log(`✅ تم تحديث السجل ${recordId} إلى حالة ${newStatus}`);
            return {
                success: true,
                recordId: recordId,
                status: newStatus
            };
            
        } catch (error) {
            console.error("❌ خطأ في تحديث حالة السجل:", error);
            return {
                success: false,
                error: error.message
            };
        }
    },
    
    // الاستماع للتحديثات الفورية على رقم المصادقة
    listenForAuthUpdates: function(callback) {
        try {
            if (!realtimeDbService) {
                this.realtimeDb();
                if (!realtimeDbService) {
                    throw new Error("Realtime Database غير متاح");
                }
            }
            
            return realtimeDbService.ref('current_auth_number')
                .on('value', (snapshot) => {
                    const data = snapshot.val();
                    if (data && callback) {
                        callback(data);
                    }
                }, (error) => {
                    console.error("❌ خطأ في مستمع Firebase:", error);
                    if (callback) {
                        callback(null, error);
                    }
                });
                
        } catch (error) {
            console.error("❌ خطأ في إعداد المستمع:", error);
            return null;
        }
    },
    
    // إيقاف الاستماع للتحديثات
    stopListening: function(listener) {
        try {
            if (realtimeDbService && listener) {
                realtimeDbService.ref('current_auth_number').off('value', listener);
                console.log("✅ تم إيقاف المستمع");
            }
        } catch (error) {
            console.error("❌ خطأ في إيقاف المستمع:", error);
        }
    },
    
    // تنظيف بيانات قديمة
    cleanupOldData: async function() {
        try {
            if (!firestoreDbService) {
                this.firestore();
                if (!firestoreDbService) {
                    return { success: false, error: "Firestore غير متاح" };
                }
            }
            
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            
            const oldRecords = await firestoreDbService.collection('id_numbers')
                .where('created_at', '<', oneWeekAgo)
                .where('status', 'in', ['completed', 'cancelled'])
                .get();
            
            const batch = firestoreDbService.batch();
            oldRecords.forEach(doc => {
                batch.delete(doc.ref);
            });
            
            await batch.commit();
            
            console.log(`✅ تم تنظيف ${oldRecords.size} سجل قديم`);
            return {
                success: true,
                cleanedCount: oldRecords.size
            };
            
        } catch (error) {
            console.error("❌ خطأ في تنظيف البيانات:", error);
            return {
                success: false,
                error: error.message
            };
        }
    },
    
    // تحقق من حالة سجل معين
    checkRecordStatus: async function(recordId) {
        try {
            if (!firestoreDbService) {
                this.firestore();
                if (!firestoreDbService) {
                    throw new Error("Firestore غير متاح");
                }
            }
            
            const doc = await firestoreDbService.collection('id_numbers').doc(recordId).get();
            
            if (!doc.exists) {
                return { success: false, error: "السجل غير موجود" };
            }
            
            const data = doc.data();
            return {
                success: true,
                exists: true,
                data: data,
                status: data.status,
                authNumber: data.auth_number,
                waiting: data.waiting
            };
            
        } catch (error) {
            console.error("❌ خطأ في التحقق من حالة السجل:", error);
            return {
                success: false,
                error: error.message
            };
        }
    },
    
    // دالة لإنشاء سجل جديد (بدون رقم مصادقة)
    createNewRecord: async function(idNumber, additionalData = {}) {
        try {
            if (!firestoreDbService) {
                this.firestore();
                if (!firestoreDbService) {
                    throw new Error("Firestore غير متاح");
                }
            }
            
            const recordData = {
                id_number: idNumber,
                idNumber: idNumber,
                status: 'pending',
                waiting: true,
                auth_number: null,
                created_at: firebase.firestore.FieldValue.serverTimestamp(),
                timestamp: new Date().toISOString(),
                source: 'apply_page',
                ...additionalData
            };
            
            const recordRef = await firestoreDbService.collection('id_numbers').add(recordData);
            
            console.log(`✅ تم إنشاء سجل جديد: ${recordRef.id}`);
            return {
                success: true,
                recordId: recordRef.id,
                data: recordData
            };
            
        } catch (error) {
            console.error("❌ خطأ في إنشاء سجل جديد:", error);
            return {
                success: false,
                error: error.message
            };
        }
    }
};

// ========== تصدير الكائن للاستخدام العالمي ==========
window.firebaseServices = firebaseServices;
window.firebaseConfig = firebaseConfig;

// ========== وظائف مساعدة ==========

// إنشاء إشعار (Toast)
function showToast(message, type = 'info') {
    try {
        let toastContainer = document.getElementById('toastContainer');
        
        // إنشاء حاوية إذا لم تكن موجودة
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container';
            toastContainer.id = 'toastContainer';
            document.body.appendChild(toastContainer);
        }
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icons = {
            'success': 'fa-check-circle',
            'error': 'fa-times-circle',
            'warning': 'fa-exclamation-triangle',
            'info': 'fa-info-circle'
        };
        
        toast.innerHTML = `
            <i class="fas ${icons[type] || 'fa-info-circle'}"></i>
            <span>${message}</span>
        `;
        
        toastContainer.appendChild(toast);
        
        // إزالة التنبيه بعد 3 ثوانٍ
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
        
    } catch (error) {
        console.error("❌ خطأ في عرض Toast:", error);
    }
}

// تحميل أنماط CSS للـ Toasts
function loadToastStyles() {
    if (!document.getElementById('toast-styles')) {
        const toastStyles = document.createElement('style');
        toastStyles.id = 'toast-styles';
        toastStyles.textContent = `
            .toast-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
            }
            
            .toast {
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                margin-bottom: 10px;
                padding: 15px;
                display: flex;
                align-items: center;
                gap: 10px;
                max-width: 400px;
                animation: slideIn 0.3s ease;
            }
            
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
            
            .toast-success {
                border-left: 4px solid #00ac75;
            }
            
            .toast-error {
                border-left: 4px solid #ff4757;
            }
            
            .toast-warning {
                border-left: 4px solid #ff9800;
            }
            
            .toast-info {
                border-left: 4px solid #007bff;
            }
        `;
        document.head.appendChild(toastStyles);
    }
}

// ========== التهيئة التلقائية عند التحميل ==========
document.addEventListener('DOMContentLoaded', function() {
    console.log("📄 الصفحة محملة، جاري تحميل أنماط Toast...");
    loadToastStyles();
    
    if (typeof firebase !== 'undefined') {
        console.log("🚀 Firebase SDK محمل، جاري التهيئة التلقائية...");
        
        // تأخير التهيئة لضمان تحميل الصفحة أولاً
        setTimeout(() => {
            firebaseServices.initialize();
            
            // اختبار الاتصال بعد التهيئة
            setTimeout(() => {
                firebaseServices.checkConnection().then(result => {
                    console.log("📊 نتيجة اختبار الاتصال:", result);
                });
            }, 2000);
        }, 500);
    } else {
        console.warn("⚠️ Firebase SDK غير محمل بعد");
    }
});

// إضافة وظيفة showToast للنافذة العامة
window.showToast = showToast;

console.log("✅ firebase-config.js (v16) محمل وجاهز للاستخدام");
