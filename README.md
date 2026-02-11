# Alfen Wallbox Card

Custom Lovelace Card für Alfen Wallboxen (z.B. Duo Pro-line).

Die Karte zeigt pro Ladepunkt:

- Großen Kreis mit **aktuellem Strom in Ampere (A)**
- **Status-Chip** (z.B. „Lädt“, „Bereit“, „Fehler“)
- Detailzeilen für **Session-Energie (kWh)**, **Stromstärke (A)** und **Verriegelung**
- Kleine Chips für **„Stecker angesteckt“** und **„Ladevorgang aktiv“** (falls konfiguriert)
- Buttons zum **Starten/Stoppen** des Ladevorgangs und zum **Verriegeln/Entriegeln**

## Installation über HACS

1. Dieses Repository auf GitHub veröffentlichen.
2. In Home Assistant **HACS** öffnen → oben rechts auf die drei Punkte → **Benutzerdefinierte Repositories**.
3. Die URL dieses Repositories eintragen, Typ: **Lovelace**.
4. In HACS unter **Frontend** die **Alfen Wallbox Card** installieren.
5. Sicherstellen, dass die Ressource geladen wird:
   - Entweder über HACS automatisch
   - Oder manuell als Ressource:
     - URL: `/hacsfiles/alfen-wallbox-card/alfen-wallbox-card.js`
     - Typ: `module`

## Verwendung im Dashboard

Nach der Installation kannst du im Dashboard-Editor eine neue Karte hinzufügen und den Typ **„Alfen Wallbox Card“** auswählen.  
Alle relevanten Entitäten lassen sich im Editor per Dropdown auswählen:

- `entity_current` – Sensor für Stromstärke in Ampere (Pflicht)
- `entity_session_energy` – Sensor für Session-Energie in kWh (optional)
- `entity_status` – Status-Sensor (z.B. charging/ready/error) (optional)
- `plugged_entity` – Binary Sensor „Stecker angesteckt“ (optional)
- `charging_entity` – Binary Sensor „Ladevorgang aktiv“ (optional)
- `switch_entity` – Switch zum Starten/Stoppen des Ladevorgangs (optional)
- `lock_entity` – Lock-Entität für Verriegelung/Entriegelung (optional)

### Beispielkonfiguration (YAML)

```yaml
type: custom:alfen-wallbox-card
name: Alfen Ladepunkt 1
entity_current: sensor.alfen_p1_current              # A
entity_session_energy: sensor.alfen_p1_session_energy # kWh
entity_status: sensor.alfen_p1_status                # optional
plugged_entity: binary_sensor.alfen_p1_plugged       # optional
charging_entity: binary_sensor.alfen_p1_charging     # optional
switch_entity: switch.alfen_p1_charging_enable       # optional
lock_entity: lock.alfen_p1_lock                      # optional
```

Für eine Duo-Wallbox kannst du zwei Karten nebeneinander in einem `horizontal-stack` verwenden.

