

// =======================
// 1. FONCTIONS UTILITAIRES
// =======================

// Regroupe les données pour affichage
function buildLignesEtDates(data) {
  const lignes = {};
  const datesSet = new Set();
  data.forEach(row => {
    const key = `${row.competence_id}||${row.horaire_id}`;
    if (!lignes[key]) {
      lignes[key] = {
        competence: row.competence,
        horaire_debut: row.horaire_debut,
        horaire_fin: row.horaire_fin,
        competence_id: row.competence_id,
        horaire_id: row.horaire_id,
        cells: {}
      };
    }
    lignes[key].cells[row.date] = {
      ouverture: row.ouverture,
      nom: row.nom,
      nom_id: row.nom_id,
      date: row.date
    };
    datesSet.add(row.date);
  });
  return { lignes: Object.values(lignes), dates: Array.from(datesSet).sort() };
}

// Calcule les stats d’un planning
function computeStats(planning) {
  const stats = {};
  planning.forEach((cell) => {
    if (!cell.nom) return;
    if (!stats[cell.nom])
      stats[cell.nom] = { total: 0, IRM: 0, Perso: 0, Matin: 0, ApresMidi: 0 };
    if (cell.competence && cell.competence.toLowerCase().includes("irm"))
      stats[cell.nom].IRM++;
    if (cell.competence && cell.competence.toLowerCase().includes("perso"))
      stats[cell.nom].Perso++;
    if (cell.horaire_debut && cell.horaire_debut.startsWith("08"))
      stats[cell.nom].Matin++;
    if (cell.horaire_debut && cell.horaire_debut.startsWith("12"))
      stats[cell.nom].ApresMidi++;
    stats[cell.nom].total++;
  });
  return stats;
}

// Calcule le score d’équilibre
function computeEquilibreScore(stats) {
  function ecartType(arr) {
    const moy = arr.reduce((a, b) => a + b, 0) / arr.length;
    return Math.sqrt(
      arr.reduce((a, b) => a + Math.pow(b - moy, 2), 0) / arr.length
    );
  }
  const noms = Object.keys(stats);
  if (noms.length === 0) return 99999;
  const irm = noms.map((n) => stats[n].IRM || 0);
  const perso = noms.map((n) => stats[n].Perso || 0);
  const matin = noms.map((n) => stats[n].Matin || 0);
  const apm = noms.map((n) => stats[n].ApresMidi || 0);
  return ecartType(irm) + ecartType(perso) + ecartType(matin) + ecartType(apm);
}

// Affiche le panneau stats
function renderStatsPanel(stats) {
  let html = `<table border="1" style="border-collapse:collapse;"><thead>
    <tr><th>Nom</th><th>IRM</th><th>Perso</th><th>Matin</th><th>Après-midi</th><th>Total</th></tr></thead><tbody>`;
  Object.entries(stats).forEach(([nom, s]) => {
    html += `<tr>
      <td>${nom}</td>
      <td>${s.IRM || 0}</td>
      <td>${s.Perso || 0}</td>
      <td>${s.Matin || 0}</td>
      <td>${s.ApresMidi || 0}</td>
      <td>${s.total || 0}</td>
    </tr>`;
  });
  html += "</tbody></table>";
  document.getElementById("stats-results").innerHTML = html;
}

