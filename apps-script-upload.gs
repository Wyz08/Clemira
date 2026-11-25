// Simpan bukti pembayaran Clemira ke Google Drive, catat barisnya di Google Sheets.
//
// Pasang:
//   1. Buka script.google.com, New project, tempel seluruh isi berkas ini.
//   2. Jalankan fungsi `siapkan` sekali (Run > siapkan, izinkan akses). Fungsi
//      itu membuat spreadsheet "Pesanan Clemira Aren" di folder Drive tujuan,
//      menulis baris judul, lalu menyimpan ID-nya di properti skrip. Hasilnya
//      tercetak di View > Logs (Execution log): SHEET_ID dan URL-nya.
//   3. Deploy > New deployment > Web app. Execute as: Me. Who has access: Anyone.
//   4. Salin URL yang berakhiran /exec ke variabel DRIVE_ENDPOINT di index.html.

// Folder Drive tujuan: "Bukti_Bayar_Clemira" milik pemilik usaha.
var FOLDER_ID = "1oi3Z1_p0_X79F_2ISjoAQWZ6aa5Yxage";

// Boleh dikosongkan. Kalau kosong, `siapkan` membuat spreadsheet baru dan
// menyimpan ID-nya di properti skrip, jadi doPost tinggal memakainya.
var SHEET_ID = "";
var MAX_BYTES = 5 * 1024 * 1024;
var JUDUL_KOLOM = ["Waktu", "Kode pesanan", "Total", "Isi pesan", "Link bukti"];

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function idSheet() {
  return PropertiesService.getScriptProperties().getProperty("SHEET_ID") || SHEET_ID;
}

// Jalankan sekali dari editor Apps Script sebelum deploy.
function siapkan() {
  var id = idSheet();
  if (!id) {
    var ss = SpreadsheetApp.create("Pesanan Clemira Aren");
    DriveApp.getFileById(ss.getId()).moveTo(DriveApp.getFolderById(FOLDER_ID));
    ss.getSheets()[0].appendRow(JUDUL_KOLOM);
    PropertiesService.getScriptProperties().setProperty("SHEET_ID", ss.getId());
    id = ss.getId();
  }
  Logger.log("SHEET_ID: " + id);
  Logger.log("URL: https://docs.google.com/spreadsheets/d/" + id + "/edit");
  return id;
}

function doPost(e) {
  try {
    var p = (e && e.parameter) || {};
    var kode = p.kode || "(tanpa kode)";
    var nama = p.namaBerkas || "bukti.png";
    var tipe = p.tipeBerkas || "image/png";
    var blob = null;

    if (p.bukti64) {
      var bytes = Utilities.base64Decode(p.bukti64);
      if (bytes.length > MAX_BYTES) {
        return json({ ok: false, error: "berkas melebihi 5 MB" });
      }
      blob = Utilities.newBlob(bytes, tipe, nama);
    } else if (p.file && typeof p.file.getBlob === "function") {
      blob = p.file.getBlob();
      nama = blob.getName() || nama;
      if (blob.getBytes().length > MAX_BYTES) {
        return json({ ok: false, error: "berkas melebihi 5 MB" });
      }
    }

    if (!blob) {
      return json({ ok: false, error: "berkas bukti tidak diterima" });
    }

    var sheetId = idSheet();
    if (!sheetId) {
      return json({ ok: false, error: "siapkan belum dijalankan" });
    }

    var folder = DriveApp.getFolderById(FOLDER_ID);
    var saved = folder.createFile(blob).setName(kode + "-" + nama);
    saved.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    SpreadsheetApp.openById(sheetId).getSheets()[0].appendRow([
      new Date(), kode, p.total || "", p.pesan || "", saved.getUrl()
    ]);

    return json({ ok: true, url: saved.getUrl() });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}
