

-- Utiliser la base de données railway
USE railway;

-- Créer la table Tnom
CREATE TABLE Tnom (
    nom_id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(255) NOT NULL
);

-- Créer la table Tcompetence
CREATE TABLE Tcompetence (
    competence_id INT AUTO_INCREMENT PRIMARY KEY,
    competence VARCHAR(255) NOT NULL
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

CREATE TABLE Thoraire_competence_Tsite (
    horaire_id INT NOT NULL,
    competence_id INT NOT NULL,
    site_id INT NOT NULL,
    PRIMARY KEY (horaire_id, competence_id, site_id),
    FOREIGN KEY (horaire_id) REFERENCES Thoraire(horaire_id) ON DELETE CASCADE,
    FOREIGN KEY (competence_id) REFERENCES Tcompetence(competence_id) ON DELETE CASCADE,
    FOREIGN KEY (site_id) REFERENCES Tsite(site_id) ON DELETE CASCADE
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
-- Insérer des valeurs dans Tnom
INSERT INTO Tnom (nom_id, nom) VALUES
(1, 'Pierre'),
(2, 'Max'),
(3, 'Sophie'),
(4, 'Julie');

-- Insérer des valeurs dans Tcompetence
INSERT INTO Tcompetence (competence_id, competence) VALUES
(1, 'Scanner'),
(2, 'IRM'),
(3, 'Radiologie'),
(4, 'Densitométrie');

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

-- Insérer des valeurs dans Thoraire_competence_Tsite
INSERT INTO Thoraire_competence_Tsite (horaire_id, competence_id, site_id) VALUES
(1, 1, 1),
(2, 2, 1),
(3, 3, 2),
(4, 4, 3);

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