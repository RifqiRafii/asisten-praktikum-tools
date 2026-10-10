-- ========================================================
-- Schema Database MySQL: asisten_praktikum_db
-- Dibuat persis sesuai spesifikasi SCHEMA.md
-- ========================================================

CREATE DATABASE IF NOT EXISTS `asisten_praktikum_db`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `asisten_praktikum_db`;

-- 1. Tabel matakuliah
CREATE TABLE IF NOT EXISTS `matakuliah` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nama` VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tabel praktikan
CREATE TABLE IF NOT EXISTS `praktikan` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nim` VARCHAR(20) NOT NULL UNIQUE,
  `nama` VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tabel modul
CREATE TABLE IF NOT EXISTS `modul` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `matakuliah_id` INT NOT NULL,
  `judul_modul` VARCHAR(100) NOT NULL,
  CONSTRAINT `fk_modul_matakuliah`
    FOREIGN KEY (`matakuliah_id`) REFERENCES `matakuliah` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Tabel rubrik
CREATE TABLE IF NOT EXISTS `rubrik` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `modul_id` INT NOT NULL,
  `judul_tugas` VARCHAR(100) NOT NULL,
  `instruksi_soal` TEXT,
  `kriteria_penilaian` JSON,
  CONSTRAINT `fk_rubrik_modul`
    FOREIGN KEY (`modul_id`) REFERENCES `modul` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Tabel penilaian
CREATE TABLE IF NOT EXISTS `penilaian` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `praktikan_id` INT NOT NULL,
  `modul_id` INT NOT NULL,
  `nilai_angka` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `catatan_evaluasi` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_penilaian_praktikan`
    FOREIGN KEY (`praktikan_id`) REFERENCES `praktikan` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_penilaian_modul`
    FOREIGN KEY (`modul_id`) REFERENCES `modul` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
