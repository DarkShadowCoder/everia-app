// theme.js
// ============================================================
// EVERIA DESIGN SYSTEM
// One Event. Many Perspectives. One Everia.
// ============================================================

const theme = {
  // ==========================================================
  // 1. BRAND
  // ==========================================================

  brand: {
    name: 'Everia',
    tagline: 'One Event. Many Perspectives. One Everia.',
    shortTagline: 'One Event. Many Perspectives.',
    style: 'Midnight Plum + Champagne',
  },

  // ==========================================================
  // 2. COLORS
  // ==========================================================

  colors: {
    // --------------------------------------------------------
    // Primary Brand
    // --------------------------------------------------------

    primary: '#5B315D',
    primaryDark: '#3A1D3D',
    primaryDeep: '#261129',
    primaryDarker: '#1B0B1D',

    primaryLight: '#7A4C7C',
    primaryLighter: '#936596',
    primarySoft: '#EEE3EE',
    primaryMuted: '#DCC9DD',

    // --------------------------------------------------------
    // Accent / Luxury
    // --------------------------------------------------------

    champagne: '#D9B878',
    champagneDark: '#B89450',
    champagneLight: '#E8D2A1',
    champagneSoft: '#F4E8CD',
    champagnePale: '#FBF5E8',

    gold: '#D9B878',
    goldDark: '#A67D3B',
    goldLight: '#E7CD92',

    // --------------------------------------------------------
    // Backgrounds
    // --------------------------------------------------------

    background: '#FAF7F2',
    backgroundWarm: '#F6F0E8',
    backgroundSoft: '#FCFAF7',

    white: '#FFFFFF',
    ivory: '#FAF7F2',
    ivoryDark: '#F0EAE2',

    darkBackground: '#160A18',
    darkSurface: '#211020',
    darkSurface2: '#29152B',
    darkSurface3: '#321A35',

    // --------------------------------------------------------
    // Surfaces
    // --------------------------------------------------------

    surface: '#FFFFFF',
    surfaceSoft: '#F9F5F1',
    surfaceWarm: '#F7F1EA',

    surfaceDark: '#241125',
    surfaceDark2: '#2D1830',
    surfaceDark3: '#351C37',

    overlay: 'rgba(28, 12, 30, 0.62)',
    overlayLight: 'rgba(255,255,255,0.72)',
    overlayDark: 'rgba(0,0,0,0.28)',

    // --------------------------------------------------------
    // Text
    // --------------------------------------------------------

    textPrimary: '#211D22',
    textSecondary: '#756B76',
    textMuted: '#9D949E',
    textDisabled: '#C8C1C8',
    textInverse: '#FFFFFF',

    textOnPrimary: '#FFFFFF',
    textOnDark: '#FFFDF9',

    textGold: '#B88F4D',
    textPlum: '#5B315D',

    // --------------------------------------------------------
    // Borders / Dividers
    // --------------------------------------------------------

    border: '#E9E2D8',
    borderLight: '#F1EBE4',
    borderDark: '#4B2B4E',

    divider: '#EDE6DE',
    dividerDark: '#402441',

    // --------------------------------------------------------
    // Semantic states
    // --------------------------------------------------------

    success: '#6E9277',
    successLight: '#EAF2EC',
    successDark: '#42664A',

    warning: '#C8954B',
    warningLight: '#F8EEDB',
    warningDark: '#8A622B',

    error: '#B85C68',
    errorLight: '#F8E7EA',
    errorDark: '#7D3843',

    info: '#758BA7',
    infoLight: '#EAF0F7',
    infoDark: '#506985',

    // --------------------------------------------------------
    // Event states
    // --------------------------------------------------------

    eventLive: '#C95164',
    eventLiveSoft: '#F8E3E7',

    eventUpcoming: '#D9B878',
    eventUpcomingSoft: '#F8F0DE',

    eventFinished: '#6E9277',
    eventFinishedSoft: '#E8F1EA',

    eventDraft: '#9B949D',
    eventDraftSoft: '#F0EDEF',

    eventPrivate: '#756B76',
    eventPrivateSoft: '#EEEAEF',

    // --------------------------------------------------------
    // Media states
    // --------------------------------------------------------

    mediaPhoto: '#D9B878',
    mediaVideo: '#7A4C7C',
    mediaAudio: '#6E9277',
    mediaDocument: '#758BA7',

    mediaProcessing: '#C8954B',
    mediaUploaded: '#6E9277',
    mediaFailed: '#B85C68',

    // --------------------------------------------------------
    // Gamification
    // --------------------------------------------------------

    points: '#D9B878',
    pointsSoft: '#F8EEDB',

    level: '#7A4C7C',
    levelSoft: '#EEE3EE',

    badge: '#D9B878',
    badgeSoft: '#F6E8C8',

    rankingGold: '#D9B878',
    rankingSilver: '#A9ADB4',
    rankingBronze: '#B77A52',

    streak: '#B85C68',

    // --------------------------------------------------------
    // Moderation
    // --------------------------------------------------------

    moderationPending: '#D9B878',
    moderationApproved: '#6E9277',
    moderationRejected: '#B85C68',
    moderationFlagged: '#B85C68',

    // --------------------------------------------------------
    // Social / reactions
    // --------------------------------------------------------

    like: '#B85C68',
    love: '#B85C68',
    laugh: '#D9B878',
    wow: '#7A4C7C',
    celebration: '#6E9277',

    // --------------------------------------------------------
    // Charts
    // --------------------------------------------------------

    chartPrimary: '#5B315D',
    chartSecondary: '#D9B878',
    chartTertiary: '#6E9277',
    chartQuaternary: '#B85C68',
    chartNeutral: '#B8AEB8',
    chartGrid: '#E8E1D9',

    // --------------------------------------------------------
    // Transparent helpers
    // --------------------------------------------------------

    transparent: 'transparent',

    white10: 'rgba(255,255,255,0.10)',
    white20: 'rgba(255,255,255,0.20)',
    white40: 'rgba(255,255,255,0.40)',
    white60: 'rgba(255,255,255,0.60)',
    white80: 'rgba(255,255,255,0.80)',

    black10: 'rgba(0,0,0,0.10)',
    black20: 'rgba(0,0,0,0.20)',
    black40: 'rgba(0,0,0,0.40)',
    black60: 'rgba(0,0,0,0.60)',
  },

  // ==========================================================
  // 3. GRADIENTS
  // ==========================================================

  gradients: {
    primary: [
      '#3A1D3D',
      '#5B315D',
    ],

    primarySoft: [
      '#5B315D',
      '#7A4C7C',
    ],

    luxury: [
      '#3A1D3D',
      '#5B315D',
      '#D9B878',
    ],

    plumGold: [
      '#211022',
      '#5B315D',
      '#D9B878',
    ],

    gold: [
      '#B89450',
      '#D9B878',
      '#E8D2A1',
    ],

    goldSoft: [
      '#D9B878',
      '#F4E8CD',
    ],

    ivory: [
      '#FAF7F2',
      '#F0EAE2',
    ],

    warmIvory: [
      '#FFFFFF',
      '#FAF7F2',
      '#F6F0E8',
    ],

    darkLuxury: [
      '#160A18',
      '#211020',
      '#3A1D3D',
    ],

    darkCard: [
      '#211020',
      '#321A35',
    ],

    eventHero: [
      'rgba(25,8,28,0.92)',
      'rgba(91,49,93,0.50)',
      'rgba(25,8,28,0.20)',
    ],

    live: [
      '#B85C68',
      '#7A4C7C',
    ],

    success: [
      '#42664A',
      '#6E9277',
    ],

    glass: [
      'rgba(255,255,255,0.90)',
      'rgba(255,255,255,0.72)',
    ],

    glassDark: [
      'rgba(34,16,36,0.94)',
      'rgba(55,25,58,0.84)',
    ],
  },

  // ==========================================================
  // 4. TYPOGRAPHY
  // ==========================================================

  typography: {
    families: {
      display: 'PlayfairDisplay',
      displayMedium: 'PlayfairDisplay-Medium',
      displaySemiBold: 'PlayfairDisplay-SemiBold',
      displayBold: 'PlayfairDisplay-Bold',

      body: 'Inter',
      bodyMedium: 'Inter-Medium',
      bodySemiBold: 'Inter-SemiBold',
      bodyBold: 'Inter-Bold',

      mono: 'JetBrainsMono',
    },

    sizes: {
      xs: 10,
      sm: 12,
      md: 14,
      lg: 16,
      xl: 18,
      xxl: 20,
      xxxl: 24,

      h6: 20,
      h5: 22,
      h4: 26,
      h3: 30,
      h2: 36,
      h1: 44,

      hero: 54,
      display: 62,
    },

    lineHeights: {
      xs: 14,
      sm: 16,
      md: 20,
      lg: 24,
      xl: 26,
      xxl: 30,

      h6: 26,
      h5: 28,
      h4: 32,
      h3: 38,
      h2: 44,
      h1: 52,

      hero: 62,
      display: 72,
    },

    letterSpacing: {
      tight: -1.2,
      normal: 0,
      medium: 0.2,
      wide: 0.8,
      wider: 1.4,
      uppercase: 1.8,
      luxury: 2.4,
    },

    weights: {
      regular: '400',
      medium: '500',
      semiBold: '600',
      bold: '700',
    },

    styles: {
      display: {
        fontFamily: 'PlayfairDisplay-Bold',
        fontSize: 54,
        lineHeight: 62,
        letterSpacing: -1.2,
        color: '#211D22',
      },

      displayDark: {
        fontFamily: 'PlayfairDisplay-Bold',
        fontSize: 54,
        lineHeight: 62,
        letterSpacing: -1.2,
        color: '#FFFDF9',
      },

      h1: {
        fontFamily: 'PlayfairDisplay-SemiBold',
        fontSize: 36,
        lineHeight: 44,
        color: '#211D22',
      },

      h1Dark: {
        fontFamily: 'PlayfairDisplay-SemiBold',
        fontSize: 36,
        lineHeight: 44,
        color: '#FFFDF9',
      },

      h2: {
        fontFamily: 'PlayfairDisplay-SemiBold',
        fontSize: 30,
        lineHeight: 38,
        color: '#211D22',
      },

      h3: {
        fontFamily: 'PlayfairDisplay-Medium',
        fontSize: 26,
        lineHeight: 32,
        color: '#211D22',
      },

      title: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 20,
        lineHeight: 26,
        color: '#211D22',
      },

      titleDark: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 20,
        lineHeight: 26,
        color: '#FFFFFF',
      },

      body: {
        fontFamily: 'Inter',
        fontSize: 14,
        lineHeight: 20,
        color: '#211D22',
      },

      bodySecondary: {
        fontFamily: 'Inter',
        fontSize: 14,
        lineHeight: 20,
        color: '#756B76',
      },

      caption: {
        fontFamily: 'Inter',
        fontSize: 12,
        lineHeight: 16,
        color: '#756B76',
      },

      overline: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 10,
        lineHeight: 14,
        letterSpacing: 1.8,
        textTransform: 'uppercase',
        color: '#756B76',
      },

      luxuryLabel: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 10,
        lineHeight: 14,
        letterSpacing: 2.4,
        textTransform: 'uppercase',
        color: '#B88F4D',
      },

      button: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 14,
        lineHeight: 18,
      },

      tab: {
        fontFamily: 'Inter-Medium',
        fontSize: 10,
        lineHeight: 14,
      },
    },
  },

  // ==========================================================
  // 5. SPACING
  // ==========================================================

  spacing: {
    xxs: 2,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    huge: 40,
    massive: 48,
    giant: 64,
    hero: 80,
  },

  // ==========================================================
  // 6. BORDER RADIUS
  // ==========================================================

  radius: {
    none: 0,
    xs: 6,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 28,

    card: 18,
    cardLarge: 24,

    button: 14,
    buttonLarge: 18,

    input: 14,

    pill: 999,

    avatar: 999,
    circle: 999,
  },

  // ==========================================================
  // 7. BORDERS
  // ==========================================================

  borders: {
    hairline: 0.5,
    thin: 1,
    medium: 1.5,
    thick: 2,

    primary: {
      width: 1,
      color: '#5B315D',
    },

    gold: {
      width: 1,
      color: '#D9B878',
    },

    neutral: {
      width: 1,
      color: '#E9E2D8',
    },

    dark: {
      width: 1,
      color: '#4B2B4E',
    },
  },

  // ==========================================================
  // 8. SHADOWS
  // ==========================================================

  shadows: {
    none: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },

    xs: {
      shadowColor: '#211D22',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },

    sm: {
      shadowColor: '#211D22',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.07,
      shadowRadius: 5,
      elevation: 2,
    },

    md: {
      shadowColor: '#211D22',
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.10,
      shadowRadius: 12,
      elevation: 4,
    },

    lg: {
      shadowColor: '#211D22',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.14,
      shadowRadius: 18,
      elevation: 7,
    },

    xl: {
      shadowColor: '#211D22',
      shadowOffset: { width: 0, height: 14 },
      shadowOpacity: 0.18,
      shadowRadius: 30,
      elevation: 12,
    },

    gold: {
      shadowColor: '#D9B878',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.26,
      shadowRadius: 12,
      elevation: 5,
    },

    plum: {
      shadowColor: '#5B315D',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.20,
      shadowRadius: 12,
      elevation: 5,
    },

    floating: {
      shadowColor: '#211D22',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.16,
      shadowRadius: 24,
      elevation: 10,
    },
  },

  // ==========================================================
  // 9. LAYOUT
  // ==========================================================

  layout: {
    screenHorizontal: 20,
    screenHorizontalLarge: 24,

    headerHeight: 64,
    compactHeaderHeight: 56,

    bottomTabHeight: 78,
    bottomTabSafeArea: 20,

    sectionGap: 28,
    cardGap: 12,
    gridGap: 8,

    maxContentWidth: 720,

    avatarSmall: 32,
    avatarMedium: 40,
    avatarLarge: 56,
    avatarXL: 80,
    avatarXXL: 110,

    iconButtonSmall: 36,
    iconButtonMedium: 44,
    iconButtonLarge: 52,

    touchTarget: 44,
  },

  // ==========================================================
  // 10. ICONOGRAPHY
  // ==========================================================
  // NOTE (Everia app): la bibliothèque d'icônes utilisée dans l'app RN
  // est Ionicons (@expo/vector-icons), voir src/constants/icons.js pour
  // le mapping complet clé → nom Ionicons. Les libellés ci-dessous sont
  // conservés comme référence sémantique du design system d'origine.

  icons: {
    style: {
      family: 'Ionicons',
      strokeWidth: 1.8,
      defaultSize: 22,
      smallSize: 18,
      largeSize: 26,
    },

    sizes: {
      xs: 14,
      sm: 18,
      md: 22,
      lg: 26,
      xl: 30,
      xxl: 36,
    },

    colors: {
      default: '#5B315D',
      muted: '#756B76',
      inverse: '#FFFFFF',
      gold: '#D9B878',
      success: '#6E9277',
      error: '#B85C68',
      warning: '#C8954B',
    },
  },

  // ==========================================================
  // 11. BUTTONS
  // ==========================================================

  buttons: {
    primary: {
      backgroundColor: '#5B315D',
      color: '#FFFFFF',
      borderColor: '#5B315D',
      borderWidth: 1,
      radius: 14,
      height: 48,
      horizontalPadding: 20,
    },

    primaryDark: {
      backgroundColor: '#3A1D3D',
      color: '#FFFFFF',
      borderColor: '#3A1D3D',
      borderWidth: 1,
      radius: 14,
      height: 48,
      horizontalPadding: 20,
    },

    gold: {
      backgroundColor: '#D9B878',
      color: '#3A1D3D',
      borderColor: '#D9B878',
      borderWidth: 1,
      radius: 14,
      height: 48,
      horizontalPadding: 20,
    },

    outline: {
      backgroundColor: 'transparent',
      color: '#5B315D',
      borderColor: '#5B315D',
      borderWidth: 1,
      radius: 14,
      height: 48,
      horizontalPadding: 20,
    },

    outlineGold: {
      backgroundColor: 'transparent',
      color: '#B88F4D',
      borderColor: '#D9B878',
      borderWidth: 1,
      radius: 14,
      height: 48,
      horizontalPadding: 20,
    },

    ghost: {
      backgroundColor: 'transparent',
      color: '#5B315D',
      borderColor: 'transparent',
      borderWidth: 0,
      radius: 14,
      height: 44,
      horizontalPadding: 16,
    },

    danger: {
      backgroundColor: '#B85C68',
      color: '#FFFFFF',
      borderColor: '#B85C68',
      borderWidth: 1,
      radius: 14,
      height: 48,
      horizontalPadding: 20,
    },

    success: {
      backgroundColor: '#6E9277',
      color: '#FFFFFF',
      borderColor: '#6E9277',
      borderWidth: 1,
      radius: 14,
      height: 48,
      horizontalPadding: 20,
    },

    disabled: {
      backgroundColor: '#E9E2D8',
      color: '#9D949E',
      borderColor: '#E9E2D8',
      borderWidth: 1,
      radius: 14,
      height: 48,
      horizontalPadding: 20,
    },
  },

  // ==========================================================
  // 12. INPUTS
  // ==========================================================

  inputs: {
    default: {
      height: 52,
      backgroundColor: '#FFFFFF',
      borderColor: '#E9E2D8',
      borderWidth: 1,
      radius: 14,
      paddingHorizontal: 16,
      color: '#211D22',
      placeholderColor: '#9D949E',
    },

    focused: {
      height: 52,
      backgroundColor: '#FFFFFF',
      borderColor: '#5B315D',
      borderWidth: 1.5,
      radius: 14,
      paddingHorizontal: 16,
    },

    error: {
      height: 52,
      backgroundColor: '#FFFFFF',
      borderColor: '#B85C68',
      borderWidth: 1.5,
      radius: 14,
      paddingHorizontal: 16,
    },

    dark: {
      height: 52,
      backgroundColor: '#2D1830',
      borderColor: '#4B2B4E',
      borderWidth: 1,
      radius: 14,
      paddingHorizontal: 16,
      color: '#FFFFFF',
      placeholderColor: '#A898AA',
    },

    label: {
      fontSize: 12,
      fontFamily: 'Inter-SemiBold',
      color: '#211D22',
      marginBottom: 8,
    },

    helper: {
      fontSize: 11,
      fontFamily: 'Inter',
      color: '#756B76',
      marginTop: 6,
    },

    errorText: {
      fontSize: 11,
      fontFamily: 'Inter',
      color: '#B85C68',
      marginTop: 6,
    },
  },

  // ==========================================================
  // 13. CARDS
  // ==========================================================

  cards: {
    default: {
      backgroundColor: '#FFFFFF',
      borderRadius: 18,
      borderWidth: 1,
      borderColor: '#E9E2D8',
      padding: 16,
    },

    elevated: {
      backgroundColor: '#FFFFFF',
      borderRadius: 18,
      borderWidth: 0,
      shadowColor: '#211D22',
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.10,
      shadowRadius: 12,
      elevation: 4,
      padding: 16,
    },

    luxury: {
      backgroundColor: '#3A1D3D',
      borderRadius: 20,
      borderWidth: 1,
      borderColor: '#6A466C',
      padding: 18,
    },

    dark: {
      backgroundColor: '#211020',
      borderRadius: 18,
      borderWidth: 1,
      borderColor: '#4B2B4E',
      padding: 16,
    },

    gold: {
      backgroundColor: '#FBF5E8',
      borderRadius: 18,
      borderWidth: 1,
      borderColor: '#D9B878',
      padding: 16,
    },

    glass: {
      backgroundColor: 'rgba(255,255,255,0.78)',
      borderRadius: 20,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.90)',
      padding: 16,
    },

    media: {
      backgroundColor: '#FFFFFF',
      borderRadius: 18,
      overflow: 'hidden',
    },

    event: {
      backgroundColor: '#FFFFFF',
      borderRadius: 20,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: '#E9E2D8',
    },

    stat: {
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: '#E9E2D8',
      padding: 14,
    },

    dashboard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 18,
      borderWidth: 1,
      borderColor: '#E9E2D8',
      padding: 18,
    },
  },

  // ==========================================================
  // 14. EVENT DESIGN
  // ==========================================================

  event: {
    imageRatio: 1.65,
    heroHeight: 280,
    cardHeight: 220,

    overlayOpacity: 0.50,

    badges: {
      live: {
        backgroundColor: '#B85C68',
        textColor: '#FFFFFF',
      },

      upcoming: {
        backgroundColor: '#D9B878',
        textColor: '#3A1D3D',
      },

      finished: {
        backgroundColor: '#6E9277',
        textColor: '#FFFFFF',
      },

      private: {
        backgroundColor: '#756B76',
        textColor: '#FFFFFF',
      },
    },

    quickActions: {
      backgroundColor: 'rgba(255,255,255,0.94)',
      size: 48,
      radius: 14,
    },

    tabs: {
      activeColor: '#5B315D',
      inactiveColor: '#9D949E',
      indicatorColor: '#D9B878',
      indicatorHeight: 2,
    },
  },

  // ==========================================================
  // 15. MEDIA
  // ==========================================================

  media: {
    grid: {
      columns: 3,
      gap: 4,
      radius: 10,
    },

    largeGrid: {
      columns: 2,
      gap: 6,
      radius: 14,
    },

    thumbnailRadius: 10,

    viewer: {
      backgroundColor: '#160A18',
      controlSize: 44,
    },

    capture: {
      backgroundColor: '#000000',
      shutterOuter: 76,
      shutterInner: 62,
      shutterBorder: 4,
    },

    upload: {
      progressTrack: '#E9E2D8',
      progressActive: '#5B315D',
      success: '#6E9277',
      error: '#B85C68',
    },
  },

  // ==========================================================
  // 16. MOMENTS
  // ==========================================================

  moments: {
    accent: '#D9B878',

    card: {
      backgroundColor: '#3A1D3D',
      borderRadius: 20,
    },

    imageOverlay: 'rgba(29,11,31,0.38)',

    titleColor: '#FFFFFF',
    metaColor: '#E8D2A1',

    timeline: {
      lineColor: '#D9B878',
      dotColor: '#5B315D',
      dotBorderColor: '#D9B878',
    },

    types: {
      arrival: 'Arrivée',
      ceremony: 'Cérémonie',
      firstDance: 'Première danse',
      toast: 'Discours',
      party: 'Fête',
      sunset: 'Coucher de soleil',
      group: 'Photo de groupe',
      dinner: 'Dîner',
      custom: 'Moment',
    },
  },

  // ==========================================================
  // 17. CHALLENGES
  // ==========================================================

  challenges: {
    accent: '#D9B878',

    card: {
      backgroundColor: '#211020',
      borderColor: '#4B2B4E',
      borderRadius: 18,
    },

    pointsBadge: {
      backgroundColor: '#D9B878',
      textColor: '#3A1D3D',
    },

    active: '#6E9277',
    completed: '#D9B878',
    locked: '#756B76',
    failed: '#B85C68',

    progressTrack: '#4B2B4E',
    progressActive: '#D9B878',

    levels: {
      beginner: {
        label: 'Débutant',
        color: '#6E9277',
      },

      explorer: {
        label: 'Explorateur',
        color: '#758BA7',
      },

      storyteller: {
        label: 'Storyteller',
        color: '#7A4C7C',
      },

      master: {
        label: 'Challenge Master',
        color: '#D9B878',
      },
    },

    badges: {
      memoryHunter: {
        label: 'Memory Hunter',
        color: '#D9B878',
        icon: 'diamond-outline',
      },

      peopleHunter: {
        label: 'People Hunter',
        color: '#7A4C7C',
        icon: 'people-outline',
      },

      storyteller: {
        label: 'Storyteller',
        color: '#6E9277',
        icon: 'book-outline',
      },

      challengeMaster: {
        label: 'Challenge Master',
        color: '#D9B878',
        icon: 'trophy-outline',
      },
    },
  },

  // ==========================================================
  // 18. GAMIFICATION
  // ==========================================================

  gamification: {
    levelRing: {
      outer: '#4B2B4E',
      progress: '#D9B878',
      center: '#211020',
    },

    rankCard: {
      backgroundColor: '#211020',
      borderColor: '#4B2B4E',
    },

    points: {
      color: '#D9B878',
      icon: 'sparkles-outline',
    },

    leaderboard: {
      first: '#D9B878',
      second: '#A9ADB4',
      third: '#B77A52',
    },

    streak: {
      color: '#B85C68',
      icon: 'flame-outline',
    },
  },

  // ==========================================================
  // 19. LIVE WALL
  // ==========================================================

  liveWall: {
    backgroundColor: '#160A18',
    accentColor: '#D9B878',

    liveBadge: {
      backgroundColor: '#B85C68',
      textColor: '#FFFFFF',
    },

    tileRadius: 10,

    animation: {
      duration: 500,
      stagger: 80,
    },

    controls: {
      backgroundColor: 'rgba(22,10,24,0.82)',
      color: '#FFFFFF',
    },
  },

  // ==========================================================
  // 20. GUESTBOOK
  // ==========================================================

  guestbook: {
    cardBackground: '#FFFFFF',
    cardRadius: 18,

    textMessage: {
      accent: '#5B315D',
    },

    audioMessage: {
      accent: '#6E9277',
    },

    videoMessage: {
      accent: '#7A4C7C',
    },

    reactionBar: {
      backgroundColor: '#F9F5F1',
      radius: 999,
    },

    waveform: {
      active: '#D9B878',
      inactive: '#E9E2D8',
    },
  },

  // ==========================================================
  // 21. PROFILE
  // ==========================================================

  profile: {
    headerBackground: '#3A1D3D',
    headerHeight: 230,

    avatar: {
      borderWidth: 4,
      borderColor: '#D9B878',
    },

    stats: {
      valueColor: '#211D22',
      labelColor: '#756B76',
    },

    menu: {
      backgroundColor: '#FFFFFF',
      borderColor: '#E9E2D8',
      radius: 16,
    },
  },

  // ==========================================================
  // 22. NAVIGATION
  // ==========================================================

  navigation: {
    bottomTab: {
      backgroundColor: '#FFFFFF',
      activeColor: '#5B315D',
      inactiveColor: '#9D949E',
      activeIndicator: '#D9B878',
      height: 78,
      borderTopColor: '#E9E2D8',
    },

    darkBottomTab: {
      backgroundColor: '#211020',
      activeColor: '#D9B878',
      inactiveColor: '#A898AA',
      activeIndicator: '#D9B878',
      height: 78,
      borderTopColor: '#4B2B4E',
    },

    header: {
      backgroundColor: '#FFFFFF',
      titleColor: '#211D22',
      iconColor: '#5B315D',
      borderBottomColor: '#E9E2D8',
    },

    transparentHeader: {
      backgroundColor: 'transparent',
      titleColor: '#FFFFFF',
      iconColor: '#FFFFFF',
    },
  },

  // ==========================================================
  // 23. ORGANIZER
  // ==========================================================

  organizer: {
    dashboard: {
      backgroundColor: '#FAF7F2',
    },

    hero: {
      backgroundColor: '#3A1D3D',
      height: 230,
    },

    stats: {
      backgroundColor: '#FFFFFF',
      borderColor: '#E9E2D8',
      radius: 16,
    },

    analytics: {
      lineColor: '#5B315D',
      pointColor: '#D9B878',
      gridColor: '#E8E1D9',
    },

    moderation: {
      pending: {
        backgroundColor: '#F8EEDB',
        color: '#8A622B',
      },

      approved: {
        backgroundColor: '#EAF2EC',
        color: '#42664A',
      },

      rejected: {
        backgroundColor: '#F8E7EA',
        color: '#7D3843',
      },
    },
  },

  // ==========================================================
  // 24. INVITES / QR
  // ==========================================================

  invites: {
    qrCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 20,
      borderColor: '#D9B878',
    },

    qrBackground: '#FFFFFF',
    qrForeground: '#211D22',

    codeBackground: '#3A1D3D',
    codeText: '#FFFFFF',

    linkButton: {
      backgroundColor: '#5B315D',
      color: '#FFFFFF',
    },
  },

  // ==========================================================
  // 25. SUBSCRIPTIONS
  // ==========================================================

  subscriptions: {
    plans: {
      free: {
        label: 'Free',
        accent: '#756B76',
        backgroundColor: '#FFFFFF',
      },

      eventPass: {
        label: 'Event Pass',
        accent: '#D9B878',
        backgroundColor: '#FBF5E8',
      },

      everiaPlus: {
        label: 'Everia+',
        accent: '#5B315D',
        backgroundColor: '#F1E7F2',
      },

      business: {
        label: 'Business',
        accent: '#3A1D3D',
        backgroundColor: '#EDE5EE',
      },
    },

    highlightedPlan: {
      borderColor: '#D9B878',
      borderWidth: 2,
    },

    price: {
      color: '#3A1D3D',
    },
  },

  // ==========================================================
  // 26. NOTIFICATIONS
  // ==========================================================

  notifications: {
    unreadIndicator: '#B85C68',

    types: {
      event: {
        icon: 'calendar-outline',
        color: '#5B315D',
      },

      media: {
        icon: 'images-outline',
        color: '#D9B878',
      },

      social: {
        icon: 'heart-outline',
        color: '#B85C68',
      },

      challenge: {
        icon: 'trophy-outline',
        color: '#D9B878',
      },

      system: {
        icon: 'notifications-outline',
        color: '#6E9277',
      },
    },
  },

  // ==========================================================
  // 27. SEARCH
  // ==========================================================

  search: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E9E2D8',
    radius: 14,

    iconColor: '#756B76',
    placeholderColor: '#9D949E',

    focused: {
      borderColor: '#5B315D',
    },
  },

  // ==========================================================
  // 28. MODALS / SHEETS
  // ==========================================================

  modal: {
    overlay: 'rgba(22,10,24,0.64)',

    sheet: {
      backgroundColor: '#FFFFFF',
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
    },

    darkSheet: {
      backgroundColor: '#211020',
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
    },

    handle: {
      width: 42,
      height: 4,
      borderRadius: 999,
      backgroundColor: '#D7D0D7',
    },
  },

  // ==========================================================
  // 29. TOASTS
  // ==========================================================

  toast: {
    success: {
      backgroundColor: '#42664A',
      textColor: '#FFFFFF',
    },

    error: {
      backgroundColor: '#7D3843',
      textColor: '#FFFFFF',
    },

    warning: {
      backgroundColor: '#8A622B',
      textColor: '#FFFFFF',
    },

    info: {
      backgroundColor: '#506985',
      textColor: '#FFFFFF',
    },

    radius: 14,
  },

  // ==========================================================
  // 30. EMPTY STATES
  // ==========================================================

  emptyState: {
    iconBackground: '#F1E7F2',
    iconColor: '#5B315D',

    titleColor: '#211D22',
    subtitleColor: '#756B76',

    button: {
      backgroundColor: '#5B315D',
      textColor: '#FFFFFF',
    },
  },

  // ==========================================================
  // 31. LOADING
  // ==========================================================

  loading: {
    spinnerColor: '#5B315D',
    spinnerColorDark: '#D9B878',

    skeletonBase: '#ECE7E2',
    skeletonHighlight: '#F7F3EF',

    darkSkeletonBase: '#321A35',
    darkSkeletonHighlight: '#432346',
  },

  // ==========================================================
  // 32. ACCESSIBILITY
  // ==========================================================

  accessibility: {
    minimumTouchTarget: 44,

    highContrastText: '#171318',

    focusRing: '#D9B878',

    focusRingWidth: 2,

    disabledOpacity: 0.45,

    reducedMotion: false,

    fontScale: {
      small: 0.90,
      normal: 1,
      large: 1.15,
      extraLarge: 1.30,
    },
  },

  // ==========================================================
  // 33. MOTION
  // ==========================================================

  animation: {
    instant: 100,
    fast: 180,
    normal: 260,
    medium: 360,
    slow: 500,
    luxury: 700,

    easing: {
      standard: 'ease',
      emphasized: 'ease-out',
      entering: 'ease-out',
      exiting: 'ease-in',
    },
  },

  // ==========================================================
  // 34. Z-INDEX
  // ==========================================================

  zIndex: {
    base: 0,
    content: 10,
    sticky: 20,
    header: 30,
    tabBar: 40,
    floating: 50,
    dropdown: 60,
    modal: 70,
    sheet: 80,
    toast: 90,
    tooltip: 100,
    fullscreen: 110,
  },

  // ==========================================================
  // 35. SCREEN BACKGROUNDS
  // ==========================================================

  screens: {
    default: '#FAF7F2',

    home: '#FAF7F2',

    events: '#FAF7F2',

    memories: '#FAF7F2',

    profile: '#FAF7F2',

    onboarding: '#3A1D3D',

    authentication: '#FAF7F2',

    event: '#FAF7F2',

    gallery: '#FAF7F2',

    moment: '#211020',

    people: '#FAF7F2',

    challenges: '#211020',

    liveWall: '#160A18',

    guestbook: '#FAF7F2',

    replay: '#211020',

    organizer: '#FAF7F2',

    analytics: '#FAF7F2',

    settings: '#FAF7F2',

    subscription: '#FAF7F2',
  },

  // ==========================================================
  // 36. COMPONENT PRESETS
  // ==========================================================

  components: {
    sectionTitle: {
      marginBottom: 14,
      titleSize: 20,
      subtitleSize: 12,
    },

    divider: {
      height: 1,
      backgroundColor: '#E9E2D8',
    },

    avatarGroup: {
      overlap: -8,
      borderWidth: 2,
      borderColor: '#FFFFFF',
    },

    chip: {
      height: 32,
      paddingHorizontal: 12,
      radius: 999,
      fontSize: 11,
    },

    badge: {
      height: 24,
      paddingHorizontal: 10,
      radius: 999,
      fontSize: 10,
    },

    floatingActionButton: {
      width: 58,
      height: 58,
      borderRadius: 20,
      backgroundColor: '#5B315D',
      iconColor: '#FFFFFF',
    },

    goldFloatingActionButton: {
      width: 58,
      height: 58,
      borderRadius: 20,
      backgroundColor: '#D9B878',
      iconColor: '#3A1D3D',
    },

    pageHeader: {
      paddingHorizontal: 20,
      paddingVertical: 14,
    },

    section: {
      marginTop: 28,
      marginBottom: 12,
    },

    listItem: {
      minHeight: 64,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: '#E9E2D8',
    },
  },

  // ==========================================================
  // 37. DASHBOARD DATA VISUALIZATION
  // ==========================================================

  charts: {
    line: {
      stroke: '#5B315D',
      strokeWidth: 2.5,
      pointFill: '#D9B878',
      pointRadius: 4,
    },

    area: {
      fillOpacity: 0.12,
    },

    donut: {
      strokeWidth: 18,
    },

    bar: {
      radius: 5,
      gap: 6,
    },

    axis: {
      color: '#9D949E',
      fontSize: 10,
    },

    grid: {
      color: '#E8E1D9',
      width: 1,
    },
  },

  // ==========================================================
  // 38. ROLES
  // ==========================================================

  roles: {
    owner: {
      label: 'Organisateur',
      color: '#D9B878',
      backgroundColor: '#FBF5E8',
      icon: 'ribbon-outline',
    },

    organizer: {
      label: 'Organisateur',
      color: '#5B315D',
      backgroundColor: '#F1E7F2',
      icon: 'calendar-outline',
    },

    moderator: {
      label: 'Modérateur',
      color: '#758BA7',
      backgroundColor: '#EAF0F7',
      icon: 'shield-checkmark-outline',
    },

    participant: {
      label: 'Participant',
      color: '#6E9277',
      backgroundColor: '#EAF2EC',
      icon: 'person-outline',
    },

    guest: {
      label: 'Invité',
      color: '#758BA7',
      backgroundColor: '#EAF0F7',
      icon: 'person-outline',
    },

    photographer: {
      label: 'Photographe',
      color: '#7A4C7C',
      backgroundColor: '#EEE3EE',
      icon: 'camera-outline',
    },

    videographer: {
      label: 'Vidéaste',
      color: '#7A4C7C',
      backgroundColor: '#EEE3EE',
      icon: 'videocam-outline',
    },

    admin: {
      label: 'Administrateur',
      color: '#3A1D3D',
      backgroundColor: '#EDE5EE',
      icon: 'shield-checkmark-outline',
    },
  },

  // ==========================================================
  // 39. EVENT TYPES
  // ==========================================================

  eventTypes: {
    wedding: {
      label: 'Mariage',
      icon: 'heart-outline',
      color: '#B85C68',
      backgroundColor: '#F8E7EA',
    },

    birthday: {
      label: 'Anniversaire',
      icon: 'gift-outline',
      color: '#D9B878',
      backgroundColor: '#FBF5E8',
    },

    corporate: {
      label: 'Événement professionnel',
      icon: 'business-outline',
      color: '#5B315D',
      backgroundColor: '#F1E7F2',
    },

    graduation: {
      label: 'Diplôme',
      icon: 'school-outline',
      color: '#6E9277',
      backgroundColor: '#EAF2EC',
    },

    party: {
      label: 'Fête',
      icon: 'sparkles-outline',
      color: '#7A4C7C',
      backgroundColor: '#EEE3EE',
    },

    travel: {
      label: 'Voyage',
      icon: 'airplane-outline',
      color: '#758BA7',
      backgroundColor: '#EAF0F7',
    },

    family: {
      label: 'Famille',
      icon: 'people-outline',
      color: '#D9B878',
      backgroundColor: '#FBF5E8',
    },

    other: {
      label: 'Autre',
      icon: 'sparkles-outline',
      color: '#756B76',
      backgroundColor: '#EEEAEF',
    },
  },

  // ==========================================================
  // 40. PRIVACY
  // ==========================================================

  privacy: {
    private: {
      icon: 'lock-closed-outline',
      color: '#5B315D',
      backgroundColor: '#F1E7F2',
    },

    shared: {
      icon: 'people-outline',
      color: '#6E9277',
      backgroundColor: '#EAF2EC',
    },

    public: {
      icon: 'globe-outline',
      color: '#758BA7',
      backgroundColor: '#EAF0F7',
    },

    restricted: {
      icon: 'shield-outline',
      color: '#D9B878',
      backgroundColor: '#FBF5E8',
    },
  },

  // ==========================================================
  // 41. RESPONSIVE BREAKPOINTS
  // ==========================================================

  breakpoints: {
    small: 360,
    medium: 390,
    large: 430,
    tablet: 768,
    desktop: 1024,
  },

  // ==========================================================
