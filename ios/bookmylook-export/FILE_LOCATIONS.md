# 📂 BookMyLook - Complete File Locations Guide

## 🗂️ **Root Directory Structure**

Your project is located in the Replit workspace. Here are all the important files and folders:

---

## 📱 **ANDROID FILES** (Most Important for APK)

### Main Android Folder
```
android/
├── app/
│   ├── build.gradle                    ⭐ VERSION INFO (v2.5.13, code 32)
│   ├── src/
│   │   └── main/
│   │       ├── AndroidManifest.xml     ⭐ App permissions & settings
│   │       ├── res/                    App resources (icons, colors)
│   │       └── assets/                 Web app files
├── bookmylook-new.keystore             ⭐ SIGNING KEYSTORE (CRITICAL!)
├── bookmylook-release.keystore         Old keystore (backup)
├── build.gradle                        ⭐ Android build configuration
├── gradle.properties                   Gradle settings
├── gradlew                            Gradle wrapper (Unix)
├── gradlew.bat                        Gradle wrapper (Windows)
└── settings.gradle                    Project settings
```

**🔑 Keystore Location (MOST IMPORTANT):**
- **Path:** `android/bookmylook-new.keystore`
- **Password:** `BookMyLook2025`
- **Alias:** `bookmylook`

---

## ⚙️ **CONFIGURATION FILES** (Root Directory)

### Capacitor Configuration
```
capacitor.config.ts                     ⭐ Capacitor setup (package ID, app name)
```

### Build & TypeScript Configuration
```
package.json                           NPM dependencies & scripts
package-lock.json                      Locked dependency versions
tsconfig.json                          TypeScript configuration
vite.config.ts                         Vite build configuration
tailwind.config.ts                     Tailwind CSS configuration
postcss.config.js                      PostCSS configuration
drizzle.config.ts                      Database configuration
components.json                        shadcn/ui components config
```

---

## 🌐 **WEB APP SOURCE CODE**

### Frontend (Client)
```
client/
├── src/
│   ├── pages/                         All app pages
│   │   ├── home.tsx
│   │   ├── providers.tsx
│   │   ├── booking.tsx
│   │   └── ...
│   ├── components/                    Reusable components
│   │   ├── mobile-navigation-new.tsx  ⭐ Main hamburger menu
│   │   ├── layout/
│   │   │   └── header.tsx            ⭐ Header hamburger menu
│   │   └── standalone-hamburger.tsx   ⭐ Standalone hamburger
│   ├── lib/                          Utilities & helpers
│   │   └── config.ts                 ⭐ API URL configuration
│   ├── hooks/                        React hooks
│   └── contexts/                     React contexts
└── index.html                         Main HTML file
```

### Backend (Server)
```
server/
├── index.ts                           Main server file
├── routes.ts                          ⭐ API routes
├── storage.ts                         Database storage interface
└── vite.ts                            Vite server setup
```

### Shared
```
shared/
└── schema.ts                          ⭐ Database schema (Drizzle ORM)
```

---

## 🔨 **BUILD OUTPUT** (Generated)

```
dist/                                  Built production files
├── public/                           ⭐ Web assets synced to Android
│   ├── index.html
│   └── assets/
│       ├── index-*.css
│       └── index-*.js
└── index.js                          Server bundle
```

---

## 📋 **DOCUMENTATION & INSTRUCTIONS**

```
APK_BUILD_INSTRUCTIONS.md              ⭐ Latest APK build guide (v2.5.13)
APK-BUILD-GUIDE-VERIFIED.txt           Previous build guide
replit.md                              Project documentation
VERIFICATION-CHECKLIST-v4.md           Verification checklist
```

---

## 🎯 **FILES UPDATED FOR v2.5.13**

These files contain the new Play Store share link:

1. ✅ `client/src/components/mobile-navigation-new.tsx`
2. ✅ `client/src/components/layout/header.tsx`  
3. ✅ `client/src/components/standalone-hamburger.tsx`
4. ✅ `android/app/build.gradle` (version updated to 32/2.5.13)

---

## 📦 **HOW TO ACCESS THESE FILES**

### Option 1: Download from Replit

**Download entire project:**
1. Click on the 3-dot menu (⋮) in Replit file explorer
2. Select "Download as zip"
3. Extract the zip file on your computer

**Download specific folder:**
1. Right-click on `android` folder
2. Select "Download"

### Option 2: Git Clone (if you have Git access)

```bash
git clone <your-replit-git-url>
```

### Option 3: Use Replit Shell

You can create a compressed archive:

```bash
# Create archive of android folder
tar -czf android-v2.5.13.tar.gz android/

# Create archive of entire project
tar -czf bookmylook-v2.5.13-complete.tar.gz .
```

Then download the `.tar.gz` file from the file explorer.

---

## 🚀 **BUILDING THE APK**

### Prerequisites on Your Computer:
- ✅ Android Studio installed
- ✅ JDK 11+ installed
- ✅ Project files downloaded

### Steps:
1. **Download the `android/` folder** from Replit
2. **Open Android Studio**
3. **Open Project** → Select the `android` folder
4. **Build** → **Generate Signed Bundle/APK**
5. Use the keystore at `android/bookmylook-new.keystore`
6. Password: `BookMyLook2025`, Alias: `bookmylook`

**Output APK:**
`android/app/build/outputs/apk/release/app-release.apk`

---

## 🔐 **CRITICAL FILES - BACKUP THESE!**

These files are ESSENTIAL and should be backed up:

1. ⭐⭐⭐ `android/bookmylook-new.keystore` - WITHOUT THIS, YOU CAN'T UPDATE THE APP!
2. ⭐⭐ `android/app/build.gradle` - Version information
3. ⭐⭐ `capacitor.config.ts` - Package ID configuration
4. ⭐ `shared/schema.ts` - Database schema

---

## 📱 **PACKAGE INFORMATION**

- **Package ID:** `com.bookmylook.app` (NEVER CHANGES)
- **App Name:** `BookMyLook`
- **Current Version Code:** 32
- **Current Version Name:** 2.5.13
- **Play Store Link:** https://play.google.com/store/apps/details?id=com.bookmylook.app

---

## 🆘 **NEED THE FILES NOW?**

I can create a compressed archive with all the essential files for you. Just let me know!

**Archive options:**
1. ✅ Android folder only (for APK building)
2. ✅ Complete project (all source code)
3. ✅ Essential files only (config + android + keystore)
