// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Juulsen
/* Overblik uses the supplied SVG files verbatim. Live text is an overlay. */
(function (root) {
  const DESKTOP_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 600' width='1200' height='600' font-family='Roboto, -apple-system, Segoe UI, Arial, sans-serif'><style>.c0{fill:#1c1c1c}.c1{fill:#26292d}.c2{fill:#3c4043}.c3{font-size:22px;fill:#e8eaed;text-anchor:start;font-weight:600}.c4{font-size:12px;fill:#9aa0a6;text-anchor:end;font-weight:400}.c5{fill:#0d220f;stroke:#2e7d32;stroke-width:1}.c6{fill:#202428;stroke:#4a5057;stroke-width:2;stroke-dasharray:8 6}.c7{font-size:12px;fill:#80868b;text-anchor:start;font-weight:400}.c8{fill:url(#d);stroke:#9aa0a6;stroke-width:1.5}.c9{fill:url(#dv);stroke:#9aa0a6;stroke-width:1.2}.ca{fill:url(#d);stroke:#9aa0a6;stroke-width:1.2}.cb{fill:url(#dv)}.cc{stroke:#e8eaed;stroke-width:3;stroke-linecap:round}.cd{fill:#e8eaed}.ce{font-size:11px;fill:#e8eaed;text-anchor:start;font-weight:400}.cf{fill:none;stroke:#ff8a65;stroke-width:3.5;stroke-linecap:round;stroke-linejoin:round}.c10{fill:none;stroke:#90a4ae;stroke-width:3.5;stroke-linecap:round;stroke-linejoin:round}.c11{fill:none;stroke:#4fc3f7;stroke-width:3.5;stroke-linecap:round;stroke-linejoin:round}.c12{fill:none;stroke:#ffb74d;stroke-width:3.5;stroke-linecap:round;stroke-linejoin:round}.c13{fill:#90a4ae}.c14{fill:#ff8a65}.c15{fill:#4fc3f7}.c16{fill:#ffb74d}.c17{font-size:14px;fill:#90a4ae;text-anchor:middle;font-weight:600}.c18{font-size:11px;fill:#9aa0a6;text-anchor:middle;font-weight:400}.c19{font-size:14px;fill:#ff8a65;text-anchor:middle;font-weight:600}.c1a{font-size:14px;fill:#4fc3f7;text-anchor:middle;font-weight:600}.c1b{font-size:14px;fill:#ffb74d;text-anchor:middle;font-weight:600}.c1c{fill:url(#ex);stroke:#b0b6bc;stroke-width:3}.c1d{stroke:#4a525a;stroke-width:1}.c1e{stroke:#b0b6bc;stroke-width:2.5}.c1f{fill:#202428;stroke:#5f6368;stroke-width:1;fill-opacity:.94}.c20{font-size:13px;fill:#e8eaed;text-anchor:middle;font-weight:600}.c21{font-size:10px;fill:#9aa0a6;text-anchor:middle;font-weight:400}.c22{fill:#3a3f45;stroke:#cfd3d7;stroke-width:1.5}.c23{fill:none;stroke:#cfd3d7;stroke-width:1.5}.c24{font-size:12px;fill:#bdc1c6;text-anchor:middle;font-weight:500}.c25{fill:#3b2f2a;stroke:#ffab40;stroke-width:1.5}.c26{fill:none;stroke:#ffab40;stroke-width:1.5}.c27{fill:url(#fan);stroke:#b0b6bc;stroke-width:3}.c28{fill:none;stroke:#4a525a;stroke-width:1}.c29{stroke:#cfd3d7;stroke-width:2}.c2a{fill:#1c1c1c;stroke:#cfd3d7;stroke-width:2}.c2b{font-size:9px;fill:#e8eaed;text-anchor:middle;font-weight:700}.c2c{fill:#0c0f12;stroke:#5f6368;stroke-width:1.2}.c2d{fill:#1b5e20;stroke:#43a047;stroke-width:1.2}.c2e{fill:#23272b;stroke:#3c4043;stroke-width:1}.c2f{fill:#2e3338}.c30{font-size:13px;fill:#e8eaed;text-anchor:start;font-weight:600}.c31{font-size:12px;fill:#9aa0a6;text-anchor:start;font-weight:400}.c32{font-size:11px;fill:#bdc1c6;text-anchor:start;font-weight:400}.c33{font-size:10px;fill:#80868b;text-anchor:middle;font-weight:400}</style><defs><linearGradient id='d' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#4a5057'/><stop offset='.45' stop-color='#858c94'/><stop offset='1' stop-color='#454b52'/></linearGradient><linearGradient id='dv' x1='0' y1='0' x2='1' y2='0'><stop offset='0' stop-color='#4a5057'/><stop offset='.45' stop-color='#858c94'/><stop offset='1' stop-color='#454b52'/></linearGradient><linearGradient id='ex' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#3a4148'/><stop offset='1' stop-color='#262b30'/></linearGradient><radialGradient id='fan' cx='.5' cy='.45' r='.6'><stop offset='0' stop-color='#3c434a'/><stop offset='1' stop-color='#1f2327'/></radialGradient><linearGradient id='fUdeInd' gradientUnits='userSpaceOnUse' x1='522' y1='174' x2='664' y2='349'><stop offset='0' stop-color='#4fc3f7'/><stop offset='1' stop-color='#ffb74d'/></linearGradient><linearGradient id='fUdsAfk' gradientUnits='userSpaceOnUse' x1='678' y1='174' x2='536' y2='349'><stop offset='0' stop-color='#ff8a65'/><stop offset='1' stop-color='#90a4ae'/></linearGradient></defs><rect x='0' y='0' width='1200' height='600' rx='0' class='c0'/><rect x='0' y='0' width='1200' height='52' rx='0' class='c1'/><rect x='0' y='52' width='1200' height='2' rx='0' class='c2'/><text x='24' y='34' class='c3'>Ventilation – Nilan Comfort 300 LR</text><text x='870' y='31' class='c4'>Display</text><rect x='880' y='10' width='300' height='32' rx='4' class='c5'/><rect x='120' y='76' width='960' height='402' rx='10' class='c6'/><text x='136' y='96' class='c7'>Aggregat · modstrømsveksler</text><rect x='30' y='150' width='460' height='60' rx='0' class='c8'/><rect x='710' y='150' width='460' height='60' rx='0' class='c8'/><rect x='30' y='330' width='460' height='60' rx='0' class='c8'/><rect x='710' y='330' width='460' height='60' rx='0' class='c8'/><rect x='416' y='329' width='32' height='62' fill='#202428'/><rect x='420' y='210' width='24' height='242' rx='0' class='c9'/><rect x='756' y='390' width='24' height='62' rx='0' class='c9'/><rect x='420' y='440' width='360' height='24' rx='0' class='ca'/><rect x='421' y='209' width='22' height='4' rx='0' class='cb'/><rect x='757' y='389' width='22' height='4' rx='0' class='cb'/><line x1='590' y1='462' x2='610' y2='442' class='cc'/><circle cx='600' cy='452' r='3' class='cd'/><text x='460' y='456' class='ce'>Bypass</text><polyline points='1129,171 1120,180 1129,189' class='cf'/><polyline points='809,171 800,180 809,189' class='cf'/><polyline points='159,351 150,360 159,369' class='c10'/><polyline points='89,351 80,360 89,369' class='c10'/><polyline points='71,171 80,180 71,189' class='c11'/><polyline points='136,171 145,180 136,189' class='c11'/><polyline points='751,351 760,360 751,369' class='c12'/><polyline points='951,351 960,360 951,369' class='c12'/><polyline points='1111,351 1120,360 1111,369' class='c12'/><polyline points='514,446 520,452 514,458' class='c11'/><polyline points='694,446 700,452 694,458' class='c11'/><polyline points='426,264 432,270 438,264' class='c11'/><polyline points='742,173 735,180 742,187' class='cf'/><polyline points='477,353 470,360 477,367' class='c10'/><polyline points='468,173 475,180 468,187' class='c11'/><polyline points='728,353 735,360 728,367' class='c12'/><polygon points='30,338 10,360 30,382' class='c13'/><polygon points='1190,158 1170,180 1190,202' class='c14'/><polygon points='10,158 30,180 10,202' class='c15'/><polygon points='1170,338 1190,360 1170,382' class='c16'/><text x='70' y='414' class='c17'>Afkast</text><text x='70' y='429' class='c18'>til det fri</text><text x='1130' y='126' class='c19'>Udsugning</text><text x='1130' y='141' class='c18'>fra boligen</text><text x='70' y='126' class='c1a'>Udeluft</text><text x='70' y='141' class='c18'>fra det fri</text><text x='1130' y='414' class='c1b'>Indblæsning</text><text x='1130' y='429' class='c18'>til boligen</text><rect x='489' y='150' width='60' height='60' fill='url(#d)'/><line x1='489' y1='150' x2='549' y2='150' stroke='#9aa0a6' stroke-width='1.5'/><line x1='489' y1='210' x2='549' y2='210' stroke='#9aa0a6' stroke-width='1.5'/><rect x='651' y='150' width='60' height='60' fill='url(#d)'/><line x1='651' y1='150' x2='711' y2='150' stroke='#9aa0a6' stroke-width='1.5'/><line x1='651' y1='210' x2='711' y2='210' stroke='#9aa0a6' stroke-width='1.5'/><rect x='489' y='330' width='60' height='60' fill='url(#d)'/><line x1='489' y1='330' x2='549' y2='330' stroke='#9aa0a6' stroke-width='1.5'/><line x1='489' y1='390' x2='549' y2='390' stroke='#9aa0a6' stroke-width='1.5'/><rect x='651' y='330' width='60' height='60' fill='url(#d)'/><line x1='651' y1='330' x2='711' y2='330' stroke='#9aa0a6' stroke-width='1.5'/><line x1='651' y1='390' x2='711' y2='390' stroke='#9aa0a6' stroke-width='1.5'/><polygon points='550,132 650,132 710,210 710,330 650,408 550,408 490,330 490,210' class='c1c'/><polyline points='494.3,204.4 550,321.4 650,321.4 654.3,402.4' fill='none' class='c1d'/><polyline points='705.7,204.4 650,321.4 550,321.4 545.7,402.4' fill='none' class='c1d'/><polyline points='502.9,193.3 550,304.3 650,304.3 662.9,391.3' fill='none' class='c1d'/><polyline points='697.1,193.3 650,304.3 550,304.3 537.1,391.3' fill='none' class='c1d'/><polyline points='511.4,182.1 550,287.1 650,287.1 671.4,380.1' fill='none' class='c1d'/><polyline points='688.6,182.1 650,287.1 550,287.1 528.6,380.1' fill='none' class='c1d'/><polyline points='520,171 550,270 650,270 680,369' fill='none' class='c1d'/><polyline points='680,171 650,270 550,270 520,369' fill='none' class='c1d'/><polyline points='528.6,159.9 550,252.9 650,252.9 688.6,357.9' fill='none' class='c1d'/><polyline points='671.4,159.9 650,252.9 550,252.9 511.4,357.9' fill='none' class='c1d'/><polyline points='537.1,148.7 550,235.7 650,235.7 697.1,346.7' fill='none' class='c1d'/><polyline points='662.9,148.7 650,235.7 550,235.7 502.9,346.7' fill='none' class='c1d'/><polyline points='545.7,137.6 550,218.6 650,218.6 705.7,335.6' fill='none' class='c1d'/><polyline points='654.3,137.6 650,218.6 550,218.6 494.3,335.6' fill='none' class='c1d'/><polygon points='550,132 650,132 710,210 710,330 650,408 550,408 490,330 490,210' fill='none' stroke='#b0b6bc' stroke-width='3' stroke-linejoin='round'/><path d='M522,174 L664,349' fill='none' stroke='url(#fUdeInd)' stroke-width='3' stroke-linecap='round' opacity='.75'/><polyline points='653,348 664,349 665,338' fill='none' stroke='#ffb74d' stroke-width='3' stroke-linecap='round' stroke-linejoin='round' opacity='.75'/><path d='M678,174 L536,349' fill='none' stroke='url(#fUdsAfk)' stroke-width='3' stroke-linecap='round' opacity='.75'/><polyline points='547,348 536,349 535,338' fill='none' stroke='#90a4ae' stroke-width='3' stroke-linecap='round' stroke-linejoin='round' opacity='.75'/><rect x='524' y='230' width='152' height='80' rx='6' class='c1f'/><text x='600' y='250' class='c20'>Modstrømsveksler</text><text x='600' y='300' class='c21'>Beregnet varmegenvinding</text><rect x='869' y='142' width='22' height='76' rx='0' class='c22'/><polyline points='873,146 887,153 873,160 887,166 873,173 887,180 873,187 887,194 873,200 887,207 873,214' class='c23'/><rect x='269' y='142' width='22' height='76' rx='0' class='c22'/><polyline points='273,146 287,153 273,160 287,166 273,173 287,180 273,187 287,194 273,200 287,207 273,214' class='c23'/><text x='880' y='236' class='c24'>Filter</text><text x='280' y='236' class='c24'>Filter</text><circle cx='330' cy='360' r='44' class='c27'/><circle cx='330' cy='360' r='36' class='c28'/><text x='330' y='306' class='c24'>Udsugningsventilator</text><circle cx='870' cy='360' r='44' class='c27'/><circle cx='870' cy='360' r='36' class='c28'/><text x='870' y='306' class='c24'>Indblæsningsventilator</text><line x1='1030' y1='150' x2='1030' y2='130' class='c29'/><circle cx='1030' cy='150' r='10' class='c2a'/><text x='1030' y='154' class='c2b'>T3</text><line x1='930' y1='150' x2='930' y2='130' class='c29'/><circle cx='930' cy='150' r='10' class='c2a'/><text x='930' y='154' class='c2b'>RH</text><line x1='200' y1='150' x2='200' y2='130' class='c29'/><circle cx='200' cy='150' r='10' class='c2a'/><text x='200' y='154' class='c2b'>T8</text><line x1='200' y1='390' x2='200' y2='410' class='c29'/><circle cx='200' cy='390' r='10' class='c2a'/><text x='200' y='394' class='c2b'>T4</text><line x1='1030' y1='390' x2='1030' y2='410' class='c29'/><circle cx='1030' cy='390' r='10' class='c2a'/><text x='1030' y='394' class='c2b'>T7</text><text x='1030' y='236' class='c18'>Udsugning T3</text><text x='930' y='236' class='c18'>Fugt</text><text x='200' y='236' class='c18'>Udeluft T8</text><text x='200' y='318' class='c18'>Afkast T4</text><text x='1030' y='318' class='c18'>Indblæsning T7</text><rect x='156.0' y='103.0' width='88' height='22' rx='4' class='c2c'/><rect x='294.0' y='415.0' width='72' height='22' rx='4' class='c2c'/><rect x='890.0' y='103.0' width='80' height='22' rx='4' class='c2c'/><rect x='986.0' y='103.0' width='88' height='22' rx='4' class='c2c'/><rect x='156.0' y='415.0' width='88' height='22' rx='4' class='c2c'/><rect x='834.0' y='415.0' width='72' height='22' rx='4' class='c2c'/><rect x='986.0' y='415.0' width='88' height='22' rx='4' class='c2c'/><rect x='558' y='262' width='84' height='22' rx='4' class='c2d'/><rect x='20' y='484' width='450' height='112' rx='6' class='c2e'/><path d='M20 490a6 6 0 0 1 6-6h438a6 6 0 0 1 6 6v16h-450z' class='c2f'/><text x='32' y='500' class='c30'>Driftsstatus</text><rect x='730' y='484' width='450' height='112' rx='6' class='c2e'/><path d='M730 490a6 6 0 0 1 6-6h438a6 6 0 0 1 6 6v16h-450z' class='c2f'/><text x='742' y='500' class='c30'>Filter &amp; service</text><text x='32' y='528' class='c31'>Driftstilstand</text><rect x='140.0' y='513.0' width='104' height='22' rx='4' class='c2d'/><text x='32' y='554' class='c31'>Aktuel drift</text><rect x='140.0' y='539.0' width='104' height='22' rx='4' class='c2d'/><text x='32' y='580' class='c31'>Ventilatortrin</text><rect x='140.0' y='565.0' width='104' height='22' rx='4' class='c2d'/><text x='258' y='528' class='c31'>Sommerdrift</text><rect x='358.0' y='513.0' width='104' height='22' rx='4' class='c2d'/><text x='258' y='554' class='c31'>Alarmer</text><rect x='358.0' y='539.0' width='104' height='22' rx='4' class='c2d'/><text x='258' y='580' class='c31'>Setpunkt</text><rect x='358.0' y='565.0' width='104' height='22' rx='4' class='c2d'/><text x='742' y='528' class='c31'>Filteradvarsel</text><rect x='848.0' y='513.0' width='96' height='22' rx='4' class='c2d'/><text x='742' y='554' class='c31'>Dage til skift</text><rect x='848.0' y='539.0' width='96' height='22' rx='4' class='c2d'/><text x='742' y='580' class='c31'>Dage siden skift</text><rect x='848.0' y='565.0' width='96' height='22' rx='4' class='c2d'/><text x='958' y='528' class='c31'>Bypass</text><rect x='1076.0' y='513.0' width='96' height='22' rx='4' class='c2d'/><text x='958' y='580' class='c31'>Styreprint T0</text><rect x='1076.0' y='565.0' width='96' height='22' rx='4' class='c2d'/><rect x='500' y='501' width='12' height='12' rx='2' class='c15'/><text x='518' y='511' class='c32'>Udeluft</text><rect x='620' y='501' width='12' height='12' rx='2' class='c16'/><text x='638' y='511' class='c32'>Indblæsning</text><rect x='500' y='523' width='12' height='12' rx='2' class='c14'/><text x='518' y='533' class='c32'>Udsugning</text><rect x='620' y='523' width='12' height='12' rx='2' class='c13'/><text x='638' y='533' class='c32'>Afkast</text><text x='600' y='578' class='c33'>Tryk på en værdi for detaljer/historik</text></svg>`;
  const MOBILE_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 760' width='400' height='760' font-family='Roboto, -apple-system, Segoe UI, Arial, sans-serif'><style>.c0{fill:#1c1c1c}.c1{fill:#26292d}.c2{fill:#3c4043}.c3{font-size:16px;fill:#e8eaed;text-anchor:start;font-weight:600}.c4{fill:#0d220f;stroke:#2e7d32;stroke-width:1}.c5{font-size:11px;fill:#6fbf73;text-anchor:start;font-weight:400}.c6{fill:url(#dv);stroke:#9aa0a6;stroke-width:1.5}.c7{fill:url(#dv);stroke:#9aa0a6;stroke-width:1.2}.c8{fill:url(#d);stroke:#9aa0a6;stroke-width:1.2}.c9{stroke:#e8eaed;stroke-width:2.5;stroke-linecap:round}.ca{fill:#e8eaed}.cb{font-size:10px;fill:#e8eaed;text-anchor:middle;font-weight:400}.cc{fill:none;stroke:#4fc3f7;stroke-width:3.2;stroke-linecap:round;stroke-linejoin:round}.cd{fill:none;stroke:#ffb74d;stroke-width:3.2;stroke-linecap:round;stroke-linejoin:round}.ce{fill:none;stroke:#ff8a65;stroke-width:3.2;stroke-linecap:round;stroke-linejoin:round}.cf{fill:none;stroke:#90a4ae;stroke-width:3.2;stroke-linecap:round;stroke-linejoin:round}.c10{fill:#ffb74d}.c11{fill:#ff8a65}.c12{fill:#4fc3f7}.c13{fill:#90a4ae}.c14{font-size:13px;fill:#ffb74d;text-anchor:middle;font-weight:600}.c15{font-size:11px;fill:#9aa0a6;text-anchor:middle;font-weight:400}.c16{font-size:13px;fill:#ff8a65;text-anchor:middle;font-weight:600}.c17{font-size:13px;fill:#4fc3f7;text-anchor:middle;font-weight:600}.c18{font-size:13px;fill:#90a4ae;text-anchor:middle;font-weight:600}.c19{fill:url(#ex);stroke:#b0b6bc;stroke-width:3}.c1a{stroke:#4a525a;stroke-width:1}.c1b{stroke:#b0b6bc;stroke-width:2.5}.c1c{fill:#202428;stroke:#5f6368;stroke-width:1;fill-opacity:.95}.c1d{font-size:14px;fill:#e8eaed;text-anchor:middle;font-weight:600}.c1e{fill:#3a3f45;stroke:#cfd3d7;stroke-width:1.5}.c1f{fill:none;stroke:#cfd3d7;stroke-width:1.4}.c20{font-size:11px;fill:#bdc1c6;text-anchor:middle;font-weight:500}.c21{fill:#3b2f2a;stroke:#ffab40;stroke-width:1.5}.c22{fill:none;stroke:#ffab40;stroke-width:1.4}.c23{fill:url(#fan);stroke:#b0b6bc;stroke-width:2.5}.c24{stroke:#cfd3d7;stroke-width:1.5}.c25{fill:#1c1c1c;stroke:#cfd3d7;stroke-width:1.8}.c26{font-size:8px;fill:#e8eaed;text-anchor:middle;font-weight:700}.c27{font-size:12px;fill:#bdc1c6;text-anchor:middle;font-weight:500}.c28{fill:#0c0f12;stroke:#5f6368;stroke-width:1.2}.c29{stroke:#cfd3d7;stroke-width:1.5;stroke-dasharray:3 2}.c2a{fill:#1b5e20;stroke:#43a047;stroke-width:1.2}</style><defs><linearGradient id='d' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#4a5057'/><stop offset='.45' stop-color='#858c94'/><stop offset='1' stop-color='#454b52'/></linearGradient><linearGradient id='dv' x1='0' y1='0' x2='1' y2='0'><stop offset='0' stop-color='#4a5057'/><stop offset='.45' stop-color='#858c94'/><stop offset='1' stop-color='#454b52'/></linearGradient><linearGradient id='ex' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#3a4148'/><stop offset='1' stop-color='#262b30'/></linearGradient><radialGradient id='fan' cx='.5' cy='.45' r='.6'><stop offset='0' stop-color='#3c434a'/><stop offset='1' stop-color='#1f2327'/></radialGradient><linearGradient id='fUdeInd' gradientUnits='userSpaceOnUse' x1='318.3' y1='451.1' x2='102.7' y2='367.2'><stop offset='0' stop-color='#4fc3f7'/><stop offset='1' stop-color='#ffb74d'/></linearGradient><linearGradient id='fUdsAfk' gradientUnits='userSpaceOnUse' x1='318.3' y1='358.9' x2='102.7' y2='442.8'><stop offset='0' stop-color='#ff8a65'/><stop offset='1' stop-color='#90a4ae'/></linearGradient></defs><rect x='0' y='0' width='400' height='760' rx='0' class='c0'/><rect x='0' y='0' width='400' height='40' rx='0' class='c1'/><rect x='0' y='40' width='400' height='2' rx='0' class='c2'/><text x='16' y='27' class='c3'>Ventilation – Nilan Comfort 300 LR</text><rect x='16' y='48' width='368' height='30' rx='4' class='c4'/><text x='26' y='67' class='c5'>Display</text><rect x='44' y='126' width='40' height='564' rx='0' class='c6'/><rect x='316' y='126' width='40' height='564' rx='0' class='c6'/><rect x='8' y='314' width='18' height='182' rx='0' class='c7'/><rect x='26' y='314' width='19' height='16' rx='0' class='c8'/><rect x='43' y='476' width='42' height='24' fill='#1c1c1c'/><rect x='26' y='480' width='291' height='16' rx='0' class='c8'/><line x1='10' y1='412' x2='24' y2='398' class='c9'/><circle cx='17' cy='405' r='2.5' class='ca'/><text x='17' y='372' transform='rotate(-90 17 372)' class='cb'>Bypass</text><polyline points='56,667 64,675 72,667' class='cf'/><polyline points='56,592 64,600 72,592' class='cf'/><polyline points='56,503 64,511 72,503' class='cf'/><polyline points='56,328 64,320 72,328' class='cd'/><polyline points='56,238 64,230 72,238' class='cd'/><polyline points='56,148 64,140 72,148' class='cd'/><polyline points='328,132 336,140 344,132' class='ce'/><polyline points='328,182 336,190 344,182' class='ce'/><polyline points='328,312 336,320 344,312' class='ce'/><polyline points='328,539 336,531 344,539' class='cc'/><polyline points='328,628 336,620 344,628' class='cc'/><polyline points='328,668 336,660 344,668' class='cc'/><polyline points='11,456 17,450 23,456' class='cc'/><polyline points='11,351 17,345 23,351' class='cc'/><polyline points='275,483 270,488 275,493' class='cc'/><polyline points='155,483 150,488 155,493' class='cc'/><polygon points='44,126 64,106 84,126' class='c10'/><polygon points='316,106 356,106 336,126' class='c11'/><polygon points='44,690 84,690 64,710' class='c13'/><polygon points='316,710 336,690 356,710' class='c12'/><text x='64' y='94' class='c14'>Indblæsning</text><text x='150' y='94' class='c15'>til boligen</text><text x='336' y='94' class='c16'>Udsugning</text><text x='250' y='94' class='c15'>fra boligen</text><text x='64' y='728' class='c18'>Afkast</text><text x='64' y='744' class='c15'>til det fri</text><text x='336' y='728' class='c17'>Udeluft</text><text x='336' y='744' class='c15'>fra det fri</text><polygon points='90,340 310,340 370,380 370,430 310,470 90,470 30,430 30,380' class='c19'/><polyline points='314.3,467.1 105.7,430 105.7,380 34.3,377.1' fill='none' class='c1a'/><polyline points='314.3,342.9 105.7,380 105.7,430 34.3,432.9' fill='none' class='c1a'/><polyline points='322.9,461.4 137.1,430 137.1,380 42.9,371.4' fill='none' class='c1a'/><polyline points='322.9,348.6 137.1,380 137.1,430 42.9,438.6' fill='none' class='c1a'/><polyline points='331.4,455.7 168.6,430 168.6,380 51.4,365.7' fill='none' class='c1a'/><polyline points='331.4,354.3 168.6,380 168.6,430 51.4,444.3' fill='none' class='c1a'/><polyline points='340,450 200,430 200,380 60,360' fill='none' class='c1a'/><polyline points='340,360 200,380 200,430 60,450' fill='none' class='c1a'/><polyline points='348.6,444.3 231.4,430 231.4,380 68.6,354.3' fill='none' class='c1a'/><polyline points='348.6,365.7 231.4,380 231.4,430 68.6,455.7' fill='none' class='c1a'/><polyline points='357.1,438.6 262.9,430 262.9,380 77.1,348.6' fill='none' class='c1a'/><polyline points='357.1,371.4 262.9,380 262.9,430 77.1,461.4' fill='none' class='c1a'/><polyline points='365.7,432.9 294.3,430 294.3,380 85.7,342.9' fill='none' class='c1a'/><polyline points='365.7,377.1 294.3,380 294.3,430 85.7,467.1' fill='none' class='c1a'/><polygon points='90,340 310,340 370,380 370,430 310,470 90,470 30,430 30,380' fill='none' stroke='#b0b6bc' stroke-width='3' stroke-linejoin='round'/><path d='M318.3,451.1 L102.7,367.2' fill='none' stroke='url(#fUdeInd)' stroke-width='3' stroke-linecap='round' opacity='.75'/><polyline points='107.1,377.3 102.7,367.2 112.8,362.8' fill='none' stroke='#ffb74d' stroke-width='3' stroke-linecap='round' stroke-linejoin='round' opacity='.75'/><path d='M318.3,358.9 L102.7,442.8' fill='none' stroke='url(#fUdsAfk)' stroke-width='3' stroke-linecap='round' opacity='.75'/><polyline points='112.8,447.2 102.7,442.8 107.1,432.7' fill='none' stroke='#90a4ae' stroke-width='3' stroke-linecap='round' stroke-linejoin='round' opacity='.75'/><rect x='115' y='356' width='170' height='98' rx='6' class='c1c'/><text x='200' y='378' class='c1d'>Modstrømsveksler</text><text x='200' y='443' class='c15'>Beregnet varmegenvinding</text><rect x='312' y='273' width='48' height='18' rx='0' class='c1e'/><polyline points='316,277 320,287 324,277 328,287 332,277 336,287 340,277 344,287 348,277 352,287 356,277' class='c1f'/><text x='378' y='286' class='c20'>Filter</text><rect x='312' y='583' width='48' height='18' rx='0' class='c1e'/><polyline points='316,587 320,597 324,587 328,597 332,587 336,597 340,587 344,597 348,587 352,597 356,587' class='c1f'/><text x='378' y='596' class='c20'>Filter</text><circle cx='64' cy='285' r='27' class='c23'/><circle cx='64' cy='545' r='27' class='c23'/><line x1='84' y1='170' x2='102' y2='170' class='c24'/><circle cx='84' cy='170' r='9' class='c25'/><text x='84' y='173.5' class='c26'>T7</text><text x='150' y='153' class='c27'>Indblæsning T7</text><rect x='106.0' y='158.0' width='88' height='24' rx='4' class='c28'/><line x1='91' y1='285' x2='106' y2='285' class='c29'/><text x='150' y='268' class='c27'>Indbl.-ventilator</text><rect x='106.0' y='273.0' width='88' height='24' rx='4' class='c28'/><line x1='84' y1='650' x2='102' y2='650' class='c24'/><circle cx='84' cy='650' r='9' class='c25'/><text x='84' y='653.5' class='c26'>T4</text><text x='150' y='633' class='c27'>Afkast T4</text><rect x='106.0' y='638.0' width='88' height='24' rx='4' class='c28'/><line x1='316' y1='170' x2='298' y2='170' class='c24'/><circle cx='316' cy='170' r='9' class='c25'/><text x='316' y='173.5' class='c26'>T3</text><text x='250' y='153' class='c27'>Udsugning T3</text><rect x='206.0' y='158.0' width='88' height='24' rx='4' class='c28'/><line x1='316' y1='228' x2='298' y2='228' class='c24'/><circle cx='316' cy='228' r='9' class='c25'/><text x='316' y='231.5' class='c26'>RH</text><text x='250' y='211' class='c27'>Fugt</text><rect x='206.0' y='216.0' width='88' height='24' rx='4' class='c28'/><line x1='91' y1='545' x2='106' y2='545' class='c29'/><text x='150' y='528' class='c27'>Udsug.-ventilator</text><rect x='106.0' y='533.0' width='88' height='24' rx='4' class='c28'/><line x1='316' y1='650' x2='298' y2='650' class='c24'/><circle cx='316' cy='650' r='9' class='c25'/><text x='316' y='653.5' class='c26'>T8</text><text x='250' y='633' class='c27'>Udeluft T8</text><rect x='206.0' y='638.0' width='88' height='24' rx='4' class='c28'/><rect x='150' y='397' width='100' height='26' rx='4' class='c2a'/></svg>`;
  const PARTS = {
    "anlaeg-panelraekke-forvarmer.svg": `<text x='0' y='15.3' font-size='12px' fill='#9aa0a6' font-family='Roboto, -apple-system, Segoe UI, Arial, sans-serif'>Forvarmer</text><rect x='118.6' y='0.6' width='94.8' height='20.8' rx='4' fill='#1b5e20' stroke='#43a047' stroke-width='1.2'/>`,
    "anlaeg-tekst-eftervarmer.svg": `<text x='38.0' y='12.0' font-size='11px' fill='#bdc1c6' text-anchor='middle' font-family='Roboto, -apple-system, Segoe UI, Arial, sans-serif' font-weight='500'>Eftervarmer</text>`,
    "anlaeg-tekst-forvarmer.svg": `<text x='40.0' y='12.3' font-size='12px' fill='#bdc1c6' text-anchor='middle' font-family='Roboto, -apple-system, Segoe UI, Arial, sans-serif' font-weight='500'>Forvarmer</text>`,
    "eftervarmer-el-mobil.svg": `<rect x='6' y='5' width='36' height='30' fill='#3b2f2a' stroke='#ffab40' stroke-width='1.5'/><polyline points='11,9 37,13 11,17 37,21 11,25 37,29 11,33' fill='none' stroke='#ffab40' stroke-width='1.4' stroke-linejoin='round'/><circle cx='42.5' cy='5.5' r='5.5' fill='#ffb300' stroke='#1c1c1c' stroke-width='1'/><path d='M43.7 1.3L39.9 6.3H42.3L41.1 9.9L45.3 4.6H42.9Z' fill='#1c1c1c'/>`,
    "eftervarmer-el.svg": `<rect x='6' y='6' width='32' height='52' fill='#3b2f2a' stroke='#ffab40' stroke-width='1.5'/><polyline points='11,12 33,18 11,24 33,30 11,36 33,42 11,48 33,54' fill='none' stroke='#ffab40' stroke-width='1.5' stroke-linejoin='round'/><circle cx='37' cy='7' r='6.5' fill='#ffb300' stroke='#1c1c1c' stroke-width='1'/><path d='M38.2 2.8L34.4 7.8H36.8L35.6 11.4L39.8 6.1H37.4Z' fill='#1c1c1c'/>`,
    "eftervarmer-vand-mobil.svg": `<rect x='28' y='5' width='36' height='30' fill='#1f2a33' stroke='#90caf9' stroke-width='1.5'/><line x1='34' y1='5' x2='34' y2='35' stroke='#4a5a66' stroke-width='1'/><line x1='40' y1='5' x2='40' y2='35' stroke='#4a5a66' stroke-width='1'/><line x1='46' y1='5' x2='46' y2='35' stroke='#4a5a66' stroke-width='1'/><line x1='52' y1='5' x2='52' y2='35' stroke='#4a5a66' stroke-width='1'/><line x1='58' y1='5' x2='58' y2='35' stroke='#4a5a66' stroke-width='1'/><path d='M0 11H59V17H33V23' fill='none' stroke='#ef5350' stroke-width='2' stroke-linejoin='round'/><path d='M33 23V23H59V29H0' fill='none' stroke='#42a5f5' stroke-width='2' stroke-linejoin='round'/><path d='M7 6V16L19 6V16Z' fill='#1c1c1c' stroke='#e8eaed' stroke-width='1.1' stroke-linejoin='round'/><line x1='13' y1='11' x2='13' y2='4' stroke='#e8eaed' stroke-width='1.1'/><rect x='10' y='0.5' width='6' height='4' fill='#e8eaed'/>`,
    "eftervarmer-vand.svg": `<rect x='6' y='6' width='32' height='52' fill='#1f2a33' stroke='#90caf9' stroke-width='1.5'/><line x1='6' y1='14' x2='38' y2='14' stroke='#4a5a66' stroke-width='1'/><line x1='6' y1='22' x2='38' y2='22' stroke='#4a5a66' stroke-width='1'/><line x1='6' y1='30' x2='38' y2='30' stroke='#4a5a66' stroke-width='1'/><line x1='6' y1='38' x2='38' y2='38' stroke='#4a5a66' stroke-width='1'/><line x1='6' y1='46' x2='38' y2='46' stroke='#4a5a66' stroke-width='1'/><line x1='6' y1='54' x2='38' y2='54' stroke='#4a5a66' stroke-width='1'/><path d='M10 84V12H18V52H26' fill='none' stroke='#ef5350' stroke-width='2.2' stroke-linejoin='round'/><path d='M26 52V12H34V84' fill='none' stroke='#42a5f5' stroke-width='2.2' stroke-linejoin='round'/><path d='M5 66H15L5 78H15Z' fill='#1c1c1c' stroke='#e8eaed' stroke-width='1.1' stroke-linejoin='round'/><line x1='10' y1='72' x2='18' y2='72' stroke='#e8eaed' stroke-width='1.1'/><rect x='18' y='69' width='5' height='6' fill='#e8eaed'/>`,
    "forvarmer-el-mobil.svg": `<rect x='6' y='5' width='36' height='30' fill='#3b2f2a' stroke='#ffab40' stroke-width='1.5'/><polyline points='11,9 37,13 11,17 37,21 11,25 37,29 11,33' fill='none' stroke='#ffab40' stroke-width='1.4' stroke-linejoin='round'/><circle cx='42.5' cy='5.5' r='5.5' fill='#ffb300' stroke='#1c1c1c' stroke-width='1'/><path d='M43.7 1.3L39.9 6.3H42.3L41.1 9.9L45.3 4.6H42.9Z' fill='#1c1c1c'/>`,
    "forvarmer-el.svg": `<rect x='6' y='6' width='32' height='52' fill='#3b2f2a' stroke='#ffab40' stroke-width='1.5'/><polyline points='11,12 33,18 11,24 33,30 11,36 33,42 11,48 33,54' fill='none' stroke='#ffab40' stroke-width='1.5' stroke-linejoin='round'/><circle cx='37' cy='7' r='6.5' fill='#ffb300' stroke='#1c1c1c' stroke-width='1'/><path d='M38.2 2.8L34.4 7.8H36.8L35.6 11.4L39.8 6.1H37.4Z' fill='#1c1c1c'/>`,
    "forvarmer-vand-mobil.svg": `<rect x='28' y='5' width='36' height='30' fill='#1f2a33' stroke='#90caf9' stroke-width='1.5'/><line x1='34' y1='5' x2='34' y2='35' stroke='#4a5a66' stroke-width='1'/><line x1='40' y1='5' x2='40' y2='35' stroke='#4a5a66' stroke-width='1'/><line x1='46' y1='5' x2='46' y2='35' stroke='#4a5a66' stroke-width='1'/><line x1='52' y1='5' x2='52' y2='35' stroke='#4a5a66' stroke-width='1'/><line x1='58' y1='5' x2='58' y2='35' stroke='#4a5a66' stroke-width='1'/><path d='M0 11H59V17H33V23' fill='none' stroke='#ef5350' stroke-width='2' stroke-linejoin='round'/><path d='M33 23V23H59V29H0' fill='none' stroke='#42a5f5' stroke-width='2' stroke-linejoin='round'/><path d='M7 6V16L19 6V16Z' fill='#1c1c1c' stroke='#e8eaed' stroke-width='1.1' stroke-linejoin='round'/><line x1='13' y1='11' x2='13' y2='4' stroke='#e8eaed' stroke-width='1.1'/><rect x='10' y='0.5' width='6' height='4' fill='#e8eaed'/>`,
    "forvarmer-vand.svg": `<rect x='6' y='6' width='32' height='52' fill='#1f2a33' stroke='#90caf9' stroke-width='1.5'/><line x1='6' y1='14' x2='38' y2='14' stroke='#4a5a66' stroke-width='1'/><line x1='6' y1='22' x2='38' y2='22' stroke='#4a5a66' stroke-width='1'/><line x1='6' y1='30' x2='38' y2='30' stroke='#4a5a66' stroke-width='1'/><line x1='6' y1='38' x2='38' y2='38' stroke='#4a5a66' stroke-width='1'/><line x1='6' y1='46' x2='38' y2='46' stroke='#4a5a66' stroke-width='1'/><line x1='6' y1='54' x2='38' y2='54' stroke='#4a5a66' stroke-width='1'/><path d='M10 84V12H18V52H26' fill='none' stroke='#ef5350' stroke-width='2.2' stroke-linejoin='round'/><path d='M26 52V12H34V84' fill='none' stroke='#42a5f5' stroke-width='2.2' stroke-linejoin='round'/><path d='M5 66H15L5 78H15Z' fill='#1c1c1c' stroke='#e8eaed' stroke-width='1.1' stroke-linejoin='round'/><line x1='10' y1='72' x2='18' y2='72' stroke='#e8eaed' stroke-width='1.1'/><rect x='18' y='69' width='5' height='6' fill='#e8eaed'/>`,
    "mobil-felt-forvarmer.svg": `<text x='44' y='12' font-size='12px' fill='#bdc1c6' text-anchor='middle' font-family='Roboto, -apple-system, Segoe UI, Arial, sans-serif' font-weight='500'>Forvarmer</text><rect x='0.6' y='17.6' width='86.8' height='22.8' rx='4' fill='#1b5e20' stroke='#43a047' stroke-width='1.2'/>`,
    "mobil-tekst-eftervarmer.svg": `<text x='44.0' y='12.3' font-size='12px' fill='#bdc1c6' text-anchor='middle' font-family='Roboto, -apple-system, Segoe UI, Arial, sans-serif' font-weight='500'>Eftervarmer</text>`
  };
  const DESKTOP_SLOTS = [
    { key: 't8_outdoor', x: 156, y: 103, w: 88, h: 22, size: 12 },
    { key: 'humidity', x: 890, y: 103, w: 80, h: 22, size: 12 },
    { key: 't3_extract', x: 986, y: 103, w: 88, h: 22, size: 12 },
    { key: 't4_exhaust', x: 156, y: 415, w: 88, h: 22, size: 12 },
    { key: 'extract_fan_speed', x: 294, y: 415, w: 72, h: 22, size: 12 },
    { key: 'supply_fan_speed', x: 834, y: 415, w: 72, h: 22, size: 12 },
    { key: 't7_supply', x: 986, y: 415, w: 88, h: 22, size: 12 },
    { key: 'efficiency', x: 558, y: 262, w: 84, h: 22, size: 13 },
    { key: 'fmt:display', x: 888, y: 14, w: 284, h: 24, size: 15 },
    { key: 'control_state', x: 140, y: 513, w: 104, h: 22, size: 11 },
    { key: 'operation_mode', x: 140, y: 539, w: 104, h: 22, size: 11 },
    { key: 'fan_step', x: 140, y: 565, w: 104, h: 22, size: 12 },
    { key: 'fmt:season', x: 358, y: 513, w: 104, h: 22, size: 12 },
    { key: 'alarm_count', x: 358, y: 539, w: 104, h: 22, size: 12 },
    { key: 'set_temperature', x: 358, y: 565, w: 104, h: 22, size: 12 },
    { key: 'fmt:filter_warn', x: 848, y: 513, w: 96, h: 22, size: 12 },
    { key: 'filter_days_left', x: 848, y: 539, w: 96, h: 22, size: 12 },
    { key: 'filter_days_since', x: 848, y: 565, w: 96, h: 22, size: 12 },
    { key: 'fmt:bypass', x: 1076, y: 513, w: 96, h: 22, size: 11 },
    { key: 't0_controller', x: 1076, y: 565, w: 96, h: 22, size: 12 },
  ];
  const MOBILE_SLOTS = [
    { key: 'fmt:display', x: 108, y: 52, w: 268, h: 22, size: 13, anchor: 'end', ax: 376, ay: 68 },
    { key: 't7_supply', x: 106, y: 158, w: 88, h: 24, size: 13 },
    { key: 'supply_fan_speed', x: 106, y: 273, w: 88, h: 24, size: 13 },
    { key: 't4_exhaust', x: 106, y: 638, w: 88, h: 24, size: 13 },
    { key: 't3_extract', x: 206, y: 158, w: 88, h: 24, size: 13 },
    { key: 'humidity', x: 206, y: 216, w: 88, h: 24, size: 13 },
    { key: 'extract_fan_speed', x: 106, y: 533, w: 88, h: 24, size: 13 },
    { key: 't8_outdoor', x: 206, y: 638, w: 88, h: 24, size: 13 },
    { key: 'efficiency', x: 150, y: 397, w: 100, h: 26, size: 14 },
  ];
  const CHEVRON = {
    desktop: ['cf', 'c10', 'c11', 'c12'],
    mobile: ['cc', 'cd', 'ce', 'cf'],
  };

  function escapeText(value) {
    return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function shown(data, key) {
    const source = data && (data.values || data);
    const text = source ? source[key] : '';
    if (text == null || text === '') return '—';
    return String(text);
  }

  function fontSize(text, width, preferred) {
    const len = Math.max(1, Array.from(text).length);
    const fit = (width - 8) / (len * 0.56);
    return Math.max(8, Math.min(preferred, Math.round(fit * 10) / 10));
  }

  function fit(node) {
    if (!node || node.getAttribute == null) return;
    const width = Number(node.getAttribute('data-max'));
    const preferred = Number(node.getAttribute('data-size')) || 12;
    if (!width) return;
    node.setAttribute('font-size', String(fontSize(node.textContent || '', width, preferred)));
  }

  function overlay(slots, data) {
    const texts = slots.map((slot) => {
      const text = shown(data, slot.key);
      const size = fontSize(text, slot.w, slot.size);
      const anchor = slot.anchor || 'middle';
      const x = slot.ax != null ? slot.ax : slot.x + slot.w / 2;
      const y = slot.ay != null ? slot.ay : slot.y + slot.h / 2;
      return `<text class="nilan-value" data-live="${slot.key}" data-sensor="${slot.key}" data-max="${slot.w}" data-size="${slot.size}" x="${x}" y="${y}" text-anchor="${anchor}" dominant-baseline="middle" font-family="Roboto, -apple-system, Segoe UI, Arial, sans-serif" font-size="${size}" font-weight="500" fill="#e8eaed">${escapeText(text)}</text>`;
    });
    return `<g class="nilan-overlay" data-nilan-overlay="1">${texts.join('')}</g>`;
  }

  function fragment(name, x, y) {
    const body = PARTS[name];
    if (!body) return '';
    return `<g class="nilan-option" data-nilan-option="${name}" transform="translate(${x} ${y})">${body}</g>`;
  }

  function heaterValue(data, key, x, y, w) {
    const text = shown(data, key);
    const size = fontSize(text, w, 12);
    return `<text class="nilan-value" data-live="${key}" data-sensor="${key}" data-max="${w}" data-size="12" x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" font-family="Roboto, -apple-system, Segoe UI, Arial, sans-serif" font-size="${size}" font-weight="500" fill="#e8eaed">${escapeText(text)}</text>`;
  }

  function fittedHeaters(plant) {
    // Installation comes only from the plant options. A live state such as
    // "Fra" or "off", or the mere presence of a sensor, is not installation.
    const source = plant && typeof plant === 'object' ? plant : {};
    if (root.NilanPlant && typeof root.NilanPlant.normalize === 'function') {
      return root.NilanPlant.normalize(source);
    }
    const preheater = source.preheater === true;
    const reheater = source.reheater === 'electric' || source.reheater === 'water' ? source.reheater : 'none';
    return { preheater, reheater };
  }

  function options(plant, portrait, data) {
    const fit = fittedHeaters(plant);
    const groups = [];
    if (fit.preheater === true) {
      if (portrait) {
        groups.push(fragment('forvarmer-el-mobil.svg', 336 - 24, 535 - 20));
        groups.push(fragment('mobil-felt-forvarmer.svg', 250 - 44, 562 - 20));
        groups.push(heaterValue(data, 'preheater', 250, 570, 88));
      } else {
        groups.push(fragment('forvarmer-el.svg', 340 - 22, 180 - 32));
        groups.push(fragment('anlaeg-tekst-forvarmer.svg', 335 - 40, 232 - 12));
        groups.push(fragment('anlaeg-panelraekke-forvarmer.svg', 24, 456));
        groups.push(heaterValue(data, 'preheater', 190, 467, 88));
      }
    }
    if (fit.reheater === 'electric') {
      if (portrait) {
        groups.push(fragment('eftervarmer-el-mobil.svg', 64 - 24, 233 - 20));
        groups.push(fragment('mobil-tekst-eftervarmer.svg', 108, 194));
      } else {
        groups.push(fragment('eftervarmer-el.svg', 945 - 22, 360 - 32));
        groups.push(fragment('anlaeg-tekst-eftervarmer.svg', 945 - 38, 396));
      }
    } else if (fit.reheater === 'water') {
      if (portrait) {
        groups.push(fragment('eftervarmer-vand-mobil.svg', 53 - 35, 199 - 20));
        groups.push(fragment('mobil-tekst-eftervarmer.svg', 108, 188));
      } else {
        groups.push(fragment('eftervarmer-vand.svg', 990 - 22, 370 - 42));
        groups.push(fragment('anlaeg-tekst-eftervarmer.svg', 990 - 38, 416));
      }
    }
    return groups.join('');
  }

  function tagChevrons(svg, classes) {
    let index = 0;
    return svg.replace(/<polyline\b([^>]*)>/g, (full, attrs) => {
      const found = attrs.match(/class='([^']+)'/);
      if (!found || classes.indexOf(found[1]) === -1) return full;
      const delay = (index * 0.18).toFixed(2);
      index += 1;
      const attrsNext = attrs.replace(`class='${found[1]}'`, `class='${found[1]} nilan-flow' style='animation-delay:${delay}s'`);
      return `<polyline${attrsNext}>`;
    });
  }

  function tagFans(svg, portrait) {
    const fans = portrait
      ? [["64", "545", "extract_fan"], ["64", "285", "supply_fan"]]
      : [["330", "360", "extract_fan"], ["870", "360", "supply_fan"]];
    for (const [cx, cy, part] of fans) {
      const needle = `<circle cx='${cx}' cy='${cy}' r='${portrait ? 27 : 44}' class='${portrait ? "c23" : "c27"}'/>`;
      const tagged = `<circle cx='${cx}' cy='${cy}' r='${portrait ? 27 : 44}' class='${portrait ? "c23" : "c27"}' data-part='${part}' style='transform-origin:${cx}px ${cy}px'/>`;
      if (!svg.includes(needle)) continue;
      svg = svg.replace(needle, tagged);
    }
    return svg;
  }

  function tagDamper(svg, portrait, open) {
    if (portrait) {
      const transform = open ? ` transform='rotate(-45 17 405)'` : '';
      return svg.replace(
        `<line x1='10' y1='412' x2='24' y2='398' class='c9'/>`,
        `<line x1='10' y1='412' x2='24' y2='398' class='c9' data-nilan-damper='1' data-origin='17 405' data-open-rotate='-45'${transform}/>`,
      );
    }
    const transform = open ? ` transform='rotate(45 600 452)'` : '';
    return svg.replace(
      `<line x1='590' y1='462' x2='610' y2='442' class='cc'/>`,
      `<line x1='590' y1='462' x2='610' y2='442' class='cc' data-nilan-damper='1' data-origin='600 452' data-open-rotate='45'${transform}/>`,
    );
  }

  function markup(plant, state) {
    const data = state || {};
    const portrait = !!data.compact;
    let svg = portrait ? MOBILE_SVG : DESKTOP_SVG;
    svg = svg.replace(/<\?xml[^?]*\?>/, '');
    svg = svg.replace(/<svg\b/, "<svg preserveAspectRatio='xMidYMid meet'");
    svg = svg.replace(/\swidth='[^']+'/, " width='100%'");
    svg = svg.replace(/\sheight='[^']+'/, " height='auto'");
    svg = tagChevrons(svg, portrait ? CHEVRON.mobile : CHEVRON.desktop);
    svg = tagFans(svg, portrait);
    svg = tagDamper(svg, portrait, data.bypass === 'open');
    const extra = options(plant, portrait, data) + overlay(portrait ? MOBILE_SLOTS : DESKTOP_SLOTS, data);
    const close = svg.lastIndexOf('</svg>');
    return svg.slice(0, close) + extra + svg.slice(close);
  }

  root.NilanDiagram = { markup, fit, DESKTOP_SVG, MOBILE_SVG };
})(typeof globalThis === 'undefined' ? window : globalThis);
