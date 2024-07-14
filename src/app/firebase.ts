import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, User, signOut } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs, onSnapshot, Timestamp, doc, getDoc, DocumentData, QueryConstraint , orderBy} from 'firebase/firestore';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import * as admin from 'firebase-admin';


const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth();
const db = getFirestore(app);
const storage = getStorage(app);

export async function handleSignIn(email: string, password: string): Promise<void> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log('User signed in:', user);

    const q = query(collection(db, 'users'), where('email', '==', email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();

      if (userData.role === 'admin') {
        console.log('User is admin:', user);
      } else {
        console.error('Access denied: User is not an admin.');
        throw new Error('Access denied: User is not an admin.');
      }
    } else {
      console.error('No user found with this email.');
      throw new Error('No user found with this email.');
    }
  } catch (error) {
    console.error('Error during sign-in:', error);
    throw error;
  }
}

export function checkAuthState(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

export async function handleSignOut(): Promise<void> {
  try {
    await signOut(auth);
    console.log('User signed out');
  } catch (error) {
    console.error('Error during sign-out:', error);
  }
}

export async function getUserData(uid: string): Promise<any> {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data();
    } else {
      console.error('No user found with this uid.');
      throw new Error('No user found with this uid.');
    }
  } catch (error) {
    console.error('Error fetching user data:', error);
    throw error;
  }
}

export const getProfilePictureURL = async (uid: string): Promise<string | null> => {
  const storageRef = ref(storage, `profilePictures/${uid}`);
  try {
    const url = await getDownloadURL(storageRef);
    return url;
  } catch (error) {
    console.error("Error fetching profile picture:", error);
    return null;
  }
};

export function getTotalNotificationReceiversRealtime(callback: (totalReceiversCurrentMonth: number, totalReceiversLastMonth: number, percentageDifference: number) => void): void {
  const notificationsCollection = collection(db, 'notifications');

  // Calculate the start date of the current month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfMonthTimestamp = Timestamp.fromDate(startOfMonth);

  // Calculate the start and end date of the last month
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
  const startOfLastMonthTimestamp = Timestamp.fromDate(startOfLastMonth);
  const endOfLastMonthTimestamp = Timestamp.fromDate(endOfLastMonth);

  onSnapshot(notificationsCollection, async (notificationsSnapshot) => {
    let totalReceiversCurrentMonth = 0;
    let totalReceiversLastMonth = 0;

    const promises = notificationsSnapshot.docs.map(async (notificationDoc) => {
      const notificationData = notificationDoc.data();
      const notificationDateCreated = notificationData.dateCreated.toMillis();

      if (notificationDateCreated >= startOfMonthTimestamp.toMillis()) {
        const notifReceiversCollection = collection(db, `notifications/${notificationDoc.id}/notifReceivers`);
        const notifReceiversSnapshot = await getDocs(notifReceiversCollection);
        totalReceiversCurrentMonth += notifReceiversSnapshot.size;
      }

      if (notificationDateCreated >= startOfLastMonthTimestamp.toMillis() && notificationDateCreated <= endOfLastMonthTimestamp.toMillis()) {
        const notifReceiversCollection = collection(db, `notifications/${notificationDoc.id}/notifReceivers`);
        const notifReceiversSnapshot = await getDocs(notifReceiversCollection);
        totalReceiversLastMonth += notifReceiversSnapshot.size;
      }
    });

    await Promise.all(promises);

    const percentageDifference = totalReceiversLastMonth > 0
      ? ((totalReceiversCurrentMonth - totalReceiversLastMonth) / totalReceiversLastMonth) * 100
      : 0;

    callback(totalReceiversCurrentMonth, totalReceiversLastMonth, percentageDifference);
  });
}

export async function getTopLevelCollections() {
  try {
    const collections = ['Campaigns', 'Coupons', 'Organizations', 'Users', 'Vendors']; // Manually specify collections for now
    console.log('Top-level collections:', collections);
    return collections;
  } catch (error) {
    console.error('Error fetching top-level collections:', error);
    throw error;
  }
}

export async function getDocumentsWithConditions(collectionName: string, conditions: QueryConstraint[]) {
  try {
    const colRef = collection(db, collectionName);
    const q = query(colRef, ...conditions);
    const querySnapshot = await getDocs(q);

    const documents = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return documents;
  } catch (error) {
    console.error(`Error fetching documents from collection ${collectionName}:`, error);
    throw error;
  }
}


