# Codemagic iOS Build Setup Guide - BookMyLook

## 🎯 What You'll Achieve

Build your iOS app in the cloud **WITHOUT a Mac** and submit it to the App Store automatically!

**Time Required**: 30-45 minutes (one-time setup)

---

## 📋 Prerequisites Checklist

Before starting, make sure you have:

- ✅ **Apple Developer Account** ($99/year - you already have this!)
- ✅ **Access to developer.apple.com** (your Apple ID login)
- ✅ **GitHub Account** (free if you don't have one)
- ✅ **Your project code** (already in Replit)
- ✅ **Email access** (for verification codes)

---

## 🚀 STEP-BY-STEP SETUP

### PART 1: Push Your Code to GitHub (10 minutes)

#### Step 1.1: Create GitHub Repository

1. Go to https://github.com
2. Sign in (or create free account)
3. Click **"New repository"** (green button)
4. Repository name: `bookmylook-app`
5. Select **"Private"** (keep your code secure)
6. Click **"Create repository"**
7. **Leave the page open** - you'll need the URL

#### Step 1.2: Upload Your Code from Replit

In Replit, open the **Shell** and run these commands:

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit your code
git commit -m "Initial iOS app setup v2.7.1"

# Connect to your GitHub repository
# Replace YOUR_USERNAME with your actual GitHub username
git remote add origin https://github.com/YOUR_USERNAME/bookmylook-app.git

# Push code to GitHub
git branch -M main
git push -u origin main
```

**You may need to enter your GitHub username and password (or personal access token).**

✅ **Verify**: Go to your GitHub repository - you should see all your files there!

---

### PART 2: Get Apple Certificates (20 minutes)

**Important**: You'll do this on **developer.apple.com** - no Mac needed!

#### Step 2.1: Create App Store Connect API Key

This lets Codemagic access your Apple account securely.

1. Go to https://appstoreconnect.apple.com
2. Click **"Users and Access"** in top menu
3. Click **"Keys"** tab (under Integrations section)
4. Click **"+"** to generate new key
5. Fill in:
   - **Name**: `Codemagic CI`
   - **Access**: Check **"Developer"**
6. Click **"Generate**
7. **IMPORTANT - Download immediately**:
   - Click **"Download API Key"** button
   - File downloads: `AuthKey_XXXXXXXXXX.p8`
   - **SAVE THIS FILE** - You can't download it again!
8. **Note down** (you'll need these):
   - **Key ID**: (e.g., `AB12CD34EF`)
   - **Issuer ID**: (e.g., `12345678-1234-1234-1234-123456789012`)

✅ **You now have**: `AuthKey_XXXXXXXXXX.p8` file + Key ID + Issuer ID

#### Step 2.2: Create App ID in Developer Portal

1. Go to https://developer.apple.com/account
2. Click **"Certificates, Identifiers & Profiles"**
3. Click **"Identifiers"** in sidebar
4. Click **"+"** button (top right)
5. Select **"App IDs"** → Continue
6. Select **"App"** → Continue
7. Fill in:
   - **Description**: `BookMyLook Beauty Services`
   - **Bundle ID**: Select **"Explicit"** → Enter: `com.bookmylook.app`
8. Scroll down to **"Capabilities"**:
   - Check **"Push Notifications"** (if you use notifications)
9. Click **"Continue"** → **"Register"**

✅ **App ID created**: `com.bookmylook.app`

#### Step 2.3: Create App in App Store Connect

1. Go to https://appstoreconnect.apple.com
2. Click **"My Apps"**
3. Click **"+"** button → **"New App"**
4. Fill in:
   - **Platforms**: Check **"iOS"**
   - **Name**: `BookMyLook`
   - **Primary Language**: `English (U.S.)`
   - **Bundle ID**: Select `com.bookmylook.app` (from dropdown)
   - **SKU**: `BOOKMYLOOK2024` (any unique text)
   - **User Access**: `Full Access`
5. Click **"Create"**

✅ **App created** in App Store Connect - Ready for builds!

---

### PART 3: Setup Codemagic (10 minutes)

#### Step 3.1: Create Codemagic Account

1. Go to https://codemagic.io/signup
2. Click **"Sign up with GitHub"**
3. Authorize Codemagic to access your GitHub
4. **Select your plan**: Click **"Start free"** (500 minutes/month FREE)

✅ **Account created!**

#### Step 3.2: Add Your Repository

1. In Codemagic dashboard, click **"Add application"**
2. Select **"GitHub"**
3. Find and select your repository: `bookmylook-app`
4. Click **"Next"**
5. Select **"Capacitor"** as project type
6. Click **"Finish"**

✅ **Repository connected!**

#### Step 3.3: Configure iOS Code Signing

1. In your app settings, click **"Code signing identities"** in left sidebar
2. Scroll to **"iOS code signing"** section
3. Click **"Upload certificate"**
4. For automatic signing, select:
   - **"Automatic code signing"** (recommended)
   - Upload your **App Store Connect API Key**:
     - Click **"Choose file"** → Select the `AuthKey_XXXXXXXXXX.p8` file
     - Enter **Key ID** (from Step 2.1)
     - Enter **Issuer ID** (from Step 2.1)
5. Click **"Save"**

Codemagic will now automatically:
- Create certificates
- Create provisioning profiles
- Sign your app
- All without you needing a Mac!

✅ **Code signing configured!**

#### Step 3.4: Configure Build Settings

1. Click **"Start new build"** button
2. Click **"Edit workflow"** 
3. You'll see the `codemagic.yaml` configuration
4. Update **one line**:
   - Find: `your-email@example.com`
   - Replace with: **YOUR actual email** (to receive build notifications)
5. Click **"Save"**

✅ **Build configured!**

---

### PART 4: Build Your iOS App! (15 minutes build time)

#### Step 4.1: Start First Build

1. In Codemagic, click **"Start new build"**
2. Select:
   - **Workflow**: `ios-production`
   - **Branch**: `main`
3. Click **"Start new build"**

**Build starts!** ⏳

You'll see:
- ✅ Installing dependencies... (2 min)
- ✅ Building web app... (3 min)
- ✅ Installing CocoaPods... (2 min)
- ✅ Building iOS app... (5 min)
- ✅ Code signing... (1 min)
- ✅ Creating IPA file... (2 min)

**Total time**: ~15 minutes

#### Step 4.2: Monitor Build Progress

Watch the build logs in real-time:
- Green ✓ = Step completed
- Yellow ⏳ = Step in progress
- Red ✗ = Error (rare if setup correct)

#### Step 4.3: Download Your App

When build completes:

1. Build shows **"Success"** ✅
2. Click **"Artifacts"** tab
3. You'll see: `BookMyLook.ipa` file
4. Click **"Download"**

**Congratulations! You have your iOS app file!** 🎉

---

### PART 5: Submit to App Store (10 minutes)

#### Option A: Automatic Submission (Recommended)

Codemagic already submitted to TestFlight automatically!

1. Go to https://appstoreconnect.apple.com
2. Click **"My Apps"** → **"BookMyLook"**
3. Click **"TestFlight"** tab
4. You'll see your build: **Version 2.7.1 (55)**
5. Status: **"Processing"** (wait 5-10 minutes)
6. Status changes to: **"Ready to Submit"**

#### Option B: Manual Upload (if automatic fails)

1. Download **Transporter** app:
   - Windows: https://apps.microsoft.com/store/detail/transporter/9NQB3B9N7QZF
   - Linux: Use web upload at appstoreconnect.apple.com
2. Open Transporter
3. Sign in with your Apple ID
4. Click **"+"** → Select your `BookMyLook.ipa` file
5. Click **"Deliver"**
6. Wait for upload to complete

✅ **Build uploaded to App Store Connect!**

#### Step 5.2: Submit for Review

1. In App Store Connect, click **"App Store"** tab
2. Click **"+"** next to **"iOS App"**
3. Enter version: **2.7.1**
4. Fill in required info:
   - **What's New**: Describe your app features
   - **Screenshots**: Upload at least 3 screenshots per device size
   - **Description**: Your app description
   - **Keywords**: beauty, salon, spa, booking
   - **Support URL**: Your website
   - **Privacy Policy URL**: Your privacy policy
5. Click **"Add for Review"**
6. Click **"Submit for Review"**

✅ **Submitted to Apple!**

**Apple Review Time**: 24-48 hours

---

## 🎉 SUCCESS!

You've built your iOS app **without a Mac** using Codemagic!

---

## 🔄 Future Updates

When you need to update your app:

1. Make changes in Replit
2. Push to GitHub:
   ```bash
   git add .
   git commit -m "Update description"
   git push
   ```
3. In Codemagic, click **"Start new build"**
4. Wait 15 minutes
5. New version auto-submitted to App Store!

**Each build uses ~15 minutes of your 500 free minutes/month.**

---

## ❓ Troubleshooting

### Build Failed: "Provisioning profile error"
**Solution**: 
1. Go to Codemagic → Code signing
2. Re-upload your App Store Connect API key
3. Try build again

### Build Failed: "Pod install failed"
**Solution**:
1. In Replit, run: `cd ios/App && pod install`
2. Commit and push changes
3. Try build again

### Can't create App Store Connect API key
**Solution**:
1. Make sure you're the **Account Holder** or **Admin** role
2. Contact your team admin if you're just a developer role

### Build succeeded but no IPA file
**Solution**:
1. Check **Artifacts** tab carefully
2. Look for `build/ios/ipa/*.ipa`
3. Contact Codemagic support (they're very responsive)

---

## 📞 Support

- **Codemagic Docs**: https://docs.codemagic.io/yaml-quick-start/building-a-capacitor-app/
- **Codemagic Support**: support@codemagic.io (responds within 24h)
- **Capacitor iOS Docs**: https://capacitorjs.com/docs/ios

---

## ✅ Checklist

Before starting:
- [ ] Apple Developer account active
- [ ] GitHub account created
- [ ] Code pushed to GitHub

After setup:
- [ ] App Store Connect API key downloaded
- [ ] App ID created (com.bookmylook.app)
- [ ] App created in App Store Connect
- [ ] Codemagic account created
- [ ] Repository connected to Codemagic
- [ ] First build successful
- [ ] IPA file downloaded
- [ ] App submitted to App Store

---

**You're all set! Your iOS app is building in the cloud!** 🚀
