# Google Drive Upload Setup

## 1. Create or choose the shared folder

Create the Google Drive folder that should hold all CampusTutor resources.

Important:

- The people who upload must have edit access to this folder.
- Copy the folder ID from the URL. Example:
  `https://drive.google.com/drive/folders/FOLDER_ID`

## 2. Enable the Drive API

In Google Cloud Console:

1. Open `APIs & Services`
2. Click `Enable APIs and Services`
3. Enable `Google Drive API`

## 3. Create a Web OAuth client

In Google Cloud Console:

1. Open `APIs & Services > Credentials`
2. Create `OAuth client ID`
3. Choose `Web application`
4. Add authorized JavaScript origins, for example:
   - `http://localhost:3000`
   - your production domain later

Copy the OAuth client ID.

## 4. Add env variables

Add these values to `.env.local`:

```bash
NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID=
NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_ID=
NEXT_PUBLIC_SHARED_RESOURCES_DRIVE_URL=
```

Notes:

- `NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_ID` is the folder where uploads should go.
- `NEXT_PUBLIC_SHARED_RESOURCES_DRIVE_URL` can be the full folder link, but the app can also derive it from the folder ID.

## 5. Restart the app

After changing env variables, restart the dev server:

```bash
npm run dev
```

## 6. How the app organizes uploads

The in-app uploader creates missing folders automatically like:

```text
Root shared folder
  /100 Level
  /100 Level/MTH101 - Calculus
  /100 Level/MTH101 - Calculus/Lecture Notes
  /100 Level/MTH101 - Calculus/Past Questions
  /100 Level/MTH101 - Calculus/Past Questions/2024
```

## 7. Scope note

The app currently uses the Google Drive scope:

`https://www.googleapis.com/auth/drive`

This is the broadest option and makes in-app folder creation and uploads work reliably. If you want, this can be tightened later with a more constrained flow.
