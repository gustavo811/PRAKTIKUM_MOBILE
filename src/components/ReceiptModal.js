// Modal Nota Digital - Desain Thermal Receipt Bergaya Modern & Fitur Bagikan (Share)

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Share,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME, formatRupiah, formatDateTime } from '../constants/theme';

export default function ReceiptModal({
  visible,
  transaction,
  storeInfo,
  cashierName,
  shiftName,
  onClose,
}) {
  if (!transaction) return null;

  // Bangun teks receipt untuk dibagikan via WhatsApp, Notes, SMS dll
  const handleShareReceipt = async () => {
    try {
      const itemsText = transaction.items
        .map(
          (item) =>
            `- ${item.name} x${item.quantity} = ${formatRupiah(item.subtotal)}` +
            (item.note ? ` (${item.note})` : '')
        )
        .join('\n');

      const message = `==============================\n` +
        `🧾 *STRUK PEMBAYARAN DIGITAL*\n` +
        `*${storeInfo?.name || 'KasirKu Store'}*\n` +
        `${storeInfo?.address || ''}\n` +
        `Telp: ${storeInfo?.phone || ''}\n` +
        `==============================\n` +
        `No. Nota : ${transaction.id}\n` +
        `Tanggal  : ${formatDateTime(transaction.date)}\n` +
        `Kasir    : ${cashierName || 'Sarah Amelia'}\n` +
        `Shift    : ${shiftName || 'Shift Pagi'}\n` +
        `Pelanggan: ${transaction.customerName || 'Umum'}\n` +
        `------------------------------\n` +
        `*DETAIL PESANAN:*\n` +
        `${itemsText}\n` +
        `------------------------------\n` +
        `Subtotal : ${formatRupiah(transaction.subtotal)}\n` +
        (transaction.discountAmount > 0
          ? `Diskon (${transaction.discountPercent}%) : -${formatRupiah(transaction.discountAmount)}\n`
          : '') +
        `*GRAND TOTAL : ${formatRupiah(transaction.grandTotal)}*\n` +
        `------------------------------\n` +
        `Metode   : ${transaction.paymentMethod}\n` +
        (transaction.paymentMethod === 'TUNAI'
          ? `Dibayar  : ${formatRupiah(transaction.cashGiven)}\n` +
            `Kembali  : ${formatRupiah(transaction.changeAmount)}\n`
          : `Status   : LUNAS (QRIS Terverifikasi)\n`) +
        `==============================\n` +
        `${storeInfo?.footerMessage || 'Terima kasih atas kunjungan Anda!'}\n` +
        `*KasirKu Mobile POS*`;

      await Share.share({
        title: `Nota Pembayaran #${transaction.id}`,
        message: message,
      });
    } catch (error) {
      Alert.alert('Gagal Membagikan', 'Terjadi kesalahan saat membagikan struk.');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Action Header */}
          <View style={styles.topBar}>
            <Text style={styles.topBarTitle}>Nota Transaksi Berhasil</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeIcon}>
              <Ionicons name="close" size={24} color={THEME.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.receiptScroll}
            contentContainerStyle={styles.receiptScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* KERTAS NOTA THERMAL */}
            <View style={styles.thermalPaper}>
              {/* Header Toko */}
              <View style={styles.storeHeader}>
                <View style={styles.receiptLogoCircle}>
                  <Ionicons name="cafe" size={24} color={THEME.colors.primaryDark} />
                </View>
                <Text style={styles.receiptStoreName}>
                  {storeInfo?.name || 'Kopi & Rasa Nusantara'}
                </Text>
                {storeInfo?.tagline ? (
                  <Text style={styles.receiptTagline}>{storeInfo.tagline}</Text>
                ) : null}
                <Text style={styles.receiptAddress}>
                  {storeInfo?.address || 'Jakarta, Indonesia'}
                </Text>
                <Text style={styles.receiptContact}>
                  Telp: {storeInfo?.phone || '-'} | IG: {storeInfo?.instagram || '-'}
                </Text>
              </View>

              {/* Garis Pembatas Thermal */}
              <View style={styles.dashedDivider} />

              {/* Info Transaksi */}
              <View style={styles.metaSection}>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>No. Nota</Text>
                  <Text style={styles.metaValue}>#{transaction.id}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Waktu</Text>
                  <Text style={styles.metaValue}>
                    {formatDateTime(transaction.date)}
                  </Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Kasir / Shift</Text>
                  <Text style={styles.metaValue}>
                    {cashierName || 'Kasir'} ({shiftName || 'Shift'})
                  </Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Pelanggan</Text>
                  <Text style={styles.metaValue}>
                    {transaction.customerName || 'Umum'}
                  </Text>
                </View>
              </View>

              <View style={styles.dashedDivider} />

              {/* Rincian Item */}
              <View style={styles.itemsSection}>
                {transaction.items?.map((item, index) => (
                  <View key={index} style={styles.itemRowWrapper}>
                    <View style={styles.itemMainRow}>
                      <Text style={styles.receiptItemName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.receiptItemSubtotal}>
                        {formatRupiah(item.subtotal)}
                      </Text>
                    </View>
                    <View style={styles.itemSubRow}>
                      <Text style={styles.receiptItemDetail}>
                        {item.quantity} x {formatRupiah(item.price)}
                      </Text>
                      {item.note ? (
                        <Text style={styles.receiptItemNote}>
                          Catatan: {item.note}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.dashedDivider} />

              {/* Rincian Pembayaran */}
              <View style={styles.summarySection}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal</Text>
                  <Text style={styles.summaryValue}>
                    {formatRupiah(transaction.subtotal)}
                  </Text>
                </View>

                {transaction.discountAmount > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>
                      Diskon ({transaction.discountPercent}%)
                    </Text>
                    <Text style={styles.summaryValue}>
                      -{formatRupiah(transaction.discountAmount)}
                    </Text>
                  </View>
                )}

                <View style={[styles.summaryRow, styles.grandTotalRow]}>
                  <Text style={styles.grandTotalLabel}>TOTAL</Text>
                  <Text style={styles.grandTotalValue}>
                    {formatRupiah(transaction.grandTotal)}
                  </Text>
                </View>

                <View style={styles.dashedDivider} />

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Metode Bayar</Text>
                  <Text style={styles.summaryValue}>
                    {transaction.paymentMethod === 'TUNAI'
                      ? 'TUNAI / CASH'
                      : 'QRIS STANDAR'}
                  </Text>
                </View>

                {transaction.paymentMethod === 'TUNAI' ? (
                  <>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Uang Diterima</Text>
                      <Text style={styles.summaryValue}>
                        {formatRupiah(transaction.cashGiven)}
                      </Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Kembalian</Text>
                      <Text style={[styles.summaryValue, { fontWeight: '800' }]}>
                        {formatRupiah(transaction.changeAmount)}
                      </Text>
                    </View>
                  </>
                ) : (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Status</Text>
                    <Text style={[styles.summaryValue, { color: THEME.colors.successDark }]}>
                      LUNAS (SUKSES)
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.dashedDivider} />

              {/* Footer Ucapan */}
              <View style={styles.receiptFooter}>
                <Text style={styles.footerNote}>
                  {storeInfo?.footerMessage ||
                    'Terima kasih telah berkunjung & bertransaksi!'}
                </Text>
                <Text style={styles.barcodeText}>||| | ||||| || |||| ||||| |||</Text>
                <Text style={styles.poweredBy}>KasirKu POS Mobile System</Text>
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionSection}>
            <TouchableOpacity
              style={styles.shareBtn}
              onPress={handleShareReceipt}
              activeOpacity={0.8}
            >
              <Ionicons name="share-social-outline" size={20} color="#FFF" />
              <Text style={styles.shareBtnText}>Bagikan Nota (WhatsApp/dll)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.doneBtn}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.doneBtnText}>Selesai / Transaksi Baru</Text>
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
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    maxHeight: '92%',
    backgroundColor: '#FFF',
    borderRadius: 24,
    overflow: 'hidden',
    ...THEME.shadows.lg,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
    backgroundColor: THEME.colors.surfaceSubtle,
  },
  topBarTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  closeIcon: {
    padding: 4,
  },
  receiptScroll: {
    maxHeight: 460,
    backgroundColor: '#F1F5F9',
  },
  receiptScrollContent: {
    padding: 14,
  },
  thermalPaper: {
    backgroundColor: THEME.colors.receiptPaper,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.colors.receiptBorder,
    padding: 16,
    ...THEME.shadows.sm,
  },
  storeHeader: {
    alignItems: 'center',
    marginBottom: 10,
  },
  receiptLogoCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: THEME.colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  receiptStoreName: {
    fontSize: 16,
    fontWeight: '900',
    color: THEME.colors.receiptText,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  receiptTagline: {
    fontSize: 11,
    color: '#78716C',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 2,
  },
  receiptAddress: {
    fontSize: 10,
    color: '#78716C',
    textAlign: 'center',
    marginTop: 4,
  },
  receiptContact: {
    fontSize: 9,
    color: '#A8A29E',
    textAlign: 'center',
    marginTop: 2,
  },
  dashedDivider: {
    borderBottomWidth: 1,
    borderColor: '#D6D3D1',
    borderStyle: 'dashed',
    marginVertical: 10,
  },
  metaSection: {
    gap: 4,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaLabel: {
    fontSize: 11,
    color: '#78716C',
  },
  metaValue: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.receiptText,
  },
  itemsSection: {
    gap: 8,
  },
  itemRowWrapper: {
    gap: 2,
  },
  itemMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  receiptItemName: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.receiptText,
    flex: 1,
    marginRight: 8,
  },
  receiptItemSubtotal: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.receiptText,
  },
  itemSubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  receiptItemDetail: {
    fontSize: 10,
    color: '#78716C',
  },
  receiptItemNote: {
    fontSize: 10,
    fontStyle: 'italic',
    color: THEME.colors.primaryDark,
  },
  summarySection: {
    gap: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#78716C',
  },
  summaryValue: {
    fontSize: 11,
    color: THEME.colors.receiptText,
  },
  grandTotalRow: {
    marginVertical: 4,
    paddingVertical: 4,
  },
  grandTotalLabel: {
    fontSize: 14,
    fontWeight: '900',
    color: THEME.colors.receiptText,
  },
  grandTotalValue: {
    fontSize: 15,
    fontWeight: '900',
    color: THEME.colors.primaryDark,
  },
  receiptFooter: {
    alignItems: 'center',
    gap: 4,
    paddingTop: 6,
  },
  footerNote: {
    fontSize: 11,
    color: '#78716C',
    textAlign: 'center',
  },
  barcodeText: {
    fontSize: 18,
    letterSpacing: 2,
    color: '#44403C',
    marginTop: 4,
  },
  poweredBy: {
    fontSize: 9,
    color: '#A8A29E',
    marginTop: 2,
  },
  actionSection: {
    padding: 16,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
  },
  shareBtn: {
    backgroundColor: '#25D366', // WhatsApp Green
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: THEME.radius.md,
    gap: 8,
    ...THEME.shadows.sm,
  },
  shareBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
  },
  doneBtn: {
    backgroundColor: THEME.colors.surfaceSubtle,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: THEME.radius.md,
  },
  doneBtnText: {
    color: THEME.colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
});