// Affiche le tableau planning
function renderPlanningSwitchTable(data, dates, switched = []) {
  const { lignes } = buildLignesEtDates(data);

  let html = '<table border="1" style="border-collapse:collapse;"><tr>';
  html += '<th>Compétence</th><th>Horaires</th>';
  dates.forEach(date => html += `<th>${date}</th>`);
  html += '</tr>';

  lignes.forEach(ligne => {
    html += `<tr>
      <td>${ligne.competence}</td>
      <td>${ligne.horaire_debut} - ${ligne.horaire_fin}</td>`;
    dates.forEach(date => {
      const cell = ligne.cells[date];
      let highlight = '';
      if (cell && switched.some(sw =>
        sw.competence_id == ligne.competence_id &&
        sw.horaire_id == ligne.horaire_id &&
        sw.date == date
      )) {
        highlight = ' class="highlight-switch"';
      }
      if (!cell) {
        html += `<td style="background:#eee"></td>`;
      } else if (cell.ouverture == 1) {
        html += `<td${highlight}>${cell.nom ? `<b>${cell.nom}</b>` : ''}</td>`;
      } else {
        html += `<td style="background:#d3d3d3"></td>`;
      }
    });
    html += '</tr>';
  });
  html += '</table>';
  document.getElementById("planning-evolution-content").innerHTML = html;
}

// =======================
// 2. GÉNÉRATION ALÉATOIRE
// =======================

// Génère X plannings aléatoires avec Y mutations chacun
async function generateRandomPlannings(nbPlannings = 20, nbMutations = 1000) {
  const startDate = startDateInput.value;
  const endDate = endDateInput.value;
  const siteId = sessionStorage.getItem("selectedSite");
  if (!startDate || !endDate || !siteId) {
    alert("Sélectionne d'abord un site et une période !");
    return [];
  }
  const planningInitial = await fetchCompetencesWithNames(
    siteId,
    startDate,
    endDate
  );
  const competencesParNom = await fetchCompetencesParNom();

  let plannings = [];
  for (let i = 0; i < nbPlannings; i++) {
    let planning = JSON.parse(JSON.stringify(planningInitial));
    for (let j = 0; j < nbMutations; j++) {
      const res = nextGeneration(planning, competencesParNom);
      planning = res.planning;
    }
    // Ajoute ce log pour voir si les plannings sont différents
    console.log("Planning généré n°" + i, planning.map((c) => c.nom).join(","));
    plannings.push(planning);
  }
  return plannings;
}

// =======================
// 3. CROISEMENT ET MUTATION
// =======================

// Croisement avec points communs figés

function crossoverByExchange(parentA, parentB) {
  // On suppose que parentA et parentB sont des tableaux de cases, même ordre
  const enfant = [];
  const casesParDate = {};

  // 1. Repère les points communs et prépare les cases à échanger
  parentA.forEach((cellA, i) => {
    const cellB = parentB[i];
    const key = cellA.date;
    if (!casesParDate[key]) casesParDate[key] = [];
    // Si tout est identique, on fige
    if (
      cellA.nom === cellB.nom &&
      cellA.nom_id === cellB.nom_id &&
      cellA.competence_id === cellB.competence_id &&
      cellA.horaire_id === cellB.horaire_id &&
      cellA.date === cellB.date
    ) {
      enfant.push({ ...cellA }); // point commun figé
    } else {
      casesParDate[key].push({ idx: i, cellA, cellB });
      enfant.push(null); // à remplir plus tard
    }
  });

  // 2. Pour chaque jour, fait des échanges entre les cases non communes
  Object.values(casesParDate).forEach(cases => {
    // Liste des noms à échanger ce jour
    const nomsA = cases.map(c => c.cellA.nom_id).filter(Boolean);
    const nomsB = cases.map(c => c.cellB.nom_id).filter(Boolean);

    // On mélange les deux listes et on répartit sans doublon
    const nomsDispo = Array.from(new Set([...nomsA, ...nomsB]));
    let used = new Set();

    cases.forEach(c => {
      // On prend un nom qui n'a pas encore été utilisé ce jour
      let nom_id = null, nom = null;
      for (let id of nomsDispo) {
        if (!used.has(id)) {
          // Cherche le nom dans cellA ou cellB
          if (c.cellA.nom_id === id) {
            nom_id = c.cellA.nom_id;
            nom = c.cellA.nom;
          } else if (c.cellB.nom_id === id) {
            nom_id = c.cellB.nom_id;
            nom = c.cellB.nom;
          }
          used.add(id);
          break;
        }
      }
      enfant[c.idx] = {
        ...c.cellA,
        nom,
        nom_id
      };
    });
  });

  // Remplit les cases null (si jamais)
  return enfant.map((cell, i) => cell ? cell : { ...parentA[i], nom: null, nom_id: null });
}

