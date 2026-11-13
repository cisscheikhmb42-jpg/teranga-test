/**
 * Teranga Test — script Google Apps Script lié à la Google Sheet « Teranga Test ».
 *
 * Ce fichier se copie EN ENTIER dans Extensions > Apps Script, à la place de l'ancien.
 *
 * Ce qu'il fait :
 *  - doPost  : enregistre les formulaires du site (demande, testeur, bug, diagnostic) ;
 *  - doGet   : fournit au site le rapport d'une mission (action=rapport&code=XXX) ;
 *  - menu « Teranga Test » dans la Sheet : crée une mission depuis une demande.
 */

// ───────────── À RÉGLER : l'adresse de ton site, sans « / » à la fin ─────────────
var SITE_URL = 'https://ton-site.vercel.app';

// Noms des onglets et du dossier Drive (ne pas changer sans changer la Sheet).
var ONGLET_DEMANDES = 'Demandes';
var ONGLET_TESTEURS = 'Testeurs';
var ONGLET_MISSIONS = 'Missions';
var ONGLET_BUGS = 'Bugs';
var ONGLET_DIAGNOSTICS = 'Diagnostics';
var DOSSIER_CAPTURES = 'Teranga Test - Captures';

var STATUT_ATTENTE = 'En attente de paiement';
var STATUT_EN_COURS = 'En cours';
var GRAVITES = ['Bloquant', 'Majeur', 'Mineur'];
var TAILLE_MAX_CAPTURE = 3 * 1024 * 1024; // 3 Mo
var TYPES_IMAGE = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

// Lettres et chiffres des codes mission : sans 0/O ni 1/I, pour éviter les confusions.
var ALPHABET_CODE = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

// Position des colonnes (0 = colonne A). Suit l'ordre des colonnes de la Sheet.
var M = { CODE: 0, CREATION: 1, CLIENT: 2, WHATSAPP: 3, APPLICATION: 4, LIEN: 5, TYPE: 6, FORMULE: 7, DEBUT: 8, FIN: 9, STATUT: 10, RESUME: 11 };
var B = { DATE: 0, CODE: 1, NUMERO: 2, TITRE: 3, GRAVITE: 4, ETAPES: 5, ATTENDU: 6, OBTENU: 7, APPAREIL: 8, NAVIGATEUR: 9, CAPTURE: 10, TESTEUR: 11, WHATSAPP: 12, VISIBLE: 13, SUGGESTION: 14 };
var D = { DATE: 0, LIEN: 1, PERFORMANCE: 2, ACCESSIBILITE: 3, BONNES_PRATIQUES: 4, SEO: 5, LCP: 6, WHATSAPP: 7 };

// ═══════════════════════════ Réception des formulaires ═══════════════════════════

function doPost(e) {
  try {
    var donnees = JSON.parse(e.postData.contents);

    // Anti-spam : ce champ est invisible sur le site. S'il est rempli, c'est un robot.
    if (donnees.website) return repondre({ ok: true });

    switch (donnees.type) {
      case 'demande':
        return repondre(enregistrerDemande(donnees));
      case 'testeur':
        return repondre(enregistrerTesteur(donnees));
      case 'bug':
        return repondre(enregistrerBug(donnees));
      case 'diagnostic':
        return repondre(enregistrerDiagnostic(donnees));
      default:
        return repondre({ ok: false, error: 'Type de formulaire inconnu.' });
    }
  } catch (erreur) {
    return repondre({ ok: false, error: String(erreur && erreur.message ? erreur.message : erreur) });
  }
}

function enregistrerDemande(d) {
  onglet(ONGLET_DEMANDES).appendRow([
    new Date(),
    cellule(d.nom),
    cellule(d.application),
    cellule(d.lien),
    cellule(d.typeApp),
    cellule(d.formule),
    cellule(d.whatsapp),
    cellule(d.email),
    cellule(d.message),
    'Nouveau',
  ]);
  return { ok: true };
}

function enregistrerTesteur(d) {
  onglet(ONGLET_TESTEURS).appendRow([
    new Date(),
    cellule(d.nom),
    cellule(d.ville),
    cellule(d.telephone),
    cellule(d.android),
    cellule(d.whatsapp),
    cellule(d.disponibilite),
    'Nouveau',
  ]);
  return { ok: true };
}

