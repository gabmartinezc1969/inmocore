import React, { useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import Text from '@/src/components/AppText';
import { Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FormField } from '@/src/components/FormField';
import Button from '@/src/components/Button';
import { useStore } from '@/src/store/useStore';
import { useTheme } from '@/src/store/hooks';
import { CONFIG } from '@/src/config/config';

function PinGate() {
  const c = useTheme();
  const pin = useStore((s) => s.settings.pin);
  const unlockSession = useStore((s) => s.unlockSession);
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  const submit = () => {
    if (value === pin) { unlockSession(); return; }
    setError('PIN incorrecto');
    setValue('');
  };

  return (
    <View style={[styles.center, { backgroundColor: c.bg }]}>
      <View style={[styles.lockIcon, { backgroundColor: c.primarySoft }]}>
        <Ionicons name="lock-closed" size={26} color={c.primary} />
      </View>
      <Text style={[styles.brand, { color: c.text }]}>{CONFIG.brandName}</Text>
      <Text style={[styles.hint, { color: c.textMuted }]}>Escribe tu PIN de 4 dígitos</Text>
      <View style={{ width: 180, marginTop: 16 }}>
        <FormField
          label="" value={value} onChangeText={(v) => { setValue(v.replace(/\D/g, '').slice(0, 4)); setError(''); }}
          keyboardType="number-pad" secureTextEntry maxLength={4} placeholder="••••"
          style={{ textAlign: 'center' } as any}
        />
      </View>
      {error ? <Text style={{ color: c.expense, fontSize: 12.5, marginTop: 8, fontWeight: '700' }}>{error}</Text> : null}
      <View style={{ marginTop: 18 }}>
        <Button label="Entrar" onPress={submit} disabled={value.length !== 4} />
      </View>
    </View>
  );
}

export default function Index() {
  const hydrated = useStore((s) => s.hydrated);
  const onboardingSeen = useStore((s) => s.settings.onboardingSeen);
  const pin = useStore((s) => s.settings.pin);
  const sessionUnlocked = useStore((s) => s.sessionUnlocked);
  const c = useTheme();

  if (!hydrated) {
    return (
      <View style={[styles.center, { backgroundColor: c.bg }]}>
        <ActivityIndicator color={c.primary} />
      </View>
    );
  }

  if (onboardingSeen && pin && !sessionUnlocked) return <PinGate />;

  return <Redirect href={onboardingSeen ? '/(tabs)' : '/onboarding'} />;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  lockIcon: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  brand: { fontSize: 20, fontWeight: '800' },
  hint: { fontSize: 13, marginTop: 4 },
});
