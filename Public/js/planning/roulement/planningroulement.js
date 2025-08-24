function createRoulementButton(nom_id, nom) {
    const btn = document.createElement('button');
    btn.textContent = "Ajoute roulement";
    btn.onclick = () => openRoulementMenu(nom_id, nom);
    return btn;
}

function openRoulementMenu(nom_id, nom) {
    // Création de l'overlay et du contenu modal
    const overlay = document.createElement('div');
    overlay.className = 'roulement-overlay';
    const modal = document.createElement('div');
    modal.className = 'roulement-modal';

        modal.innerHTML = `
                <h3>Roulement pour ${nom}</h3>
                <label>Jours de la semaine</label>
                <div class="roulement-days">
                    ${[1,2,3,4,5,6,7].map(j => `
                        <div class="roulement-day">
                            <strong>${['L','M','M','J','V','S','D'][j-1]}</strong>
                            <input type="checkbox" value="${j}" class="jour-checkbox" aria-label="${['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'][j-1]}">
                        </div>
                    `).join('')}
                </div>

                <label>Semaine</label>
                <select id="semaineType" class="roulement-select">
                        <option value="toutes">Toutes</option>
                        <option value="paire">Paire</option>
                        <option value="impaire">Impaire</option>
                </select>

                <label>Couple compétence / horaire</label>
                <select id="coupleSelect" class="roulement-select"></select>

                <div class="roulement-actions">
                    <button id="roulementAnnuler">Annuler</button>
                    <button id="roulementValider" class="success">Valider</button>
                </div>
        `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Fermeture au clic en dehors de la boîte
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove();
    });
    // Fermeture clavier (Échap)
    const onKeyDown = (e) => { if (e.key === 'Escape') { overlay.remove(); window.removeEventListener('keydown', onKeyDown); } };
    window.addEventListener('keydown', onKeyDown);

        // Remplir la liste des couples (compétence + horaire) dynamiquement
    const token = localStorage.getItem('token');
        const siteId = sessionStorage.getItem('selectedSite');
            Promise.all([
                fetch('/api/competences?site_id=' + siteId, { headers: { 'Authorization': `Bearer ${token}` } }).then(r=>r.json()),
                fetch('/api/horaires?site_id=' + siteId, { headers: { 'Authorization': `Bearer ${token}` } }).then(r=>r.json()),
                fetch('/api/horaires-competences?site_id=' + siteId, { headers: { 'Authorization': `Bearer ${token}` } }).then(r=>r.json())
            ]).then(([competences, horaires, hcList]) => {
                const select = modal.querySelector('#coupleSelect');
                const options = [];
                // Index pour libellés
                const compById = new Map(competences.map(c => [String(c.competence_id), c.competence]));
                const horaireById = new Map(horaires.map(h => [String(h.horaire_id), h]));
                // hcList: [{horaire_id, horaire_debut, horaire_fin, competences:[ids]}]
                hcList.forEach(h => {
                    const hInfo = horaireById.get(String(h.horaire_id)) || { horaire_debut: h.horaire_debut, horaire_fin: h.horaire_fin };
                    (h.competences || []).forEach(cid => {
                        const compName = compById.get(String(cid));
                        if (!compName) return; // sécurité
                        options.push({
                            value: `${cid}|${h.horaire_id}`,
                            label: `${compName} — ${hInfo.horaire_debut} - ${hInfo.horaire_fin}`
                        });
                    });
                });
                // Tri alpha par libellé
                options.sort((a,b)=>a.label.localeCompare(b.label,'fr'));
                if (options.length === 0) {
                    const opt = document.createElement('option');
                    opt.value = '';
                    opt.textContent = 'Aucun couple disponible';
                    select.appendChild(opt);
                    select.disabled = true;
                } else {
                    options.forEach(o => {
                        const opt = document.createElement('option');
                        opt.value = o.value;
                        opt.textContent = o.label;
                        select.appendChild(opt);
                    });
                }
            }).catch((e)=>{ console.warn('[roulement] couples indisponibles', e); });

    modal.querySelector('#roulementAnnuler').onclick = () => { overlay.remove(); window.removeEventListener('keydown', onKeyDown); };

    modal.querySelector('#roulementValider').onclick = async (e) => {
        const btn = e.currentTarget;
        const jours = Array.from(modal.querySelectorAll('.jour-checkbox'))
            .filter(cb => cb.checked)
            .map(cb => cb.value)
            .join(',');
        const semaineType = modal.querySelector('#semaineType').value;
    const couple = modal.querySelector('#coupleSelect').value || '';
    const [competence_id, horaire_id] = couple.split('|');
        const site_id = sessionStorage.getItem('selectedSite');

        // Validations côté client
        if (!localStorage.getItem('token')) {
            alert('Vous devez être connecté pour ajouter un roulement.');
            return;
        }
        if (!site_id) {
            alert('Sélectionnez un site avant d\'ajouter un roulement.');
            return;
        }
        if (!jours) {
            alert('Sélectionnez au moins un jour.');
            return;
        }
    if (!competence_id || !horaire_id) {
            alert('Sélectionnez une compétence et un horaire.');
            return;
        }

        // Envoi à l'API avec gestion d'erreurs
        const token = localStorage.getItem('token');
        btn.disabled = true;
        try {
            const resp = await fetch('/api/troulement', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    nom_id, competence_id, horaire_id, jours_semaine: jours, semaine_type: semaineType, site_id
                })
            });
            if (!resp.ok) {
                const text = await resp.text();
                alert(`Échec de l\'ajout du roulement (${resp.status}) : ${text || 'Erreur inconnue'}`);
                btn.disabled = false;
                return;
            }
            overlay.remove();
            window.removeEventListener('keydown', onKeyDown);
            alert('Roulement ajouté !');
            fetchRoulementNoms();
        } catch (err) {
            console.error('Erreur réseau lors de l\'ajout du roulement:', err);
            alert('Erreur réseau lors de l\'ajout du roulement. Vérifiez le serveur.');
            btn.disabled = false;
        }
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
    // Tri alphabétique (fr) des noms pour l'affichage
    data.sort((a, b) => (a.nom || '').localeCompare(b.nom || '', 'fr', { sensitivity: 'base' }));
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