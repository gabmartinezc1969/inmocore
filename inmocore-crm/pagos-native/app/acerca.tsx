import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Screen from '@/src/components/Screen';
import ScreenHeader from '@/src/components/ScreenHeader';
import Card from '@/src/components/Card';
import { useTheme } from '@/src/store/hooks';

const FULL = [
  'Registro y edición de movimientos (ingresos/egresos, presupuesto vs. real, método de pago, deducible)',
  'Inicio con balance, tendencia, presupuesto del mes, alertas y próximos pagos',
  'Resumen mensual, Dashboard anual, Ingresos y Gastos con gráficas',
  'Créditos y deudas con amortización francesa (saldo teórico) y saldo real opcional',
  'Patrimonio, score financiero (0–100) y registro de activos',
  'Inversiones con capital, valor actual y rendimiento',
  'Detección automática de suscripciones recurrentes',
  'Recordatorios de pago y alertas automáticas',
  'Tema claro/oscuro, PIN de acceso, exportar/importar copia en JSON',
];

const SIMPLIFIED = [
  'Las gráficas usan un motor propio en SVG (línea, barras, dona, gauge) en vez de una librería como Chart.js — cubre los mismos datos con menos peso',
  'Sin treemap, pareto interactivo ni calendario de calor — Gastos muestra la misma información como listas ordenadas y barras de progreso',
  'Sin generador de dashboards personalizados ("Mi Dashboard") ni exportación a Excel/.ics',
];

const OUT_OF_SCOPE = [
  'Sincronización en la nube (jsonblob.com) y archivo compartido en OneDrive — requieren un backend o servicio de terceros',
  'Multiusuario o cuentas — los datos viven solo en este dispositivo (AsyncStorage)',
];

export default function AcercaScreen() {
  const c = useTheme();
  return (
    <Screen edges={['top', 'bottom']}>
      <ScreenHeader title="Acerca de esta app" />
      <Text style={[styles.lead, { color: c.textMuted }]}>
        Pagos es tu centro financiero personal: ingresos, gastos, deudas, patrimonio e inversiones en
        un solo lugar. Esta app nativa reimplementa la versión web (`pagos.html`) con el mismo modelo
        de datos y fórmulas, con una identidad visual propia. Todo se guarda localmente en este
        dispositivo — no requiere conexión a internet.
      </Text>

      <Card>
        <Text style={[styles.title, { color: c.income }]}>✅ Implementado por completo</Text>
        <View style={{ marginTop: 10 }}>
          {FULL.map((t, i) => (
            <View key={i} style={styles.item}>
              <View style={[styles.bullet, { backgroundColor: c.income }]} />
              <Text style={[styles.itemText, { color: c.text }]}>{t}</Text>
            </View>
          ))}
        </View>
      </Card>

      <Card>
        <Text style={[styles.title, { color: c.warning }]}>🟡 Versión simplificada</Text>
        <View style={{ marginTop: 10 }}>
          {SIMPLIFIED.map((t, i) => (
            <View key={i} style={styles.item}>
              <View style={[styles.bullet, { backgroundColor: c.warning }]} />
              <Text style={[styles.itemText, { color: c.text }]}>{t}</Text>
            </View>
          ))}
        </View>
      </Card>

      <Card>
        <Text style={[styles.title, { color: c.expense }]}>⛔ Fuera de alcance</Text>
        <View style={{ marginTop: 10 }}>
          {OUT_OF_SCOPE.map((t, i) => (
            <View key={i} style={styles.item}>
              <View style={[styles.bullet, { backgroundColor: c.expense }]} />
              <Text style={[styles.itemText, { color: c.text }]}>{t}</Text>
            </View>
          ))}
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  lead: { fontSize: 13.5, lineHeight: 20 },
  title: { fontSize: 15, fontWeight: '800' },
  item: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  bullet: { width: 7, height: 7, borderRadius: 4, marginTop: 6 },
  itemText: { fontSize: 13, flex: 1, lineHeight: 19 },
});
