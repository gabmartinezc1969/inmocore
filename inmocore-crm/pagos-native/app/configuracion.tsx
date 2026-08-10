import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import Screen from '@/src/components/Screen';
import Card from '@/src/components/Card';
import SegmentedControl from '@/src/components/SegmentedControl';
import Button from '@/src/components/Button';
import Sheet from '@/src/components/Sheet';
import { FormField } from '@/src/components/FormField';
import { useTheme } from '@/src/store/hooks';
import { useStore } from '@/src/store/useStore';
import { CONFIG } from '@/src/config/config';

export default function ConfiguracionScreen() {
  const c = useTheme();
  const theme = useStore((s) => s.settings.theme);
  const setTheme = useStore((s) => s.setTheme);
  const pin = useStore((s) => s.settings.pin);
  const setPin = useStore((s) => s.setPin);
  const ledger = useStore((s) => s.ledger);
  const credits = useStore((s) => s.credits);
  const assets = useStore((s) => s.assets);
  const investments = useStore((s) => s.investments);
  const importState = useStore((s) => s.importState);
  const resetToDemo = useStore((s) => s.resetToDemo);
  const clearAll = useStore((s) => s.clearAll);

  const [pinSheet, setPinSheet] = useState(false);
  const [pinValue, setPinValue] = useState('');
  const [busy, setBusy] = useState(false);

  const savePin = () => {
    if (pinValue.length !== 4 || !/^\d{4}$/.test(pinValue)) {
      Alert.alert('PIN inválido', 'Escribe exactamente 4 dígitos.');
      return;
    }
    setPin(pinValue);
    setPinValue('');
    setPinSheet(false);
  };

  const removePin = () => {
    Alert.alert('Quitar PIN', '¿Seguro que quieres quitar el bloqueo por PIN?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Quitar', style: 'destructive', onPress: () => setPin(null) },
    ]);
  };

  const exportJSON = async () => {
    try {
      setBusy(true);
      const payload = JSON.stringify({ ledger, credits, assets, investments, exportedAt: new Date().toISOString() }, null, 2);
      const file = new File(Paths.cache, 'pagos-backup.json');
      if (file.exists) file.delete();
      file.create();
      file.write(payload);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Exportar copia de Pagos' });
      } else {
        Alert.alert('Copia guardada', file.uri);
      }
    } catch (e: any) {
      Alert.alert('No se pudo exportar', e?.message ?? 'Intenta de nuevo');
    } finally {
      setBusy(false);
    }
  };

  const importJSON = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: 'application/json', copyToCacheDirectory: true });
      if (res.canceled || !res.assets?.[0]) return;
      setBusy(true);
      const content = await new File(res.assets[0].uri).text();
      const data = JSON.parse(content);
      importState({ ledger: data.ledger, credits: data.credits, assets: data.assets, investments: data.investments });
      Alert.alert('Datos importados', 'Tu copia se cargó correctamente.');
    } catch (e: any) {
      Alert.alert('No se pudo importar', e?.message ?? 'Verifica que el archivo sea válido');
    } finally {
      setBusy(false);
    }
  };

  const confirmResetDemo = () => Alert.alert('Restaurar datos de ejemplo', 'Se reemplazará tu información actual con datos de demostración.', [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Restaurar', style: 'destructive', onPress: resetToDemo },
  ]);

  const confirmClearAll = () => Alert.alert('Borrar todos los datos', 'Esta acción no se puede deshacer. Se eliminarán movimientos, créditos, activos e inversiones.', [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Borrar todo', style: 'destructive', onPress: clearAll },
  ]);

  return (
    <Screen edges={[]}>
      <Card>
        <Text style={[styles.title, { color: c.text }]}>Apariencia</Text>
        <Text style={[styles.sub, { color: c.textMuted }]}>Elige entre tema oscuro o claro para toda la aplicación.</Text>
        <SegmentedControl value={theme} onChange={setTheme} options={[{ label: 'Claro', value: 'light' }, { label: 'Oscuro', value: 'dark' }]} />
      </Card>

      <Card>
        <Text style={[styles.title, { color: c.text }]}>Seguridad · PIN de acceso</Text>
        <Text style={[styles.sub, { color: c.textMuted }]}>Protege la app con un PIN numérico de 4 dígitos. Es un candado rápido contra miradas casuales, no un cifrado.</Text>
        <Text style={[styles.status, { color: pin ? c.income : c.textFaint }]}>{pin ? 'PIN activo' : 'Sin PIN configurado'}</Text>
        <View style={styles.actionsRow}>
          <Button label={pin ? 'Cambiar PIN' : 'Activar PIN'} variant="primary" small onPress={() => setPinSheet(true)} />
          {pin ? <Button label="Quitar PIN" variant="ghost" small onPress={removePin} /> : null}
        </View>
      </Card>

      <Card>
        <Text style={[styles.title, { color: c.text }]}>Respaldo de datos</Text>
        <Text style={[styles.sub, { color: c.textMuted }]}>Tus datos viven solo en este dispositivo. Exporta una copia periódicamente o antes de reinstalar la app.</Text>
        <View style={styles.actionsRow}>
          <Button label="Exportar copia (.json)" icon="download-outline" variant="ghost" small onPress={exportJSON} loading={busy} />
          <Button label="Importar copia (.json)" icon="cloud-upload-outline" variant="ghost" small onPress={importJSON} loading={busy} />
        </View>
      </Card>

      <Card>
        <Text style={[styles.title, { color: c.text }]}>Mantenimiento</Text>
        <Text style={[styles.sub, { color: c.textMuted }]}>Esto afecta todos tus movimientos guardados en este dispositivo.</Text>
        <View style={styles.actionsRow}>
          <Button label="Restaurar datos de ejemplo" variant="ghost" small onPress={confirmResetDemo} />
          <Button label="Borrar todos los datos" variant="danger" small onPress={confirmClearAll} />
        </View>
      </Card>

      <Card>
        <Text style={[styles.title, { color: c.text }]}>{CONFIG.brandTitle}</Text>
        <Text style={[styles.sub, { color: c.textMuted, marginBottom: 0 }]}>Versión 1.0.0</Text>
        <View style={{ marginTop: 10 }}>
          <Button label="Acerca de esta app" variant="ghost" small onPress={() => router.push('/acerca')} />
        </View>
      </Card>

      <Sheet visible={pinSheet} onClose={() => setPinSheet(false)} title={pin ? 'Cambiar PIN' : 'Activar PIN'}>
        <FormField
          label="PIN de 4 dígitos" value={pinValue} onChangeText={(v) => setPinValue(v.replace(/\D/g, '').slice(0, 4))}
          keyboardType="number-pad" secureTextEntry maxLength={4} placeholder="••••"
        />
        <Button label="Guardar" onPress={savePin} />
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 15, fontWeight: '800' },
  sub: { fontSize: 12.5, marginTop: 4, marginBottom: 12, lineHeight: 18 },
  status: { fontSize: 12.5, fontWeight: '700', marginBottom: 10 },
  actionsRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
});
