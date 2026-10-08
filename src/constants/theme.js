// Sistem Tema, Warna, Tipografi & Bayangan KasirKu
export const THEME = {
  colors: {
    primary: '#0D9488',       // Teal 600 - Segar & Profesional
    primaryDark: '#115E59',   // Teal 800
    primaryLight: '#CCFBF1',  // Teal 100
    primaryMuted: '#E6FFFA',
    
    accent: '#F59E0B',        // Amber 500
    accentLight: '#FEF3C7',
    
    success: '#10B981',       // Emerald 500
    successLight: '#D1FAE5',
    successDark: '#065F46',
    
    danger: '#EF4444',        // Red 500
    dangerLight: '#FEE2E2',
    dangerDark: '#991B1B',
    
    warning: '#F97316',       // Orange 500
    warningLight: '#FFEDD5',
    
    info: '#3B82F6',          // Blue 500
    infoLight: '#DBEAFE',
    
    bg: '#F8FAFC',            // Slate 50
    surface: '#FFFFFF',
    surfaceSubtle: '#F1F5F9', // Slate 100
    border: '#E2E8F0',        // Slate 200
    borderStrong: '#CBD5E1',  // Slate 300
    
    textPrimary: '#0F172A',   // Slate 900
    textSecondary: '#475569', // Slate 600
    textMuted: '#94A3B8',     // Slate 400
    textWhite: '#FFFFFF',
    
    // Receipt Colors
    receiptPaper: '#FFFDF9',
    receiptBorder: '#E7E2D8',
    receiptText: '#1C1917',
  },
  
  shadows: {
    sm: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 4,
    },
    lg: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 8,
    },
  },
  
  radius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
  },
};

// Formatter Utilitas
export const formatRupiah = (number) => {
  const num = Number(number) || 0;
  return 'Rp ' + num.toLocaleString('id-ID');
};

export const formatDateTime = (dateInput) => {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }) + ' WIB';
};

export const formatTime = (dateInput) => {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  return d.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }) + ' WIB';
};