interface OrganizationUserCounts {
  [organizationName: string]: number;
}

export async function getOrganizationUserCounts(): Promise<OrganizationUserCounts> {
  try {
    const organizationsRef = collection(db, 'organizations');
    const organizationsSnapshot = await getDocs(organizationsRef);
    const organizationUserCounts: OrganizationUserCounts = {};

    for (const organizationDoc of organizationsSnapshot.docs) {
      const organizationData = organizationDoc.data();
      const organizationName = organizationData.abbreviation;

      const usersRef = collection(db, 'users');
      const usersQuery = query(usersRef, where('organization', '==', organizationName));
      const usersSnapshot = await getDocs(usersQuery);

      organizationUserCounts[organizationName] = usersSnapshot.size;
    }

    console.log('Organization user counts:', organizationUserCounts);
    return organizationUserCounts;
  } catch (error) {
    console.error('Error fetching organization user counts:', error);
    throw error;
  }
}

export async function getCouponUserCounts(): Promise<{ [couponName: string]: number }> {
  try {
    const couponsRef = collection(db, 'couponFRFR');
    const couponsSnapshot = await getDocs(couponsRef);

    const couponUserCounts: { [couponName: string]: number } = {};

    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);

    // Create a map to hold the user inventories
    const userInventories: { [userId: string]: string[] } = {};

    for (const userDoc of usersSnapshot.docs) {
      const userInventoryRef = collection(db, `users/${userDoc.id}/inventory`);
      const userInventorySnapshot = await getDocs(userInventoryRef);
      userInventories[userDoc.id] = userInventorySnapshot.docs.map(doc => doc.id);
    }

    // Iterate through each coupon
    for (const couponDoc of couponsSnapshot.docs) {
      const couponData = couponDoc.data();
      const couponName = couponData.couponName;

      // Initialize count for this coupon
      couponUserCounts[couponName] = 0;

      // Iterate through each user's inventory to check if they have the current coupon
      for (const userId in userInventories) {
        if (userInventories[userId].includes(couponDoc.id)) {
          couponUserCounts[couponName]++;
        }
      }
    }

    console.log('Coupon user counts:', couponUserCounts);
    return couponUserCounts;
  } catch (error) {
    console.error('Error fetching coupon user counts:', error);
    throw error;
  }
}

export async function getCouponUserCountsRedeemed(): Promise<{ [couponName: string]: number }> {
  try {
    const couponsRef = collection(db, 'couponFRFR');
    const couponsSnapshot = await getDocs(couponsRef);

    const couponUserCounts: { [couponName: string]: number } = {};

    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);

    // Create a map to hold the user inventories
    const userInventories: { [userId: string]: any[] } = {};

    for (const userDoc of usersSnapshot.docs) {
      const userInventoryRef = collection(db, `users/${userDoc.id}/inventory`);
      const userInventorySnapshot = await getDocs(userInventoryRef);
      userInventories[userDoc.id] = userInventorySnapshot.docs.map(doc => ({ id: doc.id, data: doc.data() }));
    }

    // Iterate through each coupon
    for (const couponDoc of couponsSnapshot.docs) {
      const couponData = couponDoc.data();
      const couponName = couponData.couponName;

      // Initialize count for this coupon
      couponUserCounts[couponName] = 0;

      // Iterate through each user's inventory to check if they have the current coupon
      for (const userId in userInventories) {
        const userInventory = userInventories[userId];

        for (const inventoryItem of userInventory) {
          if (inventoryItem.id === couponDoc.id && inventoryItem.data.redeemed) {
            couponUserCounts[couponName]++;
            break;
          }
        }
      }
    }

    console.log('Coupon user counts:', couponUserCounts);
    return couponUserCounts;
  } catch (error) {
    console.error('Error fetching coupon user counts:', error);
    throw error;
  }
}



// Define the ChartData interface
interface ChartData {
  month: string;
  campaigns: number;
}

