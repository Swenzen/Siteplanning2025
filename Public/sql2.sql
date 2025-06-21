-- Utiliser la base de données railway
USE railway;

CREATE TABLE Tnom (
    nom_id INT AUTO_INCREMENT PRIMARY KEY, -- Identifiant unique pour chaque nom
    nom VARCHAR(255) NOT NULL,             -- Nom de la personne
    date_debut DATE NOT NULL,              -- Date de début
    date_fin DATE NOT NULL                 -- Date de fin
);

CREATE TABLE Tcompetence (
    competence_id INT AUTO_INCREMENT PRIMARY KEY,
    competence VARCHAR(255) NOT NULL,
    date_debut DATE NOT NULL DEFAULT '2025-01-01', -- Date de début par défaut
    date_fin DATE NOT NULL DEFAULT '3000-01-01'    -- Date de fin par défaut
);

-- Créer la table Tcompetence_nom
CREATE TABLE Tcompetence_nom (
    competence_nom_id INT AUTO_INCREMENT PRIMARY KEY,
    nom_id INT,
    competence_id INT,
    FOREIGN KEY (nom_id) REFERENCES Tnom(nom_id) ON DELETE CASCADE,
    FOREIGN KEY (competence_id) REFERENCES Tcompetence(competence_id) ON DELETE CASCADE
);

-- Créer la table Thoraire
CREATE TABLE Thoraire (
    horaire_id INT AUTO_INCREMENT PRIMARY KEY,
    horaire_debut TIME NOT NULL,
    horaire_fin TIME NOT NULL
);

-- Créer la table Thoraire_competence
CREATE TABLE Thoraire_competence (
    horaire_competence_id INT AUTO_INCREMENT PRIMARY KEY,
    competence_id INT,
    horaire_id INT,
    FOREIGN KEY (competence_id) REFERENCES Tcompetence(competence_id) ON DELETE CASCADE,
    FOREIGN KEY (horaire_id) REFERENCES Thoraire(horaire_id) ON DELETE CASCADE
);

-- Créer la table Tjour
CREATE TABLE Tjour (
    jour_id INT AUTO_INCREMENT PRIMARY KEY,
    jour VARCHAR(20) NOT NULL
);

-- Créer la table Tplanning
CREATE TABLE Tplanning (
    planning_id INT AUTO_INCREMENT PRIMARY KEY,
    semaine INT,
    annee INT,
    jour_id INT,
    nom_id INT,
    competence_id INT,
    horaire_id INT,
    FOREIGN KEY (jour_id) REFERENCES Tjour(jour_id) ON DELETE CASCADE,
    FOREIGN KEY (nom_id) REFERENCES Tnom(nom_id) ON DELETE CASCADE,
    FOREIGN KEY (competence_id) REFERENCES Tcompetence(competence_id) ON DELETE CASCADE,
    FOREIGN KEY (horaire_id) REFERENCES Thoraire(horaire_id) ON DELETE CASCADE
);

-- Créer la table Tcompetence_order
CREATE TABLE Tcompetence_order (
    competence_id INT PRIMARY KEY,
    display_order INT,
    FOREIGN KEY (competence_id) REFERENCES Tcompetence(competence_id) ON DELETE CASCADE
);

-- Créer la table Tvacances
CREATE TABLE Tvacances (
    vacances_id INT AUTO_INCREMENT PRIMARY KEY,
    semaine INT NOT NULL,
    annee INT NOT NULL,
    nom_id INT,
    FOREIGN KEY (nom_id) REFERENCES Tnom(nom_id) ON DELETE CASCADE
);

-- Créer la table Tcommentaire
CREATE TABLE Tcommentaire (
    commentaire_id INT AUTO_INCREMENT PRIMARY KEY,
    semaine INT NOT NULL,
    annee INT NOT NULL,
    jour_id INT,
    nom_id INT,
    commentaire TEXT,
    FOREIGN KEY (jour_id) REFERENCES Tjour(jour_id) ON DELETE CASCADE,
    FOREIGN KEY (nom_id) REFERENCES Tnom(nom_id) ON DELETE CASCADE
);

-- Créer la table Tfermeture
CREATE TABLE Tfermeture (
    fermeture_id INT AUTO_INCREMENT PRIMARY KEY,
    fermeture BOOLEAN NOT NULL,
    jour_id INT,
    semaine INT NOT NULL,
    annee INT NOT NULL,
    competence_id INT,
    horaire_debut TIME NOT NULL,
    horaire_fin TIME NOT NULL,
    FOREIGN KEY (jour_id) REFERENCES Tjour(jour_id) ON DELETE CASCADE,
    FOREIGN KEY (competence_id) REFERENCES Tcompetence(competence_id) ON DELETE CASCADE
);


