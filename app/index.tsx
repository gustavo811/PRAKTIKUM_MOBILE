import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { secureStorage } from '../src/services/secureStorage';
import { THEME } from '../src/constants/theme';

export default function IndexScreen() {
  // 1. Penerapan useState untuk mengelola state loading pengecekan sesi
  const [checkingSession, setCheckingSession] = useState(true);

  // 1. Penerapan useEffect untuk mengambil data awal sesi saat pertama kali render
  useEffect(() => {
    checkAuthSession();
  }, []);

  const checkAuthSession = async () => {
    try {
      // Ambil data sesi pengguna aktif dari storage
      const activeUser = await secureStorage.getObject(secureStorage.KEYS.AUTH_USER);

      // Delay kecil untuk transisi splash screen yang halus
      setTimeout(() => {
        setCheckingSession(false);
        // 2. Penerapan router.replace() agar halaman splash terhapus dari stack navigasi
        if (activeUser && activeUser.username) {
          router.replace('/kasir');
        } else {
          router.replace('/auth');
        }
      }, 700);
    } catch (error) {
      console.error('Error saat cek sesi:', error);
      setCheckingSession(false);
      router.replace('/auth');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoBadge}>
        <Ionicons name="storefront" size={48} color={THEME.colors.primary} />
      </View>
      <Text style={styles.appName}>KasirKu</Text>
      <Text style={styles.appTagline}>Sistem Kasir POS & Manajemen Penjualan</Text>

      <View style={styles.loadingWrapper}>
        <ActivityIndicator size="small" color={THEME.colors.primary} />
        <Text style={styles.loadingText}>Memeriksa status login kasir...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  logoBadge: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: THEME.colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    ...THEME.shadows.md,
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: THEME.colors.primaryDark,
    letterSpacing: -0.5,
  },
  appTagline: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
    marginTop: 6,
    textAlign: 'center',
  },
  loadingWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 36,
    backgroundColor: THEME.colors.bg,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  loadingText: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    fontWeight: '600',
  },
});
