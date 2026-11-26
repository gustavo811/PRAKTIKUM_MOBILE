// Aplikasi KasirKu - Entry Point Utama, Route Guard & Navigasi Tab Bottom Bar

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import { THEME } from './src/constants/theme';
import { storage } from './src/services/storage';
import { AuthProvider, useAuth } from './src/context/AuthContext';

// Komponen & Layar
import Header from './src/components/Header';
import AuthScreen from './src/screens/AuthScreen';
import KasirScreen from './src/screens/KasirScreen';
import MenuScreen from './src/screens/MenuScreen';
import RiwayatScreen from './src/screens/RiwayatScreen';

function MainApp() {
  const { user, cashierProfile, loading: authLoading, signOut } = useAuth();

  const [isLoadingData, setIsLoadingData] = useState(false);
  const [activeTab, setActiveTab] = useState('KASIR'); // 'KASIR' | 'MENU' | 'RIWAYAT'

  // Data Terpusat
  const [products, setProducts] = useState([]);
  const [storeInfo, setStoreInfo] = useState(null);

  // Muat data POS ketika user berhasil login
  useEffect(() => {
    if (!user?.id) return;

    let active = true;
    const loadPosData = async () => {
      try {
        setIsLoadingData(true);
        const [loadedProducts, loadedStore] = await Promise.all([
          storage.getProducts(),
          storage.getStoreInfo(),
        ]);
        if (active) {
          setProducts(loadedProducts);
          setStoreInfo(loadedStore);
        }
      } catch (e) {
        console.error('Gagal memuat data POS:', e);
      } finally {
        if (active) {
          setIsLoadingData(false);
        }
      }
    };

    loadPosData();
    return () => {
      active = false;
    };
  }, [user?.id]);

  const handleRefreshProducts = async () => {
    const list = await storage.getProducts();
    setProducts(list);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      setProducts([]);
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
      id: 'RIWAYAT',
      label: 'Riwayat',
      icon: 'receipt-outline',
      iconActive: 'receipt',
    },
  ];

  // 1. Cek sesi awal masih berlangsung
  if (authLoading || (user && isLoadingData && products.length === 0)) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={THEME.colors.primary} />
        <Text style={styles.loadingText}>Menyiapkan KasirKu POS...</Text>
      </View>
    );
  }

  // 2. Route Guard: jika belum login, tampilkan AuthScreen
  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ExpoStatusBar style="dark" />
        <AuthScreen />
      </SafeAreaView>
    );
  }

  // 3. Sudah login: masuk ke aplikasi utama POS
  return (
    <SafeAreaView style={styles.safeArea}>
      <ExpoStatusBar style="dark" />

      {/* Header Atas Konsisten */}
      <Header
        currentUser={cashierProfile}
        storeInfo={storeInfo}
        onLogout={handleLogout}
      />

      {/* Konten Halaman Sesuai Tab Aktif */}
      <View style={styles.mainContent}>
        {activeTab === 'KASIR' && (
          <KasirScreen
            products={products}
            onRefreshProducts={handleRefreshProducts}
            currentUser={cashierProfile}
            storeInfo={storeInfo}
          />
        )}
        {activeTab === 'MENU' && (
          <MenuScreen
            products={products}
            onRefreshProducts={handleRefreshProducts}
          />
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

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
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
