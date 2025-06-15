// Fonction pour récupérer les noms disponibles pour une compétence donnée dans le tooltip
async function fetchNomIds(competenceId, event) {
  const token = localStorage.getItem("token"); // Récupérer le token depuis le localStorage
  const siteId = sessionStorage.getItem("selectedSite"); // Récupérer le site_id depuis le sessionStorage

  if (!token) {
    console.error("Erreur : aucun token trouvé.");
    return;
  }

  if (!siteId) {
    console.error("Erreur : aucun site_id trouvé dans le sessionStorage.");
    return;
  }

  const semaine = document.getElementById("weekNumber").value;
  const annee = document.getElementById("yearNumber").value;
  const jour_id = currentDay;

  console.log("Données envoyées pour fetchNomIds :", {
    competenceId,
    siteId,
    semaine,
    annee,
    jour_id,
  });

  try {
    const response = await fetch(
      `/api/nom-ids?competence_id=${competenceId}&site_id=${siteId}&semaine=${semaine}&annee=${annee}&jour_id=${jour_id}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`, // Ajouter le token dans l'en-tête
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Erreur lors de la récupération des noms : ${response.status} - ${errorText}`
      );
    }

    const data = await response.json();
    console.log("Noms récupérés :", data);

    // Appeler showTooltip pour afficher les noms dans le tooltip
    showTooltip(event, data, {
      competenceId,
      horaireId: null, // ou la vraie valeur si tu l'as
      date: null, // ou la vraie valeur si tu l'as
      siteId,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des noms :", error);
    alert("Une erreur est survenue lors de la récupération des noms.");
  }
}

async function fetchNomDetails(competenceId, siteId, semaine, annee, noms) {
  try {
    const response = await fetch(`/api/nom-details`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        competence_id: competenceId,
        site_id: siteId,
        semaine,
        annee,
        noms,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Erreur lors de la récupération des détails des noms : ${response.status} - ${errorText}`
      );
    }

    const data = await response.json();
    console.log("Détails des noms récupérés :", data);
    return data; // Retourne les détails des noms
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des détails des noms :",
      error
    );
    return {};
  }
}

function formatTime(time) {
  // Convertir le format "08:30:00" en "08h30"
  const [hours, minutes] = time.split(":");
  return `${hours}h${minutes}`;
}

function adjustTooltipPosition(tooltip, event) {
  const tooltipRect = tooltip.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  let left = event.pageX - tooltip.offsetWidth / 2;
  let top = event.pageY + 15;

  // Ajuster si le tooltip dépasse à droite
  if (left + tooltipRect.width > viewportWidth) {
    left = viewportWidth - tooltipRect.width - 10; // Décalage de 10px pour éviter le bord
  }

  // Ajuster si le tooltip dépasse à gauche
  if (left < 0) {
    left = 10; // Décalage de 10px pour éviter le bord
  }

  // Ajuster si le tooltip dépasse en bas
  if (top + tooltipRect.height > viewportHeight) {
    top = viewportHeight - tooltipRect.height - 10; // Décalage de 10px pour éviter le bord
  }

  // Ajuster si le tooltip dépasse en haut
  if (top < 0) {
    top = 10; // Décalage de 10px pour éviter le bord
  }

  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
}

// Fonction pour afficher le tooltip vide et charger les noms disponibles
function showEmptyTooltip(
  event,
  nom,
  nom_id,
  day,
  semaine,
  annee,
  competenceId,
  horaireDebut,
  horaireFin
) {
  const tooltip = document.getElementById("tooltip");
  tooltip.innerHTML = `
        <div style="position: relative; padding-bottom: 10px; margin-bottom: 8px; border-bottom: 1px solid #eee; text-align: right;">
            <div class="tooltip-close" style="position: static; cursor: pointer; display: inline-block; width: 20px; height: 20px; text-align: center; line-height: 20px; font-size: 18px; font-weight: bold;">&times;</div>
        </div>
        <p>Chargement des noms disponibles...</p>
    `;

  tooltip.style.display = "block";
  tooltip.style.width = "200px"; // Largeur fixe pour une meilleure présentation
  tooltip.style.padding = "10px";

  // Positionner le tooltip
  tooltip.style.left = `${event.pageX - tooltip.offsetWidth + 25}px`;
  tooltip.style.top = `${event.pageY - 15}px`;

  // Ajouter un gestionnaire de clics pour fermer le tooltip avec la croix
  tooltip
    .querySelector(".tooltip-close")
    .addEventListener("click", function (e) {
      tooltip.style.display = "none";
      e.stopPropagation(); // Empêcher la propagation du clic
    });

  // Ajouter également un gestionnaire de clic sur le document
  document.addEventListener(
    "click",
    function closeTooltip(e) {
      // Si le clic est sur la croix ou à l'intérieur du tooltip, ne pas fermer
      if (
        e.target.closest(".tooltip-close") ||
        (e.target !== tooltip && tooltip.contains(e.target))
      )
        return;

      tooltip.style.display = "none";
      document.removeEventListener("click", closeTooltip);
    },
    { once: true }
  );

  // Appeler fetchNomIds pour récupérer les noms disponibles
  fetchNomIds(competenceId, event);
}

