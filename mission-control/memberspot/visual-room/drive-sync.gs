/**
 * VISUAL ROOM → Google Drive: eingereichte Mitglieder-Songs übertragen
 *
 * Einrichten (einmalig, ca. 3 Minuten, mit dem Google-Konto, dem der Drive-Ordner gehört):
 *   1. https://script.google.com → „Neues Projekt“ → diesen Code einfügen → speichern.
 *   2. Oben die Funktion „syncSongs“ auswählen → „Ausführen“ → Zugriff erlauben.
 *   3. Links „Trigger“ (Wecker) → „Trigger hinzufügen“ → syncSongs · zeitgesteuert · alle 15 Minuten.
 *
 * Ablauf: holt alle neuen Einreichungen aus Supabase, legt die Audiodatei in
 * ZION › 05_MEDIEN › 0503_Vereinsmitglieder Medien › Songs von Mitgliedern › Eingereicht,
 * schreibt Titel/Künstler/Mitglied/Nachricht in die Dateibeschreibung, markiert sie als übertragen
 * und löscht die Kopie aus dem Supabase-Speicher.
 */
var API = 'https://emxqoahtipbmumghlixb.supabase.co';
var KEY = 'sb_publishable_LPbsKEws5DMQLcKix0X2AQ_VtYNbO-P';
var SECRET = '6311b9d24e7a89f3b8479165b9c975ed';          // nur hier im Skript, nie in der Webseite
var FOLDER_ID = '1sAQW_KDhcDb7awjLslgoiQMmECwPUkwK';      // …/Songs von Mitgliedern/Eingereicht

function rpc_(name, body) {
  var r = UrlFetchApp.fetch(API + '/rest/v1/rpc/' + name, {
    method: 'post', contentType: 'application/json', headers: { apikey: KEY }, payload: JSON.stringify(body), muteHttpExceptions: true
  });
  return JSON.parse(r.getContentText());
}

function syncSongs() {
  var list = rpc_('vr_sync_pending', { p_secret: SECRET });
  if (!Array.isArray(list)) { Logger.log('Fehler: ' + JSON.stringify(list)); return; }
  var folder = DriveApp.getFolderById(FOLDER_ID);
  list.forEach(function (s) {
    var url = API + '/storage/v1/object/public/song-einreichungen/' + s.path;
    var res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    if (res.getResponseCode() !== 200) { Logger.log('Datei fehlt: ' + s.path); return; }
    var ext = s.path.split('.').pop();
    var name = (s.artist_name ? s.artist_name + ' – ' : '') + s.title + ' (' + (s.member || 'Mitglied') + ').' + ext;
    var file = folder.createFile(res.getBlob().setName(name));
    file.setDescription('Eingereicht über den Visual Room am ' + s.created_at + '\nMitglied: ' + (s.member || '') + '\nKünstler: ' + (s.artist_name || '') + '\nOriginaldatei: ' + (s.file_name || '') + '\n\n' + (s.note || ''));
    rpc_('vr_sync_done', { p_secret: SECRET, p_id: s.id, p_drive_id: file.getId() });
    UrlFetchApp.fetch(API + '/storage/v1/object/song-einreichungen/' + s.path, { method: 'delete', headers: { apikey: KEY, Authorization: 'Bearer ' + KEY }, muteHttpExceptions: true });
    Logger.log('Übertragen: ' + name);
  });
}
