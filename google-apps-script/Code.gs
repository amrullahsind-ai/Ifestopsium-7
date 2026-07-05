/**
 * ============================================================
 *  BACKEND API — IFESTOPSIUM #7 Monitoring Timeline
 *  Google Apps Script Web App (terikat ke Spreadsheet)
 * ============================================================
 *
 * Cara pasang singkat (lihat SETUP.md untuk lengkap):
 *  1. Buka Spreadsheet > Extensions > Apps Script
 *  2. Tempel seluruh isi file ini ke Code.gs
 *  3. Jalankan fungsi setupAuthSheet() sekali (untuk membuat sheet Auth + password)
 *  4. Deploy > New deployment > Web app
 *       - Execute as: Me
 *       - Who has access: Anyone
 *  5. Salin URL "…/exec", tempel di aplikasi PWA
 */

// Sheet yang BUKAN divisi (diabaikan saat membaca data tugas)
var IGNORED_SHEETS = ['Auth', 'Config', 'PANDUAN', 'PANDUAN STATUS']

// ---------- ROUTING ----------

function doGet(e) {
  try {
    var action = (e && e.parameter && e.parameter.action) || 'ping'
    if (action === 'ping') return json({ ok: true, service: 'ifestopsium' })
    if (action === 'getAll') return json({ divisions: getAllDivisions() })
    if (action === 'getDivision') return json({ division: getDivision(e.parameter.division) })
    return json({ error: 'Action tidak dikenal: ' + action })
  } catch (err) {
    return json({ error: String(err && err.message ? err.message : err) })
  }
}

function doPost(e) {
  try {
    var body = JSON.parse((e && e.postData && e.postData.contents) || '{}')
    var action = body.action

    if (action === 'login') return json(handleLogin(body))

    // Semua operasi tulis butuh otorisasi password divisi / admin
    if (action === 'updateTask' || action === 'addTask' || action === 'deleteTask') {
      if (!authorizeWrite(body.division, body.password))
        return json({ error: 'Password salah atau tidak punya akses ke divisi ini.' })
      if (action === 'updateTask') return json(updateTask(body))
      if (action === 'addTask') return json(addTask(body))
      if (action === 'deleteTask') return json(deleteTask(body))
    }
    return json({ error: 'Action tidak dikenal: ' + action })
  } catch (err) {
    return json({ error: String(err && err.message ? err.message : err) })
  }
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  )
}

// ---------- DETEKSI STRUKTUR SHEET ----------

/** Cari baris header + peta kolom pada sebuah sheet divisi. null jika bukan sheet divisi. */
function detectLayout(values) {
  var maxScan = Math.min(values.length, 15)
  for (var r = 0; r < maxScan; r++) {
    var row = values[r]
    var map = {}
    for (var c = 0; c < row.length; c++) {
      var h = String(row[c] || '').trim().toLowerCase()
      if (!h) continue
      if (h === 'no' || h === 'no.') map.no = c
      else if (h.indexOf('jobdesc') > -1 || h.indexOf('kegiatan') > -1) map.jobdesc = c
      else if (h.indexOf('waktu') > -1) map.waktu = c
      else if (h.indexOf('keterangan') > -1 || h.indexOf('sub-task') > -1 || h.indexOf('subtask') > -1)
        map.subtask = c
      // penting: cek 'link' SEBELUM 'progres' karena "Link Progres" mengandung kata "progres"
      else if (h.indexOf('link') > -1) map.link = c
      else if (h.indexOf('progres') > -1 || h.indexOf('status') > -1) map.status = c
      else if (h.indexOf('pic') > -1) map.pic = c
      else if (h.indexOf('catatan') > -1) map.catatan = c
    }
    // Baris header valid bila punya kolom jobdesc DAN status
    if (map.jobdesc != null && map.status != null) {
      return { headerRow: r, map: map }
    }
  }
  return null
}

function isIgnored(name) {
  var n = name.trim().toLowerCase()
  for (var i = 0; i < IGNORED_SHEETS.length; i++) {
    if (n === IGNORED_SHEETS[i].toLowerCase()) return true
  }
  // Sheet dashboard biasanya mengandung kata "dashboard"
  if (n.indexOf('dashboard') > -1) return true
  return false
}

function cell(values, r, c) {
  if (c == null) return ''
  var row = values[r]
  if (!row) return ''
  var v = row[c]
  return v == null ? '' : String(v).trim()
}

