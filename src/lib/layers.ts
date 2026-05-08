// Shared z-index scale for app-level overlays and fixed UI.
// Use these tokens instead of ad hoc numbers so layering stays predictable.
export const LAYERS = {
  cardRaised: 10,
  cardDropdown: 20,
  headerBackdrop: 900,
  header: 1000,
  mobileMenuBackdrop: 1100,
  mobileMenuPanel: 1200,
  adminFloating: 1300,
  adminFloatingPopover: 1310,
  modal: 2000,
  adminModal: 2200,
  blockingModal: 5000,
} as const;
