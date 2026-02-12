class AlfenWallboxCard extends HTMLElement {
  static getConfigElement() {
    return document.createElement("alfen-wallbox-card-editor");
  }

  static getStubConfig() {
    return {
      name: "Alfen Wallbox",
      entity_current: "",
    };
  }

  setConfig(config) {
    this._config = { ...config };
    if (this.card) return;

    const card = document.createElement("ha-card");
    card.classList.add("alfen-wallbox-card");
    this.card = card;
    this.appendChild(card);
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._config || !this.card) return;

    const cfg = this._config;

    const getState = (entityId) =>
      entityId && hass.states[entityId] ? hass.states[entityId] : null;

    const isTruthy = (stateObj) => {
      if (!stateObj || stateObj.state === undefined || stateObj.state === null) {
        return false;
      }
      const v = stateObj.state.toString().toLowerCase();
      return v === "on" || v === "true" || v === "1";
    };

    const currentState = getState(cfg.entity_current);
    const statusState = getState(cfg.entity_status);
    const sessionEnergyState = getState(cfg.entity_session_energy);
    const setCurrentState = getState(cfg.entity_set_current);
    const onlineState = getState(cfg.online_entity);
    const switchState = getState(cfg.switch_entity);
    const pluggedState = getState(cfg.plugged_entity);
    const chargingState = getState(cfg.charging_entity);

    const name =
      cfg.name ||
      (currentState && currentState.attributes.friendly_name) ||
      "Alfen Wallbox";

    // Kreis: aktueller Strom
    const rawCurrentCircle = currentState ? currentState.state : "unavailable";
    const currentCircleDisplay =
      !rawCurrentCircle ||
      rawCurrentCircle === "unknown" ||
      rawCurrentCircle === "unavailable"
        ? "- A"
        : `${rawCurrentCircle} A`;

    // Detail: Aktuelle Leistung – Sensor liefert Watt, Anzeige in kW
    const rawSessionEnergy = sessionEnergyState ? sessionEnergyState.state : null;
    let sessionDisplay = "- kW";
    if (
      rawSessionEnergy !== null &&
      rawSessionEnergy !== undefined &&
      rawSessionEnergy !== "unknown" &&
      rawSessionEnergy !== "unavailable"
    ) {
      const w = Number(rawSessionEnergy);
      if (!Number.isNaN(w)) {
        const kw = w / 1000;
        sessionDisplay = `${kw.toFixed(1)} kW`;
      }
    }

    // Detail: Vorgabe Ladestrom – eigene Entität, unabhängig vom Kreis
    const rawSetCurrent = setCurrentState ? setCurrentState.state : null;
    const setCurrentDisplay =
      !rawSetCurrent ||
      rawSetCurrent === "unknown" ||
      rawSetCurrent === "unavailable"
        ? "- A"
        : `${rawSetCurrent} A`;

    // Online-Status (z.B. Backoffice connected)
    const onlineOn = isTruthy(onlineState);
    const onlineDisplay = !onlineState
      ? "-"
      : onlineOn
      ? "Online"
      : "Offline";

    const pluggedOn = isTruthy(pluggedState);
    const chargingOn = isTruthy(chargingState);

    // Konfigurierbare Farben (optional)
    const colorOnlineOn = cfg.color_online_on || null;
    const colorOnlineOff = cfg.color_online_off || null;
    const colorChargingOn = cfg.color_charging_on || null;
    const colorChargingOff = cfg.color_charging_off || null;
    const colorPluggedOn = cfg.color_plugged_on || null;
    const colorPluggedOff = cfg.color_plugged_off || null;

    // Status oben rechts
    let statusText = "Bereit";
    let statusClass = "status-idle";

    if (statusState && statusState.state) {
      const s = statusState.state.toString().toLowerCase();
      if (["charging", "ladevorgang", "laden"].includes(s)) {
        statusText = "Lädt";
        statusClass = "status-charging";
      } else if (["ready", "bereit"].includes(s)) {
        statusText = "Bereit";
        statusClass = "status-idle";
      } else if (["error", "faulted", "fehler"].includes(s)) {
        statusText = "Fehler";
        statusClass = "status-error";
      } else {
        statusText = statusState.state;
        statusClass = "status-unknown";
      }
    } else {
      if (chargingOn) {
        statusText = "Lädt";
        statusClass = "status-charging";
      } else if (pluggedOn) {
        statusText = "Fahrzeug eingesteckt";
        statusClass = "status-plugged";
      }
    }

    // Chips
    const plugChipText = pluggedOn ? "Besetzt" : "Frei";
    const plugChipClass = pluggedOn ? "chip-on" : "chip-off";

    const chargeChipText = chargingOn
      ? "Ladevorgang aktiv"
      : "Ladevorgang inaktiv";
    const chargeChipClass = chargingOn ? "chip-status-on" : "chip-status-off";

    // Button Laden Start/Stop
    const switchOn = switchState && isTruthy(switchState);
    const switchLabel = switchOn ? "Laden stoppen" : "Laden starten";

    // HTML
    this.card.innerHTML = `
      <style>
        .alfen-wallbox-card .wrapper {
          padding: 14px 16px;
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 12px 16px;
          align-items: center;
        }
        .alfen-wallbox-card .left {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }
        .alfen-wallbox-card .right {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .alfen-wallbox-card .power-circle {
          width: 110px;
          height: 110px;
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.18);
          transition: border-color 0.3s ease, transform 0.2s ease,
            box-shadow 0.3s ease;
          border: 4px solid #9ca3af;
          background: radial-gradient(circle at 50% 50%, #111827, #020617);
          color: #f9fafb;
        }
        .alfen-wallbox-card .power-circle:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(0,0,0,0.3);
        }
        .alfen-wallbox-card .power-value {
          font-size: 22px;
          font-weight: 700;
        }
        .alfen-wallbox-card .power-label {
          font-size: 12px;
          opacity: 0.9;
        }
        .alfen-wallbox-card .title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .alfen-wallbox-card .title {
          font-weight: 600;
          font-size: 16px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .alfen-wallbox-card .title-icon ha-icon {
          --mdc-icon-size: 20px;
        }
        .alfen-wallbox-card .status-chip {
          padding: 2px 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 500;
          white-space: nowrap;
        }
        .alfen-wallbox-card .details {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 14px;
        }
        .alfen-wallbox-card .detail-row {
          display: flex;
          justify-content: space-between;
        }
        .alfen-wallbox-card .label {
          opacity: 0.8;
        }
        .alfen-wallbox-card .value {
          font-weight: 500;
        }
        .alfen-wallbox-card .chips {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }
        .alfen-wallbox-card .chip {
          padding: 2px 8px;
          border-radius: 999px;
          font-size: 11px;
          border: 1px solid rgba(0,0,0,0.15);
        }
        .alfen-wallbox-card .chip-on {
          background: rgba(34, 197, 94, 0.12);
          border-color: rgba(34, 197, 94, 0.6);
          color: #166534;
        }
        .alfen-wallbox-card .chip-off {
          background: rgba(148, 163, 184, 0.12);
          border-color: rgba(148, 163, 184, 0.7);
          color: #475569;
        }
        /* Blaue Status-Chips (z.B. Online, Ladevorgang aktiv) */
        .alfen-wallbox-card .chip-status-on {
          background: rgba(59, 130, 246, 0.18);
          border-color: rgba(37, 99, 235, 0.9);
          color: #1d4ed8;
        }
        .alfen-wallbox-card .chip-status-off {
          background: rgba(148, 163, 184, 0.16);
          border-color: rgba(148, 163, 184, 0.7);
          color: #9ca3af;
        }
        .alfen-wallbox-card .actions {
          margin-top: 6px;
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .alfen-wallbox-card .btn {
          border-radius: 20px;
          border: none;
          padding: 6px 10px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: rgba(148, 163, 184, 0.16);
          color: inherit;
        }
        .alfen-wallbox-card .btn-primary {
          background: #22c55e;
          color: #ffffff;
        }
        .alfen-wallbox-card .btn-primary.stop {
          background: #dc2626;
        }

        .alfen-wallbox-card .status-idle .power-circle {
          border-color: #9ca3af;
        }
        .alfen-wallbox-card .status-plugged .power-circle {
          border-color: #22c55e;
        }
        .alfen-wallbox-card .status-charging .power-circle {
          border-color: #16a34a;
        }
        .alfen-wallbox-card .status-error .power-circle {
          border-color: #ef4444;
        }
        .alfen-wallbox-card .status-unknown .power-circle {
          border-color: #0ea5e9;
        }

        .alfen-wallbox-card .status-idle .status-chip {
          background: rgba(148, 163, 184, 0.18);
          color: #111827;
        }
        .alfen-wallbox-card .status-plugged .status-chip,
        .alfen-wallbox-card .status-charging .status-chip {
          background: rgba(34, 197, 94, 0.18);
          color: #166534;
        }
        .alfen-wallbox-card .status-error .status-chip {
          background: rgba(239, 68, 68, 0.18);
          color: #b91c1c;
        }
        .alfen-wallbox-card .status-unknown .status-chip {
          background: rgba(59, 130, 246, 0.18);
          color: #1d4ed8;
        }

        @media (max-width: 500px) {
          .alfen-wallbox-card .wrapper {
            grid-template-columns: 1fr;
            justify-items: center;
          }
          .alfen-wallbox-card .right {
            width: 100%;
          }
          .alfen-wallbox-card .title-row {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      </style>
      <div class="wrapper ${statusClass}">
        <div class="left">
          <div class="power-circle">
            <div class="power-value">${currentCircleDisplay}</div>
            <div class="power-label">Aktueller Strom</div>
          </div>
        </div>
        <div class="right">
          <div class="title-row">
            <div class="title">
              <span class="title-icon">
                <ha-icon icon="mdi:ev-station"></ha-icon>
              </span>
              <span>${name}</span>
            </div>
            <div class="status-chip">${statusText}</div>
          </div>

          <div class="details">
            <div class="detail-row">
              <span class="label">Aktuelle Leistung</span>
              <span class="value">${sessionDisplay}</span>
            </div>
            <div class="detail-row">
              <span class="label">Vorgabe Ladestrom</span>
              <span class="value">${setCurrentDisplay}</span>
            </div>
          </div>

          <div class="chips">
            ${
              cfg.plugged_entity
                ? `<span class="chip ${plugChipClass}" ${
                    pluggedOn && colorPluggedOn
                      ? `style="background:${colorPluggedOn};border-color:${colorPluggedOn};color:#ffffff;"`
                      : !pluggedOn && colorPluggedOff
                      ? `style="background:${colorPluggedOff};border-color:${colorPluggedOff};color:#ffffff;"`
                      : ""
                  }>${plugChipText}</span>`
                : ""
            }
            ${
              cfg.online_entity
                ? `<span class="chip ${
                    onlineOn ? "chip-status-on" : "chip-status-off"
                  }" ${
                    onlineOn && colorOnlineOn
                      ? `style="background:${colorOnlineOn};border-color:${colorOnlineOn};color:#ffffff;"`
                      : !onlineOn && colorOnlineOff
                      ? `style="background:${colorOnlineOff};border-color:${colorOnlineOff};color:#ffffff;"`
                      : ""
                  }>${onlineOn ? "Online" : "Offline"}</span>`
                : ""
            }
            ${
              cfg.charging_entity
                ? `<span class="chip ${chargeChipClass}" ${
                    chargingOn && colorChargingOn
                      ? `style="background:${colorChargingOn};border-color:${colorChargingOn};color:#ffffff;"`
                      : !chargingOn && colorChargingOff
                      ? `style="background:${colorChargingOff};border-color:${colorChargingOff};color:#ffffff;"`
                      : ""
                  }>${chargeChipText}</span>`
                : ""
            }
          </div>

          <div class="actions">
            ${
              cfg.switch_entity
                ? `<button class="btn btn-primary ${
                    switchOn ? "stop" : "start"
                  }" data-action="toggle_switch">
                     <ha-icon icon="${
                       switchOn ? "mdi:stop-circle" : "mdi:play-circle"
                     }"></ha-icon>
                     <span>${switchLabel}</span>
                   </button>`
                : ""
            }
          </div>
        </div>
      </div>
    `;

    // Button Actions
    const buttons = this.card.querySelectorAll("button[data-action]");
    buttons.forEach((btn) => {
      btn.addEventListener("click", (ev) => {
        const action = ev.currentTarget.getAttribute("data-action");
        if (!this._hass || !this._config) return;

        if (action === "toggle_switch" && this._config.switch_entity) {
          const st = getState(this._config.switch_entity);
          const isOn = isTruthy(st);
          const [domain] = this._config.switch_entity.split(".");
          const service = isOn ? "turn_off" : "turn_on";
          this._hass.callService(domain, service, {
            entity_id: this._config.switch_entity,
          });
        }
      });
    });
  }

  getCardSize() {
    return 4;
  }
}