export async function getActiveCampaignCounts(): Promise<ChartData[]> {
  try {
    const campaignsRef = collection(db, 'campaign');
    const campaignsSnapshot = await getDocs(campaignsRef);

    const now = new Date();
    const currentYear = now.getFullYear();

    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    const activeCampaignCounts: { [month: string]: number } = {};

    campaignsSnapshot.forEach(campaignDoc => {
      const campaignData = campaignDoc.data() as DocumentData;
      const validFrom = campaignData.validFrom.toDate(); // Assuming validFrom and validTo are Timestamps
      const validTo = campaignData.validTo.toDate();

      console.log(`Campaign valid from ${validFrom} to ${validTo}`);

      // Iterate through each month of the current year
      for (let month = 0; month < 12; month++) {
        const startOfMonth = new Date(currentYear, month, 1);
        const endOfMonth = new Date(currentYear, month + 1, 0, 23, 59, 59, 999); // Last moment of the month

        // Check if the campaign is active in this month
        if (
          (validFrom <= endOfMonth) && (validTo >= startOfMonth)
        ) {
          const monthName = monthNames[month];
          if (!activeCampaignCounts[monthName]) {
            activeCampaignCounts[monthName] = 0;
          }
          activeCampaignCounts[monthName]++;
        }
      }
    });

    const campaignData: ChartData[] = monthNames.map(month => ({
      month,
      campaigns: activeCampaignCounts[month] || 0
    }));

    console.log('Active campaign counts:', campaignData);
    return campaignData;
  } catch (error) {
    console.error('Error fetching active campaign counts:', error);
    throw error;
  }

  
}



export interface AuditData {
  id: string;
  action: string;
  object: string;
  time: Date;
  user: string;
  [key: string]: any; // Add index signature to allow additional properties
}

export async function getAuditInfo(): Promise<AuditData[]> {
  try {
    const auditRef = collection(db, 'audit');
    const auditSnapshot = await getDocs(auditRef);

    const auditData: AuditData[] = auditSnapshot.docs.map(doc => {
      const data = doc.data() as DocumentData;
      return {
        id: doc.id,
        action: data.action,
        object: data.object,
        time: data.time.toDate(), // Convert Firestore Timestamp to JavaScript Date
        user: data.user,
        ...data // Include any additional fields
      };
    });

    console.log('Audit data:', auditData);
    return auditData;
  } catch (error) {
    console.error('Error fetching audit info:', error);
    throw error;
  }
}





export function getCampaignDetailsRealtime(campaignId: string, callback: (data: any) => void): void {
  const campaignRef = doc(db, 'campaign', campaignId);

  onSnapshot(campaignRef, (campaignDoc) => {
    if (campaignDoc.exists()) {
      callback(campaignDoc.data());
    } else {
      console.error('No campaign found with this id.');
    }
  }, (error) => {
    console.error('Error fetching campaign details:', error);
  });
}

export function getAuditInfoRealtime(callback: (data: AuditData[]) => void): void {
  const auditRef = collection(db, 'audit');
  const auditQuery = query(auditRef, orderBy('time', 'desc')); // Order by 'time' field in descending order

  onSnapshot(auditQuery, (snapshot) => {
    const audits: AuditData[] = snapshot.docs.map(doc => {
      const data = doc.data() as DocumentData;
      return {
        id: doc.id,
        action: data.action,
        object: data.object,
        time: data.time.toDate(), // Convert Firestore Timestamp to JavaScript Date
        user: data.user,
        ...data // Include any additional fields
      };
    });

    callback(audits);
  }, (error) => {
    console.error('Error fetching audit info:', error);
  });
}


// // Function to log all documents in a collection
// async function logAllDocuments(collectionName: string) {
//   const querySnapshot = await getDocs(collection(db, collectionName));
//   querySnapshot.forEach((doc) => {
//     console.log(`${collectionName} - Document ID: ${doc.id}`, doc.data());
//   });
// }

// // List of collections to log
// const collections: string[] = [
//   'audit',
//   'campaign',
//   'couponFRFR',
//   'editCoupon',
//   'notifications',
//   'organizations',
//   'users',
//   'vendors'
// ];

// // Log all documents for each collection
// collections.forEach(collectionName => logAllDocuments(collectionName));


