/**
 * Base (English) UI strings. Every other language is produced from these at
 * runtime by the AI translation service and cached, so adding a language
 * never requires touching this file.
 *
 * Bump STRINGS_VERSION whenever copy changes so caches refresh.
 */
export const STRINGS_VERSION = 1;

export const STRINGS = {
  // Brand / generic
  "app.tagline": "See it. Report it. Fix it.",
  "common.cancel": "Cancel",
  "common.save": "Save",
  "common.saving": "Saving...",
  "common.close": "Close",
  "common.back": "Back",
  "common.continue": "Continue",
  "common.delete": "Delete",
  "common.search": "Search",
  "common.loading": "Loading...",
  "common.retry": "Try again",
  "common.done": "Done",
  "common.points": "points",
  "common.by": "by",
  "common.optional": "optional",

  // Navigation
  "nav.home": "Home",
  "nav.feed": "Feed",
  "nav.report": "Report",
  "nav.map": "Map",
  "nav.alerts": "Alerts",
  "nav.profile": "Profile",
  "nav.admin": "Admin",
  "nav.signOut": "Sign out",
  "nav.lightMode": "Light mode",
  "nav.darkMode": "Dark mode",
  "nav.language": "Language & Region",

  // Home
  "home.greeting": "Hello",
  "home.subtitle": "Here's what's happening around you.",
  "home.reportIssue": "Report an issue",
  "home.reportIssueSub": "Something broken nearby? Tell your neighbours.",
  "home.browseFeed": "Browse the feed",
  "home.viewMap": "Open the map",
  "home.recent": "Recent in your area",
  "home.seeAll": "See all",

  // Feed
  "feed.title": "Community feed",
  "feed.subtitle": "See what neighbours are reporting.",
  "feed.all": "All",
  "feed.empty": "No reports yet",
  "feed.emptyBody": "Be the first to report something in your neighbourhood.",
  "feed.searchPlaceholder": "Search reports in any language...",
  "feed.searchingAcross": "Searching across languages",
  "feed.noMatches": "No reports matched your search.",

  // Report form
  "report.title": "Report an issue",
  "report.step1": "What kind of issue is it?",
  "report.fieldTitle": "Title",
  "report.titlePlaceholder": "e.g. Broken streetlight near school entrance",
  "report.fieldDescription": "Description",
  "report.descriptionPlaceholder": "Add helpful details...",
  "report.photo": "Photo (optional)",
  "report.addPhoto": "Tap to add photo",
  "report.where": "Where is it?",
  "report.useLocation": "Use my current location",
  "report.useLocationSub": "Tap to share your GPS location",
  "report.address": "Address or landmark",
  "report.addressPlaceholder": "e.g. Corner of Riverside & 3rd",
  "report.submit": "Submit report",
  "report.submitting": "Submitting...",
  "report.submitted": "Report submitted — thanks for helping!",
  "report.locationCaptured": "Location captured",
  "report.locationFailed": "Couldn't get your location",
  "report.locationUnavailable": "Location not available on this device",
  "report.emergency": "This is an emergency",
  "report.emergencySub": "Translated immediately for responders and neighbours.",

  // Writing assistant
  "assistant.improve": "Improve with NeighbourBot",
  "assistant.working": "NeighbourBot is rewriting...",
  "assistant.suggestion": "NeighbourBot suggestion",
  "assistant.accept": "Accept",
  "assistant.edit": "Edit",
  "assistant.dismiss": "Dismiss",
  "assistant.failed": "NeighbourBot couldn't rewrite that. Please try again.",

  // Report detail
  "detail.confirm": "Confirm this issue",
  "detail.confirmed": "Confirmed",
  "detail.progress": "Progress",
  "detail.set": "Set",
  "detail.discussion": "Discussion",
  "detail.firstComment": "Be the first to comment.",
  "detail.commentPlaceholder": "Add a comment...",
  "detail.post": "Post",
  "detail.notFound": "Report not found.",
  "detail.backToFeed": "Back to feed",
  "detail.statusUpdated": "Status updated",
  "detail.deleted": "Report deleted",
  "detail.deleteConfirm": "Delete this report?",

  // Statuses
  "status.reported": "Reported",
  "status.verified": "Community Verified",
  "status.assigned": "Assigned",
  "status.in_progress": "In Progress",
  "status.resolved": "Resolved",

  // Categories
  "category.roads": "Roads",
  "category.electricity": "Electricity",
  "category.water": "Water",
  "category.waste": "Waste",
  "category.environment": "Environment",
  "category.safety": "Safety",
  "category.animals": "Animals",
  "category.other": "Other",

  // Notifications
  "notif.title": "Notifications",
  "notif.subtitle": "Activity on your reports.",
  "notif.empty": "You're all caught up",
  "notif.emptyBody": "When neighbours interact with your reports, you'll see it here.",
  "notif.confirmed": "{name} confirmed your report",
  "notif.commented": "{name} commented",
  "notif.on": "on",

  // Profile
  "profile.title": "Profile",
  "profile.yourReports": "Your reports",
  "profile.displayName": "Display name",
  "profile.bio": "About you",
  "profile.saved": "Profile saved",

  // Language settings
  "lang.title": "Language & Region",
  "lang.subtitle": "Choose how NeighbourNet speaks to you.",
  "lang.preferred": "Preferred language",
  "lang.search": "Search languages",
  "lang.recent": "Recently used",
  "lang.all": "All languages",
  "lang.current": "Current",
  "lang.noResults": "No languages matched.",
  "lang.autoTranslate": "Translate content automatically",
  "lang.autoTranslateSub":
    "Reports and comments written in other languages are shown in your language.",
  "lang.originalFirst": "Always show original text first",
  "lang.originalFirstSub": "Translations stay one tap away.",
  "lang.regionPreview": "Region preview",
  "lang.dateFormat": "Date",
  "lang.numberFormat": "Number",
  "lang.timeFormat": "Time",
  "lang.changed": "Language updated",

  // First-run setup
  "setup.title": "Choose your language",
  "setup.subtitle":
    "NeighbourNet will translate the whole app — and your neighbours' reports — into the language you pick.",
  "setup.detect": "Detect my device language",
  "setup.detected": "Detected",
  "setup.confirm": "Continue",
  "setup.changeLater": "You can change this anytime in Language & Region.",

  // Translation UI
  "tr.translatedFrom": "Translated from {language}",
  "tr.showOriginal": "Show original",
  "tr.showTranslation": "Show translation",
  "tr.originalIn": "Originally posted in {language}",
  "tr.viewOriginal": "View original",
  "tr.translate": "Translate",
  "tr.translating": "Translating...",
  "tr.copy": "Copy translation",
  "tr.copied": "Copied",
  "tr.reportIssue": "Report translation issue",
  "tr.reported": "Thanks — we'll review this translation.",
  "tr.approximate": "This translation may be approximate.",
  "tr.detected": "{language} detected",
  "tr.translateAuto": "Translate automatically?",
  "tr.yes": "Yes",
  "tr.no": "No",
  "tr.emergency": "Emergency translation",

  // NeighbourBot
  "bot.name": "NeighbourBot",
  "bot.placeholder": "Ask me anything...",
  "bot.open": "Open NeighbourBot",
  "bot.thinking": "Thinking",
  "bot.welcome":
    "Hi, I'm **NeighbourBot** 👋\n\nI can help you use NeighbourNet, offer safety tips, suggest simple home fixes, do calculations, and even rewrite your reports to be clearer. What can I help with?",
  "bot.speaksYourLanguage": "Speaks your language",

  // Errors
  "error.generic": "Something went wrong. Please try again.",
  "error.network": "I couldn't reach the network. Please check your connection.",
  "error.notSignedIn": "Please sign in first.",
} as const;

export type StringKey = keyof typeof STRINGS;
export type Dictionary = Record<string, string>;
