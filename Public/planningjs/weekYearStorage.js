// Sauvegarder les valeurs dans localStorage
document.getElementById("weekNumber").addEventListener("change", () => {
    const weekNumber = document.getElementById("weekNumber").value;
    localStorage.setItem("weekNumber", weekNumber);
});

document.getElementById("yearNumber").addEventListener("change", () => {
    const yearNumber = document.getElementById("yearNumber").value;
    localStorage.setItem("yearNumber", yearNumber);
});

// Charger les valeurs depuis localStorage au chargement de la page
document.addEventListener("DOMContentLoaded", () => {
    const savedWeekNumber = localStorage.getItem("weekNumber");
    const savedYearNumber = localStorage.getItem("yearNumber");

    if (savedWeekNumber) {
        document.getElementById("weekNumber").value = savedWeekNumber;
    }

    if (savedYearNumber) {
        document.getElementById("yearNumber").value = savedYearNumber;
    }
});