let crossMutatePlannings = [];
let crossMutateStats = [];
let currentCrossIdx = 0;

// Mutation par échange sur une journée (garantie anti-doublon)
function nextGeneration(prevPlanning, competencesParNom) {
  const { lignes, dates } = buildLignesEtDates(prevPlanning);
  const planning = JSON.parse(JSON.stringify(prevPlanning));
  for (let essais = 0; essais < 20; essais++) {
    const date = dates[Math.floor(Math.random() * dates.length)];
    const casesJour = [];
    lignes.forEach(ligne => {
      const cell = ligne.cells[date];
      if (cell && cell.ouverture == 1 && cell.nom_id) {
        casesJour.push({ ...cell, competence_id: ligne.competence_id, horaire_id: ligne.horaire_id });
      }
    });
    if (casesJour.length < 2) continue;
    let idx1 = Math.floor(Math.random() * casesJour.length);
    let idx2;
    do { idx2 = Math.floor(Math.random() * casesJour.length); } while (idx2 === idx1);
    const c1 = casesJour[idx1];
    const c2 = casesJour[idx2];

    // Vérifie la compatibilité croisée sur competence_id
    if (
      competencesParNom[c1.nom_id] && competencesParNom[c1.nom_id].includes(c2.competence_id) &&
      competencesParNom[c2.nom_id] && competencesParNom[c2.nom_id].includes(c1.competence_id)
    ) {
      // Vérifie que c2.nom_id n'est pas déjà affecté à une autre case ce jour-là (hors c1 et c2)
      const doublonC2 = planning.some(l =>
        l.date === date &&
        l.nom_id === c2.nom_id &&
        !(l.competence_id === c1.competence_id && l.horaire_id === c1.horaire_id) &&
        !(l.competence_id === c2.competence_id && l.horaire_id === c2.horaire_id)
      );
      // Vérifie que c1.nom_id n'est pas déjà affecté à une autre case ce jour-là (hors c1 et c2)
      const doublonC1 = planning.some(l =>
        l.date === date &&
        l.nom_id === c1.nom_id &&
        !(l.competence_id === c1.competence_id && l.horaire_id === c1.horaire_id) &&
        !(l.competence_id === c2.competence_id && l.horaire_id === c2.horaire_id)
      );
      if (!doublonC1 && !doublonC2) {
        planning.forEach(l => {
          if (l.competence_id == c1.competence_id && l.horaire_id == c1.horaire_id && l.date == c1.date) {
            l.nom = c2.nom; l.nom_id = c2.nom_id;
          } else if (l.competence_id == c2.competence_id && l.horaire_id == c2.horaire_id && l.date == c2.date) {
            l.nom = c1.nom; l.nom_id = c1.nom_id;
          }
        });
        return { planning, switched: [c1, c2], dates };
      }
    }
  }
  return { planning: prevPlanning, switched: [], dates };
}

// =======================
// 4. NAVIGATION ET AFFICHAGE
// =======================

// Affiche un planning parmi les meilleurs
function showBestPlanning(idx) {
  console.log(
    "Affichage du planning n°",
    idx + 1,
    bestPlannings[idx].map((c) => c.nom).join(",")
  );
  const { lignes, dates } = buildLignesEtDates(bestPlannings[idx]);
  renderPlanningSwitchTable(bestPlannings[idx], dates);
  renderStatsPanel(bestStats[idx]);
  document.getElementById("genLabel").textContent = `Planning ${idx + 1}/10`;
}

