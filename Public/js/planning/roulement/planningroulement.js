function createRoulementButton(nom_id, nom) {
    const btn = document.createElement('button');
    btn.textContent = "Ajoute roulement";
    btn.onclick = () => openRoulementMenu(nom_id, nom);
    return btn;
}

function openRoulementMenu(nom_id, nom) {
    // Création du menu/modal
    const modal = document.createElement('div');
    modal.className = 'roulement-modal';

    modal.innerHTML = `
        <h3>Roulement pour ${nom}</h3>
        <label>Jours de la semaine :</label><br>
        ${[1,2,3,4,5,6,7].map(j => `<label><input type="checkbox" value="${j}" class="jour-checkbox"> ${['L','M','M','J','V','S','D'][j-1]}</label>`).join(' ')}
        <br><br>
        <label>Semaine :</label>
        <select id="semaineType">
            <option value="toutes">Toutes</option>
            <option value="paire">Paire</option>
            <option value="impaire">Impaire</option>
        </select>
        <br><br>
        <label>Compétence :</label>
        <select id="competenceSelect"></select>
        <br><br>
        <label>Horaire :</label>
        <select id="horaireSelect"></select>
        <br><br>
        <button id="roulementValider">Valider</button>
        <button id="roulementAnnuler">Annuler</button>
    `;

    document.body.appendChild(modal);

    // Remplir les compétences/horaire dynamiquement
    const token = localStorage.getItem('token');

    fetch('/api/competences?site_id=' + sessionStorage.getItem('selectedSite'), {
        headers: { 'Authorization': `Bearer ${token}` }
    })
        .then(res => {
            if (!res.ok) throw new Error("Accès refusé");
            return res.json();
        })
        .then(competences => {
            const select = modal.querySelector('#competenceSelect');
            competences.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.competence_id;
                opt.textContent = c.competence;
                select.appendChild(opt);
            });
        });
    fetch('/api/horaires?site_id=' + sessionStorage.getItem('selectedSite'), {
        headers: { 'Authorization': `Bearer ${token}` }
    })
        .then(res => {
            if (!res.ok) throw new Error("Accès refusé");
            return res.json();
        })
        .then(horaires => {
            const select = modal.querySelector('#horaireSelect');
            horaires.forEach(h => {
                const opt = document.createElement('option');
                opt.value = h.horaire_id;
                opt.textContent = h.horaire_debut + ' - ' + h.horaire_fin;
                select.appendChild(opt);
            });
        });

    modal.querySelector('#roulementAnnuler').onclick = () => modal.remove();

    modal.querySelector('#roulementValider').onclick = async () => {
        const jours = Array.from(modal.querySelectorAll('.jour-checkbox'))
            .filter(cb => cb.checked)
            .map(cb => cb.value)
            .join(',');
        const semaineType = modal.querySelector('#semaineType').value;
        const competence_id = modal.querySelector('#competenceSelect').value;
        const horaire_id = modal.querySelector('#horaireSelect').value;
        const site_id = sessionStorage.getItem('selectedSite');

        // Envoi à l'API
        const token = localStorage.getItem('token');
        await fetch('/api/troulement', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nom_id, competence_id, horaire_id, jours_semaine: jours, semaine_type: semaineType, site_id
            })
        });
        modal.remove();
        alert('Roulement ajouté !');
        fetchRoulementNoms();
    };
}

function jourToNom(jour) {
    return ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'][jour-1];
}

function competenceLabel(id, competences) {
    const c = competences.find(x => x.competence_id == id);
    return c ? c.competence : id;
}

function horaireLabel(id, horaires) {
    const h = horaires.find(x => x.horaire_id == id);
    return h ? `${h.horaire_debut} - ${h.horaire_fin}` : id;
}

async function fetchRoulementsPourNom(nom_id, site_id) {
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/troulement?nom_id=${nom_id}&site_id=${site_id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) return [];
    return await res.json();
}

async function fetchRoulementNoms() {
    const token = localStorage.getItem('token');
    const siteId = sessionStorage.getItem('selectedSite');
    if (!token || !siteId) return;

    // Pré-fetch compétences et horaires pour affichage lisible
    const competences = await fetch('/api/competences?site_id=' + siteId, { headers: { 'Authorization': `Bearer ${token}` } }).then(r=>r.json());
    const horaires = await fetch('/api/horaires?site_id=' + siteId, { headers: { 'Authorization': `Bearer ${token}` } }).then(r=>r.json());

    const response = await fetch(`/api/noms?site_id=${siteId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });
    if (!response.ok) return;

    const data = await response.json();
    const tbody = document.querySelector("#roulementNomTable tbody");
    tbody.innerHTML = '';
    data.forEach(async ({ nom, nom_id }) => {
        const tr = document.createElement('tr');
        const tdNom = document.createElement('td');
        tdNom.textContent = nom;

        // Colonne 2 : Récap roulement en vignettes
        const tdRecap = document.createElement('td');
        const roulements = await fetchRoulementsPourNom(nom_id, siteId);
        if (roulements.length === 0) {
            tdRecap.textContent = '—';
        } else {
            roulements.forEach(r => {
                // Jours
                r.jours_semaine.split(',').forEach(jour => {
                    const v = document.createElement('span');
                    v.textContent = jourToNom(jour);
                    v.className = 'roulement-vignette';
                    tdRecap.appendChild(v);
                });
                // Semaine
                const vSemaine = document.createElement('span');
                vSemaine.textContent = r.semaine_type.charAt(0).toUpperCase() + r.semaine_type.slice(1);
                vSemaine.className = 'roulement-vignette';
                tdRecap.appendChild(vSemaine);
                // Compétence
                const vComp = document.createElement('span');
                vComp.textContent = competenceLabel(r.competence_id, competences);
                vComp.className = 'roulement-vignette';
                tdRecap.appendChild(vComp);
                // Horaire
                const vHor = document.createElement('span');
                vHor.textContent = horaireLabel(r.horaire_id, horaires);
                vHor.className = 'roulement-vignette';
                tdRecap.appendChild(vHor);

                tdRecap.appendChild(document.createElement('br'));
            });
        }

        // Colonne 3 : Ajoute roulement
        const tdBtn = document.createElement('td');
        tdBtn.appendChild(createRoulementButton(nom_id, nom));

        // Colonne 4 : Supprimer roulement
        const tdSuppr = document.createElement('td');
        roulements.forEach(r => {
            const btn = document.createElement('button');
            btn.textContent = "Supprimer";
            btn.onclick = async () => {
                const token = localStorage.getItem('token');
                await fetch(`/api/troulement/${r.roulement_id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                fetchRoulementNoms();
            };
            tdSuppr.appendChild(btn);
            tdSuppr.appendChild(document.createElement('br'));
        });

        tr.appendChild(tdNom);
        tr.appendChild(tdRecap);
        tr.appendChild(tdBtn);
        tr.appendChild(tdSuppr);
        tbody.appendChild(tr);
    });
}

document.addEventListener('DOMContentLoaded', fetchRoulementNoms);