// Fonction pour mettre à jour le planning dans la base de données
async function updatePlanning(
  semaine,
  annee,
  jour_id,
  horaire_debut,
  horaire_fin,
  competenceId,
  nom
) {
  const token = localStorage.getItem("token"); // Récupérer le token depuis le localStorage
  const siteId = sessionStorage.getItem("selectedSite"); // Récupérer le site_id depuis le sessionStorage

  if (!token) {
    console.error("Erreur : aucun token trouvé.");
    return;
  }

  if (!siteId) {
    console.error("Erreur : aucun site_id trouvé dans le sessionStorage.");
    return;
  }

  console.log("Données envoyées pour la mise à jour du planning :", {
    semaine,
    annee,
    jour_id,
    horaire_debut,
    horaire_fin,
    competenceId,
    nom,
    siteId,
  });

  try {
    const response = await fetch("/api/update-planning", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`, // Ajouter le token dans l'en-tête
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        semaine,
        annee,
        jour_id,
        horaire_debut,
        horaire_fin,
        competence_id: competenceId,
        nom,
        site_id: siteId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Erreur lors de la mise à jour du planning : ${response.status} - ${errorText}`
      );
    }

    const result = await response.text();
    console.log("Résultat de la mise à jour du planning :", result);

    // Actualiser le tableau après l'ajout
    fetchPlanningData();
  } catch (error) {
    console.error("Erreur lors de la mise à jour du planning :", error);
    alert("Une erreur est survenue lors de la mise à jour du planning.");
  }
}

// 2eme tableau pour afficher les noms disponibles

async function fetchAvailableNames(competenceId, siteId, date) {
  console.log("Appel à fetchAvailableNames avec :", {
    competenceId,
    siteId,
    date,
  });

  const token = localStorage.getItem("token");

  if (!token) {
    console.error("Erreur : aucun token trouvé.");
    return [];
  }

  try {
    const response = await fetch(
      `/api/available-names?competence_id=${competenceId}&site_id=${siteId}&date=${date}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Erreur lors de la récupération des noms disponibles : ${response.status} - ${errorText}`
      );
    }

    const data = await response.json();
    console.log("Noms disponibles récupérés :", data);
    return data;
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des noms disponibles :",
      error
    );
    return [];
  }
}

function showTooltip(event, noms, { competenceId, horaireId, date, siteId }) {
  const tooltip = document.getElementById("tooltip");

  tooltip.innerHTML = `
    <div style="position: relative; padding-bottom: 10px; margin-bottom: 8px; border-bottom: 1px solid #eee; text-align: right;">
        <div class="tooltip-close" style="cursor: pointer;">&times;</div>
    </div>
    <ul style="list-style: none; padding: 0; margin: 0;">
        ${noms.map(nomObj => {
          // Si nomObj est une chaîne, on l'affiche et on ne met pas de data-nom-id
          if (typeof nomObj === "string") {
            return `<li style="cursor:pointer;" data-nom="${nomObj}">${nomObj}</li>`;
          } else {
            // Sinon, on affiche comme avant
            return `<li style="cursor:pointer;" data-nom="${nomObj.nom}" data-nom-id="${nomObj.nom_id}">${nomObj.nom}</li>`;
          }
        }).join("")}
    </ul>
  `;

  tooltip.style.display = "block";
  tooltip.style.left = `${event.pageX}px`;
  tooltip.style.top = `${event.pageY}px`;

  tooltip.querySelector(".tooltip-close").addEventListener("click", () => {
    tooltip.style.display = "none";
  });

  // Ajoute le clic sur chaque nom pour updatePlanningV2
 
  tooltip.querySelectorAll("li").forEach(li => {
  li.addEventListener("click", async () => {
    tooltip.style.display = "none";
    const nomId = li.dataset.nomId;
    if (!nomId) {
      console.error("Impossible d'ajouter ce nom : nom_id manquant.");
      // Optionnel : affiche un message à l'utilisateur
      // alert("Impossible d'ajouter ce nom (nom_id manquant).");
      return;
    }
    await updatePlanningV2({
      date,
      nom_id: nomId,
      competenceId,
      horaireId,
      siteId
    });
  });
});
}

