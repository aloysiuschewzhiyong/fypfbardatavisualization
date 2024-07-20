import { initializeApp } from "firebase/app";
// import { getAnalytics } from 'firebase/analytics';
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  User,
  signOut,
  updateEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  sendEmailVerification,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  Timestamp,
  updateDoc,
  doc as firestoreDoc,
  getDoc,
  DocumentData,
  QueryConstraint,
  orderBy,
} from "firebase/firestore";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import * as admin from "firebase-admin";

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
// const analytics = getAnalytics(app);
const auth = getAuth();
const db = getFirestore(app);
const storage = getStorage(app);

export async function handleUsernameChange(
  currentUserId: string,
  newUsername: string
): Promise<void> {
  try {
    const userDocRef = firestoreDoc(db, "users", currentUserId);
    await updateDoc(userDocRef, { username: newUsername });
    console.log("Username updated successfully");
  } catch (error) {
    console.error("Error updating username:", error);
    throw error;
  }
}
export async function handleEmailChange(currentUser: User, newEmail: string, currentPassword: string): Promise<void> {
  try {
    // Check if the current email is verified
    await currentUser.reload();
    if (!currentUser.emailVerified) {
      await sendEmailVerification(currentUser);
      throw new Error('Please verify your current email before changing to a new email.');
    }

    // Reauthenticate the user
    const credential = EmailAuthProvider.credential(currentUser.email!, currentPassword);
    await reauthenticateWithCredential(currentUser, credential);

    // Update email
    await updateEmail(currentUser, newEmail);
    await sendEmailVerification(currentUser);
    console.log('Verification email sent successfully to the new email address');

    // Inform the user to verify the new email address
    console.log('Please verify the new email address. Check your email for the verification link.');
  } catch (error: any) {
    console.error('Error updating email:', error);

    if (error.code === 'auth/email-already-in-use') {
      console.error('The email address is already in use by another account.');
      throw new Error('The email address is already in use by another account.');
    } else if (error.code === 'auth/invalid-email') {
      console.error('The email address is not valid.');
      throw new Error('The email address is not valid.');
    } else if (error.code === 'auth/requires-recent-login') {
      console.error('The user must reauthenticate before this operation can be executed.');
      throw new Error('The user must reauthenticate before this operation can be executed.');
    } else if (error.code === 'auth/invalid-credential') {
      console.error('The provided credentials are invalid.');
      throw new Error('The provided credentials are invalid. Please check your current password.');
    } else {
      console.error('An unknown error occurred:', error.message);
      throw new Error('An unknown error occurred. Please try again.');
    }
  }
}


export async function completeEmailUpdate(currentUser: User, newEmail: string): Promise<void> {
  try {
    // Reload the user profile to get the latest email verification status
    await currentUser.reload();

    if (!currentUser.emailVerified) {
      throw new Error("The new email address has not been verified yet.");
    }

    console.log("New email has been verified");

    // Update email in Firestore
    const userDocRef = firestoreDoc(db, "users", currentUser.uid);
    await updateDoc(userDocRef, { email: newEmail });
    console.log("Email updated successfully in Firestore");
  } catch (error) {
    console.error("Error completing email update:", error);
    throw error;
  }
}

export async function handlePasswordChange(
  currentUser: User,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  try {
    // Re-authenticate the user
    const credential = EmailAuthProvider.credential(
      currentUser.email!,
      currentPassword
    );
    await reauthenticateWithCredential(currentUser, credential);

    // Update password in Firebase Authentication
    await updatePassword(currentUser, newPassword);
    console.log("Password updated successfully in Firebase Authentication");
  } catch (error) {
    console.error("Error updating password:", error);
    throw error;
  }
}

export async function handleSignIn(
  email: string,
  password: string
): Promise<void> {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;
    console.log("User signed in:", user);

    const q = query(collection(db, "users"), where("email", "==", email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();

      if (userData.role === "admin") {
        console.log("User is admin:", user);
      } else {
        console.error("Access denied: User is not an admin.");
        throw new Error("Access denied: User is not an admin.");
      }
    } else {
      console.error("No user found with this email.");
      throw new Error("No user found with this email.");
    }
  } catch (error) {
    console.error("Error during sign-in:", error);
    throw error;
  }
}

export function checkAuthState(
  callback: (user: User | null) => void
): () => void {
  return onAuthStateChanged(auth, callback);
}