CREATE TABLE Tuser (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE
);


CREATE TABLE Tsite (
    site_id INT AUTO_INCREMENT PRIMARY KEY,
    site_name VARCHAR(255) NOT NULL
);

CREATE TABLE Tuser_Tsite (
    user_id INT NOT NULL,
    site_id INT NOT NULL,
    PRIMARY KEY (user_id, site_id),
    FOREIGN KEY (user_id) REFERENCES Tuser(user_id),
    FOREIGN KEY (site_id) REFERENCES Tsite(site_id)
);

CREATE TABLE Tnom_Tsite (
    nom_id INT NOT NULL,
    site_id INT NOT NULL,
    PRIMARY KEY (nom_id, site_id),
    FOREIGN KEY (nom_id) REFERENCES Tnom(nom_id) ON DELETE CASCADE,
    FOREIGN KEY (site_id) REFERENCES Tsite(site_id) ON DELETE CASCADE
);

CREATE TABLE Tcompetence_Tsite (
    competence_id INT NOT NULL,
    site_id INT NOT NULL,
    PRIMARY KEY (competence_id, site_id),
    FOREIGN KEY (competence_id) REFERENCES Tcompetence(competence_id) ON DELETE CASCADE,
    FOREIGN KEY (site_id) REFERENCES Tsite(site_id) ON DELETE CASCADE
);

CREATE TABLE Thoraire_Tsite (
    horaire_id INT NOT NULL,
    site_id INT NOT NULL,
    PRIMARY KEY (horaire_id, site_id),
    FOREIGN KEY (horaire_id) REFERENCES Thoraire(horaire_id) ON DELETE CASCADE,
    FOREIGN KEY (site_id) REFERENCES Tsite(site_id) ON DELETE CASCADE
);

-- Créer la table Thoraire_competence_Tsite
CREATE TABLE Thoraire_competence_Tsite (
    horaire_id INT NOT NULL,               -- ID de l'horaire
    competence_id INT NOT NULL,           -- ID de la compétence
    site_id INT NOT NULL,                 -- ID du site
    date_debut DATE NOT NULL,             -- Date de début de l'association
    date_fin DATE NOT NULL,               -- Date de fin de l'association
    PRIMARY KEY (horaire_id, competence_id, site_id), -- Clé primaire
    FOREIGN KEY (horaire_id) REFERENCES Thoraire(horaire_id) ON DELETE CASCADE, -- Clé étrangère vers Thoraire
    FOREIGN KEY (competence_id) REFERENCES Tcompetence(competence_id) ON DELETE CASCADE, -- Clé étrangère vers Tcompetence
    FOREIGN KEY (site_id) REFERENCES Tsite(site_id) ON DELETE CASCADE -- Clé étrangère vers Tsite
);

CREATE TABLE Tcompetence_nom_Tsite (
    nom_id INT NOT NULL,
    competence_id INT NOT NULL,
    site_id INT NOT NULL,
    PRIMARY KEY (nom_id, competence_id, site_id),
    FOREIGN KEY (nom_id) REFERENCES Tnom(nom_id) ON DELETE CASCADE,
    FOREIGN KEY (competence_id) REFERENCES Tcompetence(competence_id) ON DELETE CASCADE,
    FOREIGN KEY (site_id) REFERENCES Tsite(site_id) ON DELETE CASCADE
);

CREATE TABLE Tplanning_Tsite (
    planning_id INT NOT NULL,
    site_id INT NOT NULL,
    PRIMARY KEY (planning_id, site_id),
    FOREIGN KEY (planning_id) REFERENCES Tplanning(planning_id) ON DELETE CASCADE,
    FOREIGN KEY (site_id) REFERENCES Tsite(site_id) ON DELETE CASCADE
);


CREATE TABLE Tvacances_Tsite (
    vacances_id INT NOT NULL,
    site_id INT NOT NULL,
    PRIMARY KEY (vacances_id, site_id),
    FOREIGN KEY (vacances_id) REFERENCES Tvacances(vacances_id) ON DELETE CASCADE,
    FOREIGN KEY (site_id) REFERENCES Tsite(site_id) ON DELETE CASCADE
);

