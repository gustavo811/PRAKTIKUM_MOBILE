// Layanan Manajemen Shift Kasir & Rekonsiliasi Kas (Fisik vs Sistem)

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME, formatRupiah, formatDateTime, formatTime } from '../constants/theme';
import { SHIFT_TYPES } from '../constants/initialData';
import { storage } from '../services/storage';

export default function ShiftScreen({
  activeShift,
  onRefreshShift,
  currentUser,
}) {
  const [shiftHistory, setShiftHistory] = useState([]);
  const [shiftTransactions, setShiftTransactions] = useState([]);

  // Form Tutup Shift
  const [actualCashInput, setActualCashInput] = useState('');
  const [handoverNote, setHandoverNote] = useState('');

  // Form Buka Shift Baru
  const [selectedShiftType, setSelectedShiftType] = useState('Pagi');
  const [newOpeningCashInput, setNewOpeningCashInput] = useState('200000');

  useEffect(() => {
    loadShiftData();
  }, [activeShift]);

  const loadShiftData = async () => {
    const history = await storage.getShiftHistory();
    setShiftHistory(history);

    const allTx = await storage.getTransactions();
    // Filter transaksi yang masuk ke shift aktif saat ini
    if (activeShift) {
      const currentTx = allTx.filter(
        (t) =>
          t.shiftId === activeShift.id ||
          new Date(t.date) >= new Date(activeShift.startTime)
      );
      setShiftTransactions(currentTx);
    } else {
      setShiftTransactions([]);
    }
  };

  // Kalkulasi Finansial Shift Aktif
  const totalCashSales = shiftTransactions
    .filter((t) => t.paymentMethod === 'TUNAI')
    .reduce((sum, t) => sum + (t.grandTotal || 0), 0);

  const totalQrisSales = shiftTransactions
    .filter((t) => t.paymentMethod === 'QRIS')
    .reduce((sum, t) => sum + (t.grandTotal || 0), 0);

  const totalShiftSales = totalCashSales + totalQrisSales;
  const openingCash = activeShift?.openingCash || 0;
  
  // Uang yang seharusnya ada di laci kasir (Modal Awal + Seluruh Penjualan Tunai)
  const expectedDrawerCash = openingCash + totalCashSales;

  // Nilai fisik aktual dari input kasir
  const actualCash = Number(actualCashInput.replace(/\D/g, '')) || 0;
  const cashDifference = actualCash - expectedDrawerCash;

  // Tutup Shift Aktif
  const handleCloseShift = async () => {
    if (!actualCashInput.trim()) {
      Alert.alert(
        'Perhatian',
        'Silakan hitung dan masukkan nominal uang fisik yang ada di laci kasir.'
      );
      return;
    }

    Alert.alert(
      'Konfirmasi Tutup Shift',
      `Anda akan menutup shift dengan selisih kas ${
        cashDifference === 0
          ? 'Sesuai (Rp 0)'
          : cashDifference > 0
          ? `Kelebihan +${formatRupiah(cashDifference)}`
          : `Kekurangan ${formatRupiah(cashDifference)}`
      }. Lanjutkan?`,
      [
        { text: 'Periksa Kembali', style: 'cancel' },
        {
          text: 'Tutup Shift Sekarang',
          style: 'destructive',
          onPress: async () => {
            const closingData = {
              expectedCash: expectedDrawerCash,
              actualCash: actualCash,
              cashDifference: cashDifference,
              totalCashSales: totalCashSales,
              totalQrisSales: totalQrisSales,
              totalSales: totalShiftSales,
              transactionCount: shiftTransactions.length,
              handoverNote: handoverNote.trim() || 'Serah terima shift selesai lancar.',
            };

            await storage.closeActiveShift(closingData);
            setActualCashInput('');
            setHandoverNote('');
            await onRefreshShift();
            await loadShiftData();

            Alert.alert(
              'Shift Berhasil Ditutup',
              'Rekonsiliasi kas telah tersimpan ke riwayat operasional toko.'
            );
          },
        },
      ]
    );
  };

  // Buka Shift Baru
  const handleOpenNewShift = async () => {
    const openingNum = Number(newOpeningCashInput.replace(/\D/g, '')) || 0;

    const newShift = {
      id: 'shift-' + Date.now().toString().slice(-6),
      name: `Shift ${selectedShiftType}`,
      cashierName: currentUser?.name || 'Sarah Amelia',
      cashierId: currentUser?.id || 'emp-001',
      startTime: new Date().toISOString(),
      openingCash: openingNum,
      status: 'OPEN',
    };

    await storage.setActiveShift(newShift);
    await onRefreshShift();
    await loadShiftData();

    Alert.alert(
      'Shift Dibuka',
      `Shift ${selectedShiftType} berhasil dimulai dengan modal awal ${formatRupiah(
        openingNum
      )}.`
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* SHIFT AKTIF ATAU BUKA SHIFT BARU */}
      {activeShift ? (
        <View style={styles.card}>
          {/* Header Shift Aktif */}
          <View style={styles.cardHeader}>
            <View style={styles.shiftBadge}>
              <View style={styles.pulseDot} />
              <Text style={styles.shiftBadgeText}>SHIFT SEDANG BERJALAN</Text>
            </View>
            <Text style={styles.shiftStartTime}>
              Mulai: {formatTime(activeShift.startTime)}
            </Text>
          </View>

          <Text style={styles.shiftTitle}>{activeShift.name}</Text>
          <Text style={styles.cashierName}>
            Petugas Kasir: <Text style={styles.bold}>{activeShift.cashierName}</Text>
          </Text>

          {/* Grid Ringkasan Finansial Shift */}
          <View style={styles.financialGrid}>
            <View style={styles.finItem}>
              <Text style={styles.finLabel}>Modal Awal Kasir</Text>
              <Text style={styles.finValue}>{formatRupiah(openingCash)}</Text>
            </View>
            <View style={styles.finItem}>
              <Text style={styles.finLabel}>Penjualan Tunai</Text>
              <Text style={[styles.finValue, { color: THEME.colors.primaryDark }]}>
                +{formatRupiah(totalCashSales)}
              </Text>
            </View>
            <View style={styles.finItem}>
              <Text style={styles.finLabel}>Penjualan QRIS</Text>
              <Text style={[styles.finValue, { color: THEME.colors.info }]}>
                {formatRupiah(totalQrisSales)}
              </Text>
            </View>
            <View style={styles.finItem}>
              <Text style={styles.finLabel}>Total Omset Shift</Text>
              <Text style={[styles.finValue, { color: THEME.colors.successDark }]}>
                {formatRupiah(totalShiftSales)}
              </Text>
            </View>
          </View>

          {/* Target Uang di Laci (Expected Cash) */}
          <View style={styles.expectedBox}>
            <View style={styles.expectedLeft}>
              <Ionicons name="wallet-outline" size={24} color={THEME.colors.primary} />
              <View>
                <Text style={styles.expectedLabel}>
                  Uang Seharusnya di Laci:
                </Text>
                <Text style={styles.expectedFormula}>
                  (Modal Awal + Total Penjualan Tunai)
                </Text>
              </View>
            </View>
            <Text style={styles.expectedAmount}>
              {formatRupiah(expectedDrawerCash)}
            </Text>
          </View>

          {/* FORM REKONSILIASI KAS (TUTUP SHIFT) */}
          <View style={styles.reconciliationBox}>
            <Text style={styles.reconcileTitle}>
              Tutup Shift & Rekonsiliasi Kas Laci
            </Text>
            <Text style={styles.reconcileSubtitle}>
              Hitung uang fisik di laci saat pergantian shift kasir
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Uang Fisik Aktual di Laci (Rp):</Text>
              <View style={styles.cashInputWrap}>
                <Text style={styles.cashRp}>Rp</Text>
                <TextInput
                  style={styles.cashInput}
                  keyboardType="numeric"
                  placeholder="0"
                  value={
                    actualCash > 0 ? actualCash.toLocaleString('id-ID') : ''
                  }
                  onChangeText={(txt) => setActualCashInput(txt.replace(/\D/g, ''))}
                />
              </View>
            </View>

            {/* Indikator Selisih Kas */}
            {actualCashInput.length > 0 && (
              <View
                style={[
                  styles.diffBox,
                  cashDifference === 0
                    ? styles.diffBalanced
                    : cashDifference > 0
                    ? styles.diffSurplus
                    : styles.diffDeficit,
                ]}
              >
                <View style={styles.diffLeft}>
                  <Ionicons
                    name={
                      cashDifference === 0
                        ? 'checkmark-circle'
                        : cashDifference > 0
                        ? 'trending-up'
                        : 'alert-circle'
                    }
                    size={20}
                    color={
                      cashDifference === 0
                        ? THEME.colors.successDark
                        : cashDifference > 0
                        ? THEME.colors.warning
                        : THEME.colors.danger
                    }
                  />
                  <Text style={styles.diffStatusText}>
                    {cashDifference === 0
                      ? 'Kas Sesuai (Impas)'
                      : cashDifference > 0
                      ? 'Kelebihan Uang Kas:'
                      : 'Kekurangan Uang Kas:'}
                  </Text>
                </View>
                <Text style={styles.diffAmountText}>
                  {cashDifference === 0
                    ? 'Rp 0'
                    : (cashDifference > 0 ? '+' : '') +
                      formatRupiah(cashDifference)}
                </Text>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Catatan Serah Terima:</Text>
              <TextInput
                style={styles.noteInput}
                placeholder="Catatan kondisi laci, stok koin, atau pesan untuk kasir shift berikutnya..."
                multiline
                numberOfLines={2}
                value={handoverNote}
                onChangeText={setHandoverNote}
              />
            </View>

            <TouchableOpacity
              style={styles.closeShiftBtn}
              onPress={handleCloseShift}
              activeOpacity={0.8}
            >
              <Ionicons name="lock-closed-outline" size={18} color="#FFF" />
              <Text style={styles.closeShiftBtnText}>
                Tutup Shift & Serahkan Kas
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        /* KARTU BUKA SHIFT BARU */
        <View style={styles.card}>
          <View style={styles.noShiftHeader}>
            <View style={styles.lockIconBox}>
              <Ionicons name="lock-open-outline" size={28} color={THEME.colors.primary} />
            </View>
            <View>
              <Text style={styles.noShiftTitle}>Buka Shift Kasir Baru</Text>
              <Text style={styles.noShiftSubtitle}>
                Tidak ada shift aktif. Silakan buka shift sebelum transaksi.
              </Text>
            </View>
          </View>

          {/* Pilihan Shift */}
          <Text style={styles.sectionLabel}>Pilih Periode Shift:</Text>
          <View style={styles.shiftTypeGrid}>
            {SHIFT_TYPES.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.shiftTypeBtn,
                  selectedShiftType === type.id && styles.shiftTypeBtnActive,
                ]}
                onPress={() => setSelectedShiftType(type.id)}
              >
                <Ionicons
                  name={type.icon}
                  size={20}
                  color={
                    selectedShiftType === type.id
                      ? THEME.colors.primaryDark
                      : THEME.colors.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.shiftTypeText,
                    selectedShiftType === type.id && styles.shiftTypeTextActive,
                  ]}
                >
                  {type.id}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Modal Awal */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Modal Awal Laci Kasir (*Opening Cash*):
            </Text>
            <View style={styles.cashInputWrap}>
              <Text style={styles.cashRp}>Rp</Text>
              <TextInput
                style={styles.cashInput}
                keyboardType="numeric"
                value={
                  Number(newOpeningCashInput) > 0
                    ? Number(newOpeningCashInput).toLocaleString('id-ID')
                    : ''
                }
                onChangeText={(t) =>
                  setNewOpeningCashInput(t.replace(/\D/g, ''))
                }
              />
            </View>
            <View style={styles.quickCashRow}>
              {[100000, 200000, 300000, 500000].map((amt) => (
                <TouchableOpacity
                  key={amt}
                  style={styles.quickCashChip}
                  onPress={() => setNewOpeningCashInput(amt.toString())}
                >
                  <Text style={styles.quickCashChipText}>
                    {formatRupiah(amt)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={styles.openShiftBtn}
            onPress={handleOpenNewShift}
            activeOpacity={0.8}
          >
            <Ionicons name="key-outline" size={18} color="#FFF" />
            <Text style={styles.openShiftBtnText}>
              Buka Shift ({selectedShiftType}) Sekarang
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* RIWAYAT SERAH TERIMA SHIFT SEBELUMNYA */}
      <View style={styles.historySection}>
        <View style={styles.historyHeader}>
          <Ionicons name="time-outline" size={18} color={THEME.colors.textSecondary} />
          <Text style={styles.historyTitle}>Riwayat Pergantian Shift</Text>
        </View>

        {shiftHistory.length === 0 ? (
          <View style={styles.emptyHistory}>
            <Text style={styles.emptyHistoryText}>
              Belum ada riwayat penutupan shift.
            </Text>
          </View>
        ) : (
          shiftHistory.map((item, index) => {
            const isMatch = item.cashDifference === 0;
            const isSurplus = item.cashDifference > 0;
            return (
              <View key={index} style={styles.historyCard}>
                <View style={styles.historyCardHeader}>
                  <View>
                    <Text style={styles.histShiftName}>{item.name}</Text>
                    <Text style={styles.histCashier}>
                      Kasir: {item.cashierName}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.histBadge,
                      isMatch
                        ? styles.histBadgeSuccess
                        : isSurplus
                        ? styles.histBadgeWarning
                        : styles.histBadgeDanger,
                    ]}
                  >
                    <Text
                      style={[
                        styles.histBadgeText,
                        isMatch
                          ? styles.histBadgeTextSuccess
                          : isSurplus
                          ? styles.histBadgeTextWarning
                          : styles.histBadgeTextDanger,
                      ]}
                    >
                      {isMatch
                        ? 'Sesuai'
                        : isSurplus
                        ? `+${formatRupiah(item.cashDifference)}`
                        : `${formatRupiah(item.cashDifference)}`}
                    </Text>
                  </View>
                </View>

                <View style={styles.histTimeRow}>
                  <Text style={styles.histTimeText}>
                    Buka: {formatDateTime(item.startTime)}
                  </Text>
                  <Text style={styles.histTimeText}>
                    Tutup: {formatDateTime(item.endTime)}
                  </Text>
                </View>

                <View style={styles.histGrid}>
                  <View style={styles.histGridCol}>
                    <Text style={styles.histGridLabel}>Modal Awal</Text>
                    <Text style={styles.histGridVal}>
                      {formatRupiah(item.openingCash)}
                    </Text>
                  </View>
                  <View style={styles.histGridCol}>
                    <Text style={styles.histGridLabel}>Penjualan Tunai</Text>
                    <Text style={styles.histGridVal}>
                      {formatRupiah(item.totalCashSales || 0)}
                    </Text>
                  </View>
                  <View style={styles.histGridCol}>
                    <Text style={styles.histGridLabel}>Uang Fisik Kasir</Text>
                    <Text style={styles.histGridVal}>
                      {formatRupiah(item.actualCash || 0)}
                    </Text>
                  </View>
                </View>

                {item.handoverNote ? (
                  <View style={styles.histNoteBox}>
                    <Text style={styles.histNoteText}>
                      💬 "{item.handoverNote}"
                    </Text>
                  </View>
                ) : null}
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.bg,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: THEME.radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    ...THEME.shadows.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  shiftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME.colors.success,
  },
  shiftBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.successDark,
  },
  shiftStartTime: {
    fontSize: 11,
    color: THEME.colors.textMuted,
  },
  shiftTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: THEME.colors.textPrimary,
  },
  cashierName: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  bold: {
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  financialGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: THEME.colors.surfaceSubtle,
    borderRadius: 12,
    padding: 10,
    marginVertical: 12,
    gap: 8,
  },
  finItem: {
    flex: 1,
    minWidth: '45%',
  },
  finLabel: {
    fontSize: 10,
    color: THEME.colors.textMuted,
    fontWeight: '600',
  },
  finValue: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    marginTop: 2,
  },
  expectedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: THEME.colors.primaryMuted,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: THEME.colors.primaryLight,
  },
  expectedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  expectedLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.primaryDark,
  },
  expectedFormula: {
    fontSize: 9,
    color: THEME.colors.textSecondary,
  },
  expectedAmount: {
    fontSize: 15,
    fontWeight: '900',
    color: THEME.colors.primaryDark,
  },
  reconciliationBox: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
    gap: 12,
  },
  reconcileTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  reconcileSubtitle: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: -8,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
  },
  cashInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  cashRp: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
    marginRight: 6,
  },
  cashInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  diffBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  diffBalanced: {
    backgroundColor: THEME.colors.successLight,
    borderColor: THEME.colors.success,
  },
  diffSurplus: {
    backgroundColor: THEME.colors.warningLight,
    borderColor: THEME.colors.warning,
  },
  diffDeficit: {
    backgroundColor: THEME.colors.dangerLight,
    borderColor: THEME.colors.danger,
  },
  diffLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  diffStatusText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  diffAmountText: {
    fontSize: 14,
    fontWeight: '900',
  },
  noteInput: {
    backgroundColor: THEME.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 10,
    padding: 10,
    fontSize: 12,
    height: 60,
    textAlignVertical: 'top',
  },
  closeShiftBtn: {
    backgroundColor: THEME.colors.danger,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
    marginTop: 4,
  },
  closeShiftBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
  },

  // Form Buka Shift
  noShiftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  lockIconBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: THEME.colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noShiftTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  noShiftSubtitle: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    maxWidth: 240,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
    marginBottom: 6,
  },
  shiftTypeGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  shiftTypeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  shiftTypeBtnActive: {
    backgroundColor: THEME.colors.primaryMuted,
    borderColor: THEME.colors.primary,
  },
  shiftTypeText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
  },
  shiftTypeTextActive: {
    color: THEME.colors.primaryDark,
  },
  quickCashRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  quickCashChip: {
    backgroundColor: THEME.colors.surfaceSubtle,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  quickCashChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
  },
  openShiftBtn: {
    backgroundColor: THEME.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
    marginTop: 10,
  },
  openShiftBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
  },

  // Riwayat Shift
  historySection: {
    gap: 10,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  historyTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.colors.textSecondary,
  },
  emptyHistory: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  emptyHistoryText: {
    fontSize: 12,
    color: THEME.colors.textMuted,
  },
  historyCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    gap: 8,
  },
  historyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  histShiftName: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  histCashier: {
    fontSize: 11,
    color: THEME.colors.textMuted,
  },
  histBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  histBadgeSuccess: {
    backgroundColor: THEME.colors.successLight,
  },
  histBadgeWarning: {
    backgroundColor: THEME.colors.warningLight,
  },
  histBadgeDanger: {
    backgroundColor: THEME.colors.dangerLight,
  },
  histBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  histBadgeTextSuccess: {
    color: THEME.colors.successDark,
  },
  histBadgeTextWarning: {
    color: THEME.colors.warning,
  },
  histBadgeTextDanger: {
    color: THEME.colors.dangerDark,
  },
  histTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  histTimeText: {
    fontSize: 10,
    color: THEME.colors.textMuted,
  },
  histGrid: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.surfaceSubtle,
    borderRadius: 8,
    padding: 8,
  },
  histGridCol: {
    flex: 1,
    alignItems: 'center',
  },
  histGridLabel: {
    fontSize: 9,
    color: THEME.colors.textMuted,
    fontWeight: '600',
  },
  histGridVal: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    marginTop: 2,
  },
  histNoteBox: {
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: THEME.colors.primary,
  },
  histNoteText: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    fontStyle: 'italic',
  },
});
