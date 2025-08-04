
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

    // Génère un CR par défaut au chargement
    genererCR();