export async function handleSignOut(): Promise<void> {
  try {
    await signOut(auth);
    console.log("User signed out");
  } catch (error) {
    console.error("Error during sign-out:", error);
  }
}

export async function getUserData(uid: string): Promise<any> {
  try {
    const userDoc = await getDoc(firestoreDoc(db, "users", uid));
    if (userDoc.exists()) {
      return userDoc.data();
    } else {
      console.error("No user found with this uid.");
      throw new Error("No user found with this uid.");
    }
  } catch (error) {
    console.error("Error fetching user data:", error);
    throw error;
  }
}

export const getProfilePictureURL = async (
  uid: string
): Promise<string | null> => {
  const storageRef = ref(storage, `profilePictures/${uid}`);
  try {
    const url = await getDownloadURL(storageRef);
    return url;
  } catch (error) {
    console.error("Error fetching profile picture:", error);
    return null;
  }
};

export async function getTopLevelCollections() {
  try {
    const collections = [
      "Campaigns",
      "Coupons",
      "Users",
      "Vendors",
    ]; // Manually specify collections for now
    console.log("Top-level collections:", collections);
    return collections;
  } catch (error) {
    console.error("Error fetching top-level collections:", error);
    throw error;
  }
}

export async function getDocumentsWithConditions(
  collectionName: string,
  conditions: QueryConstraint[]
) {
  try {
    const colRef = collection(db, collectionName);
    const q = query(colRef, ...conditions);
    const querySnapshot = await getDocs(q);

    const documents = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return documents;
  } catch (error) {
    console.error(
      `Error fetching documents from collection ${collectionName}:`,
      error
    );
    throw error;
  }
}

interface OrganizationUserCounts {
  [organizationName: string]: number;
}

export async function getOrganizationUserCounts(): Promise<OrganizationUserCounts> {
  try {
    const organizationsRef = collection(db, "organizations");
    const organizationsSnapshot = await getDocs(organizationsRef);
    const organizationUserCounts: OrganizationUserCounts = {};

    for (const organizationDoc of organizationsSnapshot.docs) {
      const organizationData = organizationDoc.data();
      const organizationName = organizationData.abbreviation;

      const usersRef = collection(db, "users");
      const usersQuery = query(
        usersRef,
        where("organization", "==", organizationName)
      );
      const usersSnapshot = await getDocs(usersQuery);

      organizationUserCounts[organizationName] = usersSnapshot.size;
    }

    console.log("Organization user counts:", organizationUserCounts);
    return organizationUserCounts;
  } catch (error) {
    console.error("Error fetching organization user counts:", error);
    throw error;
  }
}

export async function getCouponUserCounts(): Promise<{
  [couponName: string]: number;
}> {
  try {
    const couponsRef = collection(db, "couponFRFR");
    const couponsSnapshot = await getDocs(couponsRef);

    const couponUserCounts: { [couponName: string]: number } = {};

    const usersRef = collection(db, "users");
    const usersSnapshot = await getDocs(usersRef);

    const userInventories: { [userId: string]: string[] } = {};

    for (const userDoc of usersSnapshot.docs) {
      const userInventoryRef = collection(db, `users/${userDoc.id}/inventory`);
      const userInventorySnapshot = await getDocs(userInventoryRef);
      userInventories[userDoc.id] = userInventorySnapshot.docs.map(
        (doc) => doc.id
      );
    }

    for (const couponDoc of couponsSnapshot.docs) {
      const couponData = couponDoc.data();
      const couponName = couponData.couponName;

      couponUserCounts[couponName] = 0;

      for (const userId in userInventories) {
        if (userInventories[userId].includes(couponDoc.id)) {
          couponUserCounts[couponName]++;
        }
      }
    }

    console.log("Coupon user counts:", couponUserCounts);
    return couponUserCounts;
  } catch (error) {
    console.error("Error fetching coupon user counts:", error);
    throw error;
  }
}

