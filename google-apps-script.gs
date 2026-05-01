// ═══════════════════════════════════════════════════════════════════════════
//  Google Apps Script — Drive → Video Site Auto-Sync
//  Paste this entire file into script.google.com, then follow SETUP below.
// ═══════════════════════════════════════════════════════════════════════════

// ── SETUP ──────────────────────────────────────────────────────────────────
//  1. Go to https://script.google.com → New project
//  2. Paste this whole file, replacing any existing code
//  3. Change the two constants below:
//       SITE_URL  → your Vercel URL (no trailing slash), e.g. https://your-site.vercel.app
//       ROOT_FOLDER_ID → the ID of your "Vela" Drive folder
//         (open the folder in Drive → look at the URL: /folders/THIS_PART)
//  4. Click "Save" (floppy icon)
//  5. Click "Run" → choose runOnce → approve permissions when prompted
//     (this registers the change trigger for the first time)
//  6. In the left sidebar click "Triggers" (clock icon) → verify the trigger exists
//     If not, run installTrigger() manually once.
// ──────────────────────────────────────────────────────────────────────────

var SITE_URL       = "https://your-site.vercel.app";   // ← CHANGE THIS
var SYNC_SECRET    = "xR0OBkYM1b6HIaNCgGLuyvwlSo795KfQrdqJD4nA";
var ROOT_FOLDER_ID = "PASTE_YOUR_VELA_FOLDER_ID_HERE"; // ← CHANGE THIS

// ── installTrigger ─────────────────────────────────────────────────────────
// Run this once manually to install the Drive change trigger.
function installTrigger() {
  // Remove any existing Drive triggers for this project first
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getEventType() === ScriptApp.EventType.ON_CHANGE) {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  ScriptApp.newTrigger("onDriveChange")
    .forUserCalendar(Session.getActiveUser().getEmail()) // placeholder — Drive triggers work differently
    .onEventUpdated()
    .create();
}

// Google Drive doesn't support per-folder triggers natively.
// The correct trigger type is a time-driven trigger that scans for new files.
// ── RECOMMENDED APPROACH: Time-driven trigger ─────────────────────────────
//  Instead of a file-change trigger (which only works for Sheets/Docs),
//  we use a time-based trigger that runs every 5 minutes and checks for
//  videos added in the last 10 minutes.

function installTimeTrigger() {
  // Delete existing time triggers for syncNewVideos
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === "syncNewVideos") {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  // Create a new trigger: every 5 minutes
  ScriptApp.newTrigger("syncNewVideos")
    .timeBased()
    .everyMinutes(5)
    .create();

  Logger.log("✅ Time trigger installed — syncNewVideos will run every 5 minutes.");
}

// ── syncNewVideos ──────────────────────────────────────────────────────────
// Scans all sub-folders of ROOT_FOLDER_ID for video files uploaded in the
// last 10 minutes, then calls the API to insert them.
function syncNewVideos() {
  var rootFolder = DriveApp.getFolderById(ROOT_FOLDER_ID);
  var subFolders = rootFolder.getFolders();

  // Look back 10 minutes to catch anything uploaded since last run
  var cutoff = new Date(Date.now() - 10 * 60 * 1000);

  while (subFolders.hasNext()) {
    var folder = subFolders.next();
    var folderName = folder.getName(); // e.g. "FK", "SG", "SK", "song", "WS"

    var files = folder.getFiles();
    while (files.hasNext()) {
      var file = files.next();

      // Only video mime types
      var mime = file.getMimeType();
      if (!mime.startsWith("video/") && mime !== "application/vnd.google-apps.video") {
        continue;
      }

      // Only files created after the cutoff
      if (file.getDateCreated() < cutoff) {
        continue;
      }

      var fileId = file.getId();
      var title  = file.getName().replace(/\.[^.]+$/, ""); // strip extension

      // Call the site API
      var result = callSyncApi(fileId, title, folderName);
      Logger.log(
        result.skipped
          ? "⏭  Skipped (already exists): " + title
          : "✅ Synced: " + title + " → videoId=" + result.videoId
      );
    }
  }
}

// ── callSyncApi ────────────────────────────────────────────────────────────
function callSyncApi(fileId, title, folderName) {
  var payload = JSON.stringify({
    secret: SYNC_SECRET,
    fileId: fileId,
    title: title,
    folderName: folderName,
  });

  var options = {
    method: "post",
    contentType: "application/json",
    payload: payload,
    muteHttpExceptions: true,
  };

  var response = UrlFetchApp.fetch(SITE_URL + "/api/sync-drive", options);
  var code = response.getResponseCode();
  var text = response.getContentText();

  if (code !== 200) {
    Logger.log("❌ API error " + code + ": " + text);
    throw new Error("sync-drive API returned " + code + ": " + text);
  }

  return JSON.parse(text);
}

// ── runOnce ────────────────────────────────────────────────────────────────
// Manually trigger a full back-fill scan (ignores the 10-minute cutoff).
// Run this once after deploy to sync any existing videos in your folders.
function runOnce() {
  var rootFolder = DriveApp.getFolderById(ROOT_FOLDER_ID);
  var subFolders = rootFolder.getFolders();

  while (subFolders.hasNext()) {
    var folder = subFolders.next();
    var folderName = folder.getName();
    var files = folder.getFiles();

    while (files.hasNext()) {
      var file = files.next();
      var mime = file.getMimeType();
      if (!mime.startsWith("video/") && mime !== "application/vnd.google-apps.video") continue;

      var fileId = file.getId();
      var title  = file.getName().replace(/\.[^.]+$/, "");

      try {
        var result = callSyncApi(fileId, title, folderName);
        Logger.log(
          result.skipped
            ? "⏭  Already exists: " + title
            : "✅ Added: " + title
        );
      } catch (e) {
        Logger.log("❌ Failed for " + title + ": " + e.message);
      }
    }
  }

  Logger.log("🎉 Back-fill complete.");
}
