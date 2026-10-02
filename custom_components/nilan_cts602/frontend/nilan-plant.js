/* Plant options shared by the card and the wizard. */
(function (root) {
  const REHEATERS = ['none', 'electric', 'water'];
  const SOURCES = ['t15', 't10', 'entity'];

  function flag(value) {
    return value === true || value === 1 || value === 'true' || value === 'on';
  }

  function normalize(raw) {
    const source = raw && typeof raw === 'object' ? raw : {};
    const reheater = REHEATERS.includes(source.reheater) ? source.reheater : 'none';
    const room = SOURCES.includes(source.room_source) ? source.room_source : 'entity';
    let entity = null;
    if (typeof source.room_entity === 'string') {
      const cleaned = source.room_entity.trim();
      if (cleaned) entity = cleaned.slice(0, 255);
    }
    return {
      version: 1,
      preheater: flag(source.preheater),
      reheater,
      co2: flag(source.co2),
      t10: flag(source.t10),
      room_source: room,
      room_entity: entity,
    };
  }

  root.NilanPlant = { normalize, REHEATERS, SOURCES };
})(typeof globalThis === 'undefined' ? window : globalThis);
