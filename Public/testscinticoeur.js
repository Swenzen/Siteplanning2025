const examen = document.getElementById('examen');
const perfusion = document.getElementById('perfusion');
const conclusion = document.getElementById('conclusion');
const crZone = document.getElementById('cr-zone');

function genererCR() {
  let texte = "Scintigraphie myocardique réalisée en mode " + examen.options[examen.selectedIndex].text.toLowerCase() + ".\n";
  texte += "Perfusion : " + perfusion.options[perfusion.selectedIndex].text + ".\n";
  texte += "Conclusion : " + conclusion.options[conclusion.selectedIndex].text + ".";
  crZone.textContent = texte;
}

examen.addEventListener('change', genererCR);
perfusion.addEventListener('change', genererCR);
conclusion.addEventListener('change', genererCR);

// Couleurs de sélection
const couleurs = ["#fa5252", "#fd7e14", "#ffe066", "#51cf66"]; // rouge, orange foncé, jaune, vert
const zones = ["zone1", "zone2", "zone3", "zone4"];
const etats = [0, 0, 0, 0]; // état de chaque zone

zones.forEach((zoneId, idx) => {
  const zone = document.getElementById(zoneId);
  if (zone) {
    zone.style.fill = couleurs[0]; // couleur initiale rouge
    zone.addEventListener("mouseenter", () => {
      zone.style.filter = "brightness(1.3) drop-shadow(0 0 6px #ff0a)";
      zone.style.strokeWidth = "3";
    });
    zone.addEventListener("mouseleave", () => {
      zone.style.filter = "";
      zone.style.strokeWidth = "1.5";
    });
    zone.addEventListener("click", () => {
      etats[idx] = (etats[idx] + 1) % couleurs.length;
      zone.style.fill = couleurs[etats[idx]];
    });
  }
});

genererCR();