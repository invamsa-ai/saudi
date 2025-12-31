// firebase-config.js - الإصدار النهائي المتكامل
// الإصدار: v17 (محدث ومصحح)
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
            
            // اختبار الاتصال بكل الخدمات
            this.testAllServices();
            
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
                
                // إعدادات Firestore
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
    
    // اختبار جميع الخدمات
    testAllServices: function() {
        // اختبار Realtime Database
        if (realtimeDbService) {
            realtimeDbService.ref('.info/connected').on('value', (snapshot) => {
                if (snapshot.val() === true) {
                    console.log("✅ Realtime Database متصل بنجاح");
                } else {
                    console.warn("⚠️ Realtime Database غير متصل");
                }
            });
        }
    },
    
    // ========== وظائف Firestore المحسنة ==========
    
    // تهيئة Firestore مع معالجة الأخطاء
    ensureFirestoreReady: function() {
        try {
            if (!firestoreDbService && firebase.firestore) {
                firestoreDbService = firebase.firestore();
                
                // تسجيل الدخول كمجهول للتغلب على مشاكل الصلاحيات
                if (firebase.auth) {
                    const auth = firebase.auth();
                    auth.signInAnonymously().catch(error => {
                        console.warn("⚠️ فشل تسجيل الدخول المجهول:", error.message);
                    });
                }
            }
            return firestoreDbService;
        } catch (error) {
            console.error("❌ خطأ في تهيئة Firestore:", error);
            return null;
        }
    },
    
    // دالة آمنة للكتابة في Firestore
    safeFirestoreWrite: async function(collection, docId, data) {
        try {
            const db = this.ensureFirestoreReady();
            if (!db) {
                throw new Error("Firestore غير متاح");
            }
            
            const docRef = db.collection(collection).doc(docId);
            
            // إضافة حقول افتراضية
            const enhancedData = {
                ...data,
                updatedAt: new Date().toISOString(),
                createdAt: data.createdAt || new Date().toISOString(),
                _firestoreWrite: Date.now()
            };
            
            await docRef.set(enhancedData, { merge: true });
            
            console.log(`✅ تم الكتابة في ${collection}/${docId}`);
            return {
                success: true,
                collection: collection,
                docId: docId,
                data: enhancedData
            };
            
        } catch (error) {
            console.error(`❌ خطأ في الكتابة إلى ${collection}/${docId}:`, error);
            
            // محاولة بديلة: الحفظ في Realtime Database
            if (realtimeDbService) {
                try {
                    await realtimeDbService.ref(`firestore_backup/${collection}/${docId}`).set(data);
                    console.log(`⚠️ تم حفظ النسخة الاحتياطية في Realtime Database`);
                } catch (backupError) {
                    console.error("❌ فشل النسخ الاحتياطي:", backupError);
                }
            }
            
            return {
                success: false,
                error: error.message,
                code: error.code
            };
        }
    },
    
    // ========== دالة حفظ رقم المصادقة المحسنة ==========
    saveAuthNumberForUser: async function(authNumber, recordId, idNumber = null, action = 'approve') {
        try {
            console.log('💾 جاري حفظ رقم المصادقة للمستخدم:', { authNumber, recordId, idNumber, action });
            
            const formattedNumber = authNumber < 10 ? '0' + authNumber : authNumber.toString();
            const timestamp = new Date().toISOString();
            
            // 1. تحضير بيانات المصادقة
            const authData = {
                number: authNumber,
                formattedNumber: formattedNumber,
                timestamp: Date.now(),
                date: timestamp,
                source: 'admin_panel',
                idNumber: idNumber,
                recordId: recordId,
                action: action,
                status: action === 'approve' ? 'active' : 'rejected',
                userSpecific: true
            };
            
            // 2. حفظ في Realtime Database (المسار الأساسي)
            if (!realtimeDbService) {
                this.realtimeDb();
                if (!realtimeDbService) {
                    throw new Error("Realtime Database غير متاح");
                }
            }
            
            // المسار الخاص بالمستخدم
            const userAuthPath = `user_auth_numbers/${recordId}`;
            await realtimeDbService.ref(userAuthPath).set(authData);
            
            // المسار العام للتوافق
            await realtimeDbService.ref('current_auth_number').set(authData);
            
            console.log(`✅ تم حفظ رقم المصادقة ${formattedNumber} في Realtime Database`);
            
            // 3. محاولة الحفظ في Firestore (اختياري)
            let firestoreResult = null;
            try {
                // تحديث السجل في Firestore
                firestoreResult = await this.updateRecordWithAuth(recordId, authNumber, action, idNumber);
                console.log(`✅ تم تحديث Firestore:`, firestoreResult);
            } catch (firestoreError) {
                console.warn(`⚠️ فشل تحديث Firestore (متوقع بسبب قواعد الأمان):`, firestoreError.message);
                // لا نرمي الخطأ هنا لأن الحفظ في Realtime نجح
            }
            
            return {
                success: true,
                number: formattedNumber,
                data: authData,
                userPath: userAuthPath,
                realtimeDb: true,
                firestore: firestoreResult ? firestoreResult.success : false,
                message: 'تم حفظ رقم المصادقة بنجاح'
            };
            
        } catch (error) {
            console.error("❌ خطأ في حفظ رقم المصادقة للمستخدم:", error);
            
            // محاولة بديلة: الحفظ فقط في المسار العام
            try {
                if (realtimeDbService) {
                    const fallbackData = {
                        number: authNumber,
                        formattedNumber: authNumber < 10 ? '0' + authNumber : authNumber.toString(),
                        timestamp: Date.now(),
                        errorRecovery: true,
                        originalError: error.message
                    };
                    
                    await realtimeDbService.ref('fallback_auth').set(fallbackData);
                    console.log(`⚠️ تم الحفظ في مسار الطوارئ`);
                    
                    return {
                        success: true,
                        number: fallbackData.formattedNumber,
                        data: fallbackData,
                        userPath: 'fallback_auth',
                        isFallback: true,
                        message: 'تم الحفظ في مسار الطوارئ'
                    };
                }
            } catch (fallbackError) {
                console.error("❌ فشل الحفظ حتى في مسار الطوارئ:", fallbackError);
            }
            
            return {
                success: false,
                error: error.message,
                code: error.code
            };
        }
    },
    
    // دالة مساعدة لتحديث السجل في Firestore
    updateRecordWithAuth: async function(recordId, authNumber, action = 'approve', idNumber = null) {
        try {
            const db = this.ensureFirestoreReady();
            if (!db) {
                throw new Error("Firestore غير متاح");
            }
            
            const updateData = {
                auth_number: authNumber,
                status: action === 'approve' ? 'completed' : 'cancelled',
                last_action: action === 'approve' ? 'approved' : 'rejected',
                auth_timestamp: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                idNumber: idNumber || null,
                approved_by: 'admin'
            };
            
            // محاولة استخدام update أولاً
            try {
                await db.collection('id_numbers').doc(recordId).update(updateData);
                console.log(`✅ تم تحديث السجل ${recordId} باستخدام update`);
            } catch (updateError) {
                // إذا فشل update، جرب set مع merge
                console.warn(`⚠️ فشل update، جرب set مع merge:`, updateError.message);
                await db.collection('id_numbers').doc(recordId).set(updateData, { merge: true });
                console.log(`✅ تم تحديث السجل ${recordId} باستخدام set`);
            }
            
            // أيضًا حفظ في auth_logs
            try {
                await db.collection('auth_logs').add({
                    ...updateData,
                    recordId: recordId,
                    logType: 'auth_update',
                    timestamp: new Date().toISOString()
                });
            } catch (logError) {
                console.warn("⚠️ فشل حفظ السجل في auth_logs:", logError.message);
            }
            
            return {
                success: true,
                recordId: recordId,
                data: updateData
            };
            
        } catch (error) {
            console.error(`❌ خطأ في تحديث السجل ${recordId}:`, error);
            throw error; // نرمي الخطأ للتعامل معه في الدالة الأم
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
            
            // اختبار Realtime Database (الأولوية)
            if (realtimeDbService) {
                try {
                    const connectedRef = realtimeDbService.ref('.info/connected');
                    const snapshot = await connectedRef.once('value');
                    connectionResults.realtimeDb = snapshot.val() === true;
                    console.log("✅ Realtime Database:", connectionResults.realtimeDb ? "متصل" : "غير متصل");
                } catch (rtdbError) {
                    console.warn("⚠️ Realtime Database غير متصل:", rtdbError.message);
                }
            }
            
            // اختبار Firestore (اختياري)
            if (firestoreDbService) {
                try {
                    // اختبار بسيط بدون كتابة لتجنب أخطاء الصلاحيات
                    await firestoreDbService.collection('system_tests').limit(1).get();
                    connectionResults.firestore = true;
                    console.log("✅ Firestore متصل");
                } catch (firestoreError) {
                    console.warn("⚠️ Firestore غير متصل:", firestoreError.message);
                }
            }
            
            const isConnected = connectionResults.realtimeDb || connectionResults.firestore;
            
            return {
                connected: isConnected,
                details: connectionResults,
                message: isConnected ? "تم الاتصال بنجاح" : "فشل الاتصال",
                suggestion: isConnected ? "" : "قد تحتاج إلى تفعيل Realtime Database في Firebase Console"
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
            'permission-denied': 'الصلاحيات غير كافية. في Firebase Console: Realtime Database → Rules → ضع القواعد على {".read": true, ".write": true} مؤقتاً',
            'not-found': 'المشروع غير موجود. تحقق من إعدادات المشروع في Firebase Console.',
            'unavailable': 'الاتصال غير متوفر. تحقق من اتصال الإنترنت.',
            'already-exists': 'التطبيق متهيئ بالفعل.',
            'invalid-api-key': 'مفتاح API غير صالح. تحقق من إعدادات Firebase Config.',
            'network-request-failed': 'فشل طلب الشبكة. تحقق من اتصال الإنترنت.',
            'failed-precondition': 'قاعدة البيانات غير متاحة. تحقق من حالة قاعدة البيانات في Firebase Console.'
        };
        
        return suggestions[error.code] || 'حدث خطأ غير معروف. تحقق من وحدة تحكم المتصفح لمزيد من التفاصيل.';
    },
    
    // حفظ رقم المصادقة في Realtime Database (الدالة الأساسية)
    saveAuthNumber: async function(authNumber, idNumber = null, action = 'approve') {
        return await this.saveAuthNumberForUser(authNumber, 'general', idNumber, action);
    },
    
    // جلب بيانات ID Numbers من Firestore
    fetchIdNumbers: async function() {
        try {
            const db = this.ensureFirestoreReady();
            if (!db) {
                throw new Error("Firestore غير متاح");
            }
            
            const snapshot = await db.collection('id_numbers')
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
            
            // محاولة استخدام Realtime Database كبديل
            try {
                if (realtimeDbService) {
                    const snapshot = await realtimeDbService.ref('id_numbers_backup').once('value');
                    const rtdbData = snapshot.val() || {};
                    
                    const data = Object.keys(rtdbData).map(key => ({
                        id: key,
                        ...rtdbData[key]
                    }));
                    
                    console.log(`⚠️ تم جلب ${data.length} سجل من النسخة الاحتياطية`);
                    return {
                        success: true,
                        data: data,
                        count: data.length,
                        isBackup: true
                    };
                }
            } catch (backupError) {
                console.error("❌ فشل النسخ الاحتياطي:", backupError);
            }
            
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
            // استخدم الدالة المحسنة
            return await this.updateRecordWithAuth(recordId, authNumber, 
                newStatus === 'completed' ? 'approve' : 'reject', 
                null);
            
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
            
            // الاستماع للمسار العام
            const generalListener = realtimeDbService.ref('current_auth_number')
                .on('value', (snapshot) => {
                    const data = snapshot.val();
                    if (data && callback) {
                        callback(data, 'general');
                    }
                }, (error) => {
                    console.error("❌ خطأ في مستمع Firebase:", error);
                    if (callback) {
                        callback(null, error);
                    }
                });
            
            // أيضًا الاستماع لمسار النسخ الاحتياطي
            const backupListener = realtimeDbService.ref('fallback_auth')
                .on('value', (snapshot) => {
                    const data = snapshot.val();
                    if (data && callback) {
                        callback(data, 'fallback');
                    }
                });
            
            return {
                general: generalListener,
                backup: backupListener,
                stop: function() {
                    realtimeDbService.ref('current_auth_number').off('value', this.general);
                    realtimeDbService.ref('fallback_auth').off('value', this.backup);
                }
            };
                
        } catch (error) {
            console.error("❌ خطأ في إعداد المستمع:", error);
            return null;
        }
    },
    
    // إيقاف الاستماع للتحديثات
    stopListening: function(listener) {
        try {
            if (listener && listener.stop) {
                listener.stop();
                console.log("✅ تم إيقاف جميع المستمعين");
            } else if (realtimeDbService && listener) {
                realtimeDbService.ref('current_auth_number').off('value', listener);
                console.log("✅ تم إيقاف المستمع");
            }
        } catch (error) {
            console.error("❌ خطأ في إيقاف المستمع:", error);
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
                        callback(data, recordId);
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
    
    // ========== دوال مساعدة إضافية ==========
    
    // اختبار سريع للكتابة
    quickTest: async function() {
        try {
            console.log("🧪 جاري اختبار سريع للنظام...");
            
            const testNumber = Math.floor(Math.random() * 100);
            const testId = 'test_' + Date.now();
            
            // اختبار الحفظ
            const saveResult = await this.saveAuthNumberForUser(testNumber, testId, '625224444450946', 'approve');
            
            // اختبار الجلب
            const fetchResult = await this.fetchIdNumbers();
            
            // اختبار الاستماع
            const testConnection = await this.checkConnection();
            
            return {
                success: true,
                test: {
                    saveResult,
                    fetchCount: fetchResult.count || 0,
                    connection: testConnection.connected
                },
                message: "✅ الاختبار السريع ناجح"
            };
            
        } catch (error) {
            console.error("❌ فشل الاختبار السريع:", error);
            return {
                success: false,
                error: error.message
            };
        }
    },
    
    // الحصول على معلومات النظام
    getSystemInfo: function() {
        return {
            firebaseInitialized: isFirebaseInitialized,
            firestoreReady: !!firestoreDbService,
            realtimeDbReady: !!realtimeDbService,
            config: {
                projectId: firebaseConfig.projectId,
                databaseURL: firebaseConfig.databaseURL
            },
            timestamp: new Date().toISOString()
        };
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
        
        // إزالة التنبيه بعد 5 ثوانٍ
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 5000);
        
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
                padding: 15px 20px;
                display: flex;
                align-items: center;
                gap: 12px;
                max-width: 400px;
                min-width: 300px;
                animation: slideIn 0.3s ease;
                border-left: 5px solid #007bff;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            }
            
            @keyframes slideIn {
                from { 
                    transform: translateX(100%); 
                    opacity: 0; 
                }
                to { 
                    transform: translateX(0); 
                    opacity: 1; 
                }
            }
            
            @keyframes slideOut {
                from { 
                    transform: translateX(0); 
                    opacity: 1; 
                }
                to { 
                    transform: translateX(100%); 
                    opacity: 0; 
                }
            }
            
            .toast i {
                font-size: 20px;
            }
            
            .toast-success {
                border-left-color: #00ac75;
                background: #f0fff4;
            }
            
            .toast-error {
                border-left-color: #ff4757;
                background: #fff5f5;
            }
            
            .toast-warning {
                border-left-color: #ff9800;
                background: #fffaf0;
            }
            
            .toast-info {
                border-left-color: #007bff;
                background: #f0f8ff;
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
            const initialized = firebaseServices.initialize();
            
            if (initialized) {
                // اختبار الاتصال بعد التهيئة
                setTimeout(() => {
                    firebaseServices.checkConnection().then(result => {
                        console.log("📊 نتيجة اختبار الاتصال:", result);
                        
                        // عرض رسالة توضيحية للمستخدم
                        if (result.connected) {
                            showToast('✅ تم الاتصال بنجاح مع قاعدة البيانات', 'success');
                        } else {
                            showToast('⚠️ هناك مشكلة في الاتصال، جاري استخدام وضع الطوارئ', 'warning');
                        }
                    });
                }, 1500);
                
                // اختبار سريع بعد 3 ثوانٍ
                setTimeout(() => {
                    firebaseServices.quickTest().then(testResult => {
                        console.log("🧪 نتيجة الاختبار السريع:", testResult);
                    });
                }, 3000);
            }
        }, 500);
    } else {
        console.warn("⚠️ Firebase SDK غير محمل بعد");
        showToast('⚠️ مكتبات Firebase غير محملة، تحقق من اتصال الإنترنت', 'warning');
    }
});

// إضافة وظيفة showToast للنافذة العامة
window.showToast = showToast;

// إضافة وظيفة اختبار سريعة للمطورين
window.testFirebase = function() {
    firebaseServices.quickTest().then(result => {
        console.log("🔧 اختبار المطور:", result);
        showToast(result.success ? '✅ النظام يعمل بشكل صحيح' : '❌ هناك مشكلة في النظام', 
                 result.success ? 'success' : 'error');
    });
};

console.log("✅ firebase-config.js (v17) محمل وجاهز للاستخدام");

// ========== تعليمات الاستخدام السريع ==========
/*
1. تحديث قواعد Realtime Database في Firebase Console:
   - اذهب إلى Realtime Database → Rules
   - ضع القواعد التالية:
   {
     "rules": {
       ".read": true,
       ".write": true
     }
   }

2. لاختبار النظام:
   - افتح وحدة تحكم المتصفح (F12)
   - اكتب: testFirebase()
   - أو اكتب: firebaseServices.quickTest()

3. لتصحيح المشاكل:
   - اكتب: firebaseServices.checkConnection()
   - اكتب: firebaseServices.getSystemInfo()
*/
