import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { THEME, formatRupiah, formatDateTime } from '../src/constants/theme';
import { storage } from '../src/services/storage';

export default function RiwayatScreen() {
  // 1. Penerapan useState untuk mengelola state lokal daftar riwayat transaksi
  const [transactions, setTransactions] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filterMethod, setFilterMethod] = useState('Semua'); // 'Semua' | 'TUNAI' | 'QRIS'
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 1. Penerapan useEffect untuk mengambil data awal transaksi dari AsyncStorage saat pertama kali dirender
  useEffect(() => {
    fetchInitialTransactions();
  }, []);

  const fetchInitialTransactions = async () => {
    try {
      setIsLoading(true);
      const data = await storage.getTransactions();
      setTransactions(data);
    } catch (e) {
      console.error('Error saat load data transaksi:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    const data = await storage.getTransactions();
    setTransactions(data);
    setRefreshing(false);
  };

  // 2. Penerapan router.back() untuk kembali ke halaman sebelumnya (Kasir POS)
  const handleGoBack = () => {
    router.back();
  };

  // 2. Penerapan router.push() untuk berpindah ke halaman detail nota transaksi
  const handleOpenDetailNota = (transactionItem: any) => {
    router.push({
      pathname: '/detail-nota',
      params: { id: transactionItem.id },
    });
  };

  // Perhitungan Ringkasan Finansial
  const totalOmset = transactions.reduce((sum, t) => sum + (t.grandTotal || 0), 0);
  const totalCash = transactions
    .filter((t) => t.paymentMethod === 'TUNAI')
    .reduce((sum, t) => sum + (t.grandTotal || 0), 0);
  const totalQris = transactions
    .filter((t) => t.paymentMethod === 'QRIS')
    .reduce((sum, t) => sum + (t.grandTotal || 0), 0);

  // Filter Data
  const filtered = transactions.filter((t) => {
    const matchMethod =
      filterMethod === 'Semua' || t.paymentMethod === filterMethod;
    const matchSearch =
      (t.id && t.id.toLowerCase().includes(search.toLowerCase())) ||
      (t.customerName && t.customerName.toLowerCase().includes(search.toLowerCase()));
    return matchMethod && matchSearch;
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* CUSTOM HEADER DENGAN TOMBOL KEMBALI ROUTER.BACK() */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleGoBack}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color={THEME.colors.textPrimary} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Riwayat Transaksi</Text>
          <Text style={styles.headerSubtitle}>
            {transactions.length} Transaksi Tercatat
          </Text>
        </View>
      </View>

      {/* KARTU STATISTIK OMSET */}
      <View style={styles.metricsWrapper}>
        <View style={styles.mainMetricCard}>
          <Text style={styles.mainMetricLabel}>Total Omset Penjualan</Text>
          <Text style={styles.mainMetricValue}>{formatRupiah(totalOmset)}</Text>
          <View style={styles.mainMetricSub}>
            <Ionicons name="receipt-outline" size={14} color="#CCFBF1" />
            <Text style={styles.mainMetricSubText}>
              {transactions.length} Total Transaksi Berhasil
            </Text>
          </View>
        </View>

        <View style={styles.subMetricsRow}>
          <View style={styles.subMetricCard}>
            <View style={styles.subMetricHeader}>
              <Ionicons name="cash-outline" size={16} color={THEME.colors.primary} />
              <Text style={styles.subMetricLabel}>Tunai (Cash)</Text>
            </View>
            <Text style={styles.subMetricValue}>{formatRupiah(totalCash)}</Text>
          </View>

          <View style={styles.subMetricCard}>
            <View style={styles.subMetricHeader}>
              <Ionicons name="qr-code-outline" size={16} color={THEME.colors.info} />
              <Text style={styles.subMetricLabel}>QRIS / Digital</Text>
            </View>
            <Text style={[styles.subMetricValue, { color: THEME.colors.info }]}>
              {formatRupiah(totalQris)}
            </Text>
          </View>
        </View>
      </View>

      {/* FILTER METODE & CARI NOMOR NOTA */}
      <View style={styles.filterSection}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={THEME.colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari no. nota / nama pelanggan..."
            placeholderTextColor={THEME.colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={THEME.colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filterTabs}>
          {['Semua', 'TUNAI', 'QRIS'].map((m) => (
            <TouchableOpacity
              key={m}
              style={[
                styles.filterTab,
                filterMethod === m && styles.filterTabActive,
              ]}
              onPress={() => setFilterMethod(m)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  filterMethod === m && styles.filterTabTextActive,
                ]}
              >
                {m === 'Semua' ? 'Semua Metode' : m === 'TUNAI' ? 'Tunai' : 'QRIS'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* DAFTAR TRANSAKSI (FLATLIST) */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={THEME.colors.primary} />
          <Text style={styles.loadingText}>Memuat riwayat transaksi...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[THEME.colors.primary]}
            />
          }
          renderItem={({ item }) => {
            const isTunai = item.paymentMethod === 'TUNAI';
            const itemsSummary = item.items
              ? item.items.map((i: any) => `${i.name} x${i.quantity}`).join(', ')
              : '-';

            return (
              <TouchableOpacity
                style={styles.txCard}
                // 2. Penerapan router.push() saat kartu transaksi ditekan
                onPress={() => handleOpenDetailNota(item)}
                activeOpacity={0.8}
              >
                <View style={styles.txCardHeader}>
                  <View>
                    <Text style={styles.txId}>#{item.id}</Text>
                    <Text style={styles.txTime}>{formatDateTime(item.date)}</Text>
                  </View>

                  <View
                    style={[
                      styles.methodBadge,
                      isTunai ? styles.badgeTunai : styles.badgeQris,
                    ]}
                  >
                    <Ionicons
                      name={isTunai ? 'cash' : 'qr-code'}
                      size={12}
                      color={isTunai ? THEME.colors.primaryDark : THEME.colors.info}
                    />
                    <Text
                      style={[
                        styles.methodBadgeText,
                        isTunai ? styles.methodTextTunai : styles.methodTextQris,
                      ]}
                    >
                      {item.paymentMethod}
                    </Text>
                  </View>
                </View>

                <Text style={styles.txCustomer}>
                  Pelanggan: <Text style={styles.bold}>{item.customerName || 'Umum'}</Text>{' '}
                  • Kasir: {item.cashierName || 'Kasir'}
                </Text>

                <Text style={styles.txItemsSummary} numberOfLines={1}>
                  {itemsSummary}
                </Text>

                <View style={styles.txCardFooter}>
                  <View>
                    <Text style={styles.txTotalLabel}>Total Belanja</Text>
                    <Text style={styles.txTotalAmount}>
                      {formatRupiah(item.grandTotal)}
                    </Text>
                  </View>

                  <View style={styles.detailBtn}>
                    <Text style={styles.detailBtnText}>Lihat Nota</Text>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={THEME.colors.primary}
                    />
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={48} color={THEME.colors.borderDark} />
              <Text style={styles.emptyTitle}>Belum Ada Transaksi</Text>
              <Text style={styles.emptySubtitle}>
                Transaksi yang berhasil diproses di kasir akan muncul di sini.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.colors.bg,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: THEME.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
    gap: 12,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: THEME.colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: THEME.colors.textMuted,
  },
  metricsWrapper: {
    padding: 16,
    gap: 10,
  },
  mainMetricCard: {
    backgroundColor: THEME.colors.primary,
    borderRadius: 18,
    padding: 18,
    ...THEME.shadows.md,
  },
  mainMetricLabel: {
    fontSize: 12,
    color: '#CCFBF1',
    fontWeight: '600',
  },
  mainMetricValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFF',
    marginTop: 4,
    marginBottom: 8,
  },
  mainMetricSub: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mainMetricSubText: {
    fontSize: 12,
    color: '#CCFBF1',
    fontWeight: '500',
  },
  subMetricsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  subMetricCard: {
    flex: 1,
    backgroundColor: THEME.colors.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    ...THEME.shadows.sm,
  },
  subMetricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  subMetricLabel: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    fontWeight: '600',
  },
  subMetricValue: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.primaryDark,
  },
  filterSection: {
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: THEME.colors.textPrimary,
  },
  filterTabs: {
    flexDirection: 'row',
    gap: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  filterTabActive: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primary,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
  },
  filterTabTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },
  txCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    ...THEME.shadows.sm,
  },
  txCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  txId: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  txTime: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  methodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeTunai: {
    backgroundColor: THEME.colors.primaryMuted,
  },
  badgeQris: {
    backgroundColor: '#E0F2FE',
  },
  methodBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  methodTextTunai: {
    color: THEME.colors.primaryDark,
  },
  methodTextQris: {
    color: THEME.colors.info,
  },
  txCustomer: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    marginBottom: 4,
  },
  bold: {
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  txItemsSummary: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    marginBottom: 12,
  },
  txCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
    paddingTop: 10,
  },
  txTotalLabel: {
    fontSize: 10,
    color: THEME.colors.textMuted,
  },
  txTotalAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.colors.primaryDark,
  },
  detailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: THEME.colors.primaryMuted,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  detailBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.primaryDark,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    padding: 30,
  },
  loadingText: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
});
