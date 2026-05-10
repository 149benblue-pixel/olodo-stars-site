import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

const initFirebase = () => {
  try {
    if (!firebaseConfig || !firebaseConfig.apiKey) {
      throw new Error('Firebase configuration (apiKey) is missing. Check firebase-applet-config.json');
    }
    
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    
    // Explicitly pass bucket URL if present to ensure correct initialization. 
    // If not, it will be pulled from firebaseConfig automatically by getStorage(app)
    const storageBucket = firebaseConfig.storageBucket 
      ? (firebaseConfig.storageBucket.startsWith('gs://') 
          ? firebaseConfig.storageBucket 
          : `gs://${firebaseConfig.storageBucket}`)
      : undefined;
      
    const storage = storageBucket ? getStorage(app, storageBucket) : getStorage(app);
    const auth = getAuth(app);

    if (!firebaseConfig.storageBucket) {
      console.warn('Firebase Storage bucket is missing in config. Uploads will fail.');
    } else {
      console.log('Firebase Storage initialized. Bucket string:', firebaseConfig.storageBucket);
    }

    return { app, db, storage, auth };
  } catch (error) {
    console.error('Critical Error during Firebase Initialization:', error);
    // Return objects that will throw when used, or nulls with type casting to avoid initial import crashes
    return {
      app: null as any,
      db: null as any,
      storage: null as any,
      auth: null as any
    };
  }
};

export { firebaseConfig };
export const { app, db, storage, auth } = initFirebase();
export const googleProvider = new GoogleAuthProvider();

/**
 * Uploads a file to Firebase Storage and returns the download URL.
 * @param file The file to upload.
 * @param path The path in storage where the file should be saved.
 * @param onProgress Callback for upload progress (0-100).
 * @returns A promise that resolves to the download URL.
 */
export const uploadFile = async (
  file: File, 
  path: string, 
  onProgress?: (progress: number) => void
): Promise<string> => {
  try {
    if (!storage) {
      throw new Error('Firebase Storage is not initialized. Please check your configuration.');
    }
    
    if (!navigator.onLine) {
      throw new Error('You appear to be offline. Please check your internet connection.');
    }
    
    console.log(`Attempting to upload ${file.name} to ${path} (${file.size} bytes)`);
    const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const storageRef = ref(storage, `${path}/${fileName}`);
    
    if (onProgress) onProgress(10);
    
    const result = await uploadBytes(storageRef, file);
    
    if (onProgress) onProgress(100);
    
    console.log('Upload successful for:', result.metadata.fullPath);
    const url = await getDownloadURL(result.ref);
    return url;
  } catch (error: any) {
    console.error('Error in uploadFile:', error);
    if (error.code === 'storage/unauthorized') {
      throw new Error('Permission denied. Please ensure you have a verified email and are logged in.');
    } else if (error.code === 'storage/retry-limit-exceeded') {
      throw new Error('Connection timed out. This may be due to a misconfigured storage bucket or network issues.');
    }
    throw new Error(error.message || 'An unknown error occurred during upload.');
  }
};

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Error signing in with Google', error);
    throw error;
  }
};

export const logout = () => signOut(auth);

// Test connection to Firestore
async function testConnection() {
  if (!db) return;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. The client is offline.");
    }
  }
}
testConnection();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