customElements.define("alfen-wallbox-card", AlfenWallboxCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "alfen-wallbox-card",
  name: "Alfen Wallbox Card",
  description:
    "Zeigt Strom (A), Status, Session-Energie und Steuerung eines Alfen-Ladepunkts an.",
});

class AlfenWallboxCardEditor extends HTMLElement {
  set hass(hass) {
    this._hass = hass;
  }

  setConfig(config) {
    this._config = { ...config };
    if (this.isConnected) {
      this._render();
    }
  }

  connectedCallback() {
    this._render();
  }

  _render() {
    if (!this._hass) return;

    if (this._root) {
      this._root.innerHTML = "";
    } else {
      this._root = this.attachShadow({ mode: "open" });
    }

    const root = this._root;
    const cfg = this._config || {};
    const entities = this._hass.states;

    const makeSelect = (label, key, filterFn) => {
      const wrapper = document.createElement("div");
      wrapper.classList.add("field");

      const lab = document.createElement("label");
      lab.textContent = label;
      lab.style.display = "block";
      lab.style.fontSize = "12px";
      lab.style.marginBottom = "2px";

      const select = document.createElement("select");
      select.style.width = "100%";
      select.style.padding = "4px 6px";
      select.style.background = "var(--card-background-color)";
      select.style.color = "var(--primary-text-color)";
      select.style.borderRadius = "4px";
      select.style.border = "1px solid var(--divider-color)";

      const empty = document.createElement("option");
      empty.value = "";
      empty.textContent = "– nicht gesetzt –";
      select.appendChild(empty);

      Object.keys(entities)
        .filter(filterFn)
        .sort()
        .forEach((id) => {
          const opt = document.createElement("option");
          opt.value = id;
          opt.textContent = id;
          select.appendChild(opt);
        });

      select.value = cfg[key] || "";

      select.addEventListener("change", (ev) => {
        this._config = {
          ...this._config,
          [key]: ev.target.value || undefined,
        };
        this._fireConfigChanged();
      });

      wrapper.appendChild(lab);
      wrapper.appendChild(select);
      return wrapper;
    };

    const makeColorInput = (label, key) => {
      const wrapper = document.createElement("div");
      wrapper.classList.add("field");

      const lab = document.createElement("label");
      lab.textContent = label;
      lab.style.display = "block";
      lab.style.fontSize = "12px";
      lab.style.marginBottom = "2px";

      const input = document.createElement("input");
      input.type = "color";
      input.style.width = "60px";
      input.style.height = "26px";
      input.value = cfg[key] || "";

      input.addEventListener("change", (ev) => {
        this._config = {
          ...this._config,
          [key]: ev.target.value || undefined,
        };
        this._fireConfigChanged();
      });

      wrapper.appendChild(lab);
      wrapper.appendChild(input);
      return wrapper;
    };

    const style = document.createElement("style");
    style.textContent = `
      .card-editor {
        padding: 12px 14px 14px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        font-size: 13px;
      }
      .section {
        border-radius: 12px;
        border: 1px solid var(--divider-color);
        padding: 10px 12px 12px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        background: rgba(15, 23, 42, 0.35);
      }
      .section-title {
        font-size: 12px;
        font-weight: 600;
        opacity: 0.85;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .row {
        display: flex;
        gap: 8px;
      }
      .row > .field {
        flex: 1;
      }
      .field label {
        display: block;
        font-size: 12px;
        margin-bottom: 2px;
        opacity: 0.9;
      }
      .field input[type="text"],
      .field select {
        width: 100%;
        box-sizing: border-box;
        padding: 4px 6px;
        border-radius: 6px;
        border: 1px solid var(--divider-color);
        background: var(--card-background-color);
        color: var(--primary-text-color);
        font: inherit;
      }
      .field input[type="color"] {
        width: 100%;
        box-sizing: border-box;
        padding: 1px;
        border-radius: 6px;
        border: 1px solid var(--divider-color);
        background: var(--card-background-color);
      }
    `;
    root.appendChild(style);

    const container = document.createElement("div");
    container.classList.add("card-editor");

    // Abschnitt: Allgemein
    const sectionGeneral = document.createElement("div");
    sectionGeneral.classList.add("section");
    const titleGeneral = document.createElement("div");
    titleGeneral.classList.add("section-title");
    titleGeneral.textContent = "Allgemein";
    sectionGeneral.appendChild(titleGeneral);

    const nameField = document.createElement("div");
    nameField.classList.add("field");
    const nameLabel = document.createElement("label");
    nameLabel.textContent = "Name";
    nameLabel.style.display = "block";
    nameLabel.style.fontSize = "12px";
    nameLabel.style.marginBottom = "2px";
    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.value = cfg.name || "";
    nameInput.addEventListener("change", (ev) => {
      this._config = {
        ...this._config,
        name: ev.target.value,
      };
      this._fireConfigChanged();
    });
    nameField.appendChild(nameLabel);
    nameField.appendChild(nameInput);
    sectionGeneral.appendChild(nameField);

    sectionGeneral.appendChild(
      makeSelect(
        "Aktueller Strom – entity_current",
        "entity_current",
        (id) => id.startsWith("sensor.")
      )
    );

    container.appendChild(sectionGeneral);

    // Abschnitt: Messwerte
    const sectionMetrics = document.createElement("div");
    sectionMetrics.classList.add("section");
    const titleMetrics = document.createElement("div");
    titleMetrics.classList.add("section-title");
    titleMetrics.textContent = "Messwerte";
    sectionMetrics.appendChild(titleMetrics);

    const row1 = document.createElement("div");
    row1.classList.add("row");
    row1.appendChild(
      makeSelect(
        "Aktuelle Leistung",
        "entity_session_energy",
        (id) => id.startsWith("sensor.")
      )
    );
    row1.appendChild(
      makeSelect(
        "Wallboxname",
        "entity_status",
        (id) => id.startsWith("sensor.")
      )
    );
    sectionMetrics.appendChild(row1);

    const rowSet = document.createElement("div");
    rowSet.classList.add("row");
    rowSet.appendChild(
      makeSelect(
        "Vorgabe Ladestrom",
        "entity_set_current",
        (id) => id.startsWith("sensor.")
      )
    );
    sectionMetrics.appendChild(rowSet);

    container.appendChild(sectionMetrics);

    // Abschnitt: Status & Steuerung
    const sectionStatus = document.createElement("div");
    sectionStatus.classList.add("section");
    const titleStatus = document.createElement("div");
    titleStatus.classList.add("section-title");
    titleStatus.textContent = "Status & Steuerung";
    sectionStatus.appendChild(titleStatus);

    const row2 = document.createElement("div");
    row2.classList.add("row");
    row2.appendChild(
      makeSelect(
        "Stecker angesteckt",
        "plugged_entity",
        (id) => id.startsWith("sensor.")
      )
    );
    row2.appendChild(
      makeSelect(
        "Ladevorgang aktiv",
        "charging_entity",
        (id) => id.startsWith("sensor.")
      )
    );
    sectionStatus.appendChild(row2);

    const row3 = document.createElement("div");
    row3.classList.add("row");
    row3.appendChild(
      makeSelect("Laden Start/Stop", "switch_entity", (id) =>
        id.startsWith("sensor.")
      )
    );
    row3.appendChild(
      makeSelect("Online-Status", "online_entity", (id) =>
        id.startsWith("sensor.")
      )
    );
    sectionStatus.appendChild(row3);

    container.appendChild(sectionStatus);

    // Abschnitt: Farben
    const sectionColors = document.createElement("div");
    sectionColors.classList.add("section");
    const titleColors = document.createElement("div");
    titleColors.classList.add("section-title");
    titleColors.textContent = "Farben (optional)";
    sectionColors.appendChild(titleColors);

    const rowColors1 = document.createElement("div");
    rowColors1.classList.add("row");
    rowColors1.appendChild(
      makeColorInput("Stecker angesteckt (AN)", "color_plugged_on")
    );
    rowColors1.appendChild(
      makeColorInput("Stecker angesteckt (AUS)", "color_plugged_off")
    );
    sectionColors.appendChild(rowColors1);

    const rowColors2 = document.createElement("div");
    rowColors2.classList.add("row");
    rowColors2.appendChild(
      makeColorInput("Online aktiv (AN)", "color_online_on")
    );
    rowColors2.appendChild(
      makeColorInput("Online aktiv (AUS)", "color_online_off")
    );
    sectionColors.appendChild(rowColors2);

    const rowColors3 = document.createElement("div");
    rowColors3.classList.add("row");
    rowColors3.appendChild(
      makeColorInput("Ladevorgang aktiv (AN)", "color_charging_on")
    );
    rowColors3.appendChild(
      makeColorInput("Ladevorgang aktiv (AUS)", "color_charging_off")
    );
    sectionColors.appendChild(rowColors3);

    container.appendChild(sectionColors);

    root.appendChild(container);
  }

  _fireConfigChanged() {
    const event = new Event("config-changed", {
      bubbles: true,
      composed: true,
    });
    event.detail = { config: this._config };
    this.dispatchEvent(event);
  }
}

customElements.define("alfen-wallbox-card-editor", AlfenWallboxCardEditor);