import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { THEME } from '../src/constants/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: THEME.colors.surface,
          },
          headerTintColor: THEME.colors.textPrimary,
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: 18,
          },
          headerShadowVisible: false,
          contentStyle: {
            backgroundColor: THEME.colors.bg,
          },
        }}
      >
        {/* 1. Halaman Index / Splash / Pengecekan Sesi */}
        <Stack.Screen
          name="index"
          options={{
            headerShown: false,
          }}
        />

        {/* 2. Halaman Autentikasi (Login & Registrasi Kasir) */}
        <Stack.Screen
          name="auth"
          options={{
            headerShown: false,
            title: 'Masuk KasirKu',
            gestureEnabled: false,
          }}
        />

        {/* 3. Halaman Utama Kasir POS */}
        <Stack.Screen
          name="kasir"
          options={{
            headerShown: false,
            title: 'Kasir POS',
            gestureEnabled: false,
          }}
        />

        {/* 4. Halaman Riwayat Transaksi */}
        <Stack.Screen
          name="riwayat"
          options={{
            headerShown: false,
            title: 'Riwayat Transaksi',
          }}
        />

        {/* 5. Halaman Detail Nota Transaksi */}
        <Stack.Screen
          name="detail-nota"
          options={{
            headerShown: true,
            title: 'Rincian Nota Transaksi',
            headerBackTitle: 'Kembali',
          }}
        />

        {/* 6. Halaman Kelola Menu & Katalog Stok */}
        <Stack.Screen
          name="menu"
          options={{
            headerShown: true,
            title: 'Katalog Menu & Stok',
            headerBackTitle: 'Kasir',
          }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}
