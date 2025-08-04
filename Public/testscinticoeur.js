const examen = document.getElementById('examen');
const perfusion = document.getElementById('perfusion');
const conclusion = document.getElementById('conclusion');
const crZone = document.getElementById('cr-zone');
const svg = document.getElementById('myocard-svg');
const couleurs = ["#fa5252", "#fd7e14", "#ffe066", "#51cf66"]; // rouge, orange foncé, jaune, vert
const nRings = 4;
const nSectors = 4;
const center = 160;
const radii = [40, 80, 120, 150, 160]; // 4 anneaux

let etats = [];

function polarToCartesian(cx, cy, r, angle) {
  const rad = (angle-90) * Math.PI / 180.0;
  return {
    x: cx + (r * Math.cos(rad)),
    y: cy + (r * Math.sin(rad))
  };
}

function describeArc(cx, cy, r1, r2, startAngle, endAngle) {
  const start1 = polarToCartesian(cx, cy, r1, endAngle);
  const end1 = polarToCartesian(cx, cy, r1, startAngle);
  const start2 = polarToCartesian(cx, cy, r2, endAngle);
  const end2 = polarToCartesian(cx, cy, r2, startAngle);

  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return [
    "M", start1.x, start1.y,
    "A", r1, r1, 0, largeArcFlag, 0, end1.x, end1.y,
    "L", end2.x, end2.y,
    "A", r2, r2, 0, largeArcFlag, 1, start2.x, start2.y,
    "Z"
  ].join(" ");
}

// Génère les zones
let zoneIdx = 0;
for (let ring = 0; ring < nRings; ring++) {
  for (let sector = 0; sector < nSectors; sector++) {
    const startAngle = sector * (360 / nSectors);
    const endAngle = (sector + 1) * (360 / nSectors);
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", describeArc(center, center, radii[ring], radii[ring+1], startAngle, endAngle));
    path.setAttribute("fill", couleurs[0]);
    path.setAttribute("stroke", "#222");
    path.setAttribute("stroke-width", "1.5");
    path.style.cursor = "pointer";
    path.dataset.idx = zoneIdx;
    svg.appendChild(path);

    // Etat initial
    etats[zoneIdx] = 0;
    path.setAttribute("fill", couleurs[etats[zoneIdx]]);

    // Capture l'index pour chaque closure
    let idx = zoneIdx;

    // Interactivité
    path.addEventListener("mouseenter", () => {
      path.style.filter = "brightness(1.3) drop-shadow(0 0 6px #ff0a)";
      path.setAttribute("stroke-width", "3");
    });
    path.addEventListener("mouseleave", () => {
      path.style.filter = "";
      path.setAttribute("stroke-width", "1.5");
    });
    path.addEventListener("click", () => {
      etats[idx] = (etats[idx] + 1) % couleurs.length;
      path.setAttribute("fill", couleurs[etats[idx]]);
    });
    path.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      etats[idx] = (etats[idx] - 1 + couleurs.length) % couleurs.length;
      path.setAttribute("fill", couleurs[etats[idx]]);
    });

    zoneIdx++;
  }
}

// Optionnel : cercle central (zone 17)
const centerCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
centerCircle.setAttribute("cx", center);
centerCircle.setAttribute("cy", center);
centerCircle.setAttribute("r", radii[0] - 5);
centerCircle.setAttribute("fill", couleurs[0]);
centerCircle.setAttribute("stroke", "#222");
centerCircle.setAttribute("stroke-width", "1.5");
centerCircle.style.cursor = "pointer";
svg.appendChild(centerCircle);

etats[zoneIdx] = 0;
centerCircle.addEventListener("mouseenter", () => {
  centerCircle.style.filter = "brightness(1.3) drop-shadow(0 0 6px #ff0a)";
  centerCircle.setAttribute("stroke-width", "3");
});
centerCircle.addEventListener("mouseleave", () => {
  centerCircle.style.filter = "";
  centerCircle.setAttribute("stroke-width", "1.5");
});
centerCircle.addEventListener("click", () => {
  etats[zoneIdx] = (etats[zoneIdx] + 1) % couleurs.length;
  centerCircle.setAttribute("fill", couleurs[etats[zoneIdx]]);
});
centerCircle.addEventListener("contextmenu", (e) => {
  e.preventDefault();
  etats[zoneIdx] = (etats[zoneIdx] - 1 + couleurs.length) % couleurs.length;
  centerCircle.setAttribute("fill", couleurs[etats[zoneIdx]]);
});

function genererCR() {
  let texte = "Scintigraphie myocardique réalisée en mode " + examen.options[examen.selectedIndex].text.toLowerCase() + ".\n";
  texte += "Perfusion : " + perfusion.options[perfusion.selectedIndex].text + ".\n";
  texte += "Conclusion : " + conclusion.options[conclusion.selectedIndex].text + ".";
  crZone.textContent = texte;
}

examen.addEventListener('change', genererCR);
perfusion.addEventListener('change', genererCR);
conclusion.addEventListener('change', genererCR);

genererCR();

const btnCopier = document.getElementById('btn-copier-cr');
const copieOk = document.getElementById('copie-ok');

// Masquer le message à l'initialisation
if (copieOk) copieOk.classList.remove("visible");

btnCopier.addEventListener('click', () => {
  navigator.clipboard.writeText(crZone.textContent)
    .then(() => {
      copieOk.classList.add("visible");
      setTimeout(() => copieOk.classList.remove("visible"), 1200);
    });
});