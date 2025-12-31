// firebase-config.js - إصدار محسّن ومتكامل
// الإصدار: v12 (محدث)
// تاريخ التحديث: 2024

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
let firebaseApp = null;
let firestoreDb = null;
let realtimeDb = null;
let firebaseAuth = null;
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
                firebaseApp = firebase.apps[0];
                console.log("✅ Firebase متهيئ بالفعل");
            } else {
                firebaseApp = firebase.initializeApp(firebaseConfig);
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
            if (firebase.firestore) {
                firestoreDb = firebase.firestore();
                
                // إعدادات Firestore للمثالية
                if (firestoreDb.settings) {
                    firestoreDb.settings({
                        cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED,
                        merge: true
                    });
                }
                
                console.log("✅ Firestore Database جاهز");
            }
            
            // Realtime Database
            if (firebase.database) {
                realtimeDb = firebase.database();
                console.log("✅ Realtime Database جاهز");
            }
            
            // Authentication
            if (firebase.auth) {
                firebaseAuth = firebase.auth();
                console.log("✅ Authentication جاهز");
            }
            
        } catch (error) {
            console.error("❌ خطأ في تهيئة خدمات Firebase:", error);
        }
    },
    // دالة لتحديث رقم المصادقة في Realtime Database فقط
updateAuthNumberRealtime: async function(authNumber, recordData = {}) {
    try {
        if (!this.realtimeDb) {
            this.realtimeDb();
            if (!this.realtimeDb) {
                throw new Error("Realtime Database غير متاح");
            }
        }
        
        const formattedNumber = authNumber < 10 ? '0' + authNumber : authNumber.toString();
        const authData = {
            number: authNumber,
            formattedNumber: formattedNumber,
            timestamp: Date.now(),
            date: new Date().toISOString(),
            source: 'admin_manual',
            idNumber: recordData.id_number || recordData.idNumber,
            recordId: recordData.id,
            status: 'approved',
            action: 'manual_approval',
            requiresUserAction: true,
            // لا نرسل authNumber هنا لأنه سيكون في Firestore فقط
            // authNumber: formattedNumber // تعليق هذا السطر
        };
        
        // حفظ في Realtime Database فقط
        await this.realtimeDb.ref('current_auth_number').set(authData);
        
        console.log(`✅ تم حفظ رقم المصادقة ${formattedNumber} في Realtime Database`);
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
    // الحصول على Firestore
    firestore: function() {
        if (!firestoreDb && firebase.firestore) {
            firestoreDb = firebase.firestore();
        }
        return firestoreDb;
    },
    
    // الحصول على Realtime Database
    realtimeDb: function() {
        if (!realtimeDb && firebase.database) {
            realtimeDb = firebase.database();
        }
        return realtimeDb;
    },
    
    // الحصول على Authentication
    auth: function() {
        if (!firebaseAuth && firebase.auth) {
            firebaseAuth = firebase.auth();
        }
        return firebaseAuth;
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
            if (firestoreDb) {
                try {
                    const testDocRef = firestoreDb.collection('system_tests').doc('connection_test');
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
            if (realtimeDb) {
                try {
                    await realtimeDb.ref('.info/connected').once('value', (snapshot) => {
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
            'network-request-failed': 'فشل طلب الشبكة. تحقق من اتصال الإنترنت.'
        };
        
        return suggestions[error.code] || 'حدث خطأ غير معروف. تحقق من وحدة تحكم المتصفح لمزيد من التفاصيل.';
    },
    
    // حفظ رقم المصادقة في Realtime Database
    saveAuthNumber: async function(authNumber, idNumber = null, action = 'approve') {
        try {
            if (!realtimeDb) {
                this.realtimeDb();
                if (!realtimeDb) {
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
            await realtimeDb.ref('current_auth_number').set(authData);
            
            // أيضًا حفظ في Firestore للتسجيل
            if (firestoreDb) {
                await firestoreDb.collection('auth_logs').add({
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
            if (!firestoreDb) {
                this.firestore();
                if (!firestoreDb) {
                    throw new Error("Firestore غير متاح");
                }
            }
            
            const snapshot = await firestoreDb.collection('id_numbers')
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
            if (!firestoreDb) {
                this.firestore();
                if (!firestoreDb) {
                    throw new Error("Firestore غير متاح");
                }
            }
            
            const updateData = {
                status: newStatus,
                updated_at: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            if (authNumber !== null) {
                updateData.auth_number = authNumber;
                updateData.auth_timestamp = Date.now();
            }
            
            await firestoreDb.collection('id_numbers')
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
            if (!realtimeDb) {
                this.realtimeDb();
                if (!realtimeDb) {
                    throw new Error("Realtime Database غير متاح");
                }
            }
            
            return realtimeDb.ref('current_auth_number')
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
            if (realtimeDb && listener) {
                realtimeDb.ref('current_auth_number').off('value', listener);
                console.log("✅ تم إيقاف المستمع");
            }
        } catch (error) {
            console.error("❌ خطأ في إيقاف المستمع:", error);
        }
    },
    
    // تنظيف بيانات قديمة
    cleanupOldData: async function() {
        try {
            if (!firestoreDb) {
                this.firestore();
                if (!firestoreDb) {
                    return { success: false, error: "Firestore غير متاح" };
                }
            }
            
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            
            const oldRecords = await firestoreDb.collection('id_numbers')
                .where('created_at', '<', oneWeekAgo)
                .where('status', 'in', ['completed', 'cancelled'])
                .get();
            
            const batch = firestoreDb.batch();
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
    }
};

// ========== تصدير الكائن للاستخدام العالمي ==========
window.firebaseServices = firebaseServices;
window.firebaseConfig = firebaseConfig;
window.firebaseRealtimeDb = realtimeDb;
window.firestoreDb = firestoreDb;

// ========== التهيئة التلقائية عند التحميل ==========
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

// ========== وظائف مساعدة ==========

// إنشاء إشعار (Toast)
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer') || createToastContainer();
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="fas fa-${getToastIcon(type)}"></i>
        <span>${message}</span>
    `;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

function getToastIcon(type) {
    const icons = {
        'success': 'check-circle',
        'error': 'exclamation-circle',
        'warning': 'exclamation-triangle',
        'info': 'info-circle'
    };
    return icons[type] || 'info-circle';
}

function createToastContainer() {
    const container = document.createElement('div');
    container.className = 'toast-container';
    container.id = 'toastContainer';
    document.body.appendChild(container);
    return container;
}

// ========== تحميل أنماط CSS للـ Toasts ==========
const toastStyles = document.createElement('style');
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

console.log("✅ firebase-config.js محمل وجاهز للاستخدام");
