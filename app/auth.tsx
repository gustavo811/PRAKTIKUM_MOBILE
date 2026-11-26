import React, { useState } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../src/constants/theme';
import { supabase, isSupabaseConfigured } from '../src/services/supabase';

export default function AuthScreen() {
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Form Fields State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSwitchMode = (registerMode: boolean) => {
    setIsRegister(registerMode);
    setErrorMessage('');
  };

  const handleLogin = async () => {
    setErrorMessage('');
    if (!email.trim() || !password) {
      setErrorMessage('Email dan kata sandi wajib diisi.');
      return;
    }

    if (!isSupabaseConfigured) {
      setErrorMessage('Konfigurasi Supabase di file .env belum diisi.');
      return;
    }

    try {
      setIsSubmitting(true);
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        setErrorMessage(error.message || 'Email atau kata sandi tidak sesuai.');
      }
    } catch {
      setErrorMessage('Terjadi kesalahan sistem saat proses login.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async () => {
    setErrorMessage('');
    if (!fullName.trim() || !email.trim() || !password) {
      setErrorMessage('Nama lengkap kasir, email, dan kata sandi wajib diisi.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Kata sandi minimal 6 karakter.');
      return;
    }

    if (!isSupabaseConfigured) {
      setErrorMessage('Konfigurasi Supabase di file .env belum diisi.');
      return;
    }

    try {
      setIsSubmitting(true);
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            role: 'Kasir',
          },
        },
      });

      if (error) {
        setErrorMessage(error.message || 'Gagal mendaftarkan akun kasir.');
        return;
      }

      if (!data?.session) {
        Alert.alert(
          'Registrasi Berhasil',
          `Akun ${fullName.trim()} berhasil dibuat. Silakan cek email untuk verifikasi (jika aktif), lalu login.`,
          [{ text: 'OK', onPress: () => handleSwitchMode(false) }]
        );
      }
    } catch {
      setErrorMessage('Gagal mendaftarkan akun kasir.');
    } finally {
      setIsSubmitting(false);
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
              onPress={() => handleSwitchMode(false)}
              disabled={isSubmitting}
            >
              <Text
                style={[styles.toggleBtnText, !isRegister && styles.toggleBtnTextActive]}
              >
                Masuk Kasir
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, isRegister && styles.toggleBtnActive]}
              onPress={() => handleSwitchMode(true)}
              disabled={isSubmitting}
            >
              <Text
                style={[styles.toggleBtnText, isRegister && styles.toggleBtnTextActive]}
              >
                Daftar Kasir
              </Text>
            </TouchableOpacity>
          </View>

          {/* FORM CARD */}
          <View style={styles.card}>
            {errorMessage ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={16} color={THEME.colors.danger} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {isRegister && (
              <>
                <Text style={styles.inputLabel}>Nama Lengkap Kasir</Text>
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
                    editable={!isSubmitting}
                  />
                </View>
              </>
            )}

            <Text style={styles.inputLabel}>Email Kasir</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="mail-outline"
                size={20}
                color={THEME.colors.textMuted}
              />
              <TextInput
                style={styles.input}
                placeholder="kasir@toko.com"
                placeholderTextColor={THEME.colors.textMuted}
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                editable={!isSubmitting}
              />
            </View>

            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={THEME.colors.textMuted}
              />
              <TextInput
                style={styles.input}
                placeholder="Minimal 6 karakter"
                placeholderTextColor={THEME.colors.textMuted}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                editable={!isSubmitting}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                disabled={isSubmitting}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={THEME.colors.textMuted}
                />
              </TouchableOpacity>
            </View>

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
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: THEME.colors.dangerLight,
    borderWidth: 1,
    borderColor: THEME.colors.danger,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 6,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.dangerDark,
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
});