export async function getCouponUserCountsRedeemed(): Promise<{
  [couponName: string]: number;
}> {
  try {
    const couponsRef = collection(db, "couponFRFR");
    const couponsSnapshot = await getDocs(couponsRef);

    const couponUserCounts: { [couponName: string]: number } = {};

    const usersRef = collection(db, "users");
    const usersSnapshot = await getDocs(usersRef);

    const userInventories: { [userId: string]: any[] } = {};

    for (const userDoc of usersSnapshot.docs) {
      const userInventoryRef = collection(db, `users/${userDoc.id}/inventory`);
      const userInventorySnapshot = await getDocs(userInventoryRef);
      userInventories[userDoc.id] = userInventorySnapshot.docs.map((doc) => ({
        id: doc.id,
        data: doc.data(),
      }));
    }

    for (const couponDoc of couponsSnapshot.docs) {
      const couponData = couponDoc.data();
      const couponName = couponData.couponName;

      couponUserCounts[couponName] = 0;

      for (const userId in userInventories) {
        const userInventory = userInventories[userId];

        for (const inventoryItem of userInventory) {
          if (
            inventoryItem.id === couponDoc.id &&
            inventoryItem.data.redeemed
          ) {
            couponUserCounts[couponName]++;
            break;
          }
        }
      }
    }

    console.log("Coupon user counts:", couponUserCounts);
    return couponUserCounts;
  } catch (error) {
    console.error("Error fetching coupon user counts:", error);
    throw error;
  }
}

interface ChartData {
  month: string;
  campaigns: number;
}

export async function getActiveCampaignCounts(): Promise<ChartData[]> {
  try {
    const campaignsRef = collection(db, "campaign");
    const campaignsSnapshot = await getDocs(campaignsRef);

    const now = new Date();
    const currentYear = now.getFullYear();

    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const activeCampaignCounts: { [month: string]: number } = {};

    campaignsSnapshot.forEach((campaignDoc) => {
      const campaignData = campaignDoc.data() as DocumentData;
      const validFrom = campaignData.validFrom.toDate();
      const validTo = campaignData.validTo.toDate();

      for (let month = 0; month < 12; month++) {
        const startOfMonth = new Date(currentYear, month, 1);
        const endOfMonth = new Date(currentYear, month + 1, 0, 23, 59, 59, 999);

        if (validFrom <= endOfMonth && validTo >= startOfMonth) {
          const monthName = monthNames[month];
          if (!activeCampaignCounts[monthName]) {
            activeCampaignCounts[monthName] = 0;
          }
          activeCampaignCounts[monthName]++;
        }
      }
    });

    const campaignData: ChartData[] = monthNames.map((month) => ({
      month,
      campaigns: activeCampaignCounts[month] || 0,
    }));

    console.log("Active campaign counts:", campaignData);
    return campaignData;
  } catch (error) {
    console.error("Error fetching active campaign counts:", error);
    throw error;
  }
}

export interface AuditData {
  id: string;
  action: string;
  object: string;
  time: Date;
  user: string;
  [key: string]: any;
}

export async function getAuditInfo(): Promise<AuditData[]> {
  try {
    const auditRef = collection(db, "audit");
    const auditSnapshot = await getDocs(auditRef);

    const auditData: AuditData[] = auditSnapshot.docs.map((doc) => {
      const data = doc.data() as DocumentData;
      return {
        id: doc.id,
        action: data.action,
        object: data.object,
        time: data.time.toDate(),
        user: data.user,
        ...data,
      };
    });

    console.log("Audit data:", auditData);
    return auditData;
  } catch (error) {
    console.error("Error fetching audit info:", error);
    throw error;
  }
}

export function getCampaignDetailsRealtime(
  campaignId: string,
  callback: (data: any) => void
): void {
  const campaignRef = firestoreDoc(db, "campaign", campaignId);

  onSnapshot(
    campaignRef,
    (campaignDoc) => {
      if (campaignDoc.exists()) {
        callback(campaignDoc.data());
      } else {
        console.error("No campaign found with this id.");
      }
    },
    (error) => {
      console.error("Error fetching campaign details:", error);
    }
  );
}

export function getAuditInfoRealtime(
  callback: (data: AuditData[]) => void
): void {
  const auditRef = collection(db, "audit");
  const auditQuery = query(auditRef, orderBy("time", "desc"));

  onSnapshot(
    auditQuery,
    (snapshot) => {
      const audits: AuditData[] = snapshot.docs.map((doc) => {
        const data = doc.data() as DocumentData;
        return {
          id: doc.id,
          action: data.action,
          object: data.object,
          time: data.time.toDate(),
          user: data.user,
          ...data,
        };
      });

      callback(audits);
    },
    (error) => {
      console.error("Error fetching audit info:", error);
    }
  );
}

