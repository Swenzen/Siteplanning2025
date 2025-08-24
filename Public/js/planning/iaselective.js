let generations = [];
let currentGen = 0;
let lastSwitch = null;
let evolutionDates = [];
let evolutionLignes = [];
let planningData = [];
let nomsDisponiblesParCellule = {};
const siteId = sessionStorage.getItem("selectedSite");
let groupesCache = {};
let _exclusionsSet = new Set();

async function loadExclusionsSet() {
  try {
    const site_id = sessionStorage.getItem('selectedSite');
    const token = localStorage.getItem('token');
    if (!site_id || !token) return;
    const res = await fetch(`/api/exclusions-competence-nom?site_id=${site_id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return;
    const rows = await res.json();
    _exclusionsSet = new Set((rows || []).filter(r => r.excluded).map(r => `${r.nom_id}|${r.competence_id}|${r.horaire_id}`));
  } catch {}
}

window.addEventListener("DOMContentLoaded", () => {
  // Précharger les exclusions pour les algos (auto-fill, croisement, mutation)
  loadExclusionsSet();
  // Crée un conteneur pour les boutons si pas déjà présent
  let actionsDiv = document.getElementById("planning-actions");
  if (!actionsDiv) {
    actionsDiv = document.createElement("div");
    actionsDiv.id = "planning-actions";
    actionsDiv.classList.add("actions-container");
    // Place le conteneur juste avant le tableau d'évolution
    const evoVisu = document.getElementById("evolution-visualization");
    evoVisu.parentNode.insertBefore(actionsDiv, evoVisu);
  }

  // 1 - Appliquer les roulements
  if (!document.getElementById("btnApplyRoulements")) {
    const btn = document.createElement("button");
    btn.id = "btnApplyRoulements";
    btn.textContent = "1 - Appliquer les roulements";
    btn.classList.add("action-btn");
    btn.onclick = function() {
      appliquerRoulementsDansPlanningAuto();
    };
    actionsDiv.appendChild(btn);
  }

  // 2 - Remplir automatiquement le planning
  if (!document.getElementById("auto-fill-btn")) {
    const btn = document.createElement("button");
    btn.id = "auto-fill-btn";
    btn.textContent = "2 - Remplir automatiquement le planning";
    btn.classList.add("action-btn");
    btn.onclick = async function() {
      if (!planningData || planningData.length === 0) {
        alert("Aucune donnée de planning à remplir !");
        return;
      }
      await autoFillPlanningSimulatedTable(planningData);
    };
    actionsDiv.appendChild(btn);
  }

  // 3 - Générer 100 plannings équilibrés
  if (!document.getElementById("btnBestPlannings")) {
    const btn = document.createElement("button");
    btn.id = "btnBestPlannings";
    btn.textContent = "3 - Générer 100 plannings équilibrés";
    btn.classList.add("action-btn");
    btn.onclick = launchBestPlannings;
    actionsDiv.appendChild(btn);
  }

  // 4 - 100 générations (remplace le bouton croiser/muter)
  if (!document.getElementById("btnNextGen100")) {
    const btn = document.createElement("button");
    btn.id = "btnNextGen100";
    btn.textContent = "4 - 100 générations";
    btn.classList.add("action-btn");
    btn.onclick = next100Generations;
    actionsDiv.appendChild(btn);
  }

  // 5 - Appliquer ce planning
  if (!document.getElementById("btnApplySimuPlanning")) {
    const btn = document.createElement("button");
    btn.id = "btnApplySimuPlanning";
    btn.textContent = "5 - Appliquer ce planning";
    btn.classList.add("action-btn");
    btn.onclick = async function() {
      let toApply = planningData;
      if (typeof currentBestIdx !== "undefined" && bestPlannings && bestPlannings.length > 0) {
        const genLabel = document.getElementById("genLabel");
        if (genLabel && genLabel.textContent.startsWith("Planning")) {
          toApply = bestPlannings[currentBestIdx];
        }
      }
      if (typeof currentCrossIdx !== "undefined" && crossMutatePlannings && crossMutatePlannings.length > 0) {
        const genLabel = document.getElementById("genLabel");
        if (genLabel && genLabel.textContent.startsWith("Enfant")) {
          toApply = crossMutatePlannings[currentCrossIdx];
        }
      }
      if (!toApply || toApply.length === 0) {
        alert("Aucun planning simulé à appliquer !");
        return;
      }
      if (!confirm("Voulez-vous vraiment appliquer ce planning ? Cela va écraser les affectations existantes pour cette période.")) return;
      await applySimuPlanningToDB(toApply);
    };
    actionsDiv.appendChild(btn);
  }

  // Place la navigation juste sous les boutons
  const nav = document.getElementById("evolution-nav");
  if (nav) {
    actionsDiv.parentNode.insertBefore(nav, actionsDiv.nextSibling);
  }

  // Barre de progression
  if (!document.getElementById("progressBarContainer")) {
    const container = document.createElement("div");
    container.id = "progressBarContainer";
    container.classList.add("progress-bar-container");
    const bar = document.createElement("div");
    bar.id = "progressBar";
    bar.classList.add("progress-bar");
    const prog = document.createElement("progress");
    prog.id = "progressProcess";
    prog.max = 100; prog.value = 0;
    prog.classList.add("native-progress");
    container.appendChild(bar);
    container.appendChild(prog);
    document.body.insertBefore(container, document.getElementById("evolution-nav"));
  }
});

// Remplissage automatique du planning simulé (pas de BDD)
async function autoFillPlanningSimulatedTable(planningData) {
  const site_id = sessionStorage.getItem("selectedSite");
  ensureProgressUI();
  // Prépare la barre de progression pour l'opération de remplissage auto
  const progressBarContainer = document.getElementById("progressBarContainer");
  const progressBar = document.getElementById("progressBar");
  const progressProcess = document.getElementById("progressProcess");
  if (progressBarContainer) progressBarContainer.classList.add('show');
  if (progressBar) progressBar.style.width = "0%";
  if (progressProcess) progressProcess.value = 0;
  let planning = planningData.map(cell => ({
    ...cell,
    site_id,
    locked: cell.locked === true,
    nom: cell.locked === true ? cell.nom : null,
    nom_id: cell.locked === true ? cell.nom_id : null,
    commentaires: cell.commentaires || [],
    commentaire: cell.commentaire || null
  }));

  // Regroupe les cases par date
  const casesParDate = {};
  planning.forEach(cell => {
    if (
      cell.ouverture == 1 &&
      !cell.nom &&
      !cell.locked &&
      cell.repos !== 1
    ) {
      if (!casesParDate[cell.date]) casesParDate[cell.date] = [];
      casesParDate[cell.date].push(cell);
    }
  });

  // Charger les exclusions une fois
  await loadExclusionsSet();

  // Pour chaque date, tente de remplir toutes les cases ouvertes de la journée
  const datesList = Object.keys(casesParDate);
  const totalDates = datesList.length || 1;
  let idxDate = 0;
  for (const date of datesList) {
    let essais = 0;
    let rempli = false;
    let backup = JSON.parse(JSON.stringify(planning)); // Pour restaurer si échec

    while (essais < 20 && !rempli) {
      essais++;
      // On travaille sur une copie temporaire du planning pour ce jour
      let tempPlanning = JSON.parse(JSON.stringify(planning));
      const cases = tempPlanning.filter(cell =>
        cell.date === date &&
        cell.ouverture == 1 &&
        !cell.nom &&
        !cell.locked &&
        cell.repos !== 1
      );

      const personnesPossiblesParCase = await Promise.all(cases.map(async cell => {
        const nomsDispoRaw = await fetchAvailableNames(cell.competence_id, siteId, cell.date, cell.horaire_id);
        const nomsDispo = Array.isArray(nomsDispoRaw)
          ? nomsDispoRaw.filter(n => !_exclusionsSet.has(`${n.nom_id}|${cell.competence_id}|${cell.horaire_id}`))
          : [];
        return { cell, nomsDispo };
      }));

      personnesPossiblesParCase.sort((a, b) => a.nomsDispo.length - b.nomsDispo.length);

      const personnesUtilisees = new Set(
        tempPlanning.filter(c => c.date === date && c.nom_id).map(c => c.nom_id)
      );

      for (const { cell, nomsDispo } of personnesPossiblesParCase) {
        const nomsFiltres = nomsDispo.filter(nom => !personnesUtilisees.has(nom.nom_id));
        if (nomsFiltres.length) {
          const choisi = nomsFiltres[Math.floor(Math.random() * nomsFiltres.length)];
          cell.nom = choisi.nom;
          cell.nom_id = choisi.nom_id;
          cell.locked = false;
          personnesUtilisees.add(choisi.nom_id);
        }
      }

      // Vérifie si toutes les cases ouvertes de la journée sont remplies
      const casesVides = tempPlanning.filter(cell =>
        cell.date === date &&
        cell.ouverture == 1 &&
        !cell.nom &&
        !cell.locked &&
        cell.repos !== 1
      ).length;

      if (casesVides === 0) {
        // On reporte les affectations de la journée sur le planning principal
        planning.forEach((cell, idx) => {
          if (cell.date === date) {
            cell.nom = tempPlanning[idx].nom;
            cell.nom_id = tempPlanning[idx].nom_id;
            cell.locked = tempPlanning[idx].locked;
          }
        });
        rempli = true;
      }
    }
    // Si après 20 essais la journée n'est pas remplie, on laisse les cases vides

    // Mise à jour de la barre de progression par date traitée
    idxDate++;
  const pct = Math.min(100, Math.round((idxDate / totalDates) * 100));
  if (progressBar) progressBar.style.width = pct + "%";
  if (progressProcess) progressProcess.value = pct;
    // Laisse un petit temps au navigateur pour peindre (optionnel)
    await new Promise(r => setTimeout(r, 0));
  }

  renderPlanningRemplissageTable(planning);
  // Cache la barre à la fin
  if (progressBarContainer) setTimeout(() => { progressBarContainer.classList.remove('show'); }, 400);
  return planning;
}

// Affiche le tableau du planning simulé (ne touche pas la BDD)
function renderPlanningRemplissageTable(data) {
  planningData = data;
  // Regroupe les compétences et horaires
  const lignes = {};
  const datesSet = new Set();
  data.forEach(row => {
    const key = `${row.competence}||${row.horaire_debut}||${row.horaire_fin}||${row.competence_id}||${row.horaire_id}`;
    if (!lignes[key]) {
      lignes[key] = {
        competence: row.competence,
        horaire_debut: row.horaire_debut,
        horaire_fin: row.horaire_fin,
        competence_id: row.competence_id,
        horaire_id: row.horaire_id,
        repos: row.repos, // <-- ajoute cette ligne
        cells: {}
      };
    }
    lignes[key].cells[row.date] = {
      ouverture: row.ouverture,
      nom: row.nom,
      nom_id: row.nom_id,
      date: row.date,
      locked: row.locked === true,
      commentaires: row.commentaires || [],
      commentaire: row.commentaire || null // pour compatibilité
    };
    datesSet.add(row.date);
  });
  const dates = Array.from(datesSet).sort();

  let html = '<table class="simu-table"><tr>';
  html += '<th>Compétence</th><th>Horaires</th>';
  dates.forEach(date => html += `<th>${date}</th>`);
  html += '</tr>';

  Object.values(lignes).forEach(ligne => {
    // Ajoute la détection repos ici (repos == 1 => ligne fermée)
    const isRepos = ligne.repos === 1;
    html += `<tr>
      <td>${ligne.competence}</td>
      <td>${ligne.horaire_debut} - ${ligne.horaire_fin}</td>`;
    dates.forEach(date => {
      const cell = ligne.cells[date];
      if (isRepos) {
        html += `<td class="cell-fermee"></td>`;
      } else if (!cell) {
        html += `<td class="cell-empty"></td>`;
      } else {
        // Ajout : détection commentaire "Fermée"
        let isFermee = false;
        if (cell.commentaires && Array.isArray(cell.commentaires)) {
          const commentaireGeneral = cell.commentaires.find(c => !c.nom_id);
          if (commentaireGeneral && commentaireGeneral.commentaire && commentaireGeneral.commentaire.trim().toLowerCase() === "fermée") {
            isFermee = true;
          }
        }
        if (!isFermee && cell.commentaire && typeof cell.commentaire === "string" && cell.commentaire.trim().toLowerCase() === "fermée") {
          isFermee = true;
        }
        if (cell.ouverture == 1 && !isFermee) {
          if (cell.nom) {
            if (cell.locked) {
              html += `<td><b class="simu-locked">${cell.nom}</b></td>`;
            } else {
              html += `<td><b>${cell.nom}</b></td>`;
            }
          } else {
            html += `<td></td>`;
          }
        } else {
          html += `<td class="cell-fermee"></td>`;
        }
      }
    });
    html += '</tr>';
  });
  html += '</table>';
  document.getElementById("planning-evolution-content").innerHTML = html;
}



// =======================
// 1. FONCTIONS UTILITAIRES
// =======================

// Récupère dynamiquement les groupes de compétences
async function fetchCompetenceGroupes(site_id) {
  if (groupesCache[site_id]) {
    return groupesCache[site_id];
  }
  const res = await fetch(`/api/competence-groupes?site_id=${site_id}`, {
    headers: { Authorization: "Bearer " + localStorage.getItem("token") }
  });
  if (!res.ok) {
    console.error("Erreur fetch groupes:", res.status, await res.text());
    return [];
  }
  const groupes = await res.json();
  groupesCache[site_id] = groupes;
  return groupes;
}


async function fetchHoraireGroupes(site_id) {
  if (groupesCache["horaire_" + site_id]) {
    return groupesCache["horaire_" + site_id];
  }
  const res = await fetch(`/api/horaire-groupes?site_id=${site_id}`, {
    headers: { Authorization: "Bearer " + localStorage.getItem("token") }
  });
  if (!res.ok) {
    console.error("Erreur fetch groupes horaires:", res.status, await res.text());
    return [];
  }
  const groupes = await res.json();
  groupesCache["horaire_" + site_id] = groupes;
  return groupes;
}
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
        repos: row.repos || 0,
        cells: {}
      };
    }
    lignes[key].cells[row.date] = {
      ouverture: row.ouverture,
      nom: row.nom,
      nom_id: row.nom_id,
      date: row.date,
      locked: row.locked === true,
      commentaires: row.commentaires || [], // <-- AJOUT ICI
      commentaire: row.commentaire || null  // <-- AJOUT ICI
    };
    datesSet.add(row.date);
  });
  return { lignes: Object.values(lignes), dates: Array.from(datesSet).sort() };
}

// Calcule les stats d’un planning
// Calcule les stats d’un planning (par groupe de compétences)
async function computeStats(planning) {
  const site_id = sessionStorage.getItem("selectedSite");
  const groupesCompetence = await fetchCompetenceGroupes(site_id);
  const groupesHoraire = await fetchHoraireGroupes(site_id);

  // Fusionne les deux listes de groupes
  const groupes = [
    ...groupesCompetence.map(g => ({ ...g, type: "competence" })),
    ...groupesHoraire.map(g => ({ ...g, type: "horaire" }))
  ];

  // stats[nom][groupe.nom_groupe] = nombre d'affectations
  const stats = {};
  planning.forEach(cell => {
    if (!cell.nom) return;
    groupes.forEach(groupe => {
      if (
        (groupe.type === "competence" && groupe.competences?.some(c => c.competence_id == cell.competence_id)) ||
        (groupe.type === "horaire" && groupe.horaires?.some(h => h.horaire_id == cell.horaire_id))
      ) {
        if (!stats[cell.nom]) stats[cell.nom] = {};
        stats[cell.nom][groupe.nom_groupe] = (stats[cell.nom][groupe.nom_groupe] || 0) + 1;
      }
    });
  });
  // Ajoute le total
  Object.values(stats).forEach(s => {
    s.Total = Object.values(s).reduce((a, b) => a + b, 0);
  });
  stats._groupes = groupes; // Pour l'affichage plus tard
  return stats;
}

// Calcule le score d’équilibre
// Calcule le score d’équilibre (somme des écarts types sur les groupes)
function computeEquilibreScore(stats, priorites = {}) {
  function ecartType(arr) {
    const moy = arr.reduce((a, b) => a + b, 0) / arr.length;
    return Math.sqrt(
      arr.reduce((a, b) => a + Math.pow(b - moy, 2), 0) / arr.length
    );
  }
  const groupes = stats._groupes || [];
  const noms = Object.keys(stats).filter(n => n !== "_groupes");
  if (noms.length === 0) return 99999;
  let score = 0;
  groupes.forEach(groupe => {
    const vals = noms.map(nom => stats[nom][groupe.nom_groupe] || 0);
    const poids = priorites[groupe.nom_groupe] || 1;
    const et = ecartType(vals);
    score += et * poids;
  });
  return score;
}

// Affiche le panneau stats
// Affiche le panneau stats dynamiquement selon les groupes
function renderStatsPanel(stats) {
  const groupes = stats._groupes || [];
  let html = `<table border="1" class="stats-table"><thead>
    <tr><th>Nom</th>`;
  groupes.forEach(g => html += `<th>${g.nom_groupe}</th>`);
  html += `<th>Total</th></tr></thead><tbody>`;

  Object.entries(stats).forEach(([nom, s]) => {
    if (nom === "_groupes") return;
    html += `<tr><td>${nom}</td>`;
    let total = 0;
    groupes.forEach(g => {
      const val = s[g.nom_groupe] || 0;
      html += `<td>${val}</td>`;
      total += val;
    });
    html += `<td>${total}</td></tr>`;
  });
  html += "</tbody></table>";

  // Ajoute le score global d'équilibre
  const score = computeEquilibreScore(stats, window.groupePriorites);
  html = `<div class="stats-score"><b>Score d'équilibre : ${score.toFixed(3)}</b></div>` + html;

  document.getElementById("stats-results").innerHTML = html;
}

// Affiche le tableau planning
function renderPlanningSwitchTable(data, dates, switched = []) {
  const { lignes } = buildLignesEtDates(data);

  let html = '<table class="simu-table"><tr>';
  html += '<th>Compétence</th><th>Horaires</th>';
  dates.forEach(date => html += `<th>${date}</th>`);
  html += '</tr>';

  lignes.forEach(ligne => {
    const isRepos = ligne.repos === 1;
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
        highlight = ' highlight-switch';
      }
      let isFermee = false;
      if (cell && cell.commentaires && Array.isArray(cell.commentaires)) {
        const commentaireGeneral = cell.commentaires.find(c => !c.nom_id);
        if (commentaireGeneral && commentaireGeneral.commentaire && commentaireGeneral.commentaire.trim().toLowerCase() === "fermée") {
          isFermee = true;
        }
      }
      if (cell && !isFermee && cell.commentaire && typeof cell.commentaire === "string" && cell.commentaire.trim().toLowerCase() === "fermée") {
        isFermee = true;
      }
      if (isRepos) {
        html += `<td class="cell-fermee${highlight}"></td>`;
      } else if (!cell) {
        html += `<td class="cell-empty${highlight}"></td>`;
      } else if (cell.ouverture == 1 && !isFermee) {
        if (cell.nom) {
          if (cell.locked) {
            html += `<td class="${highlight}"><b class="simu-locked">${cell.nom}</b></td>`;
          } else {
            html += `<td class="${highlight}"><b>${cell.nom}</b></td>`;
          }
        } else {
          html += `<td class="${highlight}"></td>`;
        }
      } else {
        html += `<td class="cell-fermee${highlight}"></td>`;
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
async function generateRandomPlannings(nbPlannings = 20, nbMutations = 1000, planningBase = null) {
  let planningInitial;
  if (planningBase) {
    planningInitial = JSON.parse(JSON.stringify(planningBase));
  } else {
    const startDate = startDateInput.value;
    const endDate = endDateInput.value;
    const siteId = sessionStorage.getItem("selectedSite");
    if (!startDate || !endDate || !siteId) {
      alert("Sélectionne d'abord un site et une période !");
      return [];
    }
    planningInitial = await fetchCompetencesWithNames(siteId, startDate, endDate);
  }
  const competencesParNom = await fetchCompetencesParNom();

  // Affiche la barre de progression
  ensureProgressUI();
  const progressBarContainer = document.getElementById("progressBarContainer");
  const progressBar = document.getElementById("progressBar");
  const progressProcess = document.getElementById("progressProcess");
  if (progressBarContainer) progressBarContainer.classList.add('show');
  if (progressBar) progressBar.style.width = "0%";
  if (progressProcess) progressProcess.value = 0;

  let plannings = [];
  for (let i = 0; i < nbPlannings; i++) {
    let planning = JSON.parse(JSON.stringify(planningInitial));
    for (let j = 0; j < nbMutations; j++) {
      const res = nextGeneration(planning, competencesParNom);
      planning = res.planning;
    }
    plannings.push(planning);

    // Mise à jour de la barre de progression
  const pct = ((i + 1) / nbPlannings) * 100;
  if (progressBar) progressBar.style.width = `${pct}%`;
  if (progressProcess) progressProcess.value = Math.round(pct);
    // Pour laisser le temps d'afficher la progression (optionnel)
    await new Promise(r => setTimeout(r, 1));
  }

  // Cache la barre à la fin
  if (progressBarContainer) setTimeout(() => { progressBarContainer.classList.remove('show'); }, 500);

  return plannings;
}

// Assure la présence de l'UI de progression (sans dépendre de DOMContentLoaded)
function ensureProgressUI() {
  if (document.getElementById('progressBarContainer')) return;
  const container = document.createElement('div');
  container.id = 'progressBarContainer';
  container.classList.add('progress-bar-container');
  const bar = document.createElement('div');
  bar.id = 'progressBar';
  bar.classList.add('progress-bar');
  const prog = document.createElement('progress');
  prog.id = 'progressProcess';
  prog.max = 100; prog.value = 0;
  prog.classList.add('native-progress');
  container.appendChild(bar);
  container.appendChild(prog);
  const nav = document.getElementById('evolution-nav');
  if (nav && nav.parentNode) {
    nav.parentNode.insertBefore(container, nav);
  } else {
    document.body.appendChild(container);
  }
}

// =======================
// 3. CROISEMENT ET MUTATION
// =======================

// Croisement avec points communs figés

function crossoverByExchange(parentA, parentB) {
  const enfant = [];
  const casesParDate = {};

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

  Object.values(casesParDate).forEach(cases => {
    const nomsA = cases.map(c => c.cellA.nom_id).filter(Boolean);
    const nomsB = cases.map(c => c.cellB.nom_id).filter(Boolean);
    const nomsDispo = Array.from(new Set([...nomsA, ...nomsB]));
    let used = new Set();

  cases.forEach(c => {
      // Si la case est locked dans l'un des parents, on garde la valeur et locked=true
      if (c.cellA.locked) {
        enfant[c.idx] = { ...c.cellA, locked: true };
        used.add(c.cellA.nom_id);
        return;
      }
      if (c.cellB.locked) {
        enfant[c.idx] = { ...c.cellB, locked: true };
        used.add(c.cellB.nom_id);
        return;
      }
      // Sinon, comportement normal
      let nom_id = null, nom = null;
      for (let id of nomsDispo) {
        if (used.has(id)) continue;
        let candidateNom, candidateId;
        if (c.cellA.nom_id === id) {
          candidateId = c.cellA.nom_id;
          candidateNom = c.cellA.nom;
        } else if (c.cellB.nom_id === id) {
          candidateId = c.cellB.nom_id;
          candidateNom = c.cellB.nom;
        }
        if (candidateId == null) continue;
        // Vérifie exclusion pour la case cible (compétence/horaire de cellA)
        const excl = _exclusionsSet.has(`${candidateId}|${c.cellA.competence_id}|${c.cellA.horaire_id}`);
        if (excl) continue;
        nom_id = candidateId;
        nom = candidateNom;
        used.add(id);
        break;
      }
      enfant[c.idx] = {
        ...c.cellA,
        nom,
        nom_id,
        locked: false // bien préciser que ce n'est pas une case verrouillée
      };
    });
  });

  // Remplit les cases null (si jamais)
  return enfant.map((cell, i) =>
    cell ? cell : { ...parentA[i], nom: null, nom_id: null, locked: parentA[i].locked }
  );
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
      // Ajoute !cell.locked ici :
      if (cell && cell.ouverture == 1 && cell.nom_id && !cell.locked) {
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
      // Vérifier exclusions (nom_id, competence_id, horaire_id)
      const excl1 = _exclusionsSet.has(`${c2.nom_id}|${c1.competence_id}|${c1.horaire_id}`);
      const excl2 = _exclusionsSet.has(`${c1.nom_id}|${c2.competence_id}|${c2.horaire_id}`);
      if (excl1 || excl2) continue;
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
async function showBestPlanning(idx) {
  console.log(
    "Affichage du planning n°",
    idx + 1,
    bestPlannings[idx].map((c) => c.nom).join(",")
  );
  const { lignes, dates } = buildLignesEtDates(bestPlannings[idx]);
  renderPlanningSwitchTable(bestPlannings[idx], dates);
  const stats = await computeStats(bestPlannings[idx]);
  renderStatsPanel(stats);
  document.getElementById("genLabel").textContent = `Planning ${idx + 1}/10`;
}

async function showCrossMutatePlanning(idx) {
  const { lignes, dates } = buildLignesEtDates(crossMutatePlannings[idx]);
  renderPlanningSwitchTable(crossMutatePlannings[idx], dates);
  const stats = await computeStats(crossMutatePlannings[idx]);
  renderStatsPanel(stats);
  document.getElementById("genLabel").textContent = `Enfant ${
    idx + 1
  }/10 (Génération ${generationCounter})`;
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
async function showCrossMutatePlanning(idx) {
  const { lignes, dates } = buildLignesEtDates(crossMutatePlannings[idx]);
  renderPlanningSwitchTable(crossMutatePlannings[idx], dates);
  const stats = await computeStats(crossMutatePlannings[idx]);
  renderStatsPanel(stats);
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
  // Assure que la barre d'avancement est visible immédiatement
  ensureProgressUI();
  const pbc = document.getElementById('progressBarContainer');
  const pb = document.getElementById('progressBar');
  const pp = document.getElementById('progressProcess');
  if (pbc) pbc.classList.add('show');
  if (pb) pb.style.width = '0%';
  if (pp) pp.value = 0;
  const plannings = await generateRandomPlannings(100, 1000, planningData);
  let statsPlannings = plannings.map((planning) => ({
    planning,
    stats: computeStats(planning),
    score: computeEquilibreScore(computeStats(planning), window.groupePriorites),
  }));
  statsPlannings.sort((a, b) => a.score - b.score);
  bestPlannings = statsPlannings.slice(0, 10).map((x) => x.planning);
  bestStats = statsPlannings.slice(0, 10).map((x) => x.stats);
  currentBestIdx = 0;
  showBestPlanning(0);
  setupBestPlanningNav();

  // Lance automatiquement le croisement/mutation à la fin
  await launchCrossMutateCycle();
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
      for (let j = 0; j < 1; j++) { // au lieu de 3
        const res = nextGeneration(enfant, competencesParNom);
        enfant = res.planning;
      }
      enfants.push(enfant);
    }
  }

  // 3. Pour chaque enfant, calcule les stats et le score
  let statsEnfants = enfants.map((planning) => {
    const stats = computeStats(planning);
    const groupes = stats._groupes || [];
    const noms = Object.keys(stats).filter(n => n !== "_groupes");
    const radiopharma = groupes.find(g => g.nom_groupe === "Radiopharmacie");
    let etRadiopharma = 0;
    if (radiopharma) {
      const vals = noms.map(nom => stats[nom][radiopharma.nom_groupe] || 0);
      etRadiopharma = ecartType(vals);
    }
    return {
      planning,
      stats,
      score: computeEquilibreScore(stats, window.groupePriorites),
      etRadiopharma
    };
  });
  statsEnfants.sort((a, b) => a.etRadiopharma - b.etRadiopharma || a.score - b.score);

  crossMutatePlannings = statsEnfants.slice(0, 10).map((x) => x.planning);
  crossMutateStats = statsEnfants.slice(0, 10).map((x) => x.stats);
  currentCrossIdx = 0;
  await showCrossMutatePlanning(0);;
  setupCrossMutateNav();
}

async function next100Generations() {
  const btn = document.getElementById("btnNextGen100");
  if (btn) btn.disabled = true;

  // 1. Récupère les données une seule fois et mets en cache
  const competencesParNom = await fetchCompetencesParNom();
  window._competencesParNomCache = competencesParNom; // cache global temporaire

  for (let i = 0; i < 100; i++) {
    await nextEvolutionGeneration(window._competencesParNomCache);
  }

  // 2. Supprime le cache à la fin
  delete window._competencesParNomCache;

  if (btn) btn.disabled = false;
}

// Modifie nextEvolutionGeneration pour accepter le cache en paramètre
async function nextEvolutionGeneration(competencesParNomCache = null) {
  const btn = document.getElementById("btnNextGen");
  if (btn) btn.disabled = true;
  generationCounter++;

  // 1. Conserve l'élite
  const elitePlanning = crossMutatePlannings[0];
  const eliteStats = await computeStats(elitePlanning);
  const eliteScore = computeEquilibreScore(eliteStats, window.groupePriorites);

  // 2. Utilise le cache si fourni
  const competencesParNom = competencesParNomCache || await fetchCompetencesParNom();
  const pairs = [
    [0, 1], [2, 3], [4, 5], [6, 7], [8, 9]
  ];
  let enfants = [];
  for (const [i1, i2] of pairs) {
    let parentA = crossMutatePlannings[i1];
    let parentB = crossMutatePlannings[i2];
    for (let k = 0; k < 20; k++) {
      let enfant = crossoverByExchange(parentA, parentB);
      for (let j = 0; j < 1; j++) {
        const res = nextGeneration(enfant, competencesParNom);
        enfant = res.planning;
      }
      enfants.push(enfant);
    }
  }

  // 3. Calcule les scores des enfants
  let statsEnfants = await Promise.all(enfants.map(async (planning) => {
    const stats = await computeStats(planning);
    const groupes = stats._groupes || [];
    const noms = Object.keys(stats).filter(n => n !== "_groupes");
    const radiopharma = groupes.find(g => g.nom_groupe === "Radiopharmacie");
    let etRadiopharma = 0;
    if (radiopharma) {
      const vals = noms.map(nom => stats[nom][radiopharma.nom_groupe] || 0);
      etRadiopharma = ecartType(vals);
    }
    return {
      planning,
      stats,
      score: computeEquilibreScore(stats, window.groupePriorites),
      etRadiopharma
    };
  }));

  // 4. Ajoute l'élite dans la sélection
  statsEnfants.push({
    planning: elitePlanning,
    stats: eliteStats,
    score: eliteScore,
    etRadiopharma: (() => {
      const groupes = eliteStats._groupes || [];
      const noms = Object.keys(eliteStats).filter(n => n !== "_groupes");
      const radiopharma = groupes.find(g => g.nom_groupe === "Radiopharmacie");
      if (radiopharma) {
        const vals = noms.map(nom => eliteStats[nom][radiopharma.nom_groupe] || 0);
        return ecartType(vals);
      }
      return 0;
    })()
  });

  // 5. Trie et sélectionne les 10 meilleurs (élite incluse)
  statsEnfants.sort((a, b) => a.etRadiopharma - b.etRadiopharma || a.score - b.score);
  bestPlannings = statsEnfants.slice(0, 10).map((x) => x.planning);
  bestStats = statsEnfants.slice(0, 10).map((x) => x.stats);
  crossMutatePlannings = bestPlannings;
  crossMutateStats = bestStats;

  // 6. Affiche le résultat
  currentCrossIdx = 0;
  await showCrossMutatePlanning(0);
  setupCrossMutateNav();

  if (btn) btn.disabled = false;
}

// Fonction utilitaire pour l'écart-type (à placer en haut si besoin)
function ecartType(arr) {
  const moy = arr.reduce((a, b) => a + b, 0) / arr.length;
  return Math.sqrt(
    arr.reduce((a, b) => a + Math.pow(b - moy, 2), 0) / arr.length
  );
}



async function applySimuPlanningToDB(planningSimule) {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Aucun token trouvé !");
    return;
  }
  // Filtre uniquement les cases à appliquer (pas locked)
  const toSend = planningSimule.filter(cell =>
    cell.nom_id &&
    cell.competence_id &&
    cell.horaire_id &&
    cell.date &&
    cell.site_id &&
    cell.locked !== true // <-- n'applique pas les cases simulockées
  );
  let ok = 0, fail = 0;
  for (const cell of toSend) {
    try {
    const res = await fetch("/api/update-planningv2", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          date: cell.date,
          nom_id: cell.nom_id,
          competence_id: cell.competence_id,
          horaire_id: cell.horaire_id,
      site_id: cell.site_id,
      planning_auto: 1
        })
      });
      if (res.ok) ok++;
      else fail++;
    } catch (e) {
      fail++;
    }
  }
  alert(`Planning appliqué !\nSuccès : ${ok}\nErreurs : ${fail}`);
  // Rafraîchir immédiatement l'affichage des deux tableaux
  try {
    if (typeof refreshSecondTable === "function") {
      await refreshSecondTable();
    }
    // Alias éventuel attendu par d'autres modules
    if (typeof refreshPlanningTableWithNames === "function") {
      await refreshPlanningTableWithNames();
    }
    // Ancien hook (pour compat) si présent
    if (typeof fetchPlanningData === "function") fetchPlanningData();
  } catch (e) {
    console.warn("Refresh après application du planning a échoué:", e);
  }

}




// 6. ÉVOLUTION SIMPLE (PLANNING SIMULÉ)
// Stockage des générations et de la surbrillance


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
  
  
  if (!document.getElementById("progressBarContainer")) {
    const container = document.createElement("div");
    container.id = "progressBarContainer";
    container.classList.add("progress-bar-container");
    const bar = document.createElement("div");
    bar.id = "progressBar";
    bar.classList.add("progress-bar");
    const prog = document.createElement("progress");
    prog.id = "progressProcess";
    prog.max = 100; prog.value = 0;
    prog.classList.add("native-progress");
    container.appendChild(bar);
    container.appendChild(prog);
    document.body.insertBefore(container, document.getElementById("evolution-nav"));
  }
  if (!document.getElementById("btnApplySimuPlanning")) {
    const btn = document.createElement("button");
    btn.id = "btnApplySimuPlanning";
    btn.textContent = "Appliquer ce planning";
    btn.style.marginTop = "16px";
    btn.onclick = async function() {
      let toApply = planningData;
      // Si on est dans la navigation des meilleurs plannings
      if (typeof currentBestIdx !== "undefined" && bestPlannings && bestPlannings.length > 0) {
        const genLabel = document.getElementById("genLabel");
        if (genLabel && genLabel.textContent.startsWith("Planning")) {
          toApply = bestPlannings[currentBestIdx];
        }
      }
      // Si on est dans la navigation des enfants croisés/mutés
      if (typeof currentCrossIdx !== "undefined" && crossMutatePlannings && crossMutatePlannings.length > 0) {
        const genLabel = document.getElementById("genLabel");
        if (genLabel && genLabel.textContent.startsWith("Enfant")) {
          toApply = crossMutatePlannings[currentCrossIdx];
        }
      }
      if (!toApply || toApply.length === 0) {
        alert("Aucun planning simulé à appliquer !");
        return;
      }
      if (!confirm("Voulez-vous vraiment appliquer ce planning ? Cela va écraser les affectations existantes pour cette période.")) return;
      await applySimuPlanningToDB(toApply);
    };
    document.getElementById("evolution-visualization").after(btn);
  }

  document.getElementById("btnApplyRoulements").onclick = async function() {
    setButtonState(0);
    await appliquerRoulementsDansPlanningAuto();
  };

  document.getElementById("auto-fill-btn").onclick = async function() {
    setButtonState(1);
    if (!planningData || planningData.length === 0) {
      alert("Aucune donnée de planning à remplir !");
      return;
    }
    await autoFillPlanningSimulatedTable(planningData);
  };

  document.getElementById("btnBestPlannings").onclick = async function() {
    setButtonState(2);
    await launchBestPlannings();
  };

  document.getElementById("btnNextGen100").onclick = async function() {
    setButtonState(3);
    await next100Generations();
  };

  document.getElementById("btnApplySimuPlanning").onclick = async function() {
    setButtonState(4);
    let toApply = planningData;
    if (typeof currentBestIdx !== "undefined" && bestPlannings && bestPlannings.length > 0) {
      const genLabel = document.getElementById("genLabel");
      if (genLabel && genLabel.textContent.startsWith("Planning")) {
        toApply = bestPlannings[currentBestIdx];
      }
    }
    if (typeof currentCrossIdx !== "undefined" && crossMutatePlannings && crossMutatePlannings.length > 0) {
      const genLabel = document.getElementById("genLabel");
      if (genLabel && genLabel.textContent.startsWith("Enfant")) {
        toApply = crossMutatePlannings[currentCrossIdx];
      }
    }
    if (!toApply || toApply.length === 0) {
      alert("Aucun planning simulé à appliquer !");
      return;
    }
    if (!confirm("Voulez-vous vraiment appliquer ce planning ? Cela va écraser les affectations existantes pour cette période.")) return;
    await applySimuPlanningToDB(toApply);
  };
});



