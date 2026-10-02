/* Plant wizard. Saving asks for confirmation and is limited to administrators. */
(function (root) {
  function open(host) {
    const tr = (da, en) => host.tr(da, en);
    const draft = root.NilanPlant.normalize(host.resolvedPlant ? host.resolvedPlant() : {});
    const dialog = document.createElement('dialog');
    let step = 0;
    const paint = () => {
      dialog.replaceChildren();
      dialog.append(el('h2', tr('Opsæt anlæg', 'Set up plant')));
      const notes = [
        tr('Forvarme og eftervarme styrer hvilke entiteter der oprettes. Standard er ingen eftervarme.', 'Preheater and reheater decide which entities are created. The default reheater is none.'),
        tr('CO₂ og T10 oprettes kun, hvis de er monteret. T10 sidder på styrekortet i aggregatet.', 'CO₂ and T10 are created only when fitted. T10 is on the control board inside the unit.'),
        tr('CTS602 kan ikke modtage en ekstern føler over Modbus. T15 er panelet på loftet ved aggregatet, ikke stuetemperaturen. Valget bruges kun til visning i Home Assistant.', 'The CTS602 cannot accept an external sensor over Modbus. T15 is the panel in the loft next to the unit, not the living-room temperature. The choice is only used for display in Home Assistant.'),
      ];
      dialog.append(el('p', notes[step]));
      if (step === 0) {
        dialog.append(check(tr('Forvarme monteret', 'Preheater fitted'), draft.preheater, (on) => { draft.preheater = on; }));
        dialog.append(select(tr('Eftervarme', 'Reheater'), [
          ['none', tr('Ingen', 'None')],
          ['electric', tr('El', 'Electric')],
          ['water', tr('Vand', 'Water')],
        ], draft.reheater, (value) => { draft.reheater = value; }));
      }
      if (step === 1) {
        dialog.append(check(tr('CO₂-føler monteret', 'CO₂ sensor fitted'), draft.co2, (on) => { draft.co2 = on; }));
        dialog.append(check(tr('T10 monteret', 'T10 fitted'), draft.t10, (on) => { draft.t10 = on; }));
      }
      if (step === 2) {
        dialog.append(select(tr('Rumtemperatur', 'Room temperature'), [
          ['entity', tr('Entitet i Home Assistant', 'Home Assistant entity')],
          ['t15', tr('T15 panel (loft, ikke rum)', 'T15 panel (loft, not the room)')],
          ['t10', tr('T10 styrekort (i aggregatet)', 'T10 control board (inside the unit)')],
        ], draft.room_source, (value) => { draft.room_source = value; paint(); }));
        if (draft.room_source === 'entity') {
          const temperatures = Object.entries(host._hass?.states || {}).filter(([, state]) => state.attributes?.device_class === 'temperature' || /°C|ºC/.test(String(state.attributes?.unit_of_measurement || '')));
          const options = [['', tr('Vælg senere', 'Choose later')]].concat(temperatures.map(([id, state]) => [id, state.attributes.friendly_name || id]));
          dialog.append(select(tr('Entitet', 'Entity'), options, draft.room_entity || '', (value) => { draft.room_entity = value || null; }));
        }
      }
      const actions = el('div');
      actions.className = 'actions';
      if (step > 0) actions.append(button(tr('Tilbage', 'Back'), () => { step -= 1; paint(); }));
      if (step < 2) actions.append(button(tr('Næste', 'Next'), () => { step += 1; paint(); }, 'primary'));
      else actions.append(button(tr('Gem', 'Save'), () => host.savePlant(draft), 'primary'));
      actions.append(button(tr('Luk', 'Close'), () => dialog.close()));
      dialog.append(actions);
    };
    const el = (tag, text) => {
      const node = document.createElement(tag);
      if (text !== undefined) node.textContent = text;
      return node;
    };
    const button = (text, fn, cls) => {
      const node = el('button', text);
      node.type = 'button';
      if (cls) node.className = cls;
      node.onclick = fn;
      return node;
    };
    const check = (label, value, fn) => {
      const row = el('label', label);
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.checked = !!value;
      input.onchange = () => fn(input.checked);
      row.prepend(input);
      return row;
    };
    const select = (label, options, value, fn) => {
      const wrap = el('label', label);
      const input = document.createElement('select');
      for (const [optionValue, optionLabel] of options) {
        const option = document.createElement('option');
        option.value = optionValue;
        option.textContent = optionLabel;
        input.append(option);
      }
      input.value = value || '';
      input.onchange = () => fn(input.value);
      wrap.append(input);
      return wrap;
    };
    paint();
    host.shadowRoot.append(dialog);
    if (typeof dialog.showModal === 'function') dialog.showModal();
    return dialog;
  }

  root.NilanWizard = { open };
})(typeof globalThis === 'undefined' ? window : globalThis);
