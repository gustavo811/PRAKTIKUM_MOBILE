import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../src/constants/theme';
import { secureStorage } from '../src/services/secureStorage';
import { storage } from '../src/services/storage';

export default function AuthScreen() {
  // 1. Penerapan useState untuk mengelola state lokal form autentikasi
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  // 1. Penerapan useEffect untuk mengambil data awal (kredensial tersimpan di storage)
  useEffect(() => {
    loadRememberedCredentials();
  }, []);

  const loadRememberedCredentials = async () => {
    try {
      const saved = await secureStorage.getObject(secureStorage.KEYS.REMEMBERED_CREDS);
      if (saved && saved.username && saved.password) {
        setUsername(saved.username);
        setPassword(saved.password);
        setRememberMe(true);
      }
    } catch (e) {
      console.warn('Gagal memuat kredensial tersimpan:', e);
    }
  };

  // Shortcut Akun Demo
  const fillDemoAccount = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
  };

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Form Belum Lengkap', 'Silakan masukkan username dan password kasir.');
      return;
    }

    try {
      setIsSubmitting(true);
      const employees = await storage.getEmployees();
      const matched = employees.find(
        (emp) =>
          emp.username.toLowerCase() === username.trim().toLowerCase() &&
          emp.pin === password.trim()
      );

      if (!matched) {
        Alert.alert(
          'Login Gagal',
          'Username atau password tidak sesuai. Gunakan tombol demo di bawah.'
        );
        setIsSubmitting(false);
        return;
      }

      // Simpan kredensial jika Remember Me aktif
      if (rememberMe) {
        await secureStorage.setItem(
          secureStorage.KEYS.REMEMBERED_CREDS,
          JSON.stringify({ username: username.trim(), password: password.trim() })
        );
      } else {
        await secureStorage.removeItem(secureStorage.KEYS.REMEMBERED_CREDS);
      }

      // Simpan sesi user aktif di Storage
      await secureStorage.setItem(
        secureStorage.KEYS.AUTH_USER,
        JSON.stringify(matched)
      );

      setIsSubmitting(false);

      // 2. Penerapan router.replace() dari halaman Auth ke layar utama kasir
      // agar halaman login terhapus dari stack navigasi dan tidak bisa di-swipe kembali!
      router.replace('/kasir');
    } catch (e) {
      setIsSubmitting(false);
      Alert.alert('Error', 'Terjadi kesalahan sistem saat proses login.');
    }
  };

  const handleRegister = async () => {
    if (!fullName.trim() || !username.trim() || !password.trim()) {
      Alert.alert('Form Belum Lengkap', 'Nama lengkap, username, dan password wajib diisi.');
      return;
    }

    try {
      setIsSubmitting(true);
      const employees = await storage.getEmployees();
      const exists = employees.some(
        (e) => e.username.toLowerCase() === username.trim().toLowerCase()
      );

      if (exists) {
        Alert.alert('Username Terpakai', 'Username ini sudah digunakan kasir lain.');
        setIsSubmitting(false);
        return;
      }

      const newEmp = {
        name: fullName.trim(),
        username: username.trim().toLowerCase(),
        role: 'Kasir',
        pin: password.trim(),
        phone: phone.trim() || '-',
      };

      await storage.addEmployee(newEmp);
      await secureStorage.setItem(
        secureStorage.KEYS.AUTH_USER,
        JSON.stringify(newEmp)
      );

      setIsSubmitting(false);
      Alert.alert('Registrasi Berhasil', `Selamat datang, ${newEmp.name}!`, [
        {
          text: 'Masuk Kasir',
          onPress: () => {
            // 2. Penerapan router.replace() langsung ke layar utama kasir
            router.replace('/kasir');
          },
        },
      ]);
    } catch (e) {
      setIsSubmitting(false);
      Alert.alert('Error', 'Gagal mendaftarkan akun kasir.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* BRANDING HEADER */}
          <View style={styles.header}>
            <View style={styles.brandIconWrapper}>
              <Ionicons name="storefront" size={40} color={THEME.colors.primary} />
            </View>
            <Text style={styles.brandTitle}>KasirKu</Text>
            <Text style={styles.brandSubtitle}>
              {isRegister
                ? 'Daftarkan akun staf kasir baru'
                : 'Masuk ke sistem kasir POS & kelola penjualan'}
            </Text>
          </View>

          {/* TAB PILIHAN LOGIN / DAFTAR */}
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleBtn, !isRegister && styles.toggleBtnActive]}
              onPress={() => setIsRegister(false)}
            >
              <Text
                style={[styles.toggleBtnText, !isRegister && styles.toggleBtnTextActive]}
              >
                Masuk Kasir
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, isRegister && styles.toggleBtnActive]}
              onPress={() => setIsRegister(true)}
            >
              <Text
                style={[styles.toggleBtnText, isRegister && styles.toggleBtnTextActive]}
              >
                Daftar Staf
              </Text>
            </TouchableOpacity>
          </View>

          {/* FORM CARD */}
          <View style={styles.card}>
            {isRegister && (
              <>
                <Text style={styles.inputLabel}>Nama Lengkap Staf</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color={THEME.colors.textMuted}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Contoh: Rian Anggara"
                    placeholderTextColor={THEME.colors.textMuted}
                    value={fullName}
                    onChangeText={setFullName}
                  />
                </View>

                <Text style={styles.inputLabel}>Nomor WhatsApp / HP</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="call-outline"
                    size={20}
                    color={THEME.colors.textMuted}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="0812xxxxxxxx"
                    placeholderTextColor={THEME.colors.textMuted}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                  />
                </View>
              </>
            )}

            <Text style={styles.inputLabel}>Username Kasir</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="at-outline"
                size={20}
                color={THEME.colors.textMuted}
              />
              <TextInput
                style={styles.input}
                placeholder="Masukkan username"
                placeholderTextColor={THEME.colors.textMuted}
                autoCapitalize="none"
                value={username}
                onChangeText={setUsername}
              />
            </View>

            <Text style={styles.inputLabel}>Password / PIN</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={THEME.colors.textMuted}
              />
              <TextInput
                style={styles.input}
                placeholder="Masukkan password / PIN"
                placeholderTextColor={THEME.colors.textMuted}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={THEME.colors.textMuted}
                />
              </TouchableOpacity>
            </View>

            {!isRegister && (
              <View style={styles.rememberRow}>
                <View style={styles.rememberLeft}>
                  <Switch
                    value={rememberMe}
                    onValueChange={setRememberMe}
                    trackColor={{
                      false: THEME.colors.border,
                      true: THEME.colors.primary,
                    }}
                    thumbColor="#FFF"
                  />
                  <Text style={styles.rememberText}>Ingat Saya di Perangkat Ini</Text>
                </View>
              </View>
            )}

            {/* TOMBOL AKSI UTAMA */}
            <TouchableOpacity
              style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
              onPress={isRegister ? handleRegister : handleLogin}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <>
                  <Ionicons
                    name={isRegister ? 'person-add' : 'log-in-outline'}
                    size={20}
                    color="#FFF"
                  />
                  <Text style={styles.submitBtnText}>
                    {isRegister ? 'Daftarkan Akun Kasir' : 'Masuk Aplikasi POS'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* AKUN DEMO CEPAT */}
          {!isRegister && (
            <View style={styles.demoSection}>
              <Text style={styles.demoTitle}>Pilihan Akun Demo Cepat:</Text>
              <View style={styles.demoButtonsRow}>
                <TouchableOpacity
                  style={styles.demoChip}
                  onPress={() => fillDemoAccount('sarah', '123456')}
                >
                  <Ionicons name="flash-outline" size={14} color={THEME.colors.primaryDark} />
                  <Text style={styles.demoChipText}>Kasir Sarah (PIN: 123456)</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.colors.bg,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    justifyContent: 'center',
    minHeight: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  brandIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: THEME.colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    ...THEME.shadows.sm,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: THEME.colors.primaryDark,
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 20,
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.surface,
    padding: 4,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  toggleBtnActive: {
    backgroundColor: THEME.colors.primary,
  },
  toggleBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
  },
  toggleBtnTextActive: {
    color: '#FFF',
  },
  card: {
    backgroundColor: THEME.colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    ...THEME.shadows.md,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginBottom: 6,
    marginTop: 10,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.bg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: THEME.colors.textPrimary,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 8,
  },
  rememberLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rememberText: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    fontWeight: '500',
  },
  submitBtn: {
    backgroundColor: THEME.colors.primary,
    borderRadius: 14,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    ...THEME.shadows.sm,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
  demoSection: {
    marginTop: 24,
    alignItems: 'center',
  },
  demoTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textMuted,
    marginBottom: 8,
  },
  demoButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  demoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: THEME.colors.primaryMuted,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: THEME.colors.primaryLight,
  },
  demoChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.primaryDark,
  },
});
