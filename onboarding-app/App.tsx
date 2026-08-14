import React, { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import OnboardingScreen from './src/screens/OnboardingScreen';
import AuthPlaceholderScreen from './src/screens/AuthPlaceholderScreen';

type Route = 'onboarding' | 'signup' | 'login';

export default function App() {
  const [route, setRoute] = useState<Route>('onboarding');

  return (
    <SafeAreaProvider>
      {route === 'onboarding' && (
        <OnboardingScreen onSignUp={() => setRoute('signup')} onLogIn={() => setRoute('login')} />
      )}
      {route === 'signup' && <AuthPlaceholderScreen title="Sign up" onBack={() => setRoute('onboarding')} />}
      {route === 'login' && <AuthPlaceholderScreen title="Log in" onBack={() => setRoute('onboarding')} />}
    </SafeAreaProvider>
  );
}
