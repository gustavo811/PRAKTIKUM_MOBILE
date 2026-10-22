import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { THEME, formatRupiah, formatDateTime } from '../src/constants/theme';
import { storage } from '../src/services/storage';

export default function DetailNotaScreen() {
  // Ambil parameter id transaksi yang dipassing dari router.push()
  const { id } = useLocalSearchParams<{ id: string }>();

  // 1. Penerapan useState untuk mengelola detail nota transaksi
  const [transaction, setTransaction] = useState<any>(null);
  const [storeInfo, setStoreInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Penerapan useEffect untuk mengambil data awal nota dari AsyncStorage
  useEffect(() => {
    loadNotaDetails();
  }, [id]);

  const loadNotaDetails = async () => {
    try {
      setIsLoading(true);
      const [allTx, store] = await Promise.all([
        storage.getTransactions(),
        storage.getStoreInfo(),
      ]);

      setStoreInfo(store);

      // Temukan transaksi berdasarkan id dari param router.push
      const found = allTx.find((tx: any) => tx.id === id);
      if (found) {
        setTransaction(found);
      } else if (allTx.length > 0) {
        // Fallback ke transaksi terakhir jika id tidak spesifik
        setTransaction(allTx[0]);
      }
    } catch (e) {
      console.error('Gagal mengambil data nota:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Penerapan router.back() untuk kembali ke halaman sebelumnya
  const handleBack = () => {
    router.back();
  };

  const handlePrintNota = () => {
    Alert.alert('Cetak Nota', 'Simulasi mengirim nota ke printer bluetooth kasir.');
  };

  const handleShareNota = () => {
    Alert.alert('Bagikan Nota', `Nota #${transaction?.id} siap dibagikan ke WhatsApp pelanggan.`);
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={THEME.colors.primary} />
        <Text style={styles.loadingText}>Memuat rincian nota...</Text>
      </View>
    );
  }

  if (!transaction) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={THEME.colors.danger} />
        <Text style={styles.notFoundTitle}>Nota Tidak Ditemukan</Text>
        <Text style={styles.notFoundSub}>
          Transaksi dengan ID #{id} tidak tercatat di penyimpanan kasir.
        </Text>
        <TouchableOpacity style={styles.backActionBtn} onPress={handleBack}>
          <Text style={styles.backActionText}>Kembali ke Halaman Sebelumnya</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isTunai = transaction.paymentMethod === 'TUNAI';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* TOMBOL NAVIGASI KEMBALI MENGGUNAKAN ROUTER.BACK() */}
      <View style={styles.topNavigationRow}>
        <TouchableOpacity
          style={styles.backChip}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={18} color={THEME.colors.textPrimary} />
          <Text style={styles.backChipText}>Kembali</Text>
        </TouchableOpacity>

        <View style={styles.headerRightActions}>
          <TouchableOpacity style={styles.actionIconBtn} onPress={handleShareNota}>
            <Ionicons name="share-social-outline" size={20} color={THEME.colors.primaryDark} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionIconBtn} onPress={handlePrintNota}>
            <Ionicons name="print-outline" size={20} color={THEME.colors.primaryDark} />
          </TouchableOpacity>
        </View>
      </View>

      {/* STRUK NOTA DIGITAL (RECEIPT CARD) */}
      <View style={styles.receiptCard}>
        {/* IDENTITAS TOKO */}
        <View style={styles.storeSection}>
          <View style={styles.storeIconWrap}>
            <Ionicons name="receipt" size={24} color={THEME.colors.primary} />
          </View>
          <Text style={styles.storeName}>{storeInfo?.name || 'KasirKu POS'}</Text>
          <Text style={styles.storeAddress}>{storeInfo?.address || 'Pusat Kuliner & Retail'}</Text>
          <Text style={styles.storePhone}>Telp: {storeInfo?.phone || '0812-3456-7890'}</Text>
        </View>

        {/* GARIS PEMBATAS STRUK */}
        <View style={styles.dashedLine} />

        {/* METADATA TRANSAKSI */}
        <View style={styles.metaSection}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Nomor Nota</Text>
            <Text style={styles.metaValueBold}>#{transaction.id}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Waktu</Text>
            <Text style={styles.metaValue}>{formatDateTime(transaction.date)}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Kasir Bertugas</Text>
            <Text style={styles.metaValue}>{transaction.cashierName || 'Kasir'}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Pelanggan</Text>
            <Text style={styles.metaValue}>{transaction.customerName || 'Umum'}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Metode Bayar</Text>
            <View
              style={[
                styles.methodTag,
                isTunai ? styles.methodTagTunai : styles.methodTagQris,
              ]}
            >
              <Text
                style={[
                  styles.methodTagText,
                  isTunai ? styles.textTunai : styles.textQris,
                ]}
              >
                {transaction.paymentMethod}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.dashedLine} />

        {/* DAFTAR ITEM YANG DIBELI */}
        <View style={styles.itemsSection}>
          <Text style={styles.itemsSectionTitle}>Rincian Pesanan:</Text>
          {transaction.items &&
            transaction.items.map((item: any, idx: number) => {
              const itemTotal = item.price * item.quantity;
              return (
                <View key={item.id || idx} style={styles.itemRow}>
                  <View style={styles.itemLeft}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemSubtext}>
                      {item.quantity} x {formatRupiah(item.price)}
                    </Text>
                    {item.note ? (
                      <Text style={styles.itemNote}>Catatan: "{item.note}"</Text>
                    ) : null}
                  </View>
                  <Text style={styles.itemTotalPrice}>{formatRupiah(itemTotal)}</Text>
                </View>
              );
            })}
        </View>

        <View style={styles.dashedLine} />

        {/* RINCIAN PEMBAYARAN & TOTAL */}
        <View style={styles.summarySection}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>
              {formatRupiah(transaction.subtotal || transaction.grandTotal)}
            </Text>
          </View>

          {transaction.discountPercent > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                Diskon Promo ({transaction.discountPercent}%)
              </Text>
              <Text style={styles.discountValue}>
                -{formatRupiah(transaction.discountAmount || 0)}
              </Text>
            </View>
          )}

          {transaction.taxAmount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Pajak PB1 (10%)</Text>
              <Text style={styles.summaryValue}>
                +{formatRupiah(transaction.taxAmount)}
              </Text>
            </View>
          )}

          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>TOTAL AKHIR</Text>
            <Text style={styles.grandTotalValue}>
              {formatRupiah(transaction.grandTotal)}
            </Text>
          </View>

          {isTunai && (
            <>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Uang Diterima (Cash)</Text>
                <Text style={styles.summaryValue}>
                  {formatRupiah(transaction.cashAmount || transaction.grandTotal)}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Kembalian</Text>
                <Text style={styles.changeValue}>
                  {formatRupiah(transaction.changeAmount || 0)}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* FOOTER STRUK */}
        <View style={styles.receiptFooter}>
          <Text style={styles.thankYouText}>~ Terima Kasih Atas Kunjungan Anda ~</Text>
          <Text style={styles.footerNote}>
            Barang yang sudah dibeli tidak dapat ditukar/dikembalikan
          </Text>
          <View style={styles.statusSuccessPill}>
            <Ionicons name="checkmark-circle" size={14} color="#059669" />
            <Text style={styles.statusSuccessText}>LUNAS / BERHASIL</Text>
          </View>
        </View>
      </View>

      {/* TOMBOL AKSI BAWAH */}
      <View style={styles.bottomButtons}>
        <TouchableOpacity
          style={styles.backMainBtn}
          onPress={handleBack}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={18} color="#FFF" />
          <Text style={styles.backMainBtnText}>Kembali ke Halaman Sebelumnya</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.bg,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  topNavigationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: THEME.colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    ...THEME.shadows.sm,
  },
  backChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  headerRightActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: THEME.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    ...THEME.shadows.sm,
  },
  receiptCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    ...THEME.shadows.md,
  },
  storeSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  storeIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: THEME.colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  storeName: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.colors.primaryDark,
  },
  storeAddress: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  storePhone: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  dashedLine: {
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
    borderStyle: 'dashed',
    marginVertical: 12,
  },
  metaSection: {
    gap: 6,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
  },
  metaValue: {
    fontSize: 12,
    color: THEME.colors.textPrimary,
    fontWeight: '500',
  },
  metaValueBold: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.colors.primaryDark,
  },
  methodTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  methodTagTunai: {
    backgroundColor: THEME.colors.primaryMuted,
  },
  methodTagQris: {
    backgroundColor: '#E0F2FE',
  },
  methodTagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  textTunai: {
    color: THEME.colors.primaryDark,
  },
  textQris: {
    color: THEME.colors.info,
  },
  itemsSection: {
    gap: 10,
  },
  itemsSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginBottom: 4,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemLeft: {
    flex: 1,
    paddingRight: 10,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
  },
  itemSubtext: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 1,
  },
  itemNote: {
    fontSize: 10,
    fontStyle: 'italic',
    color: THEME.colors.warning,
    marginTop: 2,
  },
  itemTotalPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  summarySection: {
    gap: 6,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
  },
  discountValue: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.danger,
  },
  changeValue: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.primaryDark,
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: THEME.colors.border,
  },
  grandTotalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  grandTotalValue: {
    fontSize: 18,
    fontWeight: '900',
    color: THEME.colors.primaryDark,
  },
  receiptFooter: {
    alignItems: 'center',
    marginTop: 16,
    gap: 4,
  },
  thankYouText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  footerNote: {
    fontSize: 10,
    color: THEME.colors.textMuted,
    textAlign: 'center',
  },
  statusSuccessPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  statusSuccessText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
  },
  bottomButtons: {
    marginTop: 16,
  },
  backMainBtn: {
    backgroundColor: THEME.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    ...THEME.shadows.sm,
  },
  backMainBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    fontWeight: '600',
  },
  notFoundTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    marginTop: 8,
  },
  notFoundSub: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    textAlign: 'center',
  },
  backActionBtn: {
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 12,
  },
  backActionText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
