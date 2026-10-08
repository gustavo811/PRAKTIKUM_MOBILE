// Modal Pembayaran KasirKu - Tunai (Cash) & QRIS Standar

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME, formatRupiah } from '../constants/theme';

export default function PaymentModal({
  visible,
  onClose,
  paymentData, // { cart, subtotal, discountPercent, discountAmount, grandTotal }
  onCompleteTransaction,
}) {
  const [method, setMethod] = useState('TUNAI'); // 'TUNAI' | 'QRIS'
  const [cashGiven, setCashGiven] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [isVerifyingQRIS, setIsVerifyingQRIS] = useState(false);
  const [isQRISVerified, setIsQRISVerified] = useState(false);

  const grandTotal = paymentData?.grandTotal || 0;
  const numericCash = Number(cashGiven.replace(/\D/g, '')) || 0;
  const changeAmount = numericCash - grandTotal;
  const isCashSufficient = numericCash >= grandTotal;

  // Reset state saat modal dibuka
  useEffect(() => {
    if (visible) {
      setMethod('TUNAI');
      setCashGiven(grandTotal.toString());
      setCustomerName('');
      setIsVerifyingQRIS(false);
      setIsQRISVerified(false);
    }
  }, [visible, grandTotal]);

  const setPresetCash = (amount) => {
    setCashGiven(amount.toString());
  };

  const handleSimulateQRISPayment = () => {
    setIsVerifyingQRIS(true);
    setTimeout(() => {
      setIsVerifyingQRIS(false);
      setIsQRISVerified(true);
    }, 1500);
  };

  const handleFinish = () => {
    if (method === 'TUNAI' && !isCashSufficient) {
      Alert.alert(
        'Nominal Kurang',
        `Uang yang dibayarkan kurang ${formatRupiah(Math.abs(changeAmount))}. Silakan sesuaikan jumlah uang.`
      );
      return;
    }

    if (method === 'QRIS' && !isQRISVerified) {
      Alert.alert(
        'Menunggu Pembayaran',
        'Pelanggan belum menyelesaikan pembayaran QRIS. Klik verifikasi jika pembayaran sudah masuk.'
      );
      return;
    }

    // Bangun payload transaksi
    const transaction = {
      id: 'TRX-' + Date.now().toString().slice(-8),
      date: new Date().toISOString(),
      customerName: customerName.trim() || 'Pelanggan Umum',
      paymentMethod: method,
      items: paymentData.cart.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        cost: item.cost || 0,
        quantity: item.quantity,
        note: item.note || '',
        subtotal: item.price * item.quantity,
      })),
      subtotal: paymentData.subtotal,
      discountPercent: paymentData.discountPercent,
      discountAmount: paymentData.discountAmount,
      grandTotal: paymentData.grandTotal,
      cashGiven: method === 'TUNAI' ? numericCash : grandTotal,
      changeAmount: method === 'TUNAI' ? Math.max(0, changeAmount) : 0,
    };

    onCompleteTransaction(transaction);
  };

  // Nilai pecahan uang preset dinamis
  const getCashPresets = () => {
    const presets = [grandTotal];
    const standardBills = [20000, 50000, 100000, 200000];
    
    standardBills.forEach((bill) => {
      if (bill >= grandTotal && !presets.includes(bill)) {
        presets.push(bill);
      }
    });

    // Bulatkan ke atas jika belum ada
    const roundNext50k = Math.ceil(grandTotal / 50000) * 50000;
    if (roundNext50k > grandTotal && !presets.includes(roundNext50k)) {
      presets.push(roundNext50k);
    }

    return presets.slice(0, 4);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Pilih Pembayaran</Text>
              <Text style={styles.headerSubtitle}>
                Tagihan:{' '}
                <Text style={styles.headerHighlight}>
                  {formatRupiah(grandTotal)}
                </Text>
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={THEME.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Input Nama Pelanggan (Opsional) */}
            <View style={styles.customerInputBox}>
              <Ionicons name="person-outline" size={18} color={THEME.colors.textSecondary} />
              <TextInput
                style={styles.customerInput}
                placeholder="Nama Pelanggan / Nomor Meja (Opsional)"
                placeholderTextColor={THEME.colors.textMuted}
                value={customerName}
                onChangeText={setCustomerName}
              />
            </View>

            {/* Tab Metode Pembayaran */}
            <View style={styles.methodTabs}>
              <TouchableOpacity
                style={[
                  styles.methodTab,
                  method === 'TUNAI' && styles.methodTabActive,
                ]}
                onPress={() => setMethod('TUNAI')}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="cash-outline"
                  size={20}
                  color={method === 'TUNAI' ? '#FFF' : THEME.colors.textSecondary}
                />
                <Text
                  style={[
                    styles.methodTabText,
                    method === 'TUNAI' && styles.methodTabTextActive,
                  ]}
                >
                  Tunai (Cash)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.methodTab,
                  method === 'QRIS' && styles.methodTabActive,
                ]}
                onPress={() => setMethod('QRIS')}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="qr-code-outline"
                  size={20}
                  color={method === 'QRIS' ? '#FFF' : THEME.colors.textSecondary}
                />
                <Text
                  style={[
                    styles.methodTabText,
                    method === 'QRIS' && styles.methodTabTextActive,
                  ]}
                >
                  QRIS / Transfer
                </Text>
              </TouchableOpacity>
            </View>

            {/* KONTEN METODE: TUNAI */}
            {method === 'TUNAI' && (
              <View style={styles.cashSection}>
                <Text style={styles.sectionLabel}>Nominal Uang Diterima:</Text>

                {/* Input Manual Uang Diterima */}
                <View style={styles.cashInputWrapper}>
                  <Text style={styles.rpPrefix}>Rp</Text>
                  <TextInput
                    style={styles.cashInput}
                    keyboardType="numeric"
                    value={
                      numericCash > 0
                        ? numericCash.toLocaleString('id-ID')
                        : ''
                    }
                    onChangeText={(txt) => setCashGiven(txt.replace(/\D/g, ''))}
                    placeholder="0"
                    placeholderTextColor={THEME.colors.textMuted}
                  />
                </View>

                {/* Tombol Pecahan Cepat */}
                <Text style={styles.subLabel}>Pecahan Cepat:</Text>
                <View style={styles.presetGrid}>
                  {getCashPresets().map((val, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.presetBtn,
                        numericCash === val && styles.presetBtnActive,
                      ]}
                      onPress={() => setPresetCash(val)}
                    >
                      <Text
                        style={[
                          styles.presetBtnText,
                          numericCash === val && styles.presetBtnTextActive,
                        ]}
                      >
                        {val === grandTotal ? 'Uang Pas' : formatRupiah(val)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Status Kembalian */}
                <View
                  style={[
                    styles.changeBox,
                    isCashSufficient
                      ? styles.changeBoxSuccess
                      : styles.changeBoxWarning,
                  ]}
                >
                  <View>
                    <Text style={styles.changeLabel}>
                      {isCashSufficient ? 'Uang Kembalian:' : 'Uang Kurang:'}
                    </Text>
                    <Text
                      style={[
                        styles.changeAmount,
                        isCashSufficient
                          ? styles.changeAmountSuccess
                          : styles.changeAmountWarning,
                      ]}
                    >
                      {formatRupiah(Math.abs(changeAmount))}
                    </Text>
                  </View>
                  <Ionicons
                    name={
                      isCashSufficient
                        ? 'checkmark-circle'
                        : 'alert-circle-outline'
                    }
                    size={28}
                    color={
                      isCashSufficient
                        ? THEME.colors.success
                        : THEME.colors.danger
                    }
                  />
                </View>
              </View>
            )}

            {/* KONTEN METODE: QRIS */}
            {method === 'QRIS' && (
              <View style={styles.qrisSection}>
                <View style={styles.qrisCard}>
                  <View style={styles.qrisHeader}>
                    <Text style={styles.qrisBrand}>QRIS</Text>
                    <Text style={styles.qrisSubBrand}>
                      PEMBAYARAN DIGITAL NASIONAL
                    </Text>
                  </View>

                  {/* QR Pattern Representation */}
                  <View style={styles.qrCodePlaceholder}>
                    <Ionicons name="qr-code" size={160} color="#000" />
                    <View style={styles.qrLogoCenter}>
                      <Ionicons name="card" size={24} color={THEME.colors.primary} />
                    </View>
                  </View>

                  <Text style={styles.qrisMerchant}>KASIRKU POS MERCHANT</Text>
                  <Text style={styles.qrisNMID}>NMID: ID1020304050607</Text>
                  <Text style={styles.qrisAmount}>
                    Nominal: {formatRupiah(grandTotal)}
                  </Text>
                </View>

                {/* Status & Simulasi QRIS */}
                <View style={styles.qrisStatusBox}>
                  {isVerifyingQRIS ? (
                    <View style={styles.verifyingRow}>
                      <ActivityIndicator size="small" color={THEME.colors.primary} />
                      <Text style={styles.verifyingText}>
                        Menghubungkan ke Gateway QRIS...
                      </Text>
                    </View>
                  ) : isQRISVerified ? (
                    <View style={styles.verifiedRow}>
                      <Ionicons
                        name="checkmark-circle"
                        size={22}
                        color={THEME.colors.success}
                      />
                      <Text style={styles.verifiedText}>
                        Pembayaran QRIS Berhasil Diverifikasi!
                      </Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.verifyBtn}
                      onPress={handleSimulateQRISPayment}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="scan-outline" size={18} color="#FFF" />
                      <Text style={styles.verifyBtnText}>
                        Cek & Verifikasi Pembayaran QRIS
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
          </ScrollView>

          {/* Footer Submit */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.submitBtn,
                (method === 'TUNAI' && !isCashSufficient) &&
                  styles.submitBtnDisabled,
                (method === 'QRIS' && !isQRISVerified) &&
                  styles.submitBtnDisabled,
              ]}
              disabled={
                (method === 'TUNAI' && !isCashSufficient) ||
                (method === 'QRIS' && !isQRISVerified)
              }
              onPress={handleFinish}
              activeOpacity={0.8}
            >
              <Ionicons name="receipt-outline" size={20} color="#FFF" />
              <Text style={styles.submitBtnText}>
                Selesaikan Transaksi & Cetak Nota
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: THEME.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    ...THEME.shadows.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  headerHighlight: {
    fontWeight: '800',
    color: THEME.colors.primaryDark,
  },
  closeBtn: {
    padding: 6,
  },
  body: {
    maxHeight: 460,
  },
  bodyContent: {
    padding: 20,
  },
  customerInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surfaceSubtle,
    borderRadius: THEME.radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: 16,
    gap: 10,
  },
  customerInput: {
    flex: 1,
    fontSize: 13,
    color: THEME.colors.textPrimary,
  },
  methodTabs: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  methodTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: THEME.radius.md,
    backgroundColor: THEME.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    gap: 8,
  },
  methodTabActive: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primary,
  },
  methodTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
  },
  methodTabTextActive: {
    color: '#FFF',
  },
  cashSection: {
    gap: 10,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
  },
  cashInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: THEME.colors.primary,
    borderRadius: THEME.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  rpPrefix: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.colors.primaryDark,
    marginRight: 6,
  },
  cashInput: {
    flex: 1,
    fontSize: 22,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  subLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.colors.textMuted,
    marginTop: 6,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetBtn: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: THEME.colors.surfaceSubtle,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  presetBtnActive: {
    backgroundColor: THEME.colors.primaryMuted,
    borderColor: THEME.colors.primary,
  },
  presetBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  presetBtnTextActive: {
    color: THEME.colors.primaryDark,
  },
  changeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: THEME.radius.md,
    marginTop: 10,
    borderWidth: 1,
  },
  changeBoxSuccess: {
    backgroundColor: THEME.colors.successLight,
    borderColor: THEME.colors.success,
  },
  changeBoxWarning: {
    backgroundColor: THEME.colors.dangerLight,
    borderColor: THEME.colors.danger,
  },
  changeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
  },
  changeAmount: {
    fontSize: 20,
    fontWeight: '900',
    marginTop: 2,
  },
  changeAmountSuccess: {
    color: THEME.colors.successDark,
  },
  changeAmountWarning: {
    color: THEME.colors.dangerDark,
  },
  qrisSection: {
    alignItems: 'center',
    gap: 14,
  },
  qrisCard: {
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    ...THEME.shadows.sm,
  },
  qrisHeader: {
    alignItems: 'center',
    marginBottom: 10,
  },
  qrisBrand: {
    fontSize: 18,
    fontWeight: '900',
    color: '#D32F2F',
    letterSpacing: 1,
  },
  qrisSubBrand: {
    fontSize: 9,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    letterSpacing: 0.5,
  },
  qrCodePlaceholder: {
    position: 'relative',
    padding: 10,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrLogoCenter: {
    position: 'absolute',
    backgroundColor: '#FFF',
    padding: 4,
    borderRadius: 8,
  },
  qrisMerchant: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    marginTop: 8,
  },
  qrisNMID: {
    fontSize: 10,
    color: THEME.colors.textMuted,
  },
  qrisAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.primaryDark,
    marginTop: 6,
  },
  qrisStatusBox: {
    width: '100%',
  },
  verifyBtn: {
    backgroundColor: THEME.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: THEME.radius.md,
    gap: 8,
  },
  verifyBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  verifyingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  verifyingText: {
    fontSize: 13,
    color: THEME.colors.primaryDark,
    fontWeight: '600',
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
    backgroundColor: THEME.colors.successLight,
    borderRadius: THEME.radius.md,
  },
  verifiedText: {
    fontSize: 13,
    color: THEME.colors.successDark,
    fontWeight: '700',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
  },
  submitBtn: {
    backgroundColor: THEME.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: THEME.radius.md,
    gap: 8,
    ...THEME.shadows.md,
  },
  submitBtnDisabled: {
    backgroundColor: THEME.colors.textMuted,
    elevation: 0,
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
