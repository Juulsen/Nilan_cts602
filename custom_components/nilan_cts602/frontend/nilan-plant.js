// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Juulsen
/* Plant options shared by the card and the wizard. */
(function (root) {
  const REHEATERS = ['none', 'electric', 'water'];
  const SOURCES = ['t15', 't10', 'entity'];

  function flag(value) {
    return value === true || value === 1 || value === 'true' || value === 'on';
  }

  function normalize(raw) {
    const source = raw && typeof raw === 'object' ? raw : {};
    // Checkboxes win over a stored reheater slug, so unchecking stays off.
    let electric;
    let water;
    if (Object.prototype.hasOwnProperty.call(source, 'reheater_electric') || Object.prototype.hasOwnProperty.call(source, 'reheater_water')) {
      electric = flag(source.reheater_electric);
      water = flag(source.reheater_water);
    } else {
      electric = source.reheater === 'electric';
      water = source.reheater === 'water';
    }
    if (electric && water) {
      if (source.reheater === 'water' && !flag(source.reheater_electric)) electric = false;
      else water = false;
    }
    const reheater = electric ? 'electric' : water ? 'water' : 'none';
    const room = SOURCES.includes(source.room_source) ? source.room_source : 'entity';
    let entity = null;
    if (typeof source.room_entity === 'string') {
      const cleaned = source.room_entity.trim();
      if (cleaned) entity = cleaned.slice(0, 255);
    }
    return {
      version: 2,
      preheater: flag(source.preheater),
      reheater,
      reheater_electric: electric,
      reheater_water: water,
      options_board: flag(source.options_board),
      experimental: flag(source.experimental),
      co2: flag(source.co2),
      t10: flag(source.t10),
      room_source: room,
      room_entity: entity,
    };
  }

  root.NilanPlant = { normalize, REHEATERS, SOURCES };
})(typeof globalThis === 'undefined' ? window : globalThis);
