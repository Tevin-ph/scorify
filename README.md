# Scorify

A React Native (Expo) app for keeping score in cricket, badminton and throwball matches. Everything is stored on the device, so no account or internet connection is needed.

## Features

### Cricket
- Ball-by-ball scoring: runs, boundaries, wickets and extras (wide, no-ball, bye, leg-bye, penalty)
- Wicket types: bowled, caught, LBW, run out, stumped, hit wicket, Mankad
- No-ball handling (penalty run kept separate from batsman runs) and automatic strike rotation
- Player retirement (injury, retired out, other) and an undo for the last ball
- Two innings with a target, run rate and required rate, plus automatic result detection
- Editable first-innings score, umpire notes, and an over-by-over breakdown
- Four preset teams plus a quick-start test setup (India vs Australia)
- Match history with a scorecard view and PDF export

### Badminton
- Singles and doubles
- Best of 3 games, rally scoring to 21 with a 2-point lead and a 30-point cap
- Serve tracking, undo, match history and PDF export

### Throwball
- Configurable team names, umpire, sets to win and points per set
- Set-by-set scoring with undo, manual "End Match" and a victory screen
- Match history and PDF export

PDF files are named like `Sport_TeamA_vs_TeamB_Winner_<name>_<date>.pdf` and shared through the system share sheet.

## Tech stack

- Expo SDK 53, React Native 0.79, React 19
- React Navigation (stack)
- AsyncStorage for local persistence
- `expo-print` and `expo-sharing` for PDF export
- `expo-linear-gradient` and `@expo/vector-icons` for the UI

## Getting started

Requires Node.js 18+ and the Expo Go app (or an Android/iOS emulator).

```bash
npm install
npx expo start
```

Then scan the QR code with Expo Go, or press `a` (Android) / `i` (iOS) in the terminal.

To build an installable app with EAS:

```bash
npx eas build --profile preview --platform android
```

## Project structure

```
App.js          Home screen and navigation
screens/        One file per screen (cricket, badminton, throwball, history, scorecard, victory)
assets/         Icons and splash images
```

## Known limitations

- `screens/cricketscreen.js` is a single large file; splitting it into smaller components is a planned cleanup.
- There are no automated tests yet.
- Data lives only on the device; there is no cloud sync or backup.

## License

[MIT](LICENSE)