// 42. HELPER FUNCTIONS
// ==========================================================

helpers: {
  /**
   * Retourne la configuration d'un statut d'événement.
   *
   * IMPORTANT :
   * Ne pas utiliser "this.eventTypes" ou "this.roles" ici.
   * La fonction est appelée via theme.helpers.xxx(), donc
   * "this" pointe vers theme.helpers et non vers theme.
   */
  getEventStatus(status) {
    const map = {
      live: {
        background: '#F8E3E7',
        text: '#B85C68',
        label: 'En direct',
      },

      upcoming: {
        background: '#F8F0DE',
        text: '#8A622B',
        label: 'À venir',
      },

      finished: {
        background: '#E8F1EA',
        text: '#42664A',
        label: 'Terminé',
      },

      draft: {
        background: '#F0EDEF',
        text: '#756B76',
        label: 'Brouillon',
      },
    };

    return map[status] || map.draft;
  },

  /**
   * Retourne la configuration d'un statut de modération.
   */
  getModerationStatus(status) {
    const map = {
      pending: {
        background: '#F8EEDB',
        text: '#8A622B',
        label: 'En attente',
      },

      approved: {
        background: '#EAF2EC',
        text: '#42664A',
        label: 'Approuvé',
      },

      rejected: {
        background: '#F8E7EA',
        text: '#7D3843',
        label: 'Rejeté',
      },

      flagged: {
        background: '#F8E7EA',
        text: '#7D3843',
        label: 'Signalé',
      },
    };

    return map[status] || map.pending;
  },

  /**
   * Retourne la configuration d'un rôle.
   *
   * On référence explicitement "theme.roles" au lieu de "this.roles".
   */
  getRole(role) {
    return theme.roles?.[role] || theme.roles?.participant || {
      label: 'Participant',
      color: '#5B315D',
      backgroundColor: '#F1E7F2',
      icon: 'person-outline',
    };
  },

  /**
   * Retourne la configuration d'un type d'événement.
   *
   * On référence explicitement "theme.eventTypes".
   *
   * Cela corrige définitivement :
   * Cannot read property 'other' of undefined
   */
  getEventType(type) {
    const normalizedType =
      typeof type === 'string' && type.trim()
        ? type.trim().toLowerCase()
        : 'other';

    return (
      theme.eventTypes?.[normalizedType] ||
      theme.eventTypes?.other || {
        label: 'Autre',
        icon: 'sparkles-outline',
        color: '#756B76',
        backgroundColor: '#EEEAEF',
      }
    );
  },

  /**
   * Retourne la couleur associée à un type de média.
   */
  getMediaColor(type) {
    const map = {
      photo: '#D9B878',
      video: '#7A4C7C',
      audio: '#6E9277',
      document: '#758BA7',
    };

    return map[type] || '#756B76';
  },

  /**
   * Retourne la couleur associée à une réaction.
   */
  getReactionColor(type) {
    const map = {
      like: '#B85C68',
      love: '#B85C68',
      laugh: '#D9B878',
      wow: '#7A4C7C',
      celebration: '#6E9277',
    };

    return map[type] || '#756B76';
  },

  /**
   * Convertit une couleur HEX en RGBA.
   */
  hexToRgba(hex, alpha = 1) {
    if (!hex || typeof hex !== 'string') {
      return `rgba(0,0,0,${alpha})`;
    }

    const normalized = hex.replace('#', '');

    if (![3, 6, 8].includes(normalized.length)) {
      return `rgba(0,0,0,${alpha})`;
    }

    let parsed = normalized;

    if (parsed.length === 3) {
      parsed = parsed
        .split('')
        .map((char) => `${char}${char}`)
        .join('');
    }

    // Pour une valeur HEX RGBA (#RRGGBBAA), on ignore
    // volontairement le canal alpha existant.
    if (parsed.length === 8) {
      parsed = parsed.slice(0, 6);
    }

    const bigint = parseInt(parsed, 16);

    if (Number.isNaN(bigint)) {
      return `rgba(0,0,0,${alpha})`;
    }

    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  },

  /**
   * Convertit une valeur de spacing en valeur numérique.
   */
  spacing(value) {
    const scale = {
      0: 0,
      1: 4,
      2: 8,
      3: 12,
      4: 16,
      5: 20,
      6: 24,
      7: 28,
      8: 32,
      9: 36,
      10: 40,
      12: 48,
      14: 56,
      16: 64,
    };

    return scale[value] ?? value;
  },

  /**
   * Convertit une valeur de radius en valeur numérique.
   */
  radius(value) {
    const scale = {
      none: 0,
      xs: 6,
      sm: 8,
      md: 12,
      lg: 16,
      xl: 20,
      xxl: 24,
      xxxl: 28,
      pill: 999,
    };

    return scale[value] ?? value;
  },
},

  // ==========================================================
  // 43. DESIGN TOKENS FOR COMMON UI
  // ==========================================================

  tokens: {
    primaryAction: {
      background: '#5B315D',
      foreground: '#FFFFFF',
      pressed: '#3A1D3D',
      disabled: '#E9E2D8',
    },

    secondaryAction: {
      background: '#F1E7F2',
      foreground: '#5B315D',
      pressed: '#E5D6E6',
      disabled: '#F0EDEF',
    },

    luxuryAction: {
      background: '#D9B878',
      foreground: '#3A1D3D',
      pressed: '#B89450',
      disabled: '#EFE5D2',
    },

    surface: {
      background: '#FFFFFF',
      elevated: '#FFFFFF',
      subtle: '#F9F5F1',
    },

    page: {
      background: '#FAF7F2',
    },

    darkMode: {
      background: '#160A18',
      surface: '#211020',
      surfaceElevated: '#2D1830',
      text: '#FFFFFF',
      muted: '#A898AA',
      accent: '#D9B878',
    },

    divider: '#E9E2D8',

    focus: '#D9B878',

    error: '#B85C68',

    success: '#6E9277',
  },
};

// ============================================================
// EXPORTS
// ============================================================

export default theme;

export const {
  colors,
  gradients,
  typography,
  spacing,
  radius,
  borders,
  shadows,
  layout,
  icons,
  buttons,
  inputs,
  cards,
  event,
  media,
  moments,
  challenges,
  gamification,
  liveWall,
  guestbook,
  profile,
  navigation,
  organizer,
  invites,
  subscriptions,
  notifications,
  search,
  modal,
  toast,
  emptyState,
  loading,
  accessibility,
  animation,
  zIndex,
  screens,
  components,
  charts,
  roles,
  eventTypes,
  privacy,
  breakpoints,
  tokens,
} = theme;