function enregistrerBug(d) {
  var code = normaliserCode(d.code);
  if (!code) return { ok: false, error: 'Le code mission est vide.' };
  if (!texte(d.titre)) return { ok: false, error: 'Le titre du bug est vide.' };
  if (GRAVITES.indexOf(d.gravite) === -1) {
    return { ok: false, error: 'La gravité doit être Bloquant, Majeur ou Mineur.' };
  }

  var mission = trouverMission(code);
  if (!mission) {
    return { ok: false, error: 'Le code mission « ' + code + ' » n\'existe pas. Vérifiez le code reçu sur WhatsApp.' };
  }
  var statut = texte(mission[M.STATUT]);
  if (statut !== STATUT_EN_COURS) {
    return {
      ok: false,
      error: 'La mission « ' + code + ' » n\'est pas en cours (statut actuel : ' + (statut || 'aucun') + '). Les bugs ne peuvent être signalés que pendant la mission.',
    };
  }

  // Les étapes arrivent en liste : une étape par ligne dans la cellule.
  var etapes = d.etapes instanceof Array ? d.etapes : String(d.etapes || '').split('\n');
  etapes = etapes.map(texte).filter(function (x) { return x !== ''; }).join('\n');

  // Verrou : si deux testeurs envoient en même temps, chacun reçoit un numéro différent.
  var verrou = LockService.getScriptLock();
  verrou.waitLock(25000);
  try {
    var feuille = onglet(ONGLET_BUGS);
    var numero = prochainNumero(feuille, code);
    var lienCapture = d.capture ? enregistrerCapture(d.capture, d.captureType, code, numero) : '';

    feuille.appendRow([
      new Date(),
      code,
      numero,
      cellule(d.titre),
      d.gravite,
      cellule(etapes),
      cellule(d.attendu),
      cellule(d.obtenu),
      cellule(d.appareil),
      cellule(d.navigateur),
      lienCapture,
      cellule(d.nom),
      cellule(d.whatsapp),
      'Non',
      '',
    ]);
    return { ok: true, numero: numero };
  } finally {
    verrou.releaseLock();
  }
}

function enregistrerDiagnostic(d) {
  onglet(ONGLET_DIAGNOSTICS).appendRow([
    new Date(),
    cellule(d.lien),
    nombre(d.performance),
    nombre(d.accessibilite),
    nombre(d.bonnesPratiques),
    nombre(d.seo),
    nombre(d.lcp),
    cellule(d.whatsapp),
  ]);
  return { ok: true };
}

/** Numéro du prochain bug de la mission : 1, 2, 3… */
function prochainNumero(feuille, code) {
  var lignes = feuille.getDataRange().getValues();
  var max = 0;
  for (var i = 1; i < lignes.length; i++) {
    if (normaliserCode(lignes[i][B.CODE]) === code) {
      var n = Number(lignes[i][B.NUMERO]) || 0;
      if (n > max) max = n;
    }
  }
  return max + 1;
}

/** Enregistre l'image dans Drive, la rend visible par lien, et renvoie ce lien. */
function enregistrerCapture(base64, type, code, numero) {
  var extension = TYPES_IMAGE[type];
  if (!extension) throw new Error('La capture doit être une image JPEG, PNG ou WebP.');

  var octets = Utilities.base64Decode(String(base64));
  if (octets.length > TAILLE_MAX_CAPTURE) throw new Error('La capture dépasse 3 Mo.');

  var nom = code + '-bug-' + numero + '.' + extension;
  var fichier = dossierCaptures().createFile(Utilities.newBlob(octets, type, nom));
  fichier.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return fichier.getUrl();
}

function dossierCaptures() {
  var dossiers = DriveApp.getFoldersByName(DOSSIER_CAPTURES);
  return dossiers.hasNext() ? dossiers.next() : DriveApp.createFolder(DOSSIER_CAPTURES);
}

// ═══════════════════════════ Lecture du rapport par le site ═══════════════════════════

function doGet(e) {
  try {
    var p = (e && e.parameter) || {};
    if (p.action === 'rapport') return repondre(lireRapport(p.code));
    if (p.action === 'capture') return repondre(lireCapture(p.code, p.numero));
    return repondre({ ok: true, message: 'Teranga Test fonctionne' });
  } catch (erreur) {
    return repondre({ ok: false, error: String(erreur && erreur.message ? erreur.message : erreur) });
  }
}