-- Ajouter la table Tcommentaire_Tsite
CREATE TABLE Tcommentaire_Tsite (
    commentaire_id INT NOT NULL,
    site_id INT NOT NULL,
    PRIMARY KEY (commentaire_id, site_id),
    FOREIGN KEY (commentaire_id) REFERENCES Tcommentaire(commentaire_id) ON DELETE CASCADE,
    FOREIGN KEY (site_id) REFERENCES Tsite(site_id) ON DELETE CASCADE
);

-- Table Trepos : Contient les types de repos
CREATE TABLE Trepos (
    repos_id INT AUTO_INCREMENT PRIMARY KEY,
    repos VARCHAR(255) NOT NULL UNIQUE
);

-- Table Trepos_Tsite : Lie un repos à un site
CREATE TABLE Trepos_Tsite (
    repos_id INT NOT NULL,
    site_id INT NOT NULL,
    PRIMARY KEY (repos_id, site_id),
    FOREIGN KEY (repos_id) REFERENCES Trepos(repos_id) ON DELETE CASCADE,
    FOREIGN KEY (site_id) REFERENCES Tsite(site_id) ON DELETE CASCADE
);

-- Table Tplanning_Trepos_Tsite : Lie un planning à un repos et un site
CREATE TABLE Tplanning_Trepos_Tsite (
    planning_id INT NOT NULL,
    repos_id INT NOT NULL,
    site_id INT NOT NULL,
    PRIMARY KEY (planning_id, repos_id, site_id),
    FOREIGN KEY (planning_id) REFERENCES Tplanning(planning_id) ON DELETE CASCADE,
    FOREIGN KEY (repos_id) REFERENCES Trepos(repos_id) ON DELETE CASCADE,
    FOREIGN KEY (site_id) REFERENCES Tsite(site_id) ON DELETE CASCADE
);

-- Créer une table pour gérer les codes d'accès des sites
CREATE TABLE Tsite_access (
    access_id INT AUTO_INCREMENT PRIMARY KEY,
    site_id INT NOT NULL,
    access_code VARCHAR(10) NOT NULL UNIQUE,
    FOREIGN KEY (site_id) REFERENCES Tsite(site_id) ON DELETE CASCADE
);

CREATE TABLE Tcompetence_disponibilite (
    disponibilite_id INT AUTO_INCREMENT PRIMARY KEY, -- Identifiant unique pour chaque période
    competence_id INT NOT NULL,                     -- Référence à la compétence
    date_debut DATE NOT NULL,                       -- Date de début de la période
    date_fin DATE NOT NULL,                         -- Date de fin de la période
    FOREIGN KEY (competence_id) REFERENCES Tcompetence(competence_id) ON DELETE CASCADE
);

CREATE TABLE Tcompetence_jour (
    competence_jour_id INT AUTO_INCREMENT PRIMARY KEY,
    competence_id INT NOT NULL, -- Référence à la compétence
    jour_id INT NOT NULL,       -- Référence au jour (lundi, mardi, etc.)
    FOREIGN KEY (competence_id) REFERENCES Tcompetence(competence_id) ON DELETE CASCADE,
    FOREIGN KEY (jour_id) REFERENCES Tjour(jour_id) ON DELETE CASCADE
);


CREATE TABLE Thoraire_competence_jour (
    horaire_id INT NOT NULL,
    competence_id INT NOT NULL,
    jour_id INT NOT NULL,
    site_id INT NOT NULL,
    PRIMARY KEY (horaire_id, competence_id, jour_id, site_id),
    FOREIGN KEY (horaire_id, competence_id, site_id) REFERENCES Thoraire_competence_Tsite(horaire_id, competence_id, site_id) ON DELETE CASCADE,
    FOREIGN KEY (jour_id) REFERENCES Tjour(jour_id) ON DELETE CASCADE
);


CREATE TABLE Tplanningv2 (
    id INT AUTO_INCREMENT PRIMARY KEY,      -- Identifiant unique auto-incrémenté
    date DATE NOT NULL,                     -- Date du planning
    nom_id INT NOT NULL,                    -- Référence à Tnom
    horaire_id INT NOT NULL,                -- Référence à Thoraire
    competence_id INT NOT NULL,             -- Référence à Tcompetence
    site_id INT NOT NULL,                   -- Référence à Tsite
    FOREIGN KEY (nom_id) REFERENCES Tnom(nom_id) ON DELETE CASCADE, -- Clé étrangère vers Tnom
    FOREIGN KEY (horaire_id, competence_id, site_id) REFERENCES Thoraire_competence_Tsite(horaire_id, competence_id, site_id) ON DELETE CASCADE, -- Clé étrangère vers Thoraire_competence_Tsite
    FOREIGN KEY (site_id) REFERENCES Tsite(site_id) ON DELETE CASCADE -- Clé étrangère vers Tsite
);


