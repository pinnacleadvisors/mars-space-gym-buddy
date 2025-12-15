# Mobile App Store Deployment Guide

This guide walks you through deploying your Mars Space Gym app to the Apple App Store and Google Play Store.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Developer Account Setup](#developer-account-setup)
3. [Development Environment Setup](#development-environment-setup)
4. [App Icons and Splash Screens](#app-icons-and-splash-screens)
5. [iOS Deployment](#ios-deployment)
6. [Android Deployment](#android-deployment)
7. [Post-Deployment](#post-deployment)

---

## Prerequisites

Before starting, ensure you have:

- ✅ macOS (required for iOS development)
- ✅ Xcode 15+ installed (from Mac App Store)
- ✅ Android Studio installed
- ✅ Node.js and npm installed
- ✅ Your app builds successfully: `npm run build`

---

## Developer Account Setup

### Apple Developer Account

1. **Sign up for Apple Developer Program**
   - Go to [developer.apple.com](https://developer.apple.com/programs/)
   - Click "Enroll" and follow the registration process
   - Cost: $99/year
   - Processing time: Usually 24-48 hours

2. **Verify Your Account**
   - Check your email for verification
   - Complete any required identity verification

3. **Access App Store Connect**
   - Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
   - Sign in with your Apple ID
   - Accept the App Store Connect agreement

### Google Play Developer Account

1. **Sign up for Google Play Console**
   - Go to [play.google.com/console](https://play.google.com/console)
   - Click "Get Started" and create an account
   - Cost: $25 one-time payment
   - Processing time: Usually instant

2. **Complete Account Setup**
   - Provide developer information
   - Accept the Developer Distribution Agreement
   - Pay the registration fee

---

## Development Environment Setup

### iOS Setup (macOS Only)

1. **Install Xcode**
   ```bash
   # Download from Mac App Store or:
   xcode-select --install
   ```

2. **Install CocoaPods** (if not already installed)
   ```bash
   sudo gem install cocoapods
   ```

3. **Install iOS Dependencies**
   ```bash
   cd ios/App
   pod install
   cd ../..
   ```

4. **Open iOS Project**
   ```bash
   npm run cap:ios
   # Or manually:
   open ios/App/App.xcworkspace
   ```

### Android Setup

1. **Install Android Studio**
   - Download from [developer.android.com/studio](https://developer.android.com/studio)
   - Install Android SDK (API 24+ recommended)
   - Install Android SDK Build-Tools

2. **Set Environment Variables** (if needed)
   ```bash
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/tools
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```

3. **Open Android Project**
   ```bash
   npm run cap:android
   # Or manually open android/ folder in Android Studio
   ```

---

## App Icons and Splash Screens

### Generate App Icons

1. **Create Source Icon**
   - Design a 1024x1024px PNG icon with your app logo
   - Ensure it follows platform guidelines:
     - **iOS**: No transparency, square design
     - **Android**: Can have transparency, adaptive icon support

2. **Generate All Sizes**
   - Use an online tool:
     - [AppIcon.co](https://www.appicon.co/)
     - [IconKitchen](https://icon.kitchen/)
     - [MakeAppIcon](https://makeappicon.com/)
   - Or use command-line tools

3. **Place Icons**

   **For iOS:**
   - Open `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
   - Replace all icon sizes in the Contents.json structure
   - Or use Xcode's AppIcon asset catalog (recommended)

   **For Android:**
   - Icons go in `android/app/src/main/res/`:
     - `mipmap-mdpi/ic_launcher.png` (48x48)
     - `mipmap-hdpi/ic_launcher.png` (72x72)
     - `mipmap-xhdpi/ic_launcher.png` (96x96)
     - `mipmap-xxhdpi/ic_launcher.png` (144x144)
     - `mipmap-xxxhdpi/ic_launcher.png` (192x192)
   - Also create round icons: `ic_launcher_round.png` in each folder

### Generate Splash Screens

1. **Create Source Splash**
   - Design a 2732x2732px PNG splash screen
   - Keep it simple with your app logo/branding

2. **Place Splash Screens**

   **For iOS:**
   - Update `ios/App/App/Assets.xcassets/Splash.imageset/`
   - Or modify `ios/App/App/Base.lproj/LaunchScreen.storyboard`

   **For Android:**
   - Update splash screen in `android/app/src/main/res/values/styles.xml`
   - Or use a dedicated splash activity

---

## iOS Deployment

### Step 1: Configure Xcode Project

1. **Open Project in Xcode**
   ```bash
   npm run cap:ios
   # Or: open ios/App/App.xcworkspace
   ```

2. **Set Bundle Identifier**
   - Select the "App" project in the navigator
   - Go to "Signing & Capabilities" tab
   - Set Bundle Identifier: `com.marsspacegym.app`
   - Ensure it matches your App Store Connect app

3. **Configure Signing**
   - Select your Team (Apple Developer account)
   - Xcode will automatically manage provisioning profiles
   - Or manually select a provisioning profile

4. **Set Version and Build Number**
   - General tab → Version: `1.0.0` (or your version)
   - General tab → Build: `1` (increment for each submission)

5. **Configure App Capabilities**
   - Ensure Camera permission is enabled
   - Add any other required capabilities

### Step 2: Build for App Store

1. **Select Generic iOS Device or "Any iOS Device"**
   - In Xcode's device selector (top toolbar)

2. **Archive the App**
   - Product → Archive
   - Wait for the archive to complete
   - Organizer window will open automatically

3. **Validate the Archive**
   - In Organizer, click "Validate App"
   - Fix any issues that arise
   - This checks for common submission problems

4. **Distribute the App**
   - Click "Distribute App"
   - Select "App Store Connect"
   - Choose "Upload"
   - Select your distribution certificate
   - Click "Upload"
   - Wait for upload to complete (can take 10-30 minutes)

### Step 3: Create App Store Connect Listing

1. **Create New App**
   - Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
   - Click "My Apps" → "+" → "New App"
   - Fill in:
     - **Platform**: iOS
     - **Name**: Mars Space Gym
     - **Primary Language**: English
     - **Bundle ID**: com.marsspacegym.app
     - **SKU**: marsspacegym-ios (unique identifier)
     - **User Access**: Full Access

2. **App Information**
   - Fill in app description, keywords, support URL
   - Upload app icon (1024x1024px)
   - Set age rating
   - Add privacy policy URL (required)

3. **Pricing and Availability**
   - Set price (Free or Paid)
   - Select countries/regions
   - Set availability date

4. **Prepare for Submission**
   - Wait for build to process (can take 1-2 hours)
   - Once build appears, select it for submission
   - Add screenshots (required):
     - iPhone 6.7" Display (1290 x 2796 pixels)
     - iPhone 6.5" Display (1242 x 2688 pixels)
     - iPhone 5.5" Display (1242 x 2208 pixels)
     - iPad Pro 12.9" (2048 x 2732 pixels)
   - Add app preview videos (optional)
   - Complete App Review Information
   - Add contact information

5. **Submit for Review**
   - Review all information
   - Click "Submit for Review"
   - Wait for review (typically 1-3 days)

### Step 4: App Review Process

- Apple will review your app for:
  - Guideline compliance
  - Functionality
  - Content appropriateness
- You'll receive email notifications about status
- If rejected, address issues and resubmit

---

## Android Deployment

### Step 1: Generate Signing Key

1. **Create Keystore**
   ```bash
   keytool -genkey -v -keystore mars-space-gym-release.keystore -alias mars-space-gym -keyalg RSA -keysize 2048 -validity 10000
   ```
   - Enter a strong password (save it securely!)
   - Fill in certificate information
   - **IMPORTANT**: Keep this keystore file safe - you'll need it for all future updates

2. **Store Keystore Securely**
   - Place in a secure location (not in git!)
   - Back it up to multiple secure locations
   - Document the password in a password manager

### Step 2: Configure Signing in Android Studio

1. **Open Android Project**
   ```bash
   npm run cap:android
   # Or open android/ folder in Android Studio
   ```

2. **Create keystore.properties** (in android/ folder)
   ```properties
   storePassword=YOUR_KEYSTORE_PASSWORD
   keyPassword=YOUR_KEY_PASSWORD
   keyAlias=mars-space-gym
   storeFile=../mars-space-gym-release.keystore
   ```

3. **Update build.gradle**
   - Open `android/app/build.gradle`
   - Add signing config:
   ```gradle
   android {
       ...
       signingConfigs {
           release {
               def keystorePropertiesFile = rootProject.file("keystore.properties")
               def keystoreProperties = new Properties()
               if (keystorePropertiesFile.exists()) {
                   keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
                   storeFile file(keystoreProperties['storeFile'])
                   storePassword keystoreProperties['storePassword']
                   keyAlias keystoreProperties['keyAlias']
                   keyPassword keystoreProperties['keyPassword']
               }
           }
       }
       buildTypes {
           release {
               signingConfig signingConfigs.release
               minifyEnabled false
               proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
           }
       }
   }
   ```

### Step 3: Build Release APK/AAB

1. **Build App Bundle (Recommended)**
   ```bash
   cd android
   ./gradlew bundleRelease
   ```
   - Output: `app/build/outputs/bundle/release/app-release.aab`

2. **Or Build APK** (alternative)
   ```bash
   ./gradlew assembleRelease
   ```
   - Output: `app/build/outputs/apk/release/app-release.apk`

### Step 4: Create Google Play Console Listing

1. **Create New App**
   - Go to [play.google.com/console](https://play.google.com/console)
   - Click "Create app"
   - Fill in:
     - **App name**: Mars Space Gym
     - **Default language**: English
     - **App or game**: App
     - **Free or paid**: Free (or Paid)
     - **Declarations**: Complete all required

2. **Set Up App Content**
   - Complete content rating questionnaire
   - Add privacy policy URL (required)
   - Set up data safety information
   - Add target audience

3. **Store Listing**
   - **App icon**: 512x512px PNG
   - **Feature graphic**: 1024x500px
   - **Screenshots** (required):
     - Phone: At least 2 (min 320px, max 3840px height)
     - Tablet: At least 1 (7" and 10" tablets)
   - **Short description**: 80 characters max
   - **Full description**: 4000 characters max
   - **App category**: Select appropriate category

4. **Upload App Bundle**
   - Go to "Production" → "Create new release"
   - Upload your `.aab` file
   - Add release notes
   - Review and roll out

### Step 5: Complete Store Listing

1. **Pricing and Distribution**
   - Set price (if paid)
   - Select countries
   - Set content rating

2. **App Access**
   - Set if app requires sign-in
   - Configure access restrictions if needed

3. **Review and Publish**
   - Review all information
   - Click "Submit for review"
   - Wait for review (typically 1-7 days)

---

## Post-Deployment

### Updating Your App

**For iOS:**
1. Increment build number in Xcode
2. Build and archive
3. Upload new build to App Store Connect
4. Create new version in App Store Connect
5. Submit for review

**For Android:**
1. Increment `versionCode` in `android/app/build.gradle`
2. Update `versionName`
3. Build new AAB: `./gradlew bundleRelease`
4. Upload to Play Console
5. Create new release and submit

### Building for Mobile

Always use the Capacitor build process:

```bash
# 1. Build web app
npm run build

# 2. Sync to native projects
npm run cap:sync

# 3. Open in native IDE
npm run cap:ios    # Opens Xcode
npm run cap:android # Opens Android Studio
```

### Environment Variables

For mobile builds, ensure you set:
- `CAPACITOR=true` when building for mobile (optional, handled automatically)
- Supabase environment variables are already configured in your app

### Testing Checklist

Before submitting, test:

- [ ] App launches successfully
- [ ] Authentication works (login/register)
- [ ] QR code scanning works
- [ ] All navigation flows
- [ ] Offline behavior (if applicable)
- [ ] Push notifications (if implemented)
- [ ] App icons display correctly
- [ ] Splash screen displays
- [ ] Status bar styling is correct
- [ ] Camera permissions work
- [ ] Deep linking (if implemented)

---

## Troubleshooting

### iOS Issues

**"No signing certificate found"**
- Go to Xcode → Preferences → Accounts
- Add your Apple ID
- Download certificates

**"Bundle identifier already exists"**
- Change bundle identifier in Xcode
- Or use existing app in App Store Connect

**Build fails with CocoaPods errors**
```bash
cd ios/App
pod deintegrate
pod install
```

### Android Issues

**"Keystore file not found"**
- Verify keystore.properties path is correct
- Ensure keystore file exists

**"Gradle sync failed"**
```bash
cd android
./gradlew clean
```

**Build errors**
- Ensure Android SDK is properly installed
- Check minSdkVersion compatibility

### General Issues

**App doesn't load in native wrapper**
- Ensure `npm run build` completed successfully
- Run `npm run cap:sync` to copy web assets
- Check Capacitor config is correct

**QR Scanner doesn't work**
- Verify camera permissions are set in Info.plist (iOS) and AndroidManifest.xml (Android)
- Test on physical device (camera may not work in simulator)

---

## Additional Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Apple App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Policy](https://play.google.com/about/developer-content-policy/)
- [App Store Connect Help](https://help.apple.com/app-store-connect/)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer)

---

## Quick Reference Commands

```bash
# Build and sync
npm run build && npm run cap:sync

# Open native projects
npm run cap:ios
npm run cap:android

# Android release build
cd android && ./gradlew bundleRelease

# Check Capacitor version
npx cap --version
```

---

## Support

If you encounter issues:
1. Check Capacitor documentation
2. Review platform-specific guides
3. Check GitHub issues for Capacitor
4. Review app store submission guidelines

Good luck with your app store deployment! 🚀

