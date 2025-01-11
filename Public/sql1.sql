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
    FOREIGN KEY (nom_id) REFERENCES Tnom(nom_id),
    FOREIGN KEY (competence_id) REFERENCES Tcompetence(competence_id)
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
    FOREIGN KEY (competence_id) REFERENCES Tcompetence(competence_id),
    FOREIGN KEY (horaire_id) REFERENCES Thoraire(horaire_id)
);

-- Créer la table Tjour
CREATE TABLE Tjour (
    jour_id INT AUTO_INCREMENT PRIMARY KEY,
    jour VARCHAR(20) NOT NULL
);

-- Insérer des valeurs dans Tjour
INSERT INTO Tjour (jour_id, jour) VALUES
(1, 'lundi'),
(2, 'mardi'),
(3, 'mercredi'),
(4, 'jeudi'),
(5, 'vendredi'),
(6, 'samedi'),
(7, 'dimanche');

-- Créer la table Tplanning
CREATE TABLE Tplanning (
    planning_id INT AUTO_INCREMENT PRIMARY KEY,
    semaine INT,
    annee INT,
    jour_id INT,
    nom_id INT,
    competence_id INT,
    horaire_id INT,
    FOREIGN KEY (jour_id) REFERENCES Tjour(jour_id),
    FOREIGN KEY (nom_id) REFERENCES Tnom(nom_id),
    FOREIGN KEY (competence_id) REFERENCES Tcompetence(competence_id),
    FOREIGN KEY (horaire_id) REFERENCES Thoraire(horaire_id)
);

-- Insérer des valeurs dans Tnom
INSERT INTO Tnom (nom_id, nom) VALUES
(1, 'Pierre'),
(2, 'Max');

-- Insérer des valeurs dans Tcompetence
INSERT INTO Tcompetence (competence_id, competence) VALUES
(1, 'scanner'),
(2, 'irm'),
(3, 'test'),
(4, 'densito');

-- Insérer des valeurs dans Tcompetence_nom
INSERT INTO Tcompetence_nom (competence_nom_id, nom_id, competence_id) VALUES
(1, 1, 1),
(2, 1, 2),
(3, 1, 3),
(4, 2, 2),
(5, 2, 3);

-- Insérer des valeurs dans Thoraire
INSERT INTO Thoraire (horaire_id, horaire_debut, horaire_fin) VALUES
(1, '08:00:00', '16:00:00'),
(2, '10:00:00', '18:00:00'),
(3, '12:00:00', '20:00:00'),
(4, '08:00:00', '20:00:00');

-- Insérer des valeurs dans Thoraire_competence
INSERT INTO Thoraire_competence (horaire_competence_id, competence_id, horaire_id) VALUES
(1, 1, 1),
(2, 2, 2),
(3, 3, 3),
(4, 4, 4);

-- Insérer des valeurs dans Tplanning
INSERT INTO Tplanning (planning_id, semaine, annee, jour_id, nom_id, competence_id, horaire_id) VALUES
(1, 1, 2025, 1, 1, 1, 1),
(2, 1, 2025, 2, 1, 2, 2),
(3, 1, 2025, 3, 1, 3, 3),
(4, 1, 2025, 4, 2, 2, 2),
(5, 1, 2025, 5, 2, 3, 3);