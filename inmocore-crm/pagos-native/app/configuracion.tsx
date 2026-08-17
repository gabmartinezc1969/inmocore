import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import Text from '@/src/components/AppText';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import Screen from '@/src/components/Screen';
import ScreenHeader from '@/src/components/ScreenHeader';
import Card from '@/src/components/Card';
import SegmentedControl from '@/src/components/SegmentedControl';
import Button from '@/src/components/Button';
import Sheet from '@/src/components/Sheet';
import Dropdown, { DropdownOption } from '@/src/components/Dropdown';
import { FormField, FormSwitch } from '@/src/components/FormField';
import { useTheme, useEnrichedLedger } from '@/src/store/hooks';
import { useStore } from '@/src/store/useStore';
import { allYears, targetYearMonth } from '@/src/utils/finance';
import { CONFIG, FONT_SCALE_LABELS } from '@/src/config/config';
import { FontScaleSetting } from '@/src/types/models';

type TipoFiltro = 'ALL' | 'I' | 'E';
const TIPO_OPTIONS: { label: string; value: TipoFiltro }[] = [
  { label: 'Todos', value: 'ALL' }, { label: 'Ingresos', value: 'I' }, { label: 'Gastos', value: 'E' },
];

export default function ConfiguracionScreen() {
  const c = useTheme();
  const theme = useStore((s) => s.settings.theme);
  const setTheme = useStore((s) => s.setTheme);
  const fontScale = useStore((s) => s.settings.fontScale ?? 'normal');
  const setFontScale = useStore((s) => s.setFontScale);
  const pin = useStore((s) => s.settings.pin);
  const setPin = useStore((s) => s.setPin);
  const ledger = useStore((s) => s.ledger);
  const credits = useStore((s) => s.credits);
  const assets = useStore((s) => s.assets);
  const investments = useStore((s) => s.investments);
  const importState = useStore((s) => s.importState);
  const resetToDemo = useStore((s) => s.resetToDemo);
  const clearAll = useStore((s) => s.clearAll);
  const copyMonth = useStore((s) => s.copyMonth);
  const deleteMonths = useStore((s) => s.deleteMonths);

  const enrichedLedger = useEnrichedLedger();
  const today = targetYearMonth(enrichedLedger);

  const [pinSheet, setPinSheet] = useState(false);
  const [pinValue, setPinValue] = useState('');
  const [busy, setBusy] = useState(false);

  // Year options span whatever years already have data, plus a couple
  // ahead so you can copy a month forward into a year you haven't
  // touched yet (e.g. duplicating this August into next August).
  const yearOptions: DropdownOption[] = useMemo(() => {
    const existing = allYears(enrichedLedger);
    const base = existing.length ? existing : [today.year];
    const min = Math.min(...base), max = Math.max(...base) + 2;
    const list: number[] = [];
    for (let y = min; y <= max; y++) list.push(y);
    return list.map((y) => ({ label: String(y), value: String(y) }));
  }, [enrichedLedger, today.year]);
  const monthOptions: DropdownOption[] = useMemo(() => CONFIG.months.map((m, idx) => ({
    label: m.charAt(0).toUpperCase() + m.slice(1), value: String(idx),
  })), []);

  const [copySheet, setCopySheet] = useState(false);
  const [copyTipo, setCopyTipo] = useState<TipoFiltro>('ALL');
  const [fromYear, setFromYear] = useState(today.year);
  const [fromMonth, setFromMonth] = useState(today.monthIdx);
  const [toYear, setToYear] = useState(today.year);
  const [toMonth, setToMonth] = useState(today.monthIdx);
  const [asPending, setAsPending] = useState(false);

  const [deleteSheet, setDeleteSheet] = useState(false);
  const [delTipo, setDelTipo] = useState<TipoFiltro>('ALL');
  const [delYear, setDelYear] = useState(today.year);
  const [delMonth, setDelMonth] = useState(today.monthIdx);
  const [delMode, setDelMode] = useState<'single' | 'onward'>('single');

  const doCopy = () => {
    const count = copyMonth({
      tipo: copyTipo === 'ALL' ? undefined : copyTipo,
      fromYear, fromMonth, toYear, toMonth, asPending,
    });
    setCopySheet(false);
    Alert.alert('Copia completa', `${count} movimiento(s) copiados a ${CONFIG.months[toMonth]} ${toYear}.`);
  };

  const doDelete = () => {
    const label = `${CONFIG.months[delMonth]} ${delYear}`;
    Alert.alert(
      'Borrar movimientos',
      delMode === 'single'
        ? `Se eliminarán los movimientos de ${label}. Esta acción no se puede deshacer.`
        : `Se eliminarán todos los movimientos desde ${label} en adelante. Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar', style: 'destructive', onPress: () => {
            const count = deleteMonths({ tipo: delTipo === 'ALL' ? undefined : delTipo, fromYear: delYear, fromMonth: delMonth, mode: delMode });
            setDeleteSheet(false);
            Alert.alert('Listo', `${count} movimiento(s) eliminado(s).`);
          },
        },
      ],
    );
  };

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
    <Screen edges={['top', 'bottom']}>
      <ScreenHeader title="Configuración" />
      <Card>
        <Text style={[styles.title, { color: c.text }]}>Apariencia</Text>
        <Text style={[styles.sub, { color: c.textMuted }]}>Elige entre tema oscuro o claro para toda la aplicación.</Text>
        <SegmentedControl value={theme} onChange={setTheme} options={[{ label: 'Claro', value: 'light' }, { label: 'Oscuro', value: 'dark' }]} />

        <Text style={[styles.title, { color: c.text, marginTop: 16 }]}>Tamaño de texto</Text>
        <Text style={[styles.sub, { color: c.textMuted }]}>Ajusta el tamaño de la letra en toda la app.</Text>
        <SegmentedControl
          value={fontScale}
          onChange={setFontScale}
          options={(Object.keys(FONT_SCALE_LABELS) as FontScaleSetting[]).map((k) => ({ label: FONT_SCALE_LABELS[k], value: k }))}
        />
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
        <Text style={[styles.title, { color: c.text }]}>Meses</Text>
        <Text style={[styles.sub, { color: c.textMuted }]}>Copia un mes completo a otro mes/año, o borra un mes específico (o de ahí en adelante).</Text>
        <View style={styles.actionsRow}>
          <Button label="Copiar mes" icon="copy-outline" variant="ghost" small onPress={() => setCopySheet(true)} />
          <Button label="Borrar mes" icon="trash-outline" variant="ghost" small onPress={() => setDeleteSheet(true)} />
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

      <Sheet visible={copySheet} onClose={() => setCopySheet(false)} title="Copiar mes">
        <Text style={[styles.sheetLabel, { color: c.textMuted }]}>Tipo</Text>
        <SegmentedControl value={copyTipo} onChange={setCopyTipo} options={TIPO_OPTIONS} />

        <Text style={[styles.sheetLabel, { color: c.textMuted }]}>Desde</Text>
        <View style={styles.row2}>
          <Dropdown title="Año" value={String(fromYear)} options={yearOptions} onChange={(v) => setFromYear(Number(v))} style={{ flex: 1 }} />
          <Dropdown title="Mes" value={String(fromMonth)} options={monthOptions} onChange={(v) => setFromMonth(Number(v))} style={{ flex: 1 }} />
        </View>

        <Text style={[styles.sheetLabel, { color: c.textMuted }]}>Hacia</Text>
        <View style={styles.row2}>
          <Dropdown title="Año" value={String(toYear)} options={yearOptions} onChange={(v) => setToYear(Number(v))} style={{ flex: 1 }} />
          <Dropdown title="Mes" value={String(toMonth)} options={monthOptions} onChange={(v) => setToMonth(Number(v))} style={{ flex: 1 }} />
        </View>

        <FormSwitch label="Copiar montos como pendientes (vacíos)" value={asPending} onValueChange={setAsPending} />
        <Button label="Copiar" onPress={doCopy} />
      </Sheet>

      <Sheet visible={deleteSheet} onClose={() => setDeleteSheet(false)} title="Borrar mes">
        <Text style={[styles.sheetLabel, { color: c.textMuted }]}>Tipo</Text>
        <SegmentedControl value={delTipo} onChange={setDelTipo} options={TIPO_OPTIONS} />

        <Text style={[styles.sheetLabel, { color: c.textMuted }]}>Mes</Text>
        <View style={styles.row2}>
          <Dropdown title="Año" value={String(delYear)} options={yearOptions} onChange={(v) => setDelYear(Number(v))} style={{ flex: 1 }} />
          <Dropdown title="Mes" value={String(delMonth)} options={monthOptions} onChange={(v) => setDelMonth(Number(v))} style={{ flex: 1 }} />
        </View>

        <Text style={[styles.sheetLabel, { color: c.textMuted }]}>Alcance</Text>
        <SegmentedControl
          value={delMode}
          onChange={setDelMode}
          options={[{ label: 'Solo este mes', value: 'single' }, { label: 'Este mes en adelante', value: 'onward' }]}
        />
        <Button label="Borrar" variant="danger" onPress={doDelete} />
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 15, fontWeight: '800' },
  sub: { fontSize: 12.5, marginTop: 4, marginBottom: 12, lineHeight: 18 },
  status: { fontSize: 12.5, fontWeight: '700', marginBottom: 10 },
  actionsRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  sheetLabel: { fontSize: 12.5, fontWeight: '700', marginBottom: 8 },
  row2: { flexDirection: 'row', gap: 12 },
});