async function updatePlanningV2({
  date,
  nom_id,
  competenceId,
  horaireId,
  siteId,
}) {
  const token = localStorage.getItem("token");

  if (!token) {
    console.error("Erreur : aucun token trouvé.");
    return;
  }

  try {
    const response = await fetch("/api/update-planningv2", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        date,
        nom_id,
        competence_id: competenceId,
        horaire_id: horaireId,
        site_id: siteId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Erreur lors de la mise à jour de Tplanningv2 : ${response.status} - ${errorText}`
      );
    }

    console.log("Planning mis à jour avec succès.");
    await refreshSecondTable();
  } catch (error) {
    console.error("Erreur lors de la mise à jour de Tplanningv2 :", error);
    alert("Une erreur est survenue lors de la mise à jour du planning.");
  }
}

async function showTooltipVacance(event, date) {
  const siteId = sessionStorage.getItem("selectedSite");
  if (!siteId) {
    alert("Aucun site sélectionné !");
    return;
  }
  const token = localStorage.getItem("token");
  // Récupère tous les noms disponibles pour ce site (hors ceux déjà en vacances ce jour-là)
  const res = await fetch(`/api/available-vacance-names?site_id=${siteId}&date=${date}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    alert("Erreur lors de la récupération des noms !");
    return;
  }
  const noms = await res.json();

  // Affiche le tooltip avec la liste des noms
  let tooltip = document.getElementById("tooltip");
  tooltip.innerHTML = `
    <div style="position: relative; padding-bottom: 10px; margin-bottom: 8px; border-bottom: 1px solid #eee; text-align: right;">
      <div class="tooltip-close" style="cursor: pointer;">&times;</div>
    </div>
    <div style="font-weight:bold; margin-bottom:6px;">Ajouter une personne en vacances :</div>
    <ul style="list-style:none; padding:0; margin:0;">
      ${noms.length === 0
        ? `<li style="color:#888;">Aucun nom disponible</li>`
        : noms.map(n => `<li style="cursor:pointer; padding:2px 0;" data-nom-id="${n.nom_id}">${n.nom}</li>`).join("")}
    </ul>
  `;
  tooltip.style.display = "block";
  tooltip.style.left = event.pageX + "px";
  tooltip.style.top = event.pageY + "px";

  tooltip.querySelector(".tooltip-close").onclick = () => tooltip.style.display = "none";

  tooltip.querySelectorAll("li[data-nom-id]").forEach(li => {
    li.onclick = async function() {
      const nomId = li.dataset.nomId;
      // Ajoute à la base pour cette date/site
      const res = await fetch('/api/ajouter-vacance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ site_id: siteId, nom_id: nomId, date })
      });
      if (res.ok) {
        tooltip.style.display = "none";
        await refreshSecondTable();
      } else {
        alert("Erreur lors de l'ajout !");
      }
    };
  });
}

//toltip vacances
async function showTooltipVacanceMulti(event, dateHeaders) {
  const siteId = sessionStorage.getItem("selectedSite");
  if (!siteId) {
    alert("Aucun site sélectionné !");
    return;
  }
  const token = localStorage.getItem("token");
  // On prend la première et la dernière date affichée
  const startDate = dateHeaders[0];
  const endDate = dateHeaders[dateHeaders.length - 1];

  // Appel à une route qui retourne les noms non en vacances sur toute la période
  const res = await fetch(`/api/available-vacance-names-multi?site_id=${siteId}&start_date=${startDate}&end_date=${endDate}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    alert("Erreur lors de la récupération des noms !");
    return;
  }
  const noms = await res.json();

  // Affiche le tooltip avec la liste des noms
  let tooltip = document.getElementById("tooltip");
  tooltip.innerHTML = `
    <div style="position: relative; padding-bottom: 10px; margin-bottom: 8px; border-bottom: 1px solid #eee; text-align: right;">
      <div class="tooltip-close" style="cursor: pointer;">&times;</div>
    </div>
    <div style="font-weight:bold; margin-bottom:6px;">Ajouter une personne en vacances sur toute la période :</div>
    <ul style="list-style:none; padding:0; margin:0;">
      ${noms.length === 0
        ? `<li style="color:#888;">Aucun nom disponible</li>`
        : noms.map(n => `<li style="cursor:pointer; padding:2px 0;" data-nom-id="${n.nom_id}">${n.nom}</li>`).join("")}
    </ul>
  `;
  tooltip.style.display = "block";
  tooltip.style.left = event.pageX + "px";
  tooltip.style.top = event.pageY + "px";

  tooltip.querySelector(".tooltip-close").onclick = () => tooltip.style.display = "none";

  tooltip.querySelectorAll("li[data-nom-id]").forEach(li => {
    li.onclick = async function() {
      const nomId = li.dataset.nomId;
      // Ajoute la personne dans Tvacancesv2 pour chaque date de la période
      const res = await fetch('/api/ajouter-vacance-multi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ site_id: siteId, nom_id: nomId, dates: dateHeaders })
      });
      if (res.ok) {
        tooltip.style.display = "none";
        await refreshSecondTable();
      } else {
        alert("Erreur lors de l'ajout !");
      }
    };
  });
}