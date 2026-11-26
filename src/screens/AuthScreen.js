// Layanan Autentikasi Pengguna KasirKu dengan Supabase Auth

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
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../constants/theme';
import { supabase, isSupabaseConfigured } from '../services/supabase';

export default function AuthScreen() {
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSwitchMode = (registerMode) => {
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
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        setErrorMessage(error.message || 'Email atau kata sandi salah.');
      }
    } catch {
      setErrorMessage('Terjadi kesalahan koneksi saat proses login.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setErrorMessage('');
    if (!fullName.trim() || !email.trim() || !password) {
      setErrorMessage('Nama kasir, email, dan kata sandi wajib diisi.');
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
      setLoading(true);
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
          'Akun berhasil dibuat. Silakan cek email untuk verifikasi (jika aktif), lalu login.',
          [{ text: 'OK', onPress: () => handleSwitchMode(false) }]
        );
      }
    } catch {
      setErrorMessage('Terjadi kesalahan koneksi saat mendaftar.');
    } finally {
      setLoading(false);
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
              Supabase Auth & SecureStore Session
            </Text>
          </View>
        </View>

        {/* Tab Card Login / Register */}
        <View style={styles.formCard}>
          <View style={styles.tabHeader}>
            <TouchableOpacity
              style={[styles.tabBtn, !isRegister && styles.tabBtnActive]}
              onPress={() => handleSwitchMode(false)}
              disabled={loading}
            >
              <Text style={[styles.tabBtnText, !isRegister && styles.tabBtnTextActive]}>
                Masuk Kasir
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, isRegister && styles.tabBtnActive]}
              onPress={() => handleSwitchMode(true)}
              disabled={loading}
            >
              <Text style={[styles.tabBtnText, isRegister && styles.tabBtnTextActive]}>
                Daftar Kasir Baru
              </Text>
            </TouchableOpacity>
          </View>

          {errorMessage ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={16} color={THEME.colors.danger} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {isRegister && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nama Lengkap Kasir</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={18} color={THEME.colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Contoh: Rian Pratama"
                  placeholderTextColor={THEME.colors.textMuted}
                  value={fullName}
                  onChangeText={setFullName}
                  editable={!loading}
                />
              </View>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email Kasir</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={18} color={THEME.colors.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="kasir@toko.com"
                placeholderTextColor={THEME.colors.textMuted}
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                editable={!loading}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Kata Sandi</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={18} color={THEME.colors.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="Minimal 6 karakter"
                placeholderTextColor={THEME.colors.textMuted}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
                disabled={loading}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={THEME.colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Action Button */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={isRegister ? handleRegister : handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <Ionicons
                  name={isRegister ? 'person-add' : 'log-in-outline'}
                  size={20}
                  color="#FFF"
                />
                <Text style={styles.submitBtnText}>
                  {isRegister ? 'Daftarkan Akun Kasir' : 'Masuk ke Aplikasi Kasir'}
                </Text>
              </>
            )}
          </TouchableOpacity>
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
    marginBottom: 14,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.dangerDark,
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
  submitBtn: {
    backgroundColor: THEME.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginTop: 6,
    ...THEME.shadows.md,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
