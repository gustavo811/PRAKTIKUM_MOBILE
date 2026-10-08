// Aplikasi KasirKu - Entry Point Utama, Navigasi Tab Bottom Bar & State Manajer

import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import { THEME } from './src/constants/theme';
import { storage } from './src/services/storage';
import { secureStorage } from './src/services/secureStorage';

// Komponen & Layar
import Header from './src/components/Header';
import AuthScreen from './src/screens/AuthScreen';
import KasirScreen from './src/screens/KasirScreen';
import MenuScreen from './src/screens/MenuScreen';
import ShiftScreen from './src/screens/ShiftScreen';
import PresensiScreen from './src/screens/PresensiScreen';
import RiwayatScreen from './src/screens/RiwayatScreen';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('KASIR'); // 'KASIR' | 'MENU' | 'SHIFT' | 'PRESENSI' | 'RIWAYAT'

  // Data Terpusat
  const [products, setProducts] = useState([]);
  const [activeShift, setActiveShift] = useState(null);
  const [storeInfo, setStoreInfo] = useState(null);

  // Inisialisasi Aplikasi Saat Start
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      setIsLoading(true);

      // 1. Cek sesi login tersimpan di Secure Storage
      const savedUser = await secureStorage.getObject(secureStorage.KEYS.AUTH_USER);
      if (savedUser) {
        setCurrentUser(savedUser);
      }

      // 2. Muat data produk katalog
      const loadedProducts = await storage.getProducts();
      setProducts(loadedProducts);

      // 3. Muat shift aktif
      const loadedShift = await storage.getActiveShift();
      setActiveShift(loadedShift);

      // 4. Muat informasi toko
      const loadedStore = await storage.getStoreInfo();
      setStoreInfo(loadedStore);
    } catch (e) {
      console.error('Inisialisasi error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshProducts = async () => {
    const list = await storage.getProducts();
    setProducts(list);
  };

  const handleRefreshShift = async () => {
    const s = await storage.getActiveShift();
    setActiveShift(s);
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
  };

  const handleLogout = async () => {
    try {
      await secureStorage.removeItem(secureStorage.KEYS.AUTH_USER);
      setCurrentUser(null);
      setActiveTab('KASIR');
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  // Konfigurasi Navigasi Tab Bottom Bar
  const TABS = [
    {
      id: 'KASIR',
      label: 'Kasir POS',
      icon: 'calculator-outline',
      iconActive: 'calculator',
    },
    {
      id: 'MENU',
      label: 'Menu',
      icon: 'restaurant-outline',
      iconActive: 'restaurant',
    },
    {
      id: 'SHIFT',
      label: 'Shift Kas',
      icon: 'wallet-outline',
      iconActive: 'wallet',
    },
    {
      id: 'PRESENSI',
      label: 'Presensi',
      icon: 'time-outline',
      iconActive: 'time',
    },
    {
      id: 'RIWAYAT',
      label: 'Riwayat',
      icon: 'receipt-outline',
      iconActive: 'receipt',
    },
  ];

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={THEME.colors.primary} />
        <Text style={styles.loadingText}>Menyiapkan KasirKu POS...</Text>
      </View>
    );
  }

  // Jika belum login, tampilkan Layar Autentikasi
  if (!currentUser) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ExpoStatusBar style="dark" />
        <AuthScreen onLoginSuccess={handleLoginSuccess} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ExpoStatusBar style="dark" />

      {/* Header Atas Konsisten */}
      <Header
        currentUser={currentUser}
        activeShift={activeShift}
        storeInfo={storeInfo}
        onLogout={handleLogout}
        onOpenShiftModal={() => setActiveTab('SHIFT')}
      />

      {/* Konten Halaman Sesuai Tab Aktif */}
      <View style={styles.mainContent}>
        {activeTab === 'KASIR' && (
          <KasirScreen
            products={products}
            onRefreshProducts={handleRefreshProducts}
            currentUser={currentUser}
            activeShift={activeShift}
            storeInfo={storeInfo}
          />
        )}
        {activeTab === 'MENU' && (
          <MenuScreen
            products={products}
            onRefreshProducts={handleRefreshProducts}
          />
        )}
        {activeTab === 'SHIFT' && (
          <ShiftScreen
            activeShift={activeShift}
            onRefreshShift={handleRefreshShift}
            currentUser={currentUser}
          />
        )}
        {activeTab === 'PRESENSI' && (
          <PresensiScreen currentUser={currentUser} />
        )}
        {activeTab === 'RIWAYAT' && (
          <RiwayatScreen storeInfo={storeInfo} />
        )}
      </View>

      {/* BOTTOM TAB BAR */}
      <View style={styles.bottomTabBar}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabItem, isActive && styles.tabItemActive]}
              onPress={() => setActiveTab(tab.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.tabIconWrapper, isActive && styles.tabIconWrapperActive]}>
                <Ionicons
                  name={isActive ? tab.iconActive : tab.icon}
                  size={20}
                  color={isActive ? THEME.colors.primary : THEME.colors.textMuted}
                />
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  isActive ? styles.tabLabelActive : styles.tabLabelInactive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.colors.surface,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.colors.bg,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
  },
  mainContent: {
    flex: 1,
    backgroundColor: THEME.colors.bg,
  },
  bottomTabBar: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.surface,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
    paddingVertical: 6,
    paddingHorizontal: 8,
    ...THEME.shadows.md,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabItemActive: {},
  tabIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconWrapperActive: {
    backgroundColor: THEME.colors.primaryMuted,
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 2,
  },
  tabLabelActive: {
    fontWeight: '800',
    color: THEME.colors.primaryDark,
  },
  tabLabelInactive: {
    fontWeight: '600',
    color: THEME.colors.textMuted,
  },
});
