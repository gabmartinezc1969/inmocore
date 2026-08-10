# Onboarding App

React Native (Expo) recreation of a 4-slide fintech onboarding carousel:
**Master Your Money → Earn as You Spend → Smarter Investing → Bank-Level
Security**, each with a gradient background, a glossy vector illustration,
title/subtitle copy, paging dots, and `Sign up` / `Log in` actions.

## Design notes

The layout, indigo→violet gradient, typography, pagination dots, and button
styles are a faithful match of the reference mockup. The per-slide 3D
illustrations in the mockup are Spline/C4D renders that can't be extracted
from a flat screenshot, so they're rebuilt here as vector (`react-native-svg`)
compositions using the same motifs and color palette (coins + plus badge,
twisted ring, gem pedestals, security vault).

## Stack

- Expo SDK 57 (React Native 0.86, React 19), TypeScript
- `react-native-svg` for gradients + illustrations
- `react-native-safe-area-context` for safe-area insets
- No navigation library — a tiny state machine in `App.tsx` switches between
  the onboarding screen and two placeholder auth screens, since the design
  brief only covers onboarding.

## Run it

```bash
npm install
npm start        # then press i / a / w, or scan the QR code with Expo Go
```

## Structure

```
App.tsx                          root: screen switcher
src/
  theme.ts                       colors + spacing tokens
  data/onboardingSlides.ts       slide copy + illustration mapping
  components/
    GradientBackground.tsx       full-bleed SVG gradient + glow
    PaginationDots.tsx
    Buttons.tsx                  PrimaryButton (filled) / OutlineButton
    illustrations/               one SVG composition per slide
  screens/
    OnboardingScreen.tsx         paging ScrollView carousel
    AuthPlaceholderScreen.tsx    placeholder for Sign up / Log in
```