export async function getCountOfDocumentsByField(
  collectionName: string,
  field: string,
  metric: string,
  isTimeField: boolean = false,
  duration?: { start: Date; end: Date }
): Promise<Record<string, number | string>> {
  const fieldCounts: Record<string, number> = {};
  const fieldDurations: Record<string, number[]> = {};

  const collectionRef = collection(db, collectionName);
  const snapshot = await getDocs(collectionRef);

  for (const doc of snapshot.docs) {
    const data = doc.data();

    if (field === 'coupons' && collectionName === 'users') {
      const userInventoryRef = collection(db, `users/${doc.id}/inventory`);
      const userInventorySnapshot = await getDocs(userInventoryRef);
      
      userInventorySnapshot.forEach(inventoryDoc => {
        const couponId = inventoryDoc.id;
        if (!fieldCounts[couponId]) {
          fieldCounts[couponId] = 0;
        }
        fieldCounts[couponId]++;
      });
    } else {
      const fieldValue = data[field];
  
      if (isTimeField && duration) {
        const fieldDate = (data[field] as Timestamp).toDate();
        if (fieldDate >= duration.start && fieldDate <= duration.end) {
          const dateKey = `${fieldDate.getFullYear()}-${fieldDate.getMonth() + 1}-${fieldDate.getDate()}`;
          if (!fieldCounts[dateKey]) {
            fieldCounts[dateKey] = 0;
          }
          fieldCounts[dateKey]++;
        }
      } else {
        if (fieldValue) {
          switch (collectionName) {
            case "campaign":
              if (metric === "Count of campaigns") {
                if (!fieldCounts[fieldValue]) {
                  fieldCounts[fieldValue] = 0;
                }
                fieldCounts[fieldValue]++;
              } else if (metric === "Average duration of campaigns") {
                const validFrom = (data["validFrom"] as Timestamp).toDate();
                const validTo = (data["validTo"] as Timestamp).toDate();
                const duration = (validTo.getTime() - validFrom.getTime()) / (1000 * 60 * 60 * 24); // Duration in days
  
                if (!fieldDurations[fieldValue]) {
                  fieldDurations[fieldValue] = [];
                }
                fieldDurations[fieldValue].push(duration);
              }
              break;
            case "couponFRFR":
              if (metric === "Count of coupons") {
                if (!fieldCounts[fieldValue]) {
                  fieldCounts[fieldValue] = 0;
                }
                fieldCounts[fieldValue]++;
              } else if (metric === "Count of coupons per organization") {
                const organizationID = data["organizationID"];
                if (organizationID) {
                  if (!fieldCounts[organizationID]) {
                    fieldCounts[organizationID] = 0;
                  }
                  fieldCounts[organizationID]++;
                }
              }
              break;
            case "organizations":
              if (metric === "Count of organizations") {
                if (!fieldCounts[fieldValue]) {
                  fieldCounts[fieldValue] = 0;
                }
                fieldCounts[fieldValue]++;
              }
              break;
            case "users":
              if (metric === "Count of users") {
                if (!fieldCounts[fieldValue]) {
                  fieldCounts[fieldValue] = 0;
                }
                fieldCounts[fieldValue]++;
              }
              break;
            case "vendors":
              if (metric === "Count of vendors") {
                if (!fieldCounts[fieldValue]) {
                  fieldCounts[fieldValue] = 0;
                }
                fieldCounts[fieldValue]++;
              }
              break;
            default:
              break;
          }
        }
      }
    }
  }

  if (metric === "Average duration of campaigns") {
    Object.keys(fieldDurations).forEach(key => {
      const durations = fieldDurations[key];
      const averageDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      fieldCounts[key] = parseFloat(averageDuration.toFixed(2)); // Format to 2 decimal places
    });
  }

  return fieldCounts;
}


// // Usage Example
// getCountOfDocumentsByField(db, 'campaigns', 'vendorID').then(fieldCounts => {
//   console.log('Count by vendorID:', fieldCounts);
// }).catch(error => {
//   console.error('Error fetching campaigns:', error);
// });


// async function testGetCountOfDocumentsByField() {
//   try {
//     const result = await getCountOfDocumentsByField('campaign', 'vendorID', 'Count of campaigns');
//     console.log('Test Result:', result);
//   } catch (error) {
//     console.error('Error in testGetCountOfDocumentsByField:', error);
//   }
// }

// testGetCountOfDocumentsByField();