/** Baca satu sheet menjadi objek divisi { name, tasks[] } */
function readSheet(sheet) {
  var lastRow = sheet.getLastRow()
  var lastCol = sheet.getLastColumn()
  if (lastRow < 1 || lastCol < 1) return null
  var values = sheet.getRange(1, 1, lastRow, lastCol).getValues()
  var layout = detectLayout(values)
  if (!layout) return null

  var map = layout.map
  var tasks = []
  for (var r = layout.headerRow + 1; r < values.length; r++) {
    var jobdesc = cell(values, r, map.jobdesc)
    var no = cell(values, r, map.no)
    // Lewati baris yang benar-benar kosong (tak ada jobdesc & tak ada no)
    if (!jobdesc && !no) continue
    // Lewati baris "sub judul" yang cuma berisi jobdesc tapi tak ada status kolom? tetap masukkan.
    tasks.push({
      row: r + 1, // nomor baris asli di sheet (1-based)
      no: no,
      jobdesc: jobdesc,
      waktu: cell(values, r, map.waktu),
      subtask: cell(values, r, map.subtask),
      status: cell(values, r, map.status),
      link: cell(values, r, map.link),
      pic: cell(values, r, map.pic),
      catatan: cell(values, r, map.catatan),
    })
  }
  return { name: sheet.getName(), tasks: tasks }
}

function getAllDivisions() {
  var ss = SpreadsheetApp.getActiveSpreadsheet()
  var sheets = ss.getSheets()
  var out = []
  for (var i = 0; i < sheets.length; i++) {
    var sh = sheets[i]
    if (isIgnored(sh.getName())) continue
    var div = readSheet(sh)
    if (div) out.push(div)
  }
  return out
}

function getDivision(name) {
  var sheet = getDivisionSheet(name)
  var div = readSheet(sheet)
  if (!div) throw new Error('Sheet "' + name + '" bukan sheet divisi yang valid.')
  return div
}

function getDivisionSheet(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet()
  var sheet = ss.getSheetByName(name)
  if (!sheet) throw new Error('Divisi "' + name + '" tidak ditemukan.')
  if (isIgnored(name)) throw new Error('Sheet "' + name + '" bukan divisi.')
  return sheet
}

function getLayoutFor(sheet) {
  var lastRow = sheet.getLastRow()
  var lastCol = sheet.getLastColumn()
  var values = sheet.getRange(1, 1, lastRow, lastCol).getValues()
  var layout = detectLayout(values)
  if (!layout) throw new Error('Struktur sheet "' + sheet.getName() + '" tidak dikenali.')
  layout.values = values
  return layout
}

// ---------- OPERASI TULIS ----------

function updateTask(body) {
  var sheet = getDivisionSheet(body.division)
  var layout = getLayoutFor(sheet)
  var map = layout.map
  var row = parseInt(body.row, 10)
  if (!row || row <= layout.headerRow + 1 - 1) throw new Error('Baris tidak valid.')

  if (map.status != null) sheet.getRange(row, map.status + 1).setValue(body.status || '')
  if (map.catatan != null) sheet.getRange(row, map.catatan + 1).setValue(body.catatan || '')
  if (map.link != null) sheet.getRange(row, map.link + 1).setValue(body.link || '')
  if (map.pic != null) sheet.getRange(row, map.pic + 1).setValue(body.pic || '')
  return { ok: true }
}

function addTask(body) {
  var sheet = getDivisionSheet(body.division)
  var layout = getLayoutFor(sheet)
  var map = layout.map
  var values = layout.values

  // Cari baris data terakhir (jobdesc terisi) di bawah header
  var lastDataRow = layout.headerRow // index array
  var count = 0
  for (var r = layout.headerRow + 1; r < values.length; r++) {
    var jd = cell(values, r, map.jobdesc)
    var no = cell(values, r, map.no)
    if (jd || no) {
      lastDataRow = r
      if (jd) count++
    }
  }
  var insertAt = lastDataRow + 1 // sheet row (1-based) untuk baris baru
  sheet.insertRowsAfter(lastDataRow + 1, 1)

  if (map.no != null) sheet.getRange(insertAt + 1, map.no + 1).setValue(count + 1)
  if (map.jobdesc != null) sheet.getRange(insertAt + 1, map.jobdesc + 1).setValue(body.jobdesc || '')
  if (map.waktu != null) sheet.getRange(insertAt + 1, map.waktu + 1).setValue(body.waktu || '')
  if (map.subtask != null) sheet.getRange(insertAt + 1, map.subtask + 1).setValue(body.subtask || '')
  if (map.status != null) sheet.getRange(insertAt + 1, map.status + 1).setValue(body.status || 'Belum Dimulai')
  if (map.link != null) sheet.getRange(insertAt + 1, map.link + 1).setValue(body.link || '')
  if (map.pic != null) sheet.getRange(insertAt + 1, map.pic + 1).setValue(body.pic || '')
  if (map.catatan != null) sheet.getRange(insertAt + 1, map.catatan + 1).setValue(body.catatan || '')

  return { ok: true, row: insertAt + 1 }
}

