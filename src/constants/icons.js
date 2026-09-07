// src/constants/icons.js
// ------------------------------------------------------------
// Everia utilise exclusivement Ionicons (@expo/vector-icons) dans
// toute l'application. Le theme.js du design system référence les
// icônes sémantiques par domaine (roles, eventTypes, privacy, etc) ;
// ce fichier complète avec la navigation, les médias et les actions
// génériques qui n'ont pas leur place dans le theme visuel.
// ------------------------------------------------------------

export const NAV_ICONS = {
  home: { active: 'home', inactive: 'home-outline' },
  events: { active: 'calendar', inactive: 'calendar-outline' },
  capture: { active: 'camera', inactive: 'camera-outline' },
  memories: { active: 'images', inactive: 'images-outline' },
  profile: { active: 'person-circle', inactive: 'person-circle-outline' },
};

export const EVENT_TAB_ICONS = {
  overview: 'grid-outline',
  gallery: 'images-outline',
  moments: 'sparkles-outline',
  people: 'people-outline',
  challenges: 'trophy-outline',
  live: 'tv-outline',
  guestbook: 'book-outline',
  experience: 'person-outline',
  replay: 'film-outline',
};

export const ORGANIZER_ICONS = {
  dashboard: 'grid-outline',
  participants: 'people-outline',
  invites: 'person-add-outline',
  media: 'images-outline',
  albums: 'folder-open-outline',
  moments: 'sparkles-outline',
  challenges: 'trophy-outline',
  moderation: 'shield-checkmark-outline',
  analytics: 'stats-chart-outline',
  liveWall: 'tv-outline',
  guestbook: 'book-outline',
  billing: 'card-outline',
  settings: 'settings-outline',
  customize: 'color-palette-outline',
};

export const MEDIA_ICONS = {
  photo: 'image-outline',
  video: 'videocam-outline',
  audio: 'mic-outline',
  document: 'document-text-outline',
  upload: 'cloud-upload-outline',
  download: 'download-outline',
  share: 'share-social-outline',
  favorite: 'heart-outline',
  favoriteActive: 'heart',
  comment: 'chatbubble-outline',
  edit: 'pencil-outline',
  delete: 'trash-outline',
  fullscreen: 'expand-outline',
  flip: 'camera-reverse-outline',
  flash: 'flash-outline',
  flashOff: 'flash-off-outline',
};

export const STATUS_ICONS = {
  success: 'checkmark-circle',
  warning: 'warning',
  error: 'close-circle',
  info: 'information-circle',
  loading: 'sync',
};

export const ACTION_ICONS = {
  add: 'add',
  addCircle: 'add-circle',
  close: 'close',
  closeCircle: 'close-circle',
  check: 'checkmark',
  checkCircle: 'checkmark-circle-outline',
  back: 'chevron-back',
  forward: 'chevron-forward',
  more: 'ellipsis-horizontal',
  search: 'search-outline',
  filter: 'options-outline',
  qr: 'qr-code-outline',
  link: 'link-outline',
  copy: 'copy-outline',
  logout: 'log-out-outline',
  send: 'send',
  mail: 'mail-outline',
  call: 'call-outline',
  location: 'location-outline',
  time: 'time-outline',
  play: 'play',
  pause: 'pause',
  eye: 'eye-outline',
  eyeOff: 'eye-off-outline',
  bell: 'notifications-outline',
  bellActive: 'notifications',
  flag: 'flag-outline',
  ban: 'ban-outline',
  gift: 'gift-outline',
  crown: 'ribbon-outline',
  wallet: 'wallet-outline',
  cash: 'cash-outline',
  refresh: 'refresh-outline',
  scan: 'scan-outline',
  reply: 'arrow-undo-outline',
  arrowRight: 'arrow-forward',
};

export const REACTION_ICONS = {
  like: 'thumbs-up',
  love: 'heart',
  laugh: 'happy',
  wow: 'sparkles',
  celebration: 'trophy',
};
