# StoreLog

StoreLog ist eine Progressive Web App zur Verwaltung persönlicher Gegenstände und deren Aufbewahrungsorte. Ziel ist es, schnell herauszufinden, wo sich ein bestimmter Gegenstand befindet.

## Funktionen

### Sofortsuche
Eingabe eines Gegenstandsnamens zeigt unmittelbar den zugehörigen Aufbewahrungsort.

### Verschachtelte Orte
Hierarchische Struktur von Orten, z. B. Zimmer → Schrank → Schublade → Box.

### Schnelles Hinzufügen
Gegenstände können mit minimalem Aufwand erfasst werden: Name eingeben, Ort auswählen, speichern.

### Offline-Nutzung
Die Anwendung funktioniert vollständig ohne Internetverbindung. Alle Daten werden lokal gespeichert.

### Installierbar als App
Die Anwendung kann über den Browser auf dem Gerät installiert und wie eine native App genutzt werden.

### Datensicherung
Export und Import der Daten im JSON-Format zur Sicherung und Wiederherstellung.

## Entwicklung

```bash
bun install
bun run dev
```

## Self-Hosting mit Docker

Die App kann auf einem Homeserver als Docker-Container betrieben werden. Daten werden in einer SQLite-Datenbank auf dem Host gespeichert.

### Schnellstart mit Docker Compose

```bash
docker compose up -d
```

Die App ist danach unter `http://<server-ip>:3000` erreichbar. Die Daten werden im Docker-Volume `storelog-data` persistiert.

### Image manuell bauen und starten

```bash
# Image bauen
docker build -t storelog .

# Container starten (Daten in lokalem Verzeichnis ./data)
docker run -d \
  --name storelog \
  -p 3000:3000 \
  -v $(pwd)/data:/data \
  --restart unless-stopped \
  storelog
```

### Port anpassen

In `docker-compose.yml` den Port unter `ports` anpassen, z.B. `"8080:3000"` für Port 8080.

### Datensicherung

Die SQLite-Datei liegt im gemounteten Volume unter `/data/storelog.db`. Diese Datei einfach kopieren oder sichern.

## Lizenz

Dieses Projekt steht unter der GNU General Public License v3.0 (GPLv3).