function deleteTask(body) {
  var sheet = getDivisionSheet(body.division)
  var row = parseInt(body.row, 10)
  if (!row || row < 2) throw new Error('Baris tidak valid.')
  sheet.deleteRow(row)
  return { ok: true }
}

// ---------- AUTENTIKASI ----------

function getAuthSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet()
  return ss.getSheetByName('Auth')
}

/** Baca sheet Auth menjadi { divisiKey: {password, role} } */
function readAuth() {
  var sheet = getAuthSheet()
  if (!sheet) throw new Error('Sheet "Auth" belum dibuat. Jalankan fungsi setupAuthSheet() dulu.')
  var values = sheet.getDataRange().getValues()
  var out = { byDivision: {}, admin: null }
  // baris 0 = header: Divisi | Password | Role
  for (var r = 1; r < values.length; r++) {
    var divisi = String(values[r][0] || '').trim()
    var pass = String(values[r][1] || '').trim()
    var role = String(values[r][2] || '').trim().toLowerCase()
    if (!divisi) continue
    if (role === 'admin' || divisi.toUpperCase() === 'ADMIN') {
      out.admin = { password: pass, division: 'ALL' }
    } else {
      out.byDivision[divisi.toLowerCase()] = { password: pass, role: 'panitia', division: divisi }
    }
  }
  return out
}

function handleLogin(body) {
  var auth = readAuth()
  var division = String(body.division || '').trim()
  var password = String(body.password || '')

  if (division.toUpperCase() === 'ADMIN') {
    if (auth.admin && auth.admin.password === password)
      return { ok: true, role: 'admin', division: 'ALL' }
    return { ok: false, message: 'Password admin salah.' }
  }

  var entry = auth.byDivision[division.toLowerCase()]
  if (!entry) return { ok: false, message: 'Divisi tidak terdaftar di sheet Auth.' }
  if (entry.password !== password) return { ok: false, message: 'Password divisi salah.' }
  return { ok: true, role: 'panitia', division: entry.division }
}

/** Boleh menulis bila password cocok dengan password divisi ATAU password admin */
function authorizeWrite(division, password) {
  var auth = readAuth()
  password = String(password || '')
  if (auth.admin && auth.admin.password === password) return true
  var entry = auth.byDivision[String(division || '').toLowerCase()]
  if (entry && entry.password === password) return true
  return false
}

// ---------- SETUP (jalankan manual sekali) ----------

/**
 * Membuat sheet "Auth" berisi daftar divisi (otomatis terdeteksi) + password default,
 * dan satu baris ADMIN. Aman dijalankan berkali-kali (tidak menimpa yang sudah ada).
 */
function setupAuthSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet()
  var sheet = ss.getSheetByName('Auth')
  if (!sheet) {
    sheet = ss.insertSheet('Auth')
    sheet.appendRow(['Divisi', 'Password', 'Role'])
    sheet.getRange(1, 1, 1, 3).setFontWeight('bold').setBackground('#4f46e5').setFontColor('#ffffff')
    sheet.appendRow(['ADMIN', 'admin123', 'admin'])
  }

  // Kumpulkan divisi yang sudah ada di Auth
  var existing = {}
  var data = sheet.getDataRange().getValues()
  for (var r = 1; r < data.length; r++) {
    var d = String(data[r][0] || '').trim().toLowerCase()
    if (d) existing[d] = true
  }

  // Tambahkan divisi terdeteksi yang belum ada
  var divisions = getAllDivisions()
  for (var i = 0; i < divisions.length; i++) {
    var name = divisions[i].name
    if (existing[name.toLowerCase()]) continue
    var defaultPass = name.toLowerCase().replace(/[^a-z0-9]/g, '') + '123'
    sheet.appendRow([name, defaultPass, 'panitia'])
  }

  sheet.autoResizeColumns(1, 3)
  Logger.log('Sheet Auth siap. Silakan ubah password sesuai kebutuhan.')
  return 'OK — sheet Auth siap. Ubah password di sana bila perlu.'
}

/** Untuk mengetes cepat dari editor: lihat hasil getAllDivisions() di Logs */
function testRead() {
  var divs = getAllDivisions()
  Logger.log('Jumlah divisi terdeteksi: ' + divs.length)
  for (var i = 0; i < divs.length; i++) {
    Logger.log('- ' + divs[i].name + ': ' + divs[i].tasks.length + ' tugas')
  }
}
