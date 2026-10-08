// Layanan Autentikasi Pengguna - Login & Registrasi dengan Dual Storage

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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../constants/theme';
import { secureStorage } from '../services/secureStorage';
import { storage } from '../services/storage';

export default function AuthScreen({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Form Fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedRole, setSelectedRole] = useState('Kasir');

  const ROLES = [
    'Kasir',
  ];

  // Muat akun tersimpan dari secureStorage jika ada
  useEffect(() => {
    checkSavedCredentials();
  }, []);

  const checkSavedCredentials = async () => {
    try {
      const saved = await secureStorage.getObject(secureStorage.KEYS.REMEMBERED_CREDS);
      if (saved && saved.username && saved.password) {
        setUsername(saved.username);
        setPassword(saved.password);
        setRememberMe(true);
      }
    } catch (e) {
      console.warn('Failed to load remembered credentials', e);
    }
  };

  // Pilih Akun Demo Cepat
  const fillDemoAccount = (user, pass) => {
    setUsername(user);
    setPassword(pass);
  };

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Form Belum Lengkap', 'Silakan masukkan username dan password.');
      return;
    }

    try {
      const employees = await storage.getEmployees();
      const matched = employees.find(
        (emp) =>
          emp.username.toLowerCase() === username.trim().toLowerCase() &&
          emp.pin === password.trim()
      );

      if (!matched) {
        Alert.alert(
          'Login Gagal',
          'Username atau password tidak sesuai. Gunakan tombol demo di bawah untuk akun bawaan.'
        );
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

      // Simpan sesi user aktif di Secure Storage
      await secureStorage.setItem(
        secureStorage.KEYS.AUTH_USER,
        JSON.stringify(matched)
      );

      onLoginSuccess(matched);
    } catch (e) {
      Alert.alert('Error', 'Terjadi kesalahan sistem saat proses login.');
    }
  };

  const handleRegister = async () => {
    if (!fullName.trim() || !username.trim() || !password.trim()) {
      Alert.alert('Form Belum Lengkap', 'Nama lengkap, username, dan password wajib diisi.');
      return;
    }

    try {
      const employees = await storage.getEmployees();
      const exists = employees.some(
        (e) => e.username.toLowerCase() === username.trim().toLowerCase()
      );

      if (exists) {
        Alert.alert('Username Terpakai', 'Username ini sudah digunakan pekerja lain. Silakan pilih username lain.');
        return;
      }

      const newEmp = {
        name: fullName.trim(),
        username: username.trim().toLowerCase(),
        role: selectedRole,
        pin: password.trim(),
        phone: phone.trim() || '-',
      };

      await storage.addEmployee(newEmp);

      Alert.alert(
        'Registrasi Berhasil',
        `Akun untuk ${fullName} telah didaftarkan sebagai ${selectedRole}. Silakan masuk.`,
        [
          {
            text: 'OK',
            onPress: () => {
              setIsRegister(false);
            },
          },
        ]
      );
    } catch (e) {
      Alert.alert('Error', 'Gagal mendaftarkan akun baru.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Brand Banner */}
        <View style={styles.brandHeader}>
          <View style={styles.brandLogoBox}>
            <Ionicons name="storefront-sharp" size={38} color={THEME.colors.primary} />
          </View>
          <Text style={styles.appTitle}>KasirKu</Text>
          <Text style={styles.appSubtitle}>
            Sistem Kasir Modern Berbasis Mobile
          </Text>
          <View style={styles.dualStorageBadge}>
            <Ionicons name="shield-checkmark" size={13} color={THEME.colors.successDark} />
            <Text style={styles.dualStorageText}>
              Terproteksi Hardware Secure Storage (Keystore/Keychain)
            </Text>
          </View>
        </View>

        {/* Tab Card Login / Register */}
        <View style={styles.formCard}>
          <View style={styles.tabHeader}>
            <TouchableOpacity
              style={[styles.tabBtn, !isRegister && styles.tabBtnActive]}
              onPress={() => setIsRegister(false)}
            >
              <Text style={[styles.tabBtnText, !isRegister && styles.tabBtnTextActive]}>
                Masuk Kasir
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, isRegister && styles.tabBtnActive]}
              onPress={() => setIsRegister(true)}
            >
              <Text style={[styles.tabBtnText, isRegister && styles.tabBtnTextActive]}>
                Daftar Staf Baru
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          {isRegister && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nama Lengkap Staf</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={18} color={THEME.colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Contoh: Rian Pratama"
                  placeholderTextColor={THEME.colors.textMuted}
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Username / ID Pekerja</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="at-outline" size={18} color={THEME.colors.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="Masukkan username"
                placeholderTextColor={THEME.colors.textMuted}
                autoCapitalize="none"
                value={username}
                onChangeText={setUsername}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Kata Sandi / PIN</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={18} color={THEME.colors.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="Masukkan password atau PIN"
                placeholderTextColor={THEME.colors.textMuted}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={THEME.colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {isRegister && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nomor WhatsApp</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="call-outline" size={18} color={THEME.colors.textSecondary} />
                  <TextInput
                    style={styles.input}
                    placeholder="0812-xxxx-xxxx"
                    placeholderTextColor={THEME.colors.textMuted}
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Posisi Kerja:</Text>
                <View style={styles.roleGrid}>
                  {ROLES.map((role) => (
                    <TouchableOpacity
                      key={role}
                      style={[
                        styles.roleChip,
                        styles.roleChipActive,
                      ]}
                      onPress={() => setSelectedRole(role)}
                    >
                      <Ionicons name="briefcase-outline" size={14} color={THEME.colors.primaryDark} style={{ marginRight: 6 }} />
                      <Text
                        style={[
                          styles.roleChipText,
                          styles.roleChipTextActive,
                        ]}
                      >
                        {role}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </>
          )}

          {!isRegister && (
            <View style={styles.rememberRow}>
              <View style={styles.rememberLeft}>
                <Switch
                  value={rememberMe}
                  onValueChange={setRememberMe}
                  trackColor={{ false: '#CBD5E1', true: THEME.colors.primaryLight }}
                  thumbColor={rememberMe ? THEME.colors.primary : '#F1F5F9'}
                />
                <Text style={styles.rememberText}>Ingat Sesi Login</Text>
              </View>
            </View>
          )}

          {/* Action Button */}
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={isRegister ? handleRegister : handleLogin}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isRegister ? 'person-add' : 'log-in-outline'}
              size={20}
              color="#FFF"
            />
            <Text style={styles.submitBtnText}>
              {isRegister ? 'Daftarkan Pekerja' : 'Masuk ke Aplikasi Kasir'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tombol Demo Cepat */}
        <View style={styles.demoCard}>
          <View style={styles.demoHeader}>
            <Ionicons name="flash-outline" size={16} color={THEME.colors.accent} />
            <Text style={styles.demoTitle}>Akun Demo Kasir (1-Klik Isi):</Text>
          </View>
          <View style={styles.demoGrid}>
            <TouchableOpacity
              style={styles.demoChip}
              onPress={() => fillDemoAccount('sarah', '123456')}
            >
              <Text style={styles.demoChipName}>Sarah Amelia</Text>
              <Text style={styles.demoChipRole}>Kasir</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.bg,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 40,
    paddingBottom: 40,
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  brandLogoBox: {
    width: 76,
    height: 76,
    borderRadius: 22,
    backgroundColor: THEME.colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    ...THEME.shadows.sm,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: THEME.colors.primaryDark,
    letterSpacing: -0.5,
  },
  appSubtitle: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 280,
  },
  dualStorageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.successLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 10,
    gap: 4,
  },
  dualStorageText: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.successDark,
  },
  formCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    ...THEME.shadows.md,
    marginBottom: 20,
  },
  tabHeader: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.surfaceSubtle,
    borderRadius: 12,
    padding: 4,
    marginBottom: 18,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: '#FFF',
    ...THEME.shadows.sm,
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
  },
  tabBtnTextActive: {
    color: THEME.colors.primaryDark,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: THEME.colors.textPrimary,
  },
  eyeBtn: {
    padding: 4,
  },
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  roleChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: THEME.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  roleChipActive: {
    backgroundColor: THEME.colors.primaryMuted,
    borderColor: THEME.colors.primary,
  },
  roleChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
  },
  roleChipTextActive: {
    color: THEME.colors.primaryDark,
    fontWeight: '800',
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  rememberLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rememberText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
  },
  submitBtn: {
    backgroundColor: THEME.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    ...THEME.shadows.md,
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
  demoCard: {
    backgroundColor: THEME.colors.surfaceSubtle,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  demoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 6,
  },
  demoTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.colors.textSecondary,
  },
  demoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  demoChip: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    minWidth: '45%',
    ...THEME.shadows.sm,
  },
  demoChipName: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  demoChipRole: {
    fontSize: 10,
    color: THEME.colors.primary,
    marginTop: 2,
    fontWeight: '600',
  },
});