// Navigation dans les meilleurs plannings
function setupBestPlanningNav() {
  // Supprime tous les anciens listeners en remplaçant les boutons par des clones
  const nextBtn = document.getElementById("nextGen");
  const prevBtn = document.getElementById("prevGen");
  const newNext = nextBtn.cloneNode(true);
  const newPrev = prevBtn.cloneNode(true);
  nextBtn.parentNode.replaceChild(newNext, nextBtn);
  prevBtn.parentNode.replaceChild(newPrev, prevBtn);

  // Ajoute les nouveaux listeners pour la navigation des 10 meilleurs
  newNext.addEventListener("click", () => {
    if (currentBestIdx < bestPlannings.length - 1) {
      currentBestIdx++;
      showBestPlanning(currentBestIdx);
    }
  });
  newPrev.addEventListener("click", () => {
    if (currentBestIdx > 0) {
      currentBestIdx--;
      showBestPlanning(currentBestIdx);
    }
  });
}

// Affiche un planning croisé/muté
function showCrossMutatePlanning(idx) {
  const { lignes, dates } = buildLignesEtDates(crossMutatePlannings[idx]);
  renderPlanningSwitchTable(crossMutatePlannings[idx], dates);
  renderStatsPanel(crossMutateStats[idx]);
  document.getElementById("genLabel").textContent = `Enfant ${
    idx + 1
  }/10 (Génération ${generationCounter})`;
}

// Navigation dans les plannings croisés/mutés
function setupCrossMutateNav() {
  const nextBtn = document.getElementById("nextGen");
  const prevBtn = document.getElementById("prevGen");
  const newNext = nextBtn.cloneNode(true);
  const newPrev = prevBtn.cloneNode(true);
  nextBtn.parentNode.replaceChild(newNext, nextBtn);
  prevBtn.parentNode.replaceChild(newPrev, prevBtn);

  newNext.addEventListener("click", () => {
    if (currentCrossIdx < crossMutatePlannings.length - 1) {
      currentCrossIdx++;
      showCrossMutatePlanning(currentCrossIdx);
    }
  });
  newPrev.addEventListener("click", () => {
    if (currentCrossIdx > 0) {
      currentCrossIdx--;
      showCrossMutatePlanning(currentCrossIdx);
    }
  });
}

// =======================
// 5. BOUTONS ET INITIALISATION
// =======================

// Lance la génération des meilleurs plannings
async function launchBestPlannings() {
  document.getElementById("stats-results").innerHTML = "Calcul en cours...";
  const plannings = await generateRandomPlannings(20, 1000);
  let statsPlannings = plannings.map((planning) => ({
    planning,
    stats: computeStats(planning),
    score: computeEquilibreScore(computeStats(planning)),
  }));
  statsPlannings.sort((a, b) => a.score - b.score);
  bestPlannings = statsPlannings.slice(0, 10).map((x) => x.planning);
  bestStats = statsPlannings.slice(0, 10).map((x) => x.stats);
  currentBestIdx = 0;
  showBestPlanning(0);
  setupBestPlanningNav();
}

// Lance le croisement/mutation des meilleurs plannings
async function launchCrossMutateCycle() {
  if (bestPlannings.length < 10) {
    alert("Il faut d'abord générer les 10 meilleurs plannings !");
    return;
  }
  document.getElementById("stats-results").innerHTML =
    "Croisement et mutations en cours...";

  const competencesParNom = await fetchCompetencesParNom();
  const pairs = [
    [0, 1],
    [2, 3],
    [4, 5],
    [6, 7],
    [8, 9],
  ];
  let enfants = [];

  for (const [i1, i2] of pairs) {
    let parentA = bestPlannings[i1];
    let parentB = bestPlannings[i2];
    // Pour chaque paire, génère 20 enfants indépendants
    for (let k = 0; k < 20; k++) {
      // 1. Croisement avec points communs figés
      let enfant = crossoverByExchange(parentA, parentB);
      // 2. 3 mutations sur l'enfant
      for (let j = 0; j < 3; j++) {
        const res = nextGeneration(enfant, competencesParNom);
        enfant = res.planning;
      }
      enfants.push(enfant);
    }
  }

  // 3. Pour chaque enfant, calcule les stats et le score
  let statsEnfants = enfants.map((planning) => ({
    planning,
    stats: computeStats(planning),
    score: computeEquilibreScore(computeStats(planning)),
  }));
  statsEnfants.sort((a, b) => a.score - b.score);

  crossMutatePlannings = statsEnfants.slice(0, 10).map((x) => x.planning);
  crossMutateStats = statsEnfants.slice(0, 10).map((x) => x.stats);
  currentCrossIdx = 0;
  showCrossMutatePlanning(0);
  setupCrossMutateNav();
}

