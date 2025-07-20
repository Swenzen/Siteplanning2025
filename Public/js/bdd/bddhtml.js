const tabs = {
    'noms': 'section-noms',
    'compétences': 'section-compétences',
    'horaires': 'section-horaires',
    'horaires par compétence': 'section-horaires par compétence',
    'horaires par compétence et jours': 'section-horaires par compétence et jours',
    'horaires par compétence avec dates': 'section-horaires par compétence avec dates',
    'compétences par nom': 'section-compétences par nom',
    'ordre compétences par nom': 'section-ordre compétences par nom',
    'jours repos': 'section-jours repos',
    'gérer les indisponibilités par compétence': 'section-gérer les indisponibilités par compétence'
};

function showSection(tab) {
    Object.values(tabs).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
    if (tabs[tab]) {
        const el = document.getElementById(tabs[tab]);
        if (el) el.style.display = '';
    }
}

function handleHash() {
    const hash = decodeURIComponent(window.location.hash.replace('#', '').toLowerCase());
    if (tabs[hash]) {
        showSection(hash);
    } else {
        showSection('noms');
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const sections = [
        "section-noms",
        "section-compétences",
        "section-horaires",
        "section-horaires par compétence",
        "section-horaires par compétence et jours",
        "section-horaires par compétence avec dates",
        "section-compétences par nom",
        "section-ordre compétences par nom",
        "section-jours repos",
        "section-gérer les indisponibilités par compétence"
    ];

    function showSectionFromHash() {
        // Cache toutes les sections
        sections.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.add("hidden");
        });

        // Affiche la section correspondant au hash ou "Noms" par défaut
        const hash = decodeURIComponent(window.location.hash.replace("#", ""));
        const sectionId = hash ? "section-" + hash : "section-noms";
        const section = document.getElementById(sectionId);
        if (section) section.classList.remove("hidden");
    }

    // Au chargement
    showSectionFromHash();

    // À chaque changement de hash (clic sur le menu)
    window.addEventListener("hashchange", showSectionFromHash);
});
