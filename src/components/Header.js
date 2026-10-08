// Header Komponen - Status Shift Aktif, Toko, dan Profil Kasir (Logout)

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../constants/theme';

export default function Header({
  currentUser,
  activeShift,
  storeInfo,
  onLogout,
  onOpenShiftModal,
}) {
  const [profileModalVisible, setProfileModalVisible] = useState(false);

  const handleConfirmLogout = () => {
    Alert.alert(
      'Konfirmasi Keluar',
      `Apakah Anda yakin ingin logout dari akun ${currentUser?.name || 'Kasir'}?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Keluar',
          style: 'destructive',
          onPress: () => {
            setProfileModalVisible(false);
            if (onLogout) onLogout();
          },
        },
      ]
    );
  };

  return (
    <View style={styles.headerContainer}>
      <View style={styles.leftContainer}>
        <View style={styles.brandBadge}>
          <Ionicons name="storefront" size={20} color={THEME.colors.primary} />
        </View>
        <View>
          <Text style={styles.appName}>KasirKu</Text>
          <Text style={styles.storeName} numberOfLines={1}>
            {storeInfo?.name || 'Toko Retail & Cafe'}
          </Text>
        </View>
      </View>

      <View style={styles.rightContainer}>
        {/* Status Shift Aktif Badge */}
        <TouchableOpacity
          style={styles.shiftBadge}
          onPress={onOpenShiftModal}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.shiftDot,
              { backgroundColor: activeShift ? THEME.colors.success : THEME.colors.danger },
            ]}
          />
          <Text style={styles.shiftText} numberOfLines={1}>
            {activeShift ? `${activeShift.name || 'Shift Aktif'}` : 'Shift Tutup'}
          </Text>
        </TouchableOpacity>

        {/* User Avatar Button */}
        <TouchableOpacity
          style={styles.avatarButton}
          onPress={() => setProfileModalVisible(true)}
          activeOpacity={0.8}
        >
          {currentUser?.avatar ? (
            <Image source={{ uri: currentUser.avatar }} style={styles.avatarImg} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitial}>
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'K'}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Modal Detail Profil & Opsi Logout */}
      <Modal
        visible={profileModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setProfileModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setProfileModalVisible(false)}
        >
          <View style={styles.modalCard} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Profil Kasir Bertugas</Text>
              <TouchableOpacity onPress={() => setProfileModalVisible(false)}>
                <Ionicons name="close" size={24} color={THEME.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.profileInfoBox}>
              <View style={styles.largeAvatarWrapper}>
                {currentUser?.avatar ? (
                  <Image source={{ uri: currentUser.avatar }} style={styles.largeAvatar} />
                ) : (
                  <View style={[styles.largeAvatar, styles.avatarFallback]}>
                    <Text style={[styles.avatarInitial, { fontSize: 24 }]}>
                      {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'K'}
                    </Text>
                  </View>
                )}
                <View style={styles.onlineBadge}>
                  <Ionicons name="shield-checkmark" size={14} color="#FFF" />
                </View>
              </View>

              <Text style={styles.userName}>{currentUser?.name || 'Kasir Aktif'}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>{currentUser?.role || 'Staf Kasir'}</Text>
              </View>
              <Text style={styles.userUsername}>@{currentUser?.username || 'user'}</Text>
            </View>

            {/* Shift Info Card */}
            <View style={styles.shiftInfoCard}>
              <View style={styles.shiftInfoRow}>
                <Ionicons name="time-outline" size={18} color={THEME.colors.primary} />
                <Text style={styles.shiftInfoLabel}>Shift Operasional:</Text>
                <Text style={styles.shiftInfoValue}>
                  {activeShift?.name || 'Belum Buka Shift'}
                </Text>
              </View>
              <View style={styles.shiftInfoRow}>
                <Ionicons name="wallet-outline" size={18} color={THEME.colors.accent} />
                <Text style={styles.shiftInfoLabel}>Modal Kasir:</Text>
                <Text style={styles.shiftInfoValue}>
                  Rp {(activeShift?.openingCash || 0).toLocaleString('id-ID')}
                </Text>
              </View>
            </View>

            {/* Tombol Logout */}
            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={handleConfirmLogout}
              activeOpacity={0.8}
            >
              <Ionicons name="log-out-outline" size={20} color="#FFF" />
              <Text style={styles.logoutBtnText}>Keluar / Logout Akun</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: THEME.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
    ...THEME.shadows.sm,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  brandBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: THEME.colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  appName: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.colors.primaryDark,
    letterSpacing: -0.3,
  },
  storeName: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    fontWeight: '500',
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shiftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surfaceSubtle,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    maxWidth: 130,
  },
  shiftDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  shiftText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  avatarButton: {
    marginLeft: 4,
  },
  avatarImg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: THEME.colors.primary,
  },
  avatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: THEME.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    ...THEME.shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  profileInfoBox: {
    alignItems: 'center',
    marginBottom: 16,
  },
  largeAvatarWrapper: {
    position: 'relative',
    marginBottom: 10,
  },
  largeAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: THEME.colors.primary,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: THEME.colors.primary,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  roleBadge: {
    backgroundColor: THEME.colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 4,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.primaryDark,
  },
  userUsername: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    marginTop: 4,
  },
  shiftInfoCard: {
    backgroundColor: THEME.colors.surfaceSubtle,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    gap: 8,
  },
  shiftInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shiftInfoLabel: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    marginLeft: 6,
    flex: 1,
  },
  shiftInfoValue: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  logoutBtn: {
    backgroundColor: THEME.colors.danger,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  logoutBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