CREATE TABLE Tcommentairev2 (
    commentaire_id INT AUTO_INCREMENT PRIMARY KEY,
    site_id INT NOT NULL,
    competence_id INT NOT NULL,
    horaire_id INT NOT NULL,
    date DATE NOT NULL,
    nom_id INT DEFAULT NULL, -- NULL = commentaire sur la case, sinon sur le nom
    commentaire TEXT NOT NULL,
    date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
    auteur_id INT DEFAULT NULL, -- optionnel, si tu veux savoir qui a écrit
    INDEX idx_case (site_id, competence_id, horaire_id, date, nom_id)
);


CREATE TABLE Tvacancesv2 (
    vacances_id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    nom_id INT NOT NULL,
    site_id INT NOT NULL,
    FOREIGN KEY (nom_id) REFERENCES Tnom(nom_id) ON DELETE CASCADE,
    FOREIGN KEY (site_id) REFERENCES Tsite(site_id) ON DELETE CASCADE
);




-- Table des groupes de compétences
CREATE TABLE Tcompetence_groupe (
    groupe_id INT AUTO_INCREMENT PRIMARY KEY,
    nom_groupe VARCHAR(255) NOT NULL
);

-- Table de liaison entre compétence et groupe
CREATE TABLE Tcompetence_groupe_liaison (
    competence_id INT NOT NULL,
    groupe_id INT NOT NULL,
    PRIMARY KEY (competence_id, groupe_id),
    FOREIGN KEY (competence_id) REFERENCES Tcompetence(competence_id) ON DELETE CASCADE,
    FOREIGN KEY (groupe_id) REFERENCES Tcompetence_groupe(groupe_id) ON DELETE CASCADE
);


-- Table des groupes d’horaires
CREATE TABLE Thoraire_groupe (
    groupe_id INT AUTO_INCREMENT PRIMARY KEY,
    nom_groupe VARCHAR(255) NOT NULL
);

-- Table de liaison entre horaire et groupe
CREATE TABLE Thoraire_groupe_liaison (
    horaire_id INT NOT NULL,
    groupe_id INT NOT NULL,
    PRIMARY KEY (horaire_id, groupe_id),
    FOREIGN KEY (horaire_id) REFERENCES Thoraire(horaire_id) ON DELETE CASCADE,
    FOREIGN KEY (groupe_id) REFERENCES Thoraire_groupe(groupe_id) ON DELETE CASCADE
);

INSERT INTO Tnom (nom_id, nom, date_debut, date_fin) VALUES
(1, 'Pierre', '2025-01-01', '2025-12-31'),
(2, 'Max', '2025-02-01', '2025-11-30'),
(3, 'Sophie', '2025-03-01', '2025-10-31'),
(4, 'Julie', '2025-04-01', '2025-09-30');

-- Insérer des valeurs dans Tcompetence
INSERT INTO Tcompetence (competence_id, competence, date_debut, date_fin) VALUES
(1, 'Scanner', '2025-01-01', '2025-12-31'),
(2, 'IRM', '2025-05-01', '2025-10-31'),
(3, 'Radiologie', '2025-02-01', '2025-08-31'),
(4, 'Densitométrie', '2025-03-01', '2025-09-30');

-- Insérer des valeurs dans Thoraire
INSERT INTO Thoraire (horaire_id, horaire_debut, horaire_fin) VALUES
(1, '08:00:00', '12:00:00'),
(2, '12:00:00', '16:00:00'),
(3, '16:00:00', '20:00:00'),
(4, '08:00:00', '20:00:00');

-- Insérer des valeurs dans Tjour
INSERT INTO Tjour (jour_id, jour) VALUES
(1, 'lundi'),
(2, 'mardi'),
(3, 'mercredi'),
(4, 'jeudi'),
(5, 'vendredi'),
(6, 'samedi'),
(7, 'dimanche');

-- Insérer des valeurs dans Tcompetence_nom
INSERT INTO Tcompetence_nom (competence_nom_id, nom_id, competence_id) VALUES
(1, 1, 1),
(2, 1, 2),
(3, 2, 3),
(4, 3, 4),
(5, 4, 1);

