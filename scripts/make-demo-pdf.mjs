// Génère public/releve-demo.pdf — un relevé de portefeuille fictif « Banque du Léman »
// utilisé pour démontrer l'extraction IA en cours. Usage : node scripts/make-demo-pdf.mjs

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { writeFileSync, mkdirSync } from "node:fs";

const POSITIONS = [
  // [nom, ticker, classe, quantité, prix, devise, valeur CHF]
  ["Nestlé SA", "NESN.SW", "Action", "1'450", "82.50", "CHF", "119'625.00"],
  ["Roche Holding AG (bon de jouissance)", "ROG.SW", "Action", "180", "265.40", "CHF", "47'772.00"],
  ["Zurich Insurance Group AG", "ZURN.SW", "Action", "95", "512.00", "CHF", "48'640.00"],
  ["Apple Inc.", "AAPL.US", "Action", "150", "308.60", "USD", "41'200.00"],
  ["Alphabet Inc. Class A", "GOOGL.US", "Action", "120", "195.30", "USD", "20'850.00"],
  ["LVMH Moët Hennessy", "MC.PA", "Action", "45", "612.00", "EUR", "25'700.00"],
  ["iShares Core MSCI World ETF", "SWDA.SW", "ETF", "620", "98.40", "CHF", "61'008.00"],
  ["UBS ETF SBI Domestic Gov 7-15", "SBI715.SW", "ETF obligataire", "350", "68.20", "CHF", "23'870.00"],
  ["ZKB Gold ETF (CHF)", "ZGLD.SW", "Métaux précieux", "42", "780.00", "CHF", "32'760.00"],
  ["Compte courant CHF", "", "Liquidités", "—", "—", "CHF", "54'300.00"],
  ["Compte courant EUR", "", "Liquidités", "—", "—", "EUR", "12'400.00"],
];

const doc = await PDFDocument.create();
const page = doc.addPage([595, 842]); // A4
const font = await doc.embedFont(StandardFonts.Helvetica);
const bold = await doc.embedFont(StandardFonts.HelveticaBold);

const ink = rgb(0.12, 0.13, 0.15);
const gray = rgb(0.45, 0.45, 0.45);

let y = 790;
const draw = (text, x, size = 9, f = font, color = ink) =>
  page.drawText(String(text), { x, y, size, font: f, color });

draw("BANQUE DU LÉMAN", 50, 16, bold);
y -= 16;
draw("Relevé de portefeuille — document fictif à usage pédagogique", 50, 9, font, gray);
y -= 28;
draw("Titulaire : M. Jean Dupont", 50, 10, bold);
y -= 14;
draw("Portefeuille n° 748.302-01 · Devise de référence : CHF", 50, 9, font, gray);
y -= 14;
draw("Date d'évaluation : 30.06.2026", 50, 9, font, gray);
y -= 30;

// En-têtes du tableau
const cols = [50, 240, 320, 380, 430, 470, 510];
["Désignation", "Ticker", "Classe", "Quantité", "Prix", "Dev.", "Valeur CHF"].forEach(
  (h, i) => draw(h, cols[i], 8, bold, gray)
);
y -= 6;
page.drawLine({
  start: { x: 50, y },
  end: { x: 545, y },
  thickness: 0.7,
  color: gray,
});
y -= 14;

for (const row of POSITIONS) {
  const [name, ticker, cls, qty, price, ccy, value] = row;
  draw(name.length > 38 ? name.slice(0, 37) + "…" : name, cols[0], 8.5);
  draw(ticker, cols[1], 8.5);
  draw(cls, cols[2], 8.5);
  draw(qty, cols[3], 8.5);
  draw(price, cols[4], 8.5);
  draw(ccy, cols[5], 8.5);
  draw(value, cols[6], 8.5);
  y -= 16;
}

y -= 4;
page.drawLine({
  start: { x: 50, y },
  end: { x: 545, y },
  thickness: 0.7,
  color: gray,
});
y -= 16;
draw("Valeur totale du portefeuille", cols[0], 9, bold);
draw("488'125.00 CHF", cols[6] - 18, 9, bold);
y -= 40;
draw(
  "Les contre-valeurs en CHF des positions en devises sont calculées au cours de clôture du 30.06.2026.",
  50, 7.5, font, gray
);
y -= 12;
draw(
  "Document généré automatiquement — ne constitue pas un relevé bancaire réel.",
  50, 7.5, font, gray
);

mkdirSync("public", { recursive: true });
writeFileSync("public/releve-demo.pdf", await doc.save());
console.log("public/releve-demo.pdf généré.");
