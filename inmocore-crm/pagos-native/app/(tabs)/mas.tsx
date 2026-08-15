import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Text from '@/src/components/AppText';
import { router } from 'expo-router';
import Screen from '@/src/components/Screen';
import Card from '@/src/components/Card';
import MenuRow from '@/src/components/MenuRow';
import { useTheme } from '@/src/store/hooks';
import { useEnrichedLedger } from '@/src/store/hooks';
import { computeAlerts, pendingItems } from '@/src/utils/finance';
import { CONFIG } from '@/src/config/config';

export default function MasScreen() {
  const c = useTheme();
  const ledger = useEnrichedLedger();
  const alerts = useMemo(() => computeAlerts(ledger), [ledger]);
  const pending = useMemo(() => pendingItems(ledger).filter((p) => p.diffDays <= 7), [ledger]);

  return (
    <Screen edges={['top']}>
      <Text style={[styles.title, { color: c.text }]}>Más</Text>

      <View>
        <Text style={[styles.group, { color: c.textFaint }]}>Análisis</Text>
        <Card padded={false}>
          <View style={styles.list}>
            <MenuRow icon="document-text-outline" label="Informes" subtitle="Presupuesto mensual y balance" onPress={() => router.push('/informes')} />
            <MenuRow icon="calendar-outline" label="Resumen mensual" subtitle="Ingresos y egresos del mes" onPress={() => router.push('/resumen')} />
            <MenuRow icon="bar-chart-outline" label="Dashboard anual" subtitle="Panorama del año completo" onPress={() => router.push('/anual')} />
            <MenuRow icon="trending-up-outline" label="Ingresos" subtitle="Fuentes de ingreso" onPress={() => router.push('/ingresos')} />
            <MenuRow icon="pricetags-outline" label="Gastos" subtitle="Concentración por categoría" onPress={() => router.push('/gastos')} />
            <MenuRow icon="repeat-outline" label="Suscripciones" subtitle="Cargos recurrentes detectados" onPress={() => router.push('/suscripciones')} />
          </View>
        </Card>
      </View>

      <View>
        <Text style={[styles.group, { color: c.textFaint }]}>Planeación</Text>
        <Card padded={false}>
          <View style={styles.list}>
            <MenuRow icon="card-outline" label="Créditos y deudas" subtitle="Hipoteca, auto y tarjetas" onPress={() => router.push('/deudas')} />
            <MenuRow icon="shield-checkmark-outline" label="Patrimonio y score" subtitle="Activos, deuda y salud financiera" onPress={() => router.push('/patrimonio')} />
            <MenuRow icon="stats-chart-outline" label="Inversiones" subtitle="Portafolio y aportaciones" onPress={() => router.push('/inversiones')} />
          </View>
        </Card>
      </View>

      <View>
        <Text style={[styles.group, { color: c.textFaint }]}>Gestión</Text>
        <Card padded={false}>
          <View style={styles.list}>
            <MenuRow icon="notifications-outline" label="Recordatorios" subtitle="Pagos programados" onPress={() => router.push('/recordatorios')} badge={pending.length || undefined} />
            <MenuRow icon="warning-outline" label="Alertas" subtitle="Señales sobre tu mes" onPress={() => router.push('/alertas')} badge={alerts.length || undefined} tone={alerts.some((a) => a.sev === 'high') ? 'warning' : 'neutral'} />
            <MenuRow icon="settings-outline" label="Configuración" subtitle="Tema, seguridad y respaldo" onPress={() => router.push('/configuracion')} />
            <MenuRow icon="information-circle-outline" label={`Acerca de ${CONFIG.brandName}`} subtitle="Qué incluye esta app" onPress={() => router.push('/acerca')} />
          </View>
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '800' },
  group: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginLeft: 4 },
  list: { paddingHorizontal: 16 },
});