-- Insérer des valeurs dans Thoraire_competence
INSERT INTO Thoraire_competence (horaire_competence_id, competence_id, horaire_id) VALUES
(1, 1, 1),
(2, 2, 2),
(3, 3, 3),
(4, 4, 4);

-- Insérer des valeurs dans Tplanning
INSERT INTO Tplanning (planning_id, semaine, annee, jour_id, nom_id, competence_id, horaire_id) VALUES
(1, 1, 2025, 1, 1, 1, 1),
(2, 1, 2025, 2, 2, 2, 2),
(3, 1, 2025, 3, 3, 3, 3),
(4, 1, 2025, 4, 4, 4, 4),
(5, 1, 2025, 5, 1, 2, 1);

-- Insérer des valeurs dans Tcompetence_order
INSERT INTO Tcompetence_order (competence_id, display_order) VALUES
(1, 1),
(2, 2),
(3, 3),
(4, 4);

-- Insérer des valeurs dans Tvacances
INSERT INTO Tvacances (vacances_id, semaine, annee, nom_id) VALUES
(1, 8, 2025, 1),
(2, 52, 2025, 2);

-- Insérer des valeurs dans Tcommentaire
INSERT INTO Tcommentaire (commentaire_id, semaine, annee, jour_id, nom_id, commentaire) VALUES
(1, 1, 2025, 1, 1, 'Absent pour formation'),
(2, 1, 2025, 2, 2, 'Congé exceptionnel');

-- Insérer des valeurs dans Tfermeture
INSERT INTO Tfermeture (fermeture_id, fermeture, jour_id, semaine, annee, competence_id, horaire_debut, horaire_fin) VALUES
(1, true, 1, 1, 2025, 1, '08:00:00', '12:00:00'),
(2, false, 2, 1, 2025, 2, '12:00:00', '16:00:00');

-- Insérer des valeurs dans Tsite
INSERT INTO Tsite (site_id, site_name) VALUES
(1, 'Amiens'),
(2, 'Paris'),
(3, 'Lille');

-- Insérer des valeurs dans Tnom_Tsite
INSERT INTO Tnom_Tsite (nom_id, site_id) VALUES
(1, 1),
(2, 1),
(3, 2),
(4, 3);

-- Insérer des valeurs dans Tcompetence_Tsite
INSERT INTO Tcompetence_Tsite (competence_id, site_id) VALUES
(1, 1),
(2, 1),
(3, 2),
(4, 3);

-- Insérer des valeurs dans Thoraire_Tsite
INSERT INTO Thoraire_Tsite (horaire_id, site_id) VALUES
(1, 1),
(2, 1),
(3, 2),
(4, 3);

-- Insérer des données dans Thoraire_competence_Tsite
INSERT INTO Thoraire_competence_Tsite (horaire_id, competence_id, site_id, date_debut, date_fin)
VALUES
(1, 1, 1, '2025-01-01', '2025-12-31'),
(2, 2, 1, '2025-01-01', '2025-12-31'),
(3, 3, 2, '2025-01-01', '2025-12-31'),
(4, 4, 3, '2025-01-01', '2025-12-31');

-- Insérer des valeurs dans Tcompetence_nom_Tsite
INSERT INTO Tcompetence_nom_Tsite (nom_id, competence_id, site_id) VALUES
(1, 1, 1),
(2, 2, 1),
(3, 3, 2),
(4, 4, 3);

-- Insérer des valeurs dans Tplanning_Tsite
INSERT INTO Tplanning_Tsite (planning_id, site_id) VALUES
(1, 1),
(2, 1),
(3, 2),
(4, 3),
(5, 1);

-- Insérer un utilisateur dans Tuser
INSERT INTO Tuser (user_id, username, password, email) VALUES
(1, 'p', '$2b$10$.UCnbJHFjrO.T65vUY4XEuui2TaahiYvu/9qs4/koL8axV2ka.D9S', 'p@gfg.p');

-- Associer l'utilisateur au site dans Tuser_Tsite
INSERT INTO Tuser_Tsite (user_id, site_id) VALUES
(1, 1);


INSERT INTO Tcompetence_jour (competence_id, jour_id) VALUES
(1, 7), -- Scanner indisponible le dimanche
(2, 6), -- IRM indisponible le samedi
(2, 7); -- IRM indisponible le dimanche

ALTER TABLE Tcompetence
ADD COLUMN repos BOOLEAN NOT NULL DEFAULT 0;