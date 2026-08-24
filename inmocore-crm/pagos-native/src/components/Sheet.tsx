import React, { PropsWithChildren } from 'react';
import { Modal, View, Text, StyleSheet, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/store/hooks';

export default function Sheet({ visible, onClose, title, children }: PropsWithChildren<{ visible: boolean; onClose: () => void; title: string }>) {
  const c = useTheme();
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      {/* On Android `behavior: undefined` makes KeyboardAvoidingView a no-op,
          so the keyboard was free to cover fields like "Real" (the paid
          amount) near the top of this sheet — 'height' is the standard fix
          for a KeyboardAvoidingView living inside a Modal on Android. */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.sheetWrap}>
        <View style={[styles.sheet, { backgroundColor: c.surface }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: c.text }]}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={22} color={c.textMuted} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,10,30,0.45)' },
  sheetWrap: { flex: 1, justifyContent: 'flex-end' },
  sheet: { maxHeight: '88%', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 14 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 12 },
  title: { fontSize: 17, fontWeight: '800' },
  content: { paddingHorizontal: 20, paddingBottom: 34, gap: 14 },
});