/** Renvoie la mission demandée (sans numéros WhatsApp) et ses bugs « Visible client = Oui ». */
function lireRapport(codeDemande) {
  var code = normaliserCode(codeDemande);
  var mission = code ? trouverMission(code) : null;
  if (!mission) return { ok: false, introuvable: true, error: 'Rapport introuvable.' };

  var bugs = bugsVisibles(code).map(function (l) {
    return {
      numero: Number(l[B.NUMERO]) || 0,
      titre: texte(l[B.TITRE]),
      gravite: texte(l[B.GRAVITE]),
      etapes: texte(l[B.ETAPES]),
      attendu: texte(l[B.ATTENDU]),
      obtenu: texte(l[B.OBTENU]),
      appareil: texte(l[B.APPAREIL]),
      navigateur: texte(l[B.NAVIGATEUR]),
      // Le site n'a pas besoin du lien Drive : il sait seulement qu'une capture existe.
      capture: texte(l[B.CAPTURE]) !== '',
      suggestion: texte(l[B.SUGGESTION]),
    };
  });

  return {
    ok: true,
    mission: {
      code: code,
      application: texte(mission[M.APPLICATION]),
      lien: texte(mission[M.LIEN]),
      type: texte(mission[M.TYPE]),
      formule: texte(mission[M.FORMULE]),
      debut: dateLisible(mission[M.DEBUT]),
      fin: dateLisible(mission[M.FIN]),
      statut: texte(mission[M.STATUT]),
      resume: texte(mission[M.RESUME]),
    },
    bugs: bugs,
    diagnostic: dernierDiagnostic(mission[M.LIEN]),
  };
}

/** Renvoie l'image d'un bug visible par le client, pour que le site l'affiche lui-même. */
function lireCapture(codeDemande, numeroDemande) {
  var code = normaliserCode(codeDemande);
  var numero = Number(numeroDemande);
  var lignes = code && trouverMission(code) ? bugsVisibles(code) : [];
  for (var i = 0; i < lignes.length; i++) {
    if (Number(lignes[i][B.NUMERO]) !== numero) continue;
    var id = String(lignes[i][B.CAPTURE]).match(/[-\w]{25,}/);
    if (!id) break;
    var blob = DriveApp.getFileById(id[0]).getBlob();
    return { ok: true, type: blob.getContentType(), data: Utilities.base64Encode(blob.getBytes()) };
  }
  return { ok: false, introuvable: true, error: 'Capture introuvable.' };
}

function bugsVisibles(code) {
  var lignes = onglet(ONGLET_BUGS).getDataRange().getValues();
  var resultat = [];
  for (var i = 1; i < lignes.length; i++) {
    if (normaliserCode(lignes[i][B.CODE]) !== code) continue;
    if (texte(lignes[i][B.VISIBLE]).toLowerCase() !== 'oui') continue;
    resultat.push(lignes[i]);
  }
  return resultat;
}

/** Dernier pré-diagnostic enregistré pour ce lien, ou null. */
function dernierDiagnostic(lien) {
  var cle = cleLien(lien);
  if (!cle) return null;
  var lignes = onglet(ONGLET_DIAGNOSTICS).getDataRange().getValues();
  for (var i = lignes.length - 1; i >= 1; i--) {
    if (cleLien(lignes[i][D.LIEN]) !== cle) continue;
    return {
      date: dateLisible(lignes[i][D.DATE]),
      performance: nombre(lignes[i][D.PERFORMANCE]),
      accessibilite: nombre(lignes[i][D.ACCESSIBILITE]),
      bonnesPratiques: nombre(lignes[i][D.BONNES_PRATIQUES]),
      seo: nombre(lignes[i][D.SEO]),
      lcp: nombre(lignes[i][D.LCP]),
    };
  }
  return null;
}

// ═══════════════════════════ Menu dans la Google Sheet ═══════════════════════════

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Teranga Test')
    .addItem('Créer une mission depuis la demande sélectionnée', 'creerMissionDepuisDemande')
    .addToUi();
}

