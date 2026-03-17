# Firebase Setup

## 1. Create a Firebase project

Enable:

- Authentication with `Email/Password`
- Firestore Database
- Storage

## 2. Add environment variables

Copy `.env.example` to `.env.local` and fill in:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_SHARED_RESOURCES_DRIVE_URL=
```

## 3. Deploy Firestore and Storage rules

Use the included files:

- `firestore.rules`
- `storage.rules`
- `firebase.json`

Deploy them to your Firebase project:

```bash
npx firebase-tools login
npx firebase-tools deploy --project campustutor1 --only firestore:rules,storage
```

Important:

- Editing `firestore.rules` locally does not change Firebase by itself.
- The app will still get `permission-denied` until the rules are deployed to `campustutor1`.
- If you have not created Firestore yet in Firebase Console, do that first before testing the app.

## 4. Recommended collections

- `users/{uid}`
- `tutorProfiles/{uid}`
- `bookings/{bookingId}`
- `reviews/{reviewId}`

## 5. Suggested flow

1. Create a learner or tutor account from the app.
2. If you sign up as a tutor, complete `/tutor/profile`.
3. Tutor profiles become discoverable from `/search-tutors`.
4. Learners can then book tutors and leave reviews.