// Lance une nouvelle génération à partir des enfants
async function nextEvolutionGeneration() {
  generationCounter++; // Incrémente à chaque nouvelle génération

  // Classe les 50 enfants et garde les 10 meilleurs
  let statsEnfants = crossMutatePlannings.map((planning) => ({
    planning,
    stats: computeStats(planning),
    score: computeEquilibreScore(computeStats(planning)),
  }));
  statsEnfants.sort((a, b) => a.score - b.score);

  // Met à jour bestPlannings avec les 10 meilleurs enfants
  bestPlannings = statsEnfants.slice(0, 10).map((x) => x.planning);
  bestStats = statsEnfants.slice(0, 10).map((x) => x.stats);

  // Relance un cycle de croisement/mutation sur ces nouveaux parents
  await launchCrossMutateCycle();
}

// Ajoute les boutons à la page
window.addEventListener("DOMContentLoaded", () => {
  // ... (reprends ta version actuelle)
});





// 6. ÉVOLUTION SIMPLE (PLANNING SIMULÉ)
// Stockage des générations et de la surbrillance
let generations = [];
let currentGen = 0;
let lastSwitch = null;
let evolutionDates = [];
let evolutionLignes = [];

// Initialise l'évolution simple (planning simulé)
function startSwitchEvolution(planningInitial, competencesParNom) {
  const { lignes, dates } = buildLignesEtDates(planningInitial);
  generations = [JSON.parse(JSON.stringify(planningInitial))];
  currentGen = 0;
  lastSwitch = [];

  // Affichage initial
  renderPlanningSwitchTable(generations[0], dates);

  // Désactive la navigation classique pour éviter le conflit avec les 10 meilleurs
  document.getElementById("nextGen").onclick = () => {};
  document.getElementById("prevGen").onclick = () => {};
}



// 7. Ajoute un bouton pour lancer la génération
window.addEventListener("DOMContentLoaded", () => {
  if (!document.getElementById("btnBestPlannings")) {
    const btn = document.createElement("button");
    btn.id = "btnBestPlannings";
    btn.textContent = "Générer 100 plannings équilibrés";
    btn.onclick = launchBestPlannings;
    document.body.insertBefore(btn, document.getElementById("evolution-nav"));
    setupBestPlanningNav();
  }
  if (!document.getElementById("btnCrossMutate")) {
    const btn = document.createElement("button");
    btn.id = "btnCrossMutate";
    btn.textContent = "Croiser et muter les meilleurs plannings";
    btn.style.marginTop = "16px";
    btn.onclick = launchCrossMutateCycle;
    // Ajoute le bouton sous le tableau d'évolution
    document.getElementById("evolution-visualization").after(btn);
  }
  if (!document.getElementById("btnNextGen")) {
    const btn = document.createElement("button");
    btn.id = "btnNextGen";
    btn.textContent = "Nouvelle génération (croiser/muter les enfants)";
    btn.style.marginTop = "16px";
    btn.onclick = nextEvolutionGeneration;
    document.getElementById("evolution-visualization").after(btn);
  }
});