function creerMissionDepuisDemande() {
  var ui = SpreadsheetApp.getUi();
  var feuille = SpreadsheetApp.getActiveSheet();
  var ligne = feuille.getActiveRange().getRow();

  if (feuille.getName() !== ONGLET_DEMANDES || ligne < 2 || ligne > feuille.getLastRow()) {
    ui.alert('Sélectionne d\'abord une ligne dans l\'onglet « Demandes » (cliquer sur une cellule de la demande suffit).');
    return;
  }

  // Colonnes de Demandes : Date | Nom complet | Application | Lien | Type | Formule | WhatsApp | …
  var demande = feuille.getRange(ligne, 1, 1, 7).getValues()[0];
  if (!texte(demande[1]) && !texte(demande[2])) {
    ui.alert('Cette ligne est vide.');
    return;
  }

  var code = nouveauCode();
  onglet(ONGLET_MISSIONS).appendRow([
    code,
    new Date(),
    cellule(demande[1]), // Client
    cellule(demande[6]), // WhatsApp client
    cellule(demande[2]), // Application
    cellule(demande[3]), // Lien
    cellule(demande[4]), // Type
    cellule(demande[5]), // Formule
    '', // Date de début
    '', // Date de fin
    STATUT_ATTENTE,
    '', // Résumé pour le client
  ]);

  var lienRapport = SITE_URL + '/rapport/' + code;
  var lienTesteurs = SITE_URL + '/signaler?code=' + code;
  var html =
    '<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.5">' +
    '<p>Mission créée pour <b>' + echapper(texte(demande[2])) + '</b>, avec le statut « ' + STATUT_ATTENTE + ' ».</p>' +
    '<p style="margin-bottom:4px"><b>Lien du rapport, à envoyer au client :</b></p>' +
    '<input readonly onclick="this.select()" style="width:100%;padding:8px;font-size:14px" value="' + echapper(lienRapport) + '">' +
    '<p style="margin-bottom:4px"><b>Lien pour les testeurs</b> (code ' + code + ') :</p>' +
    '<input readonly onclick="this.select()" style="width:100%;padding:8px;font-size:14px" value="' + echapper(lienTesteurs) + '">' +
    '<p>Quand le client a payé, mets le statut « ' + STATUT_EN_COURS + ' » dans l\'onglet Missions : les testeurs pourront alors signaler des bugs.</p>' +
    '</div>';
  ui.showModalDialog(HtmlService.createHtmlOutput(html).setWidth(480).setHeight(330), 'Mission ' + code);
}

/** Code aléatoire de 8 caractères, jamais déjà utilisé. */
function nouveauCode() {
  for (var essai = 0; essai < 50; essai++) {
    var code = '';
    for (var i = 0; i < 8; i++) {
      code += ALPHABET_CODE.charAt(Math.floor(Math.random() * ALPHABET_CODE.length));
    }
    if (!trouverMission(code)) return code;
  }
  throw new Error('Impossible de créer un code mission. Réessaie.');
}

/**
 * À lancer UNE FOIS à la main après avoir collé le script (bouton « Exécuter ») :
 * Google affiche alors la fenêtre d'autorisation pour la Sheet et pour Drive.
 */
function autoriser() {
  onglet(ONGLET_BUGS);
  dossierCaptures();
  Logger.log('Autorisations accordées. Le dossier « ' + DOSSIER_CAPTURES + ' » est prêt dans ton Drive.');
}

// ═══════════════════════════ Petits outils ═══════════════════════════

function onglet(nom) {
  var feuille = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(nom);
  if (!feuille) throw new Error('L\'onglet « ' + nom + ' » est introuvable dans la Google Sheet.');
  return feuille;
}

/** Ligne de la mission (tableau de cellules), ou null si le code n'existe pas. */
function trouverMission(code) {
  var lignes = onglet(ONGLET_MISSIONS).getDataRange().getValues();
  for (var i = 1; i < lignes.length; i++) {
    if (normaliserCode(lignes[i][M.CODE]) === code) return lignes[i];
  }
  return null;
}

function normaliserCode(code) {
  return String(code == null ? '' : code).replace(/\s+/g, '').toUpperCase();
}

function texte(valeur) {
  return String(valeur == null ? '' : valeur).trim();
}

/**
 * Prépare un texte pour une cellule. Un texte qui commence par = + - ou @ serait
 * lu comme une formule par Google Sheets : l'apostrophe le force à rester du texte
 * (elle n'apparaît pas dans la cellule, et « +221… » garde son « + »).
 */
function cellule(valeur) {
  var t = texte(valeur).slice(0, 5000);
  return /^[=+\-@]/.test(t) ? "'" + t : t;
}

function nombre(valeur) {
  var n = Number(String(valeur == null ? '' : valeur).replace(',', '.'));
  return valeur === '' || valeur == null || isNaN(n) ? '' : n;
}

function dateLisible(valeur) {
  if (valeur instanceof Date) {
    return Utilities.formatDate(valeur, SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone(), 'dd/MM/yyyy');
  }
  return texte(valeur);
}

/** Forme simplifiée d'une adresse, pour comparer deux liens écrits différemment. */
function cleLien(lien) {
  return texte(lien)
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/[?#].*$/, '')
    .replace(/\/+$/, '');
}

function echapper(t) {
  return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function repondre(objet) {
  return ContentService.createTextOutput(JSON.stringify(objet)).setMimeType(ContentService.MimeType.JSON);
}