async function appliquerRoulementsDansPlanningAuto() {
    const siteId = sessionStorage.getItem("selectedSite");
    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;
    const token = localStorage.getItem("token");
    if (!siteId || !startDate || !endDate || !token) {
        alert("Site ou dates manquants !");
        return;
    }

    // 1. Récupérer tous les roulements du site
    const roulements = await fetch(`/api/troulement?site_id=${siteId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json());

    // 2. Récupérer les vacances pour la période
    const vacancesData = await fetchVacancesData(siteId, startDate, endDate);

    // 3. Pour chaque jour de la période
    let currentDate = new Date(startDate);
    const endDateObj = new Date(endDate);
    let affectations = [];
    while (currentDate <= endDateObj) {
        const dateStr = currentDate.toISOString().slice(0, 10);
        const jourId = currentDate.getDay() === 0 ? 7 : currentDate.getDay(); // 1=lundi ... 7=dimanche
        const semaineNum = getWeekNumber(currentDate);
        const semaineType = semaineNum % 2 === 0 ? "paire" : "impaire";

        for (const r of roulements) {
            // Vérifie si le jour est dans le roulement
            if (!r.jours_semaine.split(',').includes(jourId.toString())) continue;
            // Vérifie semaine paire/impaire/toutes
            if (r.semaine_type !== "toutes" && r.semaine_type !== semaineType) continue;
            // Vérifie vacances
            const vacs = vacancesData[dateStr] || [];
            if (vacs.some(v => v.nom_id == r.nom_id)) continue;

            // Vérifie ouverture de la case
            const cell = document.querySelector(
                `#planningTableWithNames td[data-competence-id="${r.competence_id}"][data-horaire-id="${r.horaire_id}"][data-date="${dateStr}"]`
            );
            if (!cell || cell.dataset.ouverture !== "oui") continue;
            // Vérifie si déjà rempli
            if (cell.querySelector(".nom-block")) continue;

            // Vérifie disponibilité via fetchAvailableNames
            const availableNames = await fetchAvailableNames(r.competence_id, siteId, dateStr, r.horaire_id);
            if (!availableNames.some(n => n.nom_id == r.nom_id)) continue;
            // Exclusion (nom, compétence, horaire)
            if (_exclusionsSet && _exclusionsSet.has(`${r.nom_id}|${r.competence_id}|${r.horaire_id}`)) continue;

            // Affecte la personne
            affectations.push({
                date: dateStr,
                nom_id: r.nom_id,
                competence_id: r.competence_id,
                horaire_id: r.horaire_id,
                site_id: siteId
            });
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }

  // 4. Envoie les affectations à l'API
  for (const aff of affectations) {
    await fetch('/api/update-planningv2', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
      body: JSON.stringify({ ...aff, planning_auto: 1 })
        });
    }

    alert(`${affectations.length} affectations réalisées !`);
    refreshSecondTable();
    if (typeof refreshPlanningTableWithNames === "function") {
    refreshPlanningTableWithNames();
}
      
    
}



function setButtonState(activeIdx) {
  const ids = [
    "btnApplyRoulements",
    "auto-fill-btn",
    "btnBestPlannings",
    "btnNextGen100",
    "btnApplySimuPlanning"
  ];
  ids.forEach((id, idx) => {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.classList.remove("btn-active");
    btn.classList.remove("btn-blink");
    if (idx <= activeIdx) {
      btn.classList.add("btn-active");
    } else if (idx === activeIdx + 1) {
      btn.classList.add("btn-blink");
    }
  });
}