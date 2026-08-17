import React from 'react';
import { View, StyleSheet } from 'react-native';
import Text from '@/src/components/AppText';
import Screen from '@/src/components/Screen';
import ScreenHeader from '@/src/components/ScreenHeader';
import Card from '@/src/components/Card';
import { useTheme } from '@/src/store/hooks';
import { CONFIG } from '@/src/config/config';

const FEATURES = [
  'Registro de ingresos y gastos, con presupuesto vs. monto real',
  'Inicio con tu balance disponible, tendencia y presupuesto del mes',
  'Informes, Resumen mensual y Dashboard anual con gráficas',
  'Créditos y deudas, con amortización y saldo restante',
  'Patrimonio, score financiero y registro de activos',
  'Seguimiento de inversiones',
  'Detección automática de suscripciones recurrentes',
  'Recordatorios de pago y alertas sobre tu mes',
  'Tema claro/oscuro y PIN de acceso',
];

const PRIVACY = [
  'Tus movimientos, créditos, activos e inversiones se guardan únicamente en este dispositivo — la app no requiere conexión a internet ni cuenta para funcionar.',
  'Nadie más tiene acceso a tus datos: no hay sincronización en la nube ni servidor propio.',
  'Puedes exportar un respaldo en cualquier momento desde Configuración, o borrar todo si cambias o vendes de dispositivo.',
];

export default function AcercaScreen() {
  const c = useTheme();
  return (
    <Screen edges={['top', 'bottom']}>
      <ScreenHeader title="Acerca de esta app" />
      <Text style={[styles.lead, { color: c.textMuted }]}>
        {CONFIG.brandTitle} es tu centro financiero personal: ingresos, gastos, deudas, patrimonio e
        inversiones en un solo lugar, con la información que tú capturas.
      </Text>

      <Card>
        <Text style={[styles.title, { color: c.text }]}>Qué puedes hacer</Text>
        <View style={{ marginTop: 10 }}>
          {FEATURES.map((t, i) => (
            <View key={i} style={styles.item}>
              <View style={[styles.bullet, { backgroundColor: c.primary }]} />
              <Text style={[styles.itemText, { color: c.text }]}>{t}</Text>
            </View>
          ))}
        </View>
      </Card>

      <Card>
        <Text style={[styles.title, { color: c.text }]}>Tus datos y tu privacidad</Text>
        <View style={{ marginTop: 10 }}>
          {PRIVACY.map((t, i) => (
            <View key={i} style={styles.item}>
              <View style={[styles.bullet, { backgroundColor: c.income }]} />
              <Text style={[styles.itemText, { color: c.text }]}>{t}</Text>
            </View>
          ))}
        </View>
      </Card>

      <Text style={[styles.version, { color: c.textFaint }]}>Versión 1.0.0</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  lead: { fontSize: 13.5, lineHeight: 20 },
  title: { fontSize: 15, fontWeight: '800' },
  item: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  bullet: { width: 7, height: 7, borderRadius: 4, marginTop: 6 },
  itemText: { fontSize: 13, flex: 1, lineHeight: 19 },
  version: { fontSize: 12, textAlign: 'center', marginTop: 4 },
});
