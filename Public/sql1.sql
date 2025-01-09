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
    horaire VARCHAR(255) NOT NULL
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

-- Ajouter un index sur les colonnes semaine et annee
CREATE INDEX idx_semaine_annee ON Tplanning(semaine, annee);

-- Insérer des valeurs dans Tnom
INSERT INTO Tnom (nom_id, nom) VALUES
(1, 'pierre'),
(2, 'max');

-- Insérer des valeurs dans Tcompetence
INSERT INTO Tcompetence (competence_id, competence) VALUES
(1, 'scanner'),
(2, 'irm');

-- Insérer des valeurs dans Tcompetence_nom
INSERT INTO Tcompetence_nom (competence_nom_id, nom_id, competence_id) VALUES
(1, 1, 1),
(2, 1, 2),
(3, 2, 1);

-- Insérer des valeurs dans Thoraire
INSERT INTO Thoraire (horaire_id, horaire) VALUES
(1, '8h 16h'),
(2, '10h 18h'),
(3, '12h 20h');

-- Insérer des valeurs dans Thoraire_competence
INSERT INTO Thoraire_competence (horaire_competence_id, competence_id, horaire_id) VALUES
(1, 1, 1),
(2, 1, 2),
(3, 2, 1),
(4, 2, 2),
(5, 2, 3);