export async function getCountOfDocumentsByField(
  collectionName: string,
  field: string,
  metric: string,
  isTimeField: boolean = false,
  duration?: { start: Date; end: Date }
): Promise<Record<string, number>> {
  console.log("Function getCountOfDocumentsByField called with:", { collectionName, field, metric });

  const fieldCounts: Record<string, number> = {};
  const fieldDurations: Record<string, number[]> = {};

  const collectionRef = collection(db, collectionName);
  const snapshot = await getDocs(collectionRef);
  console.log("Total documents fetched:", snapshot.size);

  if (collectionName === "couponFRFR" && metric === "Issuance count") {
    try {
      const notificationsRef = collection(db, "notifications");
      const notificationsSnapshot = await getDocs(notificationsRef);
      console.log("Notifications fetched:", notificationsSnapshot.size);

      for (const notificationDoc of notificationsSnapshot.docs) {
        const notificationData = notificationDoc.data();
        const couponId = notificationData.couponID;
        const campaignId = notificationData.campaignID;

        const fieldValue = field === "couponName" ? couponId : campaignId;

        if (!fieldCounts[fieldValue]) {
          fieldCounts[fieldValue] = 0;
        }

        const notifReceiversRef = collection(
          db,
          `notifications/${notificationDoc.id}/notifReceivers`
        );
        const notifReceiversSnapshot = await getDocs(notifReceiversRef);
        console.log("Receivers for notification:", notificationDoc.id, ":", notifReceiversSnapshot.size);

        fieldCounts[fieldValue] += notifReceiversSnapshot.size;
        console.log("Updated count for fieldValue", fieldValue, ":", fieldCounts[fieldValue]);
      }
    } catch (error) {
      console.error("Error fetching notifications or receivers:", error);
    }
  } else if (collectionName === "users" && metric === "Issuance count") {
    try {
      const notificationsRef = collection(db, "notifications");
      const notificationsSnapshot = await getDocs(notificationsRef);
      console.log("Notifications fetched:", notificationsSnapshot.size);

      for (const notificationDoc of notificationsSnapshot.docs) {
        const notifReceiversRef = collection(
          db,
          `notifications/${notificationDoc.id}/notifReceivers`
        );
        const notifReceiversSnapshot = await getDocs(notifReceiversRef);
        console.log("Receivers for notification:", notificationDoc.id, ":", notifReceiversSnapshot.size);

        for (const notifReceiverDoc of notifReceiversSnapshot.docs) {
          const userId = notifReceiverDoc.id;
          const userDocRef = firestoreDoc(db, "users", userId);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const userData = userDoc.data();
            const fieldValue = userData[field];

            if (!fieldCounts[fieldValue]) {
              fieldCounts[fieldValue] = 0;
            }

            fieldCounts[fieldValue]++;
            console.log("Updated count for fieldValue", fieldValue, ":", fieldCounts[fieldValue]);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching notifications or receivers:", error);
    }
  } else if (collectionName === "couponFRFR" && metric === "Redemption count") {
    try {
      const usersRef = collection(db, "users");
      const usersSnapshot = await getDocs(usersRef);
      console.log("Users fetched:", usersSnapshot.size);

      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        const userInventoryRef = collection(db, `users/${userId}/inventory`);
        const userInventorySnapshot = await getDocs(userInventoryRef);

        for (const inventoryDoc of userInventorySnapshot.docs) {
          const inventoryData = inventoryDoc.data();
          if (inventoryData.redeemed) {
            const couponId = inventoryDoc.id;
            const couponDocRef = firestoreDoc(db, "couponFRFR", couponId);
            const couponDoc = await getDoc(couponDocRef);

            if (couponDoc.exists()) {
              const couponData = couponDoc.data();
              const fieldValue = couponData[field];

              if (!fieldCounts[fieldValue]) {
                fieldCounts[fieldValue] = 0;
              }

              fieldCounts[fieldValue]++;
              console.log("Updated redemption count for fieldValue", fieldValue, ":", fieldCounts[fieldValue]);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error fetching user inventories or coupons:", error);
    }
  } else {
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const fieldValue = data[field];

      if (field) {
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
                  const duration = (validTo.getTime() - validFrom.getTime()) / (1000 * 60 * 60 * 24);

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
                }
                break;
              case "users":
                switch (metric) {
                  case "Redemption count":
                    const userInventoryRef = collection(
                      db,
                      `users/${doc.id}/inventory`
                    );
                    const userInventorySnapshot = await getDocs(userInventoryRef);

                    userInventorySnapshot.forEach((inventoryDoc) => {
                      const inventoryData = inventoryDoc.data();
                      if (inventoryData.redeemed) {
                        if (!fieldCounts[fieldValue]) {
                          fieldCounts[fieldValue] = 0;
                        }
                        fieldCounts[fieldValue]++;
                      }
                    });
                    break;

                  case "Count of users":
                    if (!fieldCounts[fieldValue]) {
                      fieldCounts[fieldValue] = 0;
                    }
                    fieldCounts[fieldValue]++;
                    break;

                  default:
                    break;
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
  }

  if (metric === "Average duration of campaigns") {
    Object.keys(fieldDurations).forEach((key) => {
      const durations = fieldDurations[key];
      const averageDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      fieldCounts[key] = parseFloat(averageDuration.toFixed(2));
    });
  }

  return fieldCounts;
}






interface ChartDataCoupons {
  month: string;
  redemptions: number;
}

export async function getMonthlyRedemptionCount(): Promise<ChartDataCoupons[]> {
  try {
    const usersRef = collection(db, "users");
    const usersSnapshot = await getDocs(usersRef);

    const now = new Date();
    const currentYear = now.getFullYear();

    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const monthlyRedemptionCounts: { [month: string]: number } = {};

    for (const userDoc of usersSnapshot.docs) {
      const inventoryRef = collection(db, `users/${userDoc.id}/inventory`);
      const inventorySnapshot = await getDocs(inventoryRef);

      inventorySnapshot.forEach((inventoryDoc) => {
        const inventoryData = inventoryDoc.data() as DocumentData;

        if (inventoryData.redeemed) {
          const redeemedDate = inventoryData.redeemed.toDate();

          if (redeemedDate.getFullYear() === currentYear) {
            const monthName = monthNames[redeemedDate.getMonth()];
            if (!monthlyRedemptionCounts[monthName]) {
              monthlyRedemptionCounts[monthName] = 0;
            }
            monthlyRedemptionCounts[monthName]++;
          }
        }
      });
    }

    const redemptionData: ChartDataCoupons[] = monthNames.map((month) => ({
      month,
      redemptions: monthlyRedemptionCounts[month] || 0,
    }));

    console.log("Monthly redemption counts:", redemptionData);
    return redemptionData;
  } catch (error) {
    console.error("Error fetching monthly redemption counts:", error);
    throw error;
  }
}

interface ChartDataCouponsIssued {
  month: string;
  issued: number;
}

export async function getMonthlyCouponIssuanceCount(): Promise<
  ChartDataCouponsIssued[]
> {
  try {
    const notificationsRef = collection(db, "notifications");
    const notificationsSnapshot = await getDocs(notificationsRef);

    const now = new Date();
    const currentYear = now.getFullYear();

    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const monthlyIssuanceCounts: { [month: string]: number } = {};

    for (const notificationDoc of notificationsSnapshot.docs) {
      const notificationData = notificationDoc.data() as DocumentData;
      const dateCreated = notificationData.dateCreated.toDate();

      if (dateCreated.getFullYear() === currentYear) {
        const monthName = monthNames[dateCreated.getMonth()];
        if (!monthlyIssuanceCounts[monthName]) {
          monthlyIssuanceCounts[monthName] = 0;
        }

        const notifReceiversRef = collection(
          db,
          `notifications/${notificationDoc.id}/notifReceivers`
        );
        const notifReceiversSnapshot = await getDocs(notifReceiversRef);
        monthlyIssuanceCounts[monthName] += notifReceiversSnapshot.size;
      }
    }

    const issuanceData: ChartDataCouponsIssued[] = monthNames.map((month) => ({
      month,
      issued: monthlyIssuanceCounts[month] || 0,
    }));

    console.log("Monthly coupon issuance counts:", issuanceData);
    return issuanceData;
  } catch (error) {
    console.error("Error fetching monthly coupon issuance counts:", error);
    throw error;
  }
}

export interface UserData {
  id: string;
  email: string;
  organization: string;
  role: string;
  username: string;
  createdAt: Date;
  [key: string]: any;
}

export async function getAllUsers(): Promise<UserData[]> {
  try {
    const usersRef = collection(db, "users");
    const usersSnapshot = await getDocs(usersRef);

    const usersData: UserData[] = usersSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        email: data.email,
        organization: data.organization,
        role: data.role,
        username: data.username,
        createdAt: data.createdAt.toDate(),
        ...data,
      };
    });

    console.log("All users data:", usersData);
    return usersData;
  } catch (error) {
    console.error("Error fetching all users:", error);
    throw error;
  }
}

export function getTotalNotificationReceiversRealtime(
  callback: (
    totalReceiversCurrentMonth: number,
    totalReceiversLastMonth: number,
    percentageDifference: number
  ) => void
): void {
  const notificationsCollection = collection(db, "notifications");

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfMonthTimestamp = Timestamp.fromDate(startOfMonth);

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
        const notifReceiversCollection = collection(
          db,
          `notifications/${notificationDoc.id}/notifReceivers`
        );
        const notifReceiversSnapshot = await getDocs(notifReceiversCollection);
        totalReceiversCurrentMonth += notifReceiversSnapshot.size;
      }

      if (
        notificationDateCreated >= startOfLastMonthTimestamp.toMillis() &&
        notificationDateCreated <= endOfLastMonthTimestamp.toMillis()
      ) {
        const notifReceiversCollection = collection(
          db,
          `notifications/${notificationDoc.id}/notifReceivers`
        );
        const notifReceiversSnapshot = await getDocs(notifReceiversCollection);
        totalReceiversLastMonth += notifReceiversSnapshot.size;
      }
    });

    await Promise.all(promises);

    let percentageDifference;
    if (totalReceiversLastMonth > 0) {
      percentageDifference =
        ((totalReceiversCurrentMonth - totalReceiversLastMonth) /
          totalReceiversLastMonth) *
        100;
    } else if (totalReceiversCurrentMonth > 0) {
      percentageDifference = totalReceiversCurrentMonth * 100;
    } else {
      percentageDifference = 0;
    }

    callback(
      totalReceiversCurrentMonth,
      totalReceiversLastMonth,
      percentageDifference
    );
  });
}


