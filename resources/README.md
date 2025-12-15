# App Icons and Splash Screens

This directory contains app icons and splash screens for iOS and Android.

## Required Assets

### App Icon
- **iOS**: 1024x1024px PNG (required for App Store)
- **Android**: 512x512px PNG (required for Play Store)
- **Source**: Create a high-resolution icon (at least 1024x1024px) with your app logo

### Splash Screen
- **iOS**: 2732x2732px PNG (or use vector assets)
- **Android**: 2732x2732px PNG (or use vector assets)
- **Source**: Create a splash screen image with your app branding

## Icon Generation Tools

You can use online tools to generate all required icon sizes:
- [AppIcon.co](https://www.appicon.co/)
- [IconKitchen](https://icon.kitchen/)
- [MakeAppIcon](https://makeappicon.com/)

## Placement

After generating icons:
1. Place the source icon (1024x1024px) in `resources/icon/icon.png`
2. Place the source splash (2732x2732px) in `resources/splash/splash.png`
3. Run `npx cap sync` to copy assets to native projects

## Manual Setup

If you prefer manual setup:
- **iOS**: Add icons to `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
- **Android**: Add icons to `android/app/src/main/res/` in appropriate mipmap folders

