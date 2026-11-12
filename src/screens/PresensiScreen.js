// Layanan Presensi Kehadiran Pekerja (Clock-In & Clock-Out Real-time)

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
import { THEME, formatDateTime, formatTime } from '../constants/theme';
import { storage } from '../services/storage';

export default function PresensiScreen({ currentUser }) {
  // Jam Real-time (Live Clock)
  const [currentTime, setCurrentTime] = useState(new Date());
  const [employees, setEmployees] = useState([]);
  const [selectedEmpId, setSelectedEmpId] = useState(currentUser?.id || 'emp-001');
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [attendanceNote, setAttendanceNote] = useState('');

  // Update live clock setiap 1 detik
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const loadData = async () => {
    const emps = await storage.getEmployees();
    setEmployees(emps);
    if (currentUser?.id) {
      setSelectedEmpId(currentUser.id);
    }
    const logs = await storage.getAttendanceLogs();
    setAttendanceLogs(logs);
  };

  const selectedEmployee =
    employees.find((e) => e.id === selectedEmpId) || employees[0] || currentUser;

  // Tanggal Hari Ini (YYYY-MM-DD)
  const todayDateString = currentTime.toISOString().split('T')[0];

  // Cari log kehadiran pekerja terpilih untuk HARI INI
  const todayLog = attendanceLogs.find(
    (log) => log.employeeId === selectedEmployee?.id && log.dateOnly === todayDateString
  );

  // Standar Jam Masuk: Jam 08:15 (setelah 08:15 dihitung TERLAMBAT)
  const checkLateness = (time) => {
    const hours = time.getHours();
    const minutes = time.getMinutes();
    // Jika lewat jam 08:15
    if (hours > 8 || (hours === 8 && minutes > 15)) {
      return { status: 'TERLAMBAT', label: 'Terlambat' };
    }
    return { status: 'TEPAT_WAKTU', label: 'Tepat Waktu' };
  };

  // Clock-In (Presensi Masuk)
  const handleClockIn = async () => {
    const now = new Date();
    const lateness = checkLateness(now);

    const newLog = {
      id: 'att-' + Date.now().toString().slice(-6),
      employeeId: selectedEmployee.id,
      employeeName: selectedEmployee.name,
      role: selectedEmployee.role,
      dateOnly: todayDateString,
      clockInTime: now.toISOString(),
      clockOutTime: null,
      status: lateness.status,
      note: attendanceNote.trim() || 'Hadir bekerja tepat waktu.',
      duration: null,
    };

    const updatedLogs = [newLog, ...attendanceLogs];
    await storage.saveAttendanceLogs(updatedLogs);
    setAttendanceLogs(updatedLogs);
    setAttendanceNote('');

    Alert.alert(
      'Presensi Masuk Berhasil',
      `${selectedEmployee.name} berhasil Clock-In pada ${formatTime(now)} (${lateness.label}).`
    );
  };

  // Clock-Out (Presensi Pulang)
  const handleClockOut = async () => {
    if (!todayLog) return;
    const now = new Date();
    const inTime = new Date(todayLog.clockInTime);
    const diffMs = now - inTime;

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const durationText = `${diffHours} Jam ${diffMins} Menit`;

    const updated = attendanceLogs.map((item) => {
      if (item.id === todayLog.id) {
        return {
          ...item,
          clockOutTime: now.toISOString(),
          duration: durationText,
        };
      }
      return item;
    });

    await storage.saveAttendanceLogs(updated);
    setAttendanceLogs(updated);

    Alert.alert(
      'Presensi Pulang Berhasil',
      `${selectedEmployee.name} telah Clock-Out pada ${formatTime(now)}. Durasi kerja: ${durationText}.`
    );
  };

  // Format Nama Hari dan Tanggal
  const formattedDayDate = currentTime.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* LIVE CLOCK DIGITAL BANNER */}
      <View style={styles.clockCard}>
        <Text style={styles.dateLabel}>{formattedDayDate}</Text>
        <Text style={styles.liveClockText}>
          {currentTime.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })}{' '}
          <Text style={styles.wibText}>WIB</Text>
        </Text>
        <View style={styles.shiftRuleRow}>
          <Ionicons name="information-circle-outline" size={15} color="#99F6E4" />
          <Text style={styles.shiftRuleText}>
            Jam Masuk Normal: 08:00 WIB (Toleransi sd 08:15 WIB)
          </Text>
        </View>
      </View>

      {/* MULTI-EMPLOYEE SELECTOR */}
      <View style={styles.employeeSelectCard}>
        <Text style={styles.sectionTitle}>Pilih Pekerja yang Melakukan Presensi:</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.empListRow}
        >
          {employees.map((emp) => (
            <TouchableOpacity
              key={emp.id}
              style={[
                styles.empPill,
                selectedEmpId === emp.id && styles.empPillActive,
              ]}
              onPress={() => setSelectedEmpId(emp.id)}
            >
              <View
                style={[
                  styles.empDot,
                  selectedEmpId === emp.id && styles.empDotActive,
                ]}
              />
              <View>
                <Text
                  style={[
                    styles.empPillName,
                    selectedEmpId === emp.id && styles.empPillNameActive,
                  ]}
                >
                  {emp.name}
                </Text>
                <Text
                  style={[
                    styles.empPillRole,
                    selectedEmpId === emp.id && styles.empPillRoleActive,
                  ]}
                >
                  {emp.role}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* STATUS KEHADIRAN HARI INI */}
      <View style={styles.card}>
        <View style={styles.workerStatusHeader}>
          <View>
            <Text style={styles.workerName}>{selectedEmployee?.name}</Text>
            <Text style={styles.workerRole}>{selectedEmployee?.role}</Text>
          </View>

          {todayLog ? (
            <View
              style={[
                styles.statusBadge,
                todayLog.status === 'TEPAT_WAKTU'
                  ? styles.badgeOnTime
                  : styles.badgeLate,
              ]}
            >
              <Ionicons
                name={
                  todayLog.status === 'TEPAT_WAKTU'
                    ? 'checkmark-circle'
                    : 'time-outline'
                }
                size={14}
                color={
                  todayLog.status === 'TEPAT_WAKTU'
                    ? THEME.colors.successDark
                    : THEME.colors.dangerDark
                }
              />
              <Text
                style={[
                  styles.statusBadgeText,
                  todayLog.status === 'TEPAT_WAKTU'
                    ? styles.badgeTextOnTime
                    : styles.badgeTextLate,
                ]}
              >
                {todayLog.status === 'TEPAT_WAKTU'
                  ? 'Tepat Waktu'
                  : 'Terlambat'}
              </Text>
            </View>
          ) : (
            <View style={[styles.statusBadge, styles.badgeNotYet]}>
              <Text style={styles.badgeTextNotYet}>Belum Presensi</Text>
            </View>
          )}
        </View>

        {/* Detail Jam Hari Ini */}
        <View style={styles.timeInfoGrid}>
          <View style={styles.timeBox}>
            <Text style={styles.timeBoxLabel}>Jam Masuk</Text>
            <Text style={styles.timeBoxValue}>
              {todayLog?.clockInTime ? formatTime(todayLog.clockInTime) : '--:--'}
            </Text>
          </View>
          <View style={styles.timeBox}>
            <Text style={styles.timeBoxLabel}>Jam Pulang</Text>
            <Text style={styles.timeBoxValue}>
              {todayLog?.clockOutTime ? formatTime(todayLog.clockOutTime) : '--:--'}
            </Text>
          </View>
          <View style={styles.timeBox}>
            <Text style={styles.timeBoxLabel}>Durasi Kerja</Text>
            <Text style={styles.timeBoxValue}>
              {todayLog?.duration || (todayLog?.clockInTime ? 'Sedang Bekerja' : '-')}
            </Text>
          </View>
        </View>

        {/* Input Catatan Kehadiran (Opsional jika belum clock-in) */}
        {!todayLog && (
          <View style={styles.noteGroup}>
            <Text style={styles.noteLabel}>Catatan Presensi (Opsional):</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="Contoh: Kondisi sehat, shift pagi siap..."
              placeholderTextColor={THEME.colors.textMuted}
              value={attendanceNote}
              onChangeText={setAttendanceNote}
            />
          </View>
        )}

        {/* Tombol Aksi Presensi */}
        {!todayLog ? (
          <TouchableOpacity
            style={styles.clockInBtn}
            onPress={handleClockIn}
            activeOpacity={0.8}
          >
            <Ionicons name="enter-outline" size={22} color="#FFF" />
            <Text style={styles.clockBtnText}>Presensi Masuk (Clock-In)</Text>
          </TouchableOpacity>
        ) : !todayLog.clockOutTime ? (
          <TouchableOpacity
            style={styles.clockOutBtn}
            onPress={handleClockOut}
            activeOpacity={0.8}
          >
            <Ionicons name="exit-outline" size={22} color="#FFF" />
            <Text style={styles.clockBtnText}>Presensi Pulang (Clock-Out)</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.completedNotice}>
            <Ionicons name="checkmark-done-circle" size={20} color={THEME.colors.success} />
            <Text style={styles.completedNoticeText}>
              Presensi hari ini telah lengkap (Masuk & Pulang selesai).
            </Text>
          </View>
        )}
      </View>

      {/* RIWAYAT LOG PRESENSI */}
      <View style={styles.logsSection}>
        <View style={styles.logsHeader}>
          <Ionicons name="calendar-outline" size={18} color={THEME.colors.textSecondary} />
          <Text style={styles.logsTitle}>Riwayat Kehadiran Pekerja</Text>
        </View>

        {attendanceLogs.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Belum ada data presensi tercatat.</Text>
          </View>
        ) : (
          attendanceLogs.map((log) => {
            const isOnTime = log.status === 'TEPAT_WAKTU';
            return (
              <View key={log.id} style={styles.logCard}>
                <View style={styles.logCardTop}>
                  <View>
                    <Text style={styles.logEmpName}>{log.employeeName}</Text>
                    <Text style={styles.logEmpRole}>{log.role}</Text>
                  </View>
                  <View
                    style={[
                      styles.logBadge,
                      isOnTime ? styles.badgeOnTime : styles.badgeLate,
                    ]}
                  >
                    <Text
                      style={[
                        styles.logBadgeText,
                        isOnTime ? styles.badgeTextOnTime : styles.badgeTextLate,
                      ]}
                    >
                      {isOnTime ? 'Tepat Waktu' : 'Terlambat'}
                    </Text>
                  </View>
                </View>

                <View style={styles.logDetailRow}>
                  <View style={styles.logDetailItem}>
                    <Text style={styles.logLabel}>Tanggal</Text>
                    <Text style={styles.logVal}>{log.dateOnly}</Text>
                  </View>
                  <View style={styles.logDetailItem}>
                    <Text style={styles.logLabel}>Masuk</Text>
                    <Text style={styles.logVal}>
                      {log.clockInTime ? formatTime(log.clockInTime) : '-'}
                    </Text>
                  </View>
                  <View style={styles.logDetailItem}>
                    <Text style={styles.logLabel}>Pulang</Text>
                    <Text style={styles.logVal}>
                      {log.clockOutTime ? formatTime(log.clockOutTime) : 'Sedang Kerja'}
                    </Text>
                  </View>
                  <View style={styles.logDetailItem}>
                    <Text style={styles.logLabel}>Durasi</Text>
                    <Text style={styles.logVal}>{log.duration || '-'}</Text>
                  </View>
                </View>

                {log.note ? (
                  <Text style={styles.logNoteText}>💬 {log.note}</Text>
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
  clockCard: {
    backgroundColor: THEME.colors.primaryDark,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    ...THEME.shadows.md,
  },
  dateLabel: {
    color: '#99F6E4',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  liveClockText: {
    color: '#FFF',
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 1,
  },
  wibText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#CCFBF1',
  },
  shiftRuleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  shiftRuleText: {
    fontSize: 11,
    color: '#CCFBF1',
    fontWeight: '500',
  },
  employeeSelectCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    ...THEME.shadows.sm,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
    marginBottom: 10,
  },
  empListRow: {
    gap: 8,
  },
  empPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 8,
  },
  empPillActive: {
    backgroundColor: THEME.colors.primaryMuted,
    borderColor: THEME.colors.primary,
  },
  empDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME.colors.textMuted,
  },
  empDotActive: {
    backgroundColor: THEME.colors.primary,
  },
  empPillName: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  empPillNameActive: {
    color: THEME.colors.primaryDark,
  },
  empPillRole: {
    fontSize: 10,
    color: THEME.colors.textMuted,
  },
  empPillRoleActive: {
    color: THEME.colors.primary,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    ...THEME.shadows.sm,
  },
  workerStatusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  workerName: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  workerRole: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  badgeOnTime: {
    backgroundColor: THEME.colors.successLight,
  },
  badgeLate: {
    backgroundColor: THEME.colors.dangerLight,
  },
  badgeNotYet: {
    backgroundColor: THEME.colors.surfaceSubtle,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  badgeTextOnTime: {
    color: THEME.colors.successDark,
  },
  badgeTextLate: {
    color: THEME.colors.dangerDark,
  },
  badgeTextNotYet: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    fontWeight: '600',
  },
  timeInfoGrid: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.surfaceSubtle,
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  timeBox: {
    flex: 1,
    alignItems: 'center',
  },
  timeBoxLabel: {
    fontSize: 10,
    color: THEME.colors.textMuted,
    fontWeight: '600',
  },
  timeBoxValue: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    marginTop: 2,
  },
  noteGroup: {
    marginBottom: 14,
  },
  noteLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
    marginBottom: 6,
  },
  noteInput: {
    backgroundColor: THEME.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
  },
  clockInBtn: {
    backgroundColor: THEME.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    ...THEME.shadows.md,
  },
  clockOutBtn: {
    backgroundColor: THEME.colors.warning,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    ...THEME.shadows.md,
  },
  clockBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
  completedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.successLight,
    padding: 12,
    borderRadius: 10,
    gap: 8,
  },
  completedNoticeText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.successDark,
    flex: 1,
  },
  logsSection: {
    gap: 10,
  },
  logsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logsTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.colors.textSecondary,
  },
  emptyCard: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: THEME.colors.textMuted,
  },
  logCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    gap: 10,
  },
  logCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logEmpName: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  logEmpRole: {
    fontSize: 11,
    color: THEME.colors.textMuted,
  },
  logBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  logBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  logDetailRow: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.surfaceSubtle,
    borderRadius: 8,
    padding: 8,
  },
  logDetailItem: {
    flex: 1,
    alignItems: 'center',
  },
  logLabel: {
    fontSize: 9,
    color: THEME.colors.textMuted,
    fontWeight: '600',
  },
  logVal: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    marginTop: 2,
  },
  logNoteText: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    fontStyle: 'italic',
  },
});