interface ActiveUsersData {
  currentHour: string[];
  previousHour: string[];
  percentageDifference: number;
}

export async function getActiveUsersInPastTwoHours(): Promise<ActiveUsersData> {
  try {
    const allActivitySnapshot = await getDocs(collection(db, "analytics"));

    const now = new Date();
    const oneHourAgo = Timestamp.fromDate(
      new Date(now.getTime() - 60 * 60 * 1000)
    );
    const twoHoursAgo = Timestamp.fromDate(
      new Date(now.getTime() - 2 * 60 * 60 * 1000)
    );

    const currentHourActiveUserIds: Set<string> = new Set();
    const previousHourActiveUserIds: Set<string> = new Set();

    allActivitySnapshot.forEach((doc) => {
      const data = doc.data();
      const lastActive = data.last_active?.toDate();
      if (lastActive) {
        if (lastActive > oneHourAgo.toDate() && data.userId) {
          currentHourActiveUserIds.add(data.userId);
        } else if (
          lastActive > twoHoursAgo.toDate() &&
          lastActive <= oneHourAgo.toDate() &&
          data.userId
        ) {
          previousHourActiveUserIds.add(data.userId);
        }
      }
    });

    const currentHourActiveUsersArray = Array.from(currentHourActiveUserIds);
    const previousHourActiveUsersArray = Array.from(previousHourActiveUserIds);

    const currentHourCount = currentHourActiveUsersArray.length;
    const previousHourCount = previousHourActiveUsersArray.length;

    const percentageDifference =
      previousHourCount === 0
        ? currentHourCount > 0
          ? 100
          : 0
        : ((currentHourCount - previousHourCount) / previousHourCount) * 100;

    console.log("Active users in the past hour:", currentHourActiveUsersArray);
    console.log(
      "Active users in the previous hour:",
      previousHourActiveUsersArray
    );
    console.log("Percentage difference:", percentageDifference);

    return {
      currentHour: currentHourActiveUsersArray,
      previousHour: previousHourActiveUsersArray,
      percentageDifference,
    };
  } catch (error) {
    console.error("Error retrieving active users:", error);
    throw error;
  }
}

export {
  auth,
  db,
  storage,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  updateEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  sendEmailVerification,
};
