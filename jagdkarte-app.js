// Version: 20260720_v56_mobile_kontinentliste  (Touch: tippbare Kontinent-Liste unter Weltkarte)
(function () {
  var retryCount = 0;
  function init() {
    var mount = document.getElementById('jagdkarte');
    if (!mount) return;
    if (!window.JAGDKARTE_DATA) {
        if (retryCount < 40) { retryCount++; setTimeout(init, 50); }
        return;
    }

    var DATA = window.JAGDKARTE_DATA;

    var hasEH = DATA.some(function(c) { return c.iso === 'EH'; });
    if (!hasEH) {
        DATA.push({ iso: 'EH', cont: 'AF', d: 'M422,191L423,190L425,190L426,190L427,190L428,190L429,189L430,188L430,187L430,186L430,185L431,184L432,184L433,182L434,182L435,180L436,179L436,180L436,181L436,183L436,184L436,185L434,185L433,186L433,188L433,189L433,191L432,191L431,191L429,191L427,191L425,191L423,191Z' });
    }
    var hasXS = DATA.some(function(c) { return c.iso === 'XS'; });
    if (!hasXS) {
        DATA.push({ iso: 'XS', cont: 'AF', d: 'M603,228L601,228L600,228L599,227L598,227L597,227L596,227L595,226L594,226L593,226L592,225L591,225L591,224L590,223L589,223L589,222L588,221L588,220L588,219L589,219L590,218L595,217L600,216L605,216L611,217L610,217L609,218L608,218L607,218L606,219L605,219L605,220L605,222L605,223L605,224L605,225L604,226L603,227Z' });
    }

    var SPARKS = window.JAGDKARTE_SPARKS || {};
    var names = {EU:'Europa',AS:'Asien',AF:'Afrika',NA:'Nordamerika',SA:'Südamerika',OC:'Ozeanien'};
    var NS = 'http://www.w3.org/2000/svg';

    var usIndex = DATA.findIndex(function(c) { return c.iso === 'US'; });
    var hasAk = DATA.findIndex(function(c) { return c.iso === 'US-AK'; });
    if (usIndex > -1 && hasAk === -1) {
        var usPath = DATA[usIndex].d;
        var subpaths = usPath.split('Z');
        var mainland = [], alaska = [];
        subpaths.forEach(function(sp) {
            if (!sp || sp.trim() === '') return;
            var match = sp.match(/[ML]\s*(-?\d+\.?\d*)/);
            if (match) {
                var x = parseFloat(match[1]);
                if (x < 115) alaska.push(sp + 'Z');
                else mainland.push(sp + 'Z');
            } else { mainland.push(sp + 'Z'); }
        });
        DATA[usIndex].d = mainland.join('');
        DATA.push({ iso: 'US-AK', cont: 'NA', d: alaska.join('') });
    }

    var maUnified = 'M422,191L422,189L423,189L424,188L424,187L424,186L425,185L425,184L426,183L427,183L427,182L428,182L428,181L428,179L429,178L429,178L430,177L431,176L432,175L432,174L433,173L433,173L434,172L436,172L438,171L438,171L440,170L440,169L441,169L442,168L442,167L443,166L442,165L442,164L442,163L443,162L443,161L444,161L444,160L444,159L445,158L446,158L447,157L448,157L449,156L450,156L450,155L451,154L452,153L453,151L453,151L454,150L455,151L455,152L456,152L457,152L458,152L460,152L461,152L462,152L463,152L464,153L464,153L465,155L465,156L465,157L465,158L465,159L467,160L466,160L465,161L464,161L462,161L461,161L461,162L459,162L459,163L459,164L459,165L458,165L457,166L456,166L455,167L454,168L453,168L451,168L450,168L449,168L448,169L447,169L446,170L445,170L445,172L445,173L445,174L445,176L445,177L445,178L443,178L442,178L441,178L439,178L438,178L436,178L436,179L436,180L436,181L436,183L436,184L436,185L434,185L433,186L433,188L433,189L433,191L432,191L431,191L429,191L427,191L425,191L423,191Z';
    var soUnified = 'M599,232L599,231L600,231L601,230L601,229L602,229L603,228L601,228L600,228L599,227L598,227L597,227L596,227L595,226L594,226L593,226L592,225L591,225L591,224L590,223L589,223L589,222L588,221L588,220L588,219L589,219L590,218L595,217L600,216L605,216L611,217L610,217L609,218L608,218L607,218L606,219L605,219L605,220L605,222L605,223L605,224L605,225L604,226L603,227Z';

    var BUSINESS = {
      'EU': [
        {name:'Bulgarien', iso:'BG', slug:'bulgarien', desc:'Rothirsch, Damhirsch, Gams, Muffel, Rehbock'},
        {name:'Deutschland', iso:'DE', slug:'deutschland', desc:'Schwarzwild / Keiler'},
        {name:'Estland', iso:'EE', slug:'estland', desc:'Elch'},
        {name:'Europ. Russland', iso:'RU-EU', slug:'europ-russland', desc:'Auerhahn, Birkhahn, Elch, Wolf, Sikahirsch'},
        {name:'Finnland', iso:'FI', slug:'finnland', desc:'Elch, Weißwedelhirsch'},
        {name:'Frankreich', iso:'FR', slug:'frankreich', desc:'Gams'},
        {name:'Griechenland', iso:'GR', slug:'griechenland', desc:'Kri-Kri / Kretische Wildziege'},
        {name:'Irland', iso:'IE', slug:'irland', desc:'Sikahirsch'},
        {name:'Kroatien', iso:'HR', slug:'kroatien', desc:'Gams, Muffel, Rehbock, Rothirsch'},
        {name:'Lettland', iso:'LV', slug:'lettland', desc:'Elch'},
        {name:'Norwegen', iso:'NO', slug:'norwegen', desc:'Karibu'},
        {name:'Österreich', iso:'AT', slug:'oesterreich', desc:'Gams, Steinbock'},
        {name:'Polen', iso:'PL', slug:'polen', desc:'Damhirsch, Rothirsch, Muffel, Rehbock, Schwarzwild / Keiler'},
        {name:'Rumänien', iso:'RO', slug:'rumaenien', desc:'Braunbär, Gams, Rothirsch, Damhirsch, Rehbock'},
        {name:'Schottland', iso:'GB-SCO', slug:'schottland', desc:'Rothirsch, Rehbock, Sikahirsch, Fasan, Niederwild'},
        {name:'Schweden', iso:'SE', slug:'schweden', desc:'Elch'},
        {name:'Serbien', iso:'RS', slug:'serbien', desc:'Rothirsch, Rehbock'},
        {name:'Slowakei', iso:'SK', slug:'slowakei', desc:'Rothirsch, Damhirsch, Muffel, Fasan, Federwild'},
        {name:'Slowenien', iso:'SI', slug:'slowenien', desc:'Gams, Rothirsch, Rehbock, Muffel'},
        {name:'Spanien', iso:'ES', slug:'spanien', desc:'Iberischer Steinbock, Mähnenschaf, Rehbock, Schwarzwild / Keiler, Federwild'},
        {name:'Südengland', iso:'GB-ENG', slug:'suedengland', desc:'Rehbock, Chinesisches Wasserreh, Muntjak'},
        {name:'Tschechien', iso:'CZ', slug:'tschechien', desc:'Muffel, Damhirsch, Rothirsch, Sikahirsch, Taube'},
        {name:'Türkei', iso:'TR', slug:'tuerkei', desc:'Bezoar, Schwarzwild / Keiler'},
        {name:'Ungarn', iso:'HU', slug:'ungarn', desc:'Rothirsch, Damhirsch, Rehbock, Muffel, Fasan'},
        {name:'Weißrussland', iso:'BY', slug:'weissrussland', desc:'Elch, Wisent / Bison, Auerhahn, Birkhahn, Rothirsch'},
        {name:'Weitere Länder (Europa)…', iso:null}
      ],
      'AS': [
        {name:'Asiat. Russland', iso:'RU', slug:'asiat-russland', desc:'Kamtschatka-Braunbär, Elch, Schneeschaf, Tur, Sibirischer Rehbock'},
        {name:'Iran', iso:'IR', slug:'iran', desc:'Urial, Bezoar, Schwarzwild / Keiler'},
        {name:'Kasachstan', iso:'KZ', slug:'kasachstan', desc:'Steinbock, Maral, Saiga, Sibirischer Rehbock'},
        {name:'Kirgisien', iso:'KG', slug:'kirgisien', desc:'Tien Shan Argali, Steinbock'},
        {name:'Mongolei', iso:'MN', slug:'mongolei', desc:'Altai-Argali, Steinbock, Maral, Argali'},
        {name:'Nepal', iso:'NP', slug:'nepal', desc:'Blauschaf, Tahr'},
        {name:'Pakistan', iso:'PK', slug:'pakistan', desc:'Markhor, Urial, Blauschaf, Steinbock'},
        {name:'Tadschikistan', iso:'TJ', slug:'tadschikistan', desc:'Markhor, Steinbock, Marco-Polo-Argali, Urial, Schwarzwild / Keiler'},
        {name:'Weitere Länder (Asien)…', iso:null}
      ],
      'AF': [
        {name:'Äthiopien', iso:'ET', slug:'aethiopien', desc:'Bergnyala'},
        {name:'Botswana', iso:'BW', slug:'botswana', desc:'Elefant, Büffel'},
        {name:'Kamerun', iso:'CM', slug:'kamerun', desc:'Riesen-Elenantilope / Lord Derby Eland, Bongo'},
        {name:'Kongo', iso:'CG', slug:'kongo', desc:'Bongo'},
        {name:'Mauretanien', iso:'MR', slug:'mauretanien', desc:'Warzenschwein, Plainsgame'},
        {name:'Mauritius', iso:'MU', slug:'mauritius', desc:'Rusahirsch, Schwarzwild / Keiler'},
        {name:'Mosambik', iso:'MZ', slug:'mosambik', desc:'Büffel, Rappenantilope, Plainsgame'},
        {name:'Namibia', iso:'NA', slug:'namibia', desc:'Leopard, Gepard, Kudu, Oryx, Springbock'},
        {name:'Sambia', iso:'ZM', slug:'sambia', desc:'Büffel, Löwe, Leopard, Plainsgame'},
        {name:'Simbabwe', iso:'ZW', slug:'simbabwe', desc:'Büffel, Elefant, Leopard, Löwe, Kudu'},
        {name:'Südafrika', iso:'ZA', slug:'suedafrika', desc:'Büffel, Kudu, Nyala, Buschbock, Plainsgame'},
        {name:'Tansania', iso:'TZ', slug:'tansania', desc:'Büffel, Löwe, Leopard, Elefant, Kudu'},
        {name:'Uganda', iso:'UG', slug:'uganda', desc:'Büffel, Sitatunga'},
        {name:'Weitere Länder (Afrika)…', iso:null}
      ],
      'AMERIKA': [
        {name:'Alaska', iso:'US-AK', slug:'alaska', desc:'Braunbär, Dall-Schaf, Elch, Schneeziege'},
        {name:'Argentinien', iso:'AR', slug:'argentinien', desc:'Rothirsch, Hirschziegenantilope, Taube'},
        {name:'Chile', iso:'CL', slug:'chile', desc:'Rothirsch'},
        {name:'Grönland', iso:'GL', slug:'groenland', desc:'Moschusochse, Karibu'},
        {name:'Kanada', iso:'CA', slug:'kanada', desc:'Eisbär / Polarbär, Schwarzbär, Elch, Dall-Schaf, Steinschaf'},
        {name:'Mexiko', iso:'MX', slug:'mexiko', desc:'Wüsten-Dickhornschaf / Desert Bighorn'},
        {name:'Weitere Länder (Amerika)…', iso:null}
      ],
      'OC': [
        {name:'Australien', iso:'AU', slug:'australien', desc:'Wasserbüffel'},
        {name:'Neuseeland', iso:'NZ', slug:'neuseeland', desc:'Tahr, Wapiti, Rothirsch'},
        {name:'Weitere Länder (Ozeanien)…', iso:null}
      ]
    };

    // === Länderseiten-Navigation =========================================
    // Basis-Pfad zu den CMS-Länderseiten. Relativ -> funktioniert auf
    // Vorschau-Domain UND echter Domain.
    var LAENDER_BASE = '/laender/';
    // iso -> slug Karte (aus BUSINESS aufgebaut)
    var isoToSlug = {};
    Object.values(BUSINESS).forEach(function(list) {
        list.forEach(function(c) {
            if (c.iso && c.slug) isoToSlug[c.iso] = c.slug;
        });
    });
    // === Sanktionierte Länder (EU-Sanktionen) ============================
    // Russland (asiat. + europ.) und Weißrussland: keine Navigation,
    // stattdessen Hinweis-Popup (global in Footer-Code definiert).
    var SANCTION_ISOS = { 'RU': true, 'RU-EU': true, 'BY': true };
    function isSanctionedIso(iso) {
        return !!SANCTION_ISOS[iso];
    }
    function showSanctionNotice() {
        // Greift auf das globale Popup zu (Footer-Code). Fallback: nichts tun.
        if (typeof window.JK_SANCTION_SHOW === 'function') {
            window.JK_SANCTION_SHOW();
        }
    }
    // =====================================================================

    function gotoCountry(iso) {
        if (!iso) return;
        // Sanktionierte Länder: kein Sprung, nur Hinweis
        if (isSanctionedIso(iso)) { showSanctionNotice(); return; }
        var slug = isoToSlug[iso];
        if (!slug) return;
        // iOS-sicher: location.href statt window.open
        window.location.href = LAENDER_BASE + slug;
    }
    // =====================================================================

    var PLACEHOLDER_IMG = 'https://cdn.prod.website-files.com/6a031706a57be115a0a95741/6a031a630ef91eab1f78673f_Frame%201321316194.png';

    // === Strukturierte Tierdaten pro Land =================================
    // Pro Land eine Liste von Tieren mit { name, img }.
    // name MUSS exakt dem Wildarten-Namen in Webflow entsprechen (für wild_equal).
    // Länder ohne Eintrag hier nutzen weiterhin desc + Platzhalterbild (Fallback).
    var ANIMAL_DATA = {
      'BG': [
        { name: 'Gams', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a31500127433dcc539f3efd_Gams-p-500.jpg' },
        { name: 'Damhirsch', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a1eb6df918bd79ca6067033_Damhirsch-p-500.jpg' },
        { name: 'Muffel', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a316c8957679ed2cbd1c0f9_Muffel-p-500.jpg' },
        { name: 'Rehbock', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a1ecca503f180a3c0eced81_Rehbock-p-500.jpg' },
        { name: 'Rothirsch', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a316c62180c70cd1a28753e_Rothirsch-p-500.jpg' },
        { name: 'Schwarzwild / Keiler', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a200b8bc57357009eff2cc9_Schwarzwild-p-500.jpg' }
      ],
      'DE': [
        { name: 'Schwarzwild / Keiler', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a200b8bc57357009eff2cc9_Schwarzwild-p-500.jpg' }
      ],
      'EE': [
        { name: 'Elch', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a316ba461042af189b89e69_Elch-p-500.jpg' }
      ],
      'RU-EU': [
        { name: 'Wolf', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a565a6251ccc58bc7502e90_Wolf-p-500.jpg' },
        { name: 'Auerhahn', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a324f407155c87e79a65805_Auerhahn-p-500.jpg' },
        { name: 'Birkhahn', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a32500b13633436530ca33f_Birkhahn-p-500.jpg' },
        { name: 'Elch', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a316ba461042af189b89e69_Elch-p-500.jpg' },
        { name: 'Sikahirsch', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a316bce264fa2125946f76f_Sikahirsch-p-500.jpg' }
      ],
      'FI': [
        { name: 'Elch', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a316ba461042af189b89e69_Elch-p-500.jpg' },
        { name: 'Weißwedelhirsch', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a316c3761042af189b90721_Wei%C3%9Fwedelhirsch-p-500.jpg' }
      ],
      'FR': [
        { name: 'Gams', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a31500127433dcc539f3efd_Gams-p-500.jpg' }
      ],
      'GR': [
        { name: 'Kri-Kri / Kretische Wildziege', img: PLACEHOLDER_IMG }
      ],
      'IE': [
        { name: 'Sikahirsch', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a316bce264fa2125946f76f_Sikahirsch-p-500.jpg' }
      ],
      'HR': [
        { name: 'Gams', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a31500127433dcc539f3efd_Gams-p-500.jpg' },
        { name: 'Muffel', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a316c8957679ed2cbd1c0f9_Muffel-p-500.jpg' },
        { name: 'Rehbock', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a1ecca503f180a3c0eced81_Rehbock-p-500.jpg' },
        { name: 'Rothirsch', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a316c62180c70cd1a28753e_Rothirsch-p-500.jpg' }
      ],
      'LV': [
        { name: 'Elch', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a316ba461042af189b89e69_Elch-p-500.jpg' }
      ],
      'NO': [
        { name: 'Karibu', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a31509f2621e3dae2c9b96d_Karibu-p-500.jpg' }
      ],
      'AT': [
        { name: 'Gams', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a31500127433dcc539f3efd_Gams-p-500.jpg' },
        { name: 'Steinbock', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a316b59777b49f42e0b9d01_Steinbock-p-500.jpg' }
      ],
      'PL': [
        { name: 'Damhirsch', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a1eb6df918bd79ca6067033_Damhirsch-p-500.jpg' },
        { name: 'Rothirsch', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a316c62180c70cd1a28753e_Rothirsch-p-500.jpg' },
        { name: 'Muffel', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a316c8957679ed2cbd1c0f9_Muffel-p-500.jpg' },
        { name: 'Rehbock', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a1ecca503f180a3c0eced81_Rehbock-p-500.jpg' },
        { name: 'Schwarzwild / Keiler', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a200b8bc57357009eff2cc9_Schwarzwild-p-500.jpg' }
      ],
      'RO': [
        { name: 'Braunbär', img: PLACEHOLDER_IMG },
        { name: 'Gams', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a31500127433dcc539f3efd_Gams-p-500.jpg' },
        { name: 'Rothirsch', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a316c62180c70cd1a28753e_Rothirsch-p-500.jpg' },
        { name: 'Damhirsch', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a1eb6df918bd79ca6067033_Damhirsch-p-500.jpg' },
        { name: 'Rehbock', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a1ecca503f180a3c0eced81_Rehbock-p-500.jpg' }
      ],
      'GB-SCO': [
        { name: 'Rothirsch', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a316c62180c70cd1a28753e_Rothirsch-p-500.jpg' },
        { name: 'Rehbock', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a1ecca503f180a3c0eced81_Rehbock-p-500.jpg' },
        { name: 'Sikahirsch', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a316bce264fa2125946f76f_Sikahirsch-p-500.jpg' },
        { name: 'Fasan', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a3251c2d1c038858975f515_Fasan-p-500.jpg' },
        { name: 'Niederwild', img: PLACEHOLDER_IMG }
      ],
      'SE': [
        { name: 'Elch', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a316ba461042af189b89e69_Elch-p-500.jpg' }
      ],
      'RS': [
        { name: 'Rothirsch', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a316c62180c70cd1a28753e_Rothirsch-p-500.jpg' },
        { name: 'Rehbock', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a1ecca503f180a3c0eced81_Rehbock-p-500.jpg' }
      ],
      'SK': [
        { name: 'Rothirsch', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a316c62180c70cd1a28753e_Rothirsch-p-500.jpg' },
        { name: 'Damhirsch', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a1eb6df918bd79ca6067033_Damhirsch-p-500.jpg' },
        { name: 'Muffel', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a316c8957679ed2cbd1c0f9_Muffel-p-500.jpg' },
        { name: 'Fasan', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a3251c2d1c038858975f515_Fasan-p-500.jpg' },
        { name: 'Federwild', img: PLACEHOLDER_IMG }
      ],
      'SI': [
        { name: 'Gams', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a31500127433dcc539f3efd_Gams-p-500.jpg' },
        { name: 'Rothirsch', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a316c62180c70cd1a28753e_Rothirsch-p-500.jpg' },
        { name: 'Rehbock', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a1ecca503f180a3c0eced81_Rehbock-p-500.jpg' },
        { name: 'Muffel', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a316c8957679ed2cbd1c0f9_Muffel-p-500.jpg' }
      ],
      'ES': [
        { name: 'Iberischer Steinbock', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a2c00bbdda9d7b4b3bbf626_Iberischer%20Steinbock-p-500.jpg' },
        { name: 'Mähnenschaf', img: PLACEHOLDER_IMG },
        { name: 'Rehbock', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a1ecca503f180a3c0eced81_Rehbock-p-500.jpg' },
        { name: 'Schwarzwild / Keiler', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a200b8bc57357009eff2cc9_Schwarzwild-p-500.jpg' },
        { name: 'Federwild', img: PLACEHOLDER_IMG }
      ],
      'GB-ENG': [
        { name: 'Rehbock', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a1ecca503f180a3c0eced81_Rehbock-p-500.jpg' },
        { name: 'Chinesisches Wasserreh', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a315b0a7abd77344bd4f51d_Chinesisches%20Wasserreh-p-500.jpg' },
        { name: 'Muntjak', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a316bff75800d8b57d4f362_Muntjak-p-500.jpg' }
      ],
      'CZ': [
        { name: 'Muffel', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a316c8957679ed2cbd1c0f9_Muffel-p-500.jpg' },
        { name: 'Damhirsch', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a1eb6df918bd79ca6067033_Damhirsch-p-500.jpg' },
        { name: 'Rothirsch', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a316c62180c70cd1a28753e_Rothirsch-p-500.jpg' },
        { name: 'Sikahirsch', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a316bce264fa2125946f76f_Sikahirsch-p-500.jpg' },
        { name: 'Taube', img: PLACEHOLDER_IMG },
        { name: 'Federwild', img: PLACEHOLDER_IMG }
      ],
      'TR': [
        { name: 'Bezoar', img: PLACEHOLDER_IMG },
        { name: 'Schwarzwild / Keiler', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a200b8bc57357009eff2cc9_Schwarzwild-p-500.jpg' }
      ],
      'HU': [
        { name: 'Rothirsch', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a316c62180c70cd1a28753e_Rothirsch-p-500.jpg' },
        { name: 'Damhirsch', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a1eb6df918bd79ca6067033_Damhirsch-p-500.jpg' },
        { name: 'Rehbock', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a1ecca503f180a3c0eced81_Rehbock-p-500.jpg' },
        { name: 'Muffel', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a316c8957679ed2cbd1c0f9_Muffel-p-500.jpg' },
        { name: 'Fasan', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a3251c2d1c038858975f515_Fasan-p-500.jpg' },
        { name: 'Niederwild', img: PLACEHOLDER_IMG }
      ],
      'BY': [
        { name: 'Elch', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a316ba461042af189b89e69_Elch-p-500.jpg' },
        { name: 'Wisent / Bison', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a2be5b73dabaa68eb9cbc63_Wisent-p-500.jpg' },
        { name: 'Auerhahn', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a324f407155c87e79a65805_Auerhahn-p-500.jpg' },
        { name: 'Birkhahn', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a32500b13633436530ca33f_Birkhahn-p-500.jpg' },
        { name: 'Rothirsch', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a316c62180c70cd1a28753e_Rothirsch-p-500.jpg' },
        { name: 'Schwarzwild / Keiler', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a200b8bc57357009eff2cc9_Schwarzwild-p-500.jpg' }
      ],
      'RU': [
        { name: 'Kamtschatka-Braunbär', img: PLACEHOLDER_IMG },
        { name: 'Elch', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a316ba461042af189b89e69_Elch-p-500.jpg' },
        { name: 'Schneeschaf', img: PLACEHOLDER_IMG },
        { name: 'Tur', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a3248f49f24618c2e828ae0_Tur-p-500.jpg' },
        { name: 'Sibirischer Rehbock', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a3bdc0a6406e004cee0a6e1_Siberian_roe_deer-p-500.jpg' }
      ],
      'IR': [
        { name: 'Urial', img: PLACEHOLDER_IMG },
        { name: 'Bezoar', img: PLACEHOLDER_IMG },
        { name: 'Schwarzwild / Keiler', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a200b8bc57357009eff2cc9_Schwarzwild-p-500.jpg' }
      ],
      'KZ': [
        { name: 'Steinbock', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a316b59777b49f42e0b9d01_Steinbock-p-500.jpg' },
        { name: 'Maral', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a324426d450f2e5c6202c47_Maral-p-500.jpg' },
        { name: 'Saiga', img: PLACEHOLDER_IMG },
        { name: 'Sibirischer Rehbock', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a3bdc0a6406e004cee0a6e1_Siberian_roe_deer-p-500.jpg' }
      ],
      'KG': [
        { name: 'Steinbock', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a316b59777b49f42e0b9d01_Steinbock-p-500.jpg' },
        { name: 'Tien Shan Argali', img: PLACEHOLDER_IMG }
      ],
      'MN': [
        { name: 'Altai-Argali', img: PLACEHOLDER_IMG },
        { name: 'Steinbock', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a316b59777b49f42e0b9d01_Steinbock-p-500.jpg' },
        { name: 'Maral', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a324426d450f2e5c6202c47_Maral-p-500.jpg' },
        { name: 'Argali', img: PLACEHOLDER_IMG }
      ],
      'NP': [
        { name: 'Blauschaf', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a316b7d769c7418708ffea7_Blauschaf-p-500.jpg' },
        { name: 'Tahr', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a324e1ea07fcea09b443730_Tahr-p-500.jpg' }
      ],
      'PK': [
        { name: 'Urial', img: PLACEHOLDER_IMG },
        { name: 'Blauschaf', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a316b7d769c7418708ffea7_Blauschaf-p-500.jpg' },
        { name: 'Steinbock', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a316b59777b49f42e0b9d01_Steinbock-p-500.jpg' },
        { name: 'Markhor', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a58c6e13fb7c7dd52a0fc32_Markhor-p-500.jpg' },
        { name: 'Schwarzwild / Keiler', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a200b8bc57357009eff2cc9_Schwarzwild-p-500.jpg' }
      ],
      'TJ': [
        { name: 'Markhor', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a58c6e13fb7c7dd52a0fc32_Markhor-p-500.jpg' },
        { name: 'Steinbock', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a316b59777b49f42e0b9d01_Steinbock-p-500.jpg' },
        { name: 'Marco-Polo-Argali', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a2be2b4308695b359013e1e_Argali-p-500.jpg' },
        { name: 'Urial', img: PLACEHOLDER_IMG },
        { name: 'Schwarzwild / Keiler', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a200b8bc57357009eff2cc9_Schwarzwild-p-500.jpg' }
      ],
      'ET': [
        { name: 'Bergnyala', img: PLACEHOLDER_IMG }
      ],
      'BW': [
        { name: 'Elefant', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a2be0e19662b8e5b5406c25_Elefant-p-500.jpg' },
        { name: 'Büffel', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a314fd6cb8b83ceb26cf2ba_Bu%CC%88ffel-p-500.jpg' }
      ],
      'CM': [
        { name: 'Riesen-Elenantilope / Lord Derby Eland', img: PLACEHOLDER_IMG },
        { name: 'Bongo', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a315e4bb788f4807fd647f2_Bongo-p-500.jpg' }
      ],
      'CG': [
        { name: 'Bongo', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a315e4bb788f4807fd647f2_Bongo-p-500.jpg' }
      ],
      'MR': [
        { name: 'Warzenschwein', img: PLACEHOLDER_IMG },
        { name: 'Plainsgame', img: PLACEHOLDER_IMG }
      ],
      'MU': [
        { name: 'Rusahirsch', img: PLACEHOLDER_IMG },
        { name: 'Schwarzwild / Keiler', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a200b8bc57357009eff2cc9_Schwarzwild-p-500.jpg' }
      ],
      'MZ': [
        { name: 'Büffel', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a314fd6cb8b83ceb26cf2ba_Bu%CC%88ffel-p-500.jpg' },
        { name: 'Rappenantilope', img: PLACEHOLDER_IMG },
        { name: 'Plainsgame', img: PLACEHOLDER_IMG }
      ],
      'NA': [
        { name: 'Leopard', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a316b0ca4ae15542e83310e_Leopard-p-500.jpg' },
        { name: 'Gepard', img: PLACEHOLDER_IMG },
        { name: 'Kudu', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a314f9559060451a50311c3_Kudu-p-500.jpg' },
        { name: 'Oryx', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a316a933e00868b42a7c945_Oryx-p-500.jpg' },
        { name: 'Springbock', img: PLACEHOLDER_IMG },
        { name: 'Plainsgame', img: PLACEHOLDER_IMG }
      ],
      'ZM': [
        { name: 'Büffel', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a314fd6cb8b83ceb26cf2ba_Bu%CC%88ffel-p-500.jpg' },
        { name: 'Löwe', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a2bee5c88829c3cbf56fd21_Lo%CC%88we-p-500.jpg' },
        { name: 'Leopard', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a316b0ca4ae15542e83310e_Leopard-p-500.jpg' },
        { name: 'Plainsgame', img: PLACEHOLDER_IMG }
      ],
      'ZW': [
        { name: 'Büffel', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a314fd6cb8b83ceb26cf2ba_Bu%CC%88ffel-p-500.jpg' },
        { name: 'Elefant', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a2be0e19662b8e5b5406c25_Elefant-p-500.jpg' },
        { name: 'Leopard', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a316b0ca4ae15542e83310e_Leopard-p-500.jpg' },
        { name: 'Löwe', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a2bee5c88829c3cbf56fd21_Lo%CC%88we-p-500.jpg' },
        { name: 'Kudu', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a314f9559060451a50311c3_Kudu-p-500.jpg' },
        { name: 'Rappenantilope', img: PLACEHOLDER_IMG }
      ],
      'ZA': [
        { name: 'Büffel', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a314fd6cb8b83ceb26cf2ba_Bu%CC%88ffel-p-500.jpg' },
        { name: 'Nashorn', img: PLACEHOLDER_IMG },
        { name: 'Kudu', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a314f9559060451a50311c3_Kudu-p-500.jpg' },
        { name: 'Nyala', img: PLACEHOLDER_IMG },
        { name: 'Oryx', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a316a933e00868b42a7c945_Oryx-p-500.jpg' },
        { name: 'Buschbock', img: PLACEHOLDER_IMG },
        { name: 'Plainsgame', img: PLACEHOLDER_IMG }
      ],
      'TZ': [
        { name: 'Büffel', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a314fd6cb8b83ceb26cf2ba_Bu%CC%88ffel-p-500.jpg' },
        { name: 'Löwe', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a2bee5c88829c3cbf56fd21_Lo%CC%88we-p-500.jpg' },
        { name: 'Leopard', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a316b0ca4ae15542e83310e_Leopard-p-500.jpg' },
        { name: 'Elefant', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a2be0e19662b8e5b5406c25_Elefant-p-500.jpg' },
        { name: 'Kudu', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a314f9559060451a50311c3_Kudu-p-500.jpg' },
        { name: 'Warzenschwein', img: PLACEHOLDER_IMG },
        { name: 'Plainsgame', img: PLACEHOLDER_IMG }
      ],
      'UG': [
        { name: 'Büffel', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a314fd6cb8b83ceb26cf2ba_Bu%CC%88ffel-p-500.jpg' },
        { name: 'Löwe', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a2bee5c88829c3cbf56fd21_Lo%CC%88we-p-500.jpg' },
        { name: 'Sitatunga', img: PLACEHOLDER_IMG }
      ],
      'US-AK': [
        { name: 'Braunbär', img: PLACEHOLDER_IMG },
        { name: 'Dall-Schaf', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a2bfe8d24cd0988b1fe0cd7_Dall-Sharf-p-500.jpg' },
        { name: 'Elch', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a316ba461042af189b89e69_Elch-p-500.jpg' },
        { name: 'Schneeziege', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a31502d90b787871469e341_Schneeziege-p-500.jpg' }
      ],
      'AR': [
        { name: 'Rothirsch', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a316c62180c70cd1a28753e_Rothirsch-p-500.jpg' },
        { name: 'Hirschziegenantilope', img: PLACEHOLDER_IMG },
        { name: 'Taube', img: PLACEHOLDER_IMG }
      ],
      'CL': [
        { name: 'Rothirsch', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a316c62180c70cd1a28753e_Rothirsch-p-500.jpg' }
      ],
      'GL': [
        { name: 'Moschusochse', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a32457a7ceaf9d84aafb091_Moschusochsen-p-500.jpg' },
        { name: 'Karibu', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a31509f2621e3dae2c9b96d_Karibu-p-500.jpg' }
      ],
      'CA': [
        { name: 'Eisbär / Polarbär', img: PLACEHOLDER_IMG },
        { name: 'Schwarzbär', img: PLACEHOLDER_IMG },
        { name: 'Puma', img: PLACEHOLDER_IMG },
        { name: 'Elch', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a316ba461042af189b89e69_Elch-p-500.jpg' },
        { name: 'Karibu', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a31509f2621e3dae2c9b96d_Karibu-p-500.jpg' },
        { name: 'Dall-Schaf', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a2bfe8d24cd0988b1fe0cd7_Dall-Sharf-p-500.jpg' },
        { name: 'Steinschaf', img: PLACEHOLDER_IMG },
        { name: 'Schneeziege', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a31502d90b787871469e341_Schneeziege-p-500.jpg' }
      ],
      'MX': [
        { name: 'Wüsten-Dickhornschaf / Desert Bighorn', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a59ba80e003fc9e79524bf6_Wu%CC%88sten-Dickhornschaf-p-500.jpg' }
      ],
      'AU': [
        { name: 'Wasserbüffel', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a58c813898aae4f5c524b8c_Wasserbu%CC%88ffel-p-500.jpg' }
      ],
      'NZ': [
        { name: 'Tahr', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a324e1ea07fcea09b443730_Tahr-p-500.jpg' },
        { name: 'Wapiti', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a2bebd48b51648e8c091654_Wapiti-p-500.jpg' },
        { name: 'Rothirsch', img: 'https://cdn.prod.website-files.com/6a031b71b6957742cb6b4caa/6a316c62180c70cd1a28753e_Rothirsch-p-500.jpg' }
      ]
    };
    // Basis-Pfad zur Reisen-Filterseite
    var REISEN_BASE = '/reisen';
    // iso -> Land-Name Karte (für land_equal), aus BUSINESS aufgebaut
    var isoToName = {};
    Object.values(BUSINESS).forEach(function(list) {
        list.forEach(function(c) {
            if (c.iso && c.name) isoToName[c.iso] = c.name;
        });
    });
    // Baut die Filter-URL: /reisen?land_equal=Polen&wild_equal=Rothirsch
    function buildAnimalUrl(iso, animalName) {
        var landName = isoToName[iso] || '';
        return REISEN_BASE +
               '?land_equal=' + encodeURIComponent(landName) +
               '&wild_equal=' + encodeURIComponent(animalName);
    }
    // =====================================================================

    var isoDataMap = {};
    Object.values(BUSINESS).forEach(function(list) {
        list.forEach(function(c) {
            if(c.iso) isoDataMap[c.iso] = { name: c.name, desc: c.desc, img: PLACEHOLDER_IMG };
        });
    });

    function getBusinessList(cont) {
      if (cont === 'NA' || cont === 'SA') return BUSINESS['AMERIKA'];
      return BUSINESS[cont] || [];
    }
    function getServiceIsoSet(cont) {
      var list = getBusinessList(cont);
      var set = {};
      list.forEach(function(c){ if(c.iso) set[c.iso] = true; });
      return set;
    }

    var CONT_TITLE = {EU:'Europa', AS:'Asien', AF:'Afrika', NA:'Amerika', SA:'Amerika', OC:'Ozeanien'};

    var CAMERAS = {
      'EU': { cx: 580, cy: 120, scale: 1.4, dx: 0, dy: 0, pTop: '15%', pHeight: '88%' },
      'AF': { cx: 560, cy: 280, scale: 1.4, dx: 0, dy: 0, pTop: '22%', pHeight: '80%' },
      'NA': { cx: 240, cy: 250, scale: 1.0, dx: 0, dy: 0, pTop: '28%', pHeight: '65%' },
      'SA': { cx: 240, cy: 250, scale: 1.0, dx: 0, dy: 0, pTop: '28%', pHeight: '65%' },
      'AS': { cx: 780, cy: 180, scale: 1.1, dx: 0, dy: 0, pTop: '24%', pHeight: '65%' },
      'OC': { cx: 900, cy: 340, scale: 1.6, dx: 0, dy: 0, pTop: '30%', pHeight: '50%' }
    };
    var CAMERAS_PORTRAIT = {
      'EU': { focusX: 60, focusY: -10, scale: 2.3 },
      'AS': { focusX: 50, focusY: -15, scale: 1.7 },
      'AF': { focusX: 55, focusY: -10, scale: 2.0 },
      'NA': { focusX: 50, focusY: -15, scale: 1.2 },
      'SA': { focusX: 50, focusY: -15, scale: 1.2 },
      'OC': { focusX: 55, focusY: -20, scale: 2.3 }
    };
    // iPad quer (pointer:coarse, Desktop-Layout, contain-Karte):
    // eigene Kamera-Werte. focusX groesser = Karte weiter rechts,
    // focusY groesser = weiter unten, scale groesser = staerker gezoomt.
    var CAMERAS_TABLET = window.JK_CAMERAS_TABLET || {
      'EU': { focusX: 28, focusY: 38, scale: 1.7 },
      'AS': { focusX: 28, focusY: 42, scale: 1.3 },
      'AF': { focusX: 28, focusY: 38, scale: 1.6 },
      'NA': { focusX: 30, focusY: 45, scale: 1.2 },
      'SA': { focusX: 30, focusY: 45, scale: 1.2 },
      'OC': { focusX: 28, focusY: 35, scale: 1.8 }
    };
    var CONT_CENTER = {
      'EU': { cx: 530, cy: 150, name: 'Europa' },
      'AS': { cx: 760, cy: 175, name: 'Asien' },
      'AF': { cx: 520, cy: 250, name: 'Afrika' },
      'NA': { cx: 250, cy: 220, name: 'Amerika' },
      'SA': { cx: 250, cy: 220, name: 'Amerika' },
      'OC': { cx: 890, cy: 320, name: 'Ozeanien' }
    };

    mount.innerHTML =
      '<div class="jk-stage">' +
        '<div class="jk-eyebrow">— Die Welt ist weit —</div>' +
        '<div class="jk-headline">Wohin zieht es Sie?</div>' +
        '<div class="jk-sub">Wählen Sie Ihren Kontinent und starten Sie Ihre Reise</div>' +
        '<div class="jk-back">← Zurück zur Welt</div>' +
        '<div class="jk-viewport"><div class="jk-rotor">' +
          '<div class="jk-globe"><svg viewBox="0 0 1000 500" preserveAspectRatio="xMidYMid meet" class="jk-svg1"></svg></div>' +
          '<div class="jk-globe"><svg viewBox="0 0 1000 500" preserveAspectRatio="xMidYMid meet" class="jk-svg2"></svg></div>' +
        '</div></div>' +
        '<div class="jk-hint"></div>' +
        '<div class="jk-cont-list"></div>' +
        '<div class="jk-country-panel"></div>' +
        '<div class="jk-cont-label"><div class="jk-cl-name"></div></div>' +
        '<div class="jk-tooltip jk-hide"><div class="jk-tt-name"></div></div>' +
      '</div>';

    var stageEl = mount.querySelector('.jk-stage');
    var viewport = mount.querySelector('.jk-viewport');
    var rotor = mount.querySelector('.jk-rotor');
    var hint = mount.querySelector('.jk-hint');
    var back = mount.querySelector('.jk-back');
    var eyebrow = mount.querySelector('.jk-eyebrow');
    var headline = mount.querySelector('.jk-headline');
    var sub = mount.querySelector('.jk-sub');
    var panel = mount.querySelector('.jk-country-panel');
    var tooltip = mount.querySelector('.jk-tooltip');
    var contLabel = mount.querySelector('.jk-cont-label');
    var svg2 = mount.querySelector('.jk-svg2');

    var iso2cont = {};
    DATA.forEach(function(d) { iso2cont[d.iso] = d.cont; });

    var SIMPLIFY = (('ontouchstart' in window) || navigator.maxTouchPoints > 0) ? 0.8 : 0;
    function jkPerpSq(p, a, b) {
      var dx = b[0]-a[0], dy = b[1]-a[1];
      if (dx === 0 && dy === 0) { var ddx=p[0]-a[0], ddy=p[1]-a[1]; return ddx*ddx+ddy*ddy; }
      var t = ((p[0]-a[0])*dx + (p[1]-a[1])*dy) / (dx*dx+dy*dy);
      t = Math.max(0, Math.min(1, t));
      var px = a[0]+t*dx, py = a[1]+t*dy, ex = p[0]-px, ey = p[1]-py;
      return ex*ex+ey*ey;
    }
    function jkDP(pts, epsSq) {
      if (pts.length < 3) return pts;
      var dmax = 0, idx = 0;
      for (var i = 1; i < pts.length-1; i++) {
        var d = jkPerpSq(pts[i], pts[0], pts[pts.length-1]);
        if (d > dmax) { dmax = d; idx = i; }
      }
      if (dmax > epsSq) {
        return jkDP(pts.slice(0, idx+1), epsSq).slice(0, -1).concat(jkDP(pts.slice(idx), epsSq));
      }
      return [pts[0], pts[pts.length-1]];
    }
    function jkSimplify(d, eps) {
      if (!eps) return d;
      var epsSq = eps*eps, out = '';
      d.split('M').filter(function(s){ return s.trim() !== ''; }).forEach(function(part) {
        var hasZ = /Z\s*$/i.test(part.trim());
        var nums = part.replace(/Z/ig,'').split(/[ML]/i).filter(function(s){ return s.trim() !== ''; });
        var pts = [];
        nums.forEach(function(pair) {
          var xy = pair.split(',');
          if (xy.length === 2) { var x=parseFloat(xy[0]), y=parseFloat(xy[1]); if(!isNaN(x)&&!isNaN(y)) pts.push([x,y]); }
        });
        if (!pts.length) return;
        var s = jkDP(pts, epsSq);
        if (s.length < 2) s = pts;
        out += 'M' + s.map(function(p){ return p[0]+','+p[1]; }).join('L') + (hasZ ? 'Z' : '');
      });
      return out;
    }
    var SPARK_R = (('ontouchstart' in window) || navigator.maxTouchPoints > 0) ? 1.4 : 0.8;

    function fill(svg, drawSparks) {
      DATA.forEach(function (c) {
        var p = document.createElementNS(NS, 'path');
        var pathData = c.d;
        if (c.iso === 'MA') pathData = maUnified;
        if (c.iso === 'SO') pathData = soUnified;
        pathData = jkSimplify(pathData, SIMPLIFY);
        p.setAttribute('d', pathData);
        p.setAttribute('class', 'jk-country');
        p.dataset.cont = c.cont;
        p.dataset.iso = c.iso;
        svg.appendChild(p);
      });
      if (!drawSparks) return;
      var contSparks = {};
      Object.keys(SPARKS).forEach(function (iso) {
        var sc = iso2cont[iso];
        var key = (sc === 'NA' || sc === 'SA') ? 'AMERIKA' : sc;
        if (!key) return;
        if (!contSparks[key]) contSparks[key] = [];
        SPARKS[iso].forEach(function (pt) { contSparks[key].push({ pt: pt, iso: iso, cont: sc }); });
      });

      var ANCHOR_N = 4, ANCHOR_T = 24;
      var anchorSet = {};
      Object.keys(contSparks).forEach(function (key) {
        var arr = contSparks[key];
        var n = Math.min(ANCHOR_N, arr.length);
        for (var k = 0; k < n; k++) {
          var idx = Math.floor(arr.length * k / n);
          var o = arr[idx];
          anchorSet[o.iso + '|' + o.pt[0] + '|' + o.pt[1]] = k;
        }
      });

      Object.keys(SPARKS).forEach(function (iso) {
        var sparkCont = iso2cont[iso];
        SPARKS[iso].forEach(function (pt) {
          var d = document.createElementNS(NS, 'circle');
          d.setAttribute('cx', pt[0]); d.setAttribute('cy', pt[1]);
          d.setAttribute('class', 'jk-spark');
          if (sparkCont) d.dataset.cont = sparkCont;

          var anchorKey = iso + '|' + pt[0] + '|' + pt[1];
          if (anchorSet[anchorKey] !== undefined) {
            var k = anchorSet[anchorKey];
            var delay = -(ANCHOR_T * k / ANCHOR_N);
            d.setAttribute('r', SPARK_R);
            d.style.animation = 'jktw_anchor ' + ANCHOR_T + 's linear ' + delay.toFixed(2) + 's infinite';
          } else {
            d.setAttribute('r', SPARK_R);
            var dDur = (132 + Math.random() * 196);
            var del = (-Math.random() * dDur).toFixed(1);
            d.style.animation = 'jktw ' + dDur.toFixed(1) + 's ease-in-out ' + del + 's infinite';
          }
          svg.appendChild(d);
        });
      });
    }
    fill(mount.querySelector('.jk-svg1'), true);
    fill(mount.querySelector('.jk-svg2'), true);

    var zoomed = false, halfWidth = 0, offset = 0;
    var autoVel = 0, velocity = 0, userInertia = 0;
    var dragging = false, lastX = 0, lastT = 0, lastFrame = 0, activeSvg = null;
    var currentHoverIso = null, isHoveringCont = false, currentZoomCont = null;
    var zoomClickReady = false, zoomReadyTimer = null;

    function isTouchLayout() {
      return (stageEl.offsetWidth <= 1024) || (stageEl.offsetHeight > stageEl.offsetWidth);
    }
    var noAutoSpin = isTouchLayout();
    function applyTouchLayout() {
      noAutoSpin = isTouchLayout();
      stageEl.classList.toggle('jk-touch', noAutoSpin);
      if (svg2) svg2.parentNode.style.display = noAutoSpin ? 'none' : '';
      if (hint) hint.textContent = noAutoSpin ? 'Tippen Sie auf einen Kontinent' : 'Fahren Sie über einen Kontinent';
    }
    // Touch-Layout: Kontinent-Liste unter der Weltkarte (tippbar)
    var contList = mount.querySelector('.jk-cont-list');
    if (contList) {
      var CONT_ITEMS = [['EU','Europa'],['AS','Asien'],['AF','Afrika'],['NA','Amerika'],['OC','Ozeanien']];
      contList.innerHTML = CONT_ITEMS.map(function(c){
        return '<div class="jk-cl-item" data-cont="' + c[0] + '">' + c[1] + '</div>';
      }).join('');
      contList.addEventListener('click', function(e){
        var item = e.target.closest('.jk-cl-item');
        if (item) zoomTo(item.dataset.cont);
      });
    }

    applyTouchLayout();
    window.addEventListener('resize', applyTouchLayout);

    function allPaths() { return mount.querySelectorAll('.jk-country'); }

    function measure() {
      var sw = stageEl.offsetWidth, sh = stageEl.offsetHeight;
      var RATIO = 2.0;
      var isTabletOrMobile = (sw <= 1024) || (sh > sw);
      var viewportRatio = sw / sh;
      var isCoarsePointer = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
      var tw, th;
      if (isTabletOrMobile) {
        tw = sw; th = sw / RATIO;
        if (th > sh) { th = sh; tw = sh * RATIO; }
      } else if (isCoarsePointer || viewportRatio < 1.6) {
        // Desktop-Layout, aber Touch-Gerät (iPad quer) oder gedrungenes Viewport:
        // contain statt cover -> komplette Weltkarte sichtbar, kein Beschnitt.
        // pointer:coarse statt Ratio-Schwelle, weil Browser-Chrome die
        // Stage-Höhe verkleinert und 11"-iPads sonst über 1.6 rutschen.
        tw = sw; th = sw / RATIO;
        if (th > sh) { th = sh; tw = sh * RATIO; }
      } else {
        // Breites Desktop-Viewport: cover, Höhe füllt die Bühne,
        // Breite läuft über und wird durch die Auto-Rotation gezeigt
        tw = sw; th = sw / RATIO;
        if (th < sh) { th = sh; tw = sh * RATIO; }
      }
      mount.querySelectorAll('.jk-globe').forEach(function(g) {
        g.style.width = tw + 'px'; g.style.height = th + 'px';
      });
      rotor.style.width = (tw * 2) + 'px';
      rotor.style.height = th + 'px';
      rotor.style.top = ((sh - th) / 2) + 'px';
      halfWidth = tw;
      autoVel = -halfWidth / (360 * 1000);
      if (noAutoSpin) { offset = 0; rotor.style.transform = 'translateX(0px)'; }
    }
    function relayout() {
      var globes = mount.querySelectorAll('.jk-globe');
      globes.forEach(function(g){ g.style.transition = 'none'; });
      mount.querySelectorAll('svg').forEach(function(s){ s.style.transition = 'none'; });
      rotor.style.transition = 'none';

      measure();
      if (zoomed && currentZoomCont && activeSvg) {
        applyZoomTransform(currentZoomCont, activeSvg);
      }

      void mount.offsetWidth;
      requestAnimationFrame(function(){
        globes.forEach(function(g){ g.style.transition = ''; });
        rotor.style.transition = '';
        mount.querySelectorAll('svg').forEach(function(s){ s.style.transition = ''; });
      });
    }

    measure();
    window.addEventListener('resize', relayout);
    window.addEventListener('orientationchange', function() {
      relayout();
      setTimeout(relayout, 100);
      setTimeout(relayout, 300);
      setTimeout(relayout, 600);
      setTimeout(relayout, 1000);
    });
    function wrap(v) { while (v <= -halfWidth) v += halfWidth; while (v > 0) v -= halfWidth; return v; }

    function frame(t) {
      if (!lastFrame) lastFrame = t;
      var dt = t - lastFrame; lastFrame = t;
      if (dt > 100) dt = 16;

      if (!dragging && !zoomed) {
        if (noAutoSpin) {
        } else {
          userInertia *= 0.94;
          if (Math.abs(userInertia) < 0.001) userInertia = 0;
          var targetVel = isHoveringCont ? 0 : autoVel;
          velocity += (targetVel - velocity) * 0.15;
          offset += (velocity + userInertia) * dt;
          offset = wrap(offset);
          rotor.style.transform = 'translateX(' + offset + 'px)';
        }
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    function pointerDown(e) {
      if (zoomed || noAutoSpin) return;
      dragging = true; viewport.classList.add('jk-grabbing');
      hideContLabel();
      userInertia = 0;
      lastX = (e.touches ? e.touches[0].clientX : e.clientX); lastT = performance.now();
    }
    function pointerMove(e) {
      if (!dragging || zoomed || noAutoSpin) return;
      var x = (e.touches ? e.touches[0].clientX : e.clientX); var now = performance.now();
      var dx = (x - lastX) * 0.2;
      var dtm = now - lastT;
      offset = wrap(offset + dx); rotor.style.transform = 'translateX(' + offset + 'px)';
      if (dtm > 0) {
          var instantV = (dx / dtm) * 2.0;
          userInertia = userInertia * 0.4 + instantV * 0.6;
          var MAX_INERTIA = 1.5;
          if (userInertia > MAX_INERTIA) userInertia = MAX_INERTIA;
          if (userInertia < -MAX_INERTIA) userInertia = -MAX_INERTIA;
      }
      lastX = x; lastT = now;
      if (e.cancelable) e.preventDefault();
    }
    function pointerUp() { if (!dragging) return; dragging = false; viewport.classList.remove('jk-grabbing'); }
    viewport.addEventListener('mousedown', pointerDown); window.addEventListener('mousemove', pointerMove); window.addEventListener('mouseup', pointerUp);
    viewport.addEventListener('touchstart', pointerDown, {passive:true}); window.addEventListener('touchmove', pointerMove, {passive:false}); window.addEventListener('touchend', pointerUp);

    var downX = 0, moved = false;
    viewport.addEventListener('mousedown', function(e){ downX = e.clientX; moved = false; });
    viewport.addEventListener('mousemove', function(e){ if(dragging && Math.abs(e.clientX-downX)>5) moved = true; });
    viewport.addEventListener('touchstart', function(e){ if(e.touches[0]) { downX = e.touches[0].clientX; moved = false; } }, {passive:true});
    viewport.addEventListener('touchmove', function(e){ if(e.touches[0] && dragging && Math.abs(e.touches[0].clientX-downX)>5) moved = true; }, {passive:true});

    var labelCont = null;
    function showContLabel(cont, e) {
      var cfg = CONT_CENTER[cont];
      if (!cfg) return;
      var key = (cont === 'NA' || cont === 'SA') ? 'AMERIKA' : cont;

      var svg = e ? e.target.closest('svg') : mount.querySelector('.jk-svg1');
      if (!svg) svg = mount.querySelector('.jk-svg1');

      var svgRect = svg.getBoundingClientRect();
      var stageRect = stageEl.getBoundingClientRect();
      var px = svgRect.left + (cfg.cx / 1000) * svgRect.width - stageRect.left;
      var py = svgRect.top + (cfg.cy / 500) * svgRect.height - stageRect.top;

      contLabel.querySelector('.jk-cl-name').textContent = cfg.name || names[cont] || '';
      contLabel.style.left = px + 'px';
      contLabel.style.top = py + 'px';

      if (labelCont !== key) {
        contLabel.classList.remove('jk-show');
        void contLabel.offsetWidth;
      }
      contLabel.classList.add('jk-show');
      labelCont = key;
    }
    function hideContLabel() {
      contLabel.classList.remove('jk-show');
      labelCont = null;
    }

    var hoverTimeout;
    function hoverCont(cont, on, e) {
      if (zoomed) return;

      var isAm = (cont === 'NA' || cont === 'SA');
      if (on) {
        clearTimeout(hoverTimeout);
        isHoveringCont = true;

        allPaths().forEach(function (p) { p.classList.remove('jk-hover', 'jk-dim'); });
        allPaths().forEach(function (p) {
          var c = p.dataset.cont;
          var isTarget = isAm ? (c === 'NA' || c === 'SA') : (c === cont);
          p.classList.add(isTarget ? 'jk-hover' : 'jk-dim');
        });
        if (!noAutoSpin) showContLabel(cont, e);
      } else {
        clearTimeout(hoverTimeout);
        hoverTimeout = setTimeout(function() {
            isHoveringCont = false;
            hideContLabel();
            allPaths().forEach(function (p) { p.classList.remove('jk-hover', 'jk-dim'); });
        }, 120);
      }
    }

    function showMapTooltip(iso, centerX, topY) {
        var data = isoDataMap[iso];
        if (!data) return;
        tooltip.querySelector('.jk-tt-name').textContent = data.name;
        tooltip.style.left = centerX + 'px';
        tooltip.style.top = topY + 'px';
        tooltip.classList.remove('jk-hide');
        tooltip.classList.add('jk-show');
    }
    function hideMapTooltip() {
        tooltip.classList.remove('jk-show');
        tooltip.classList.add('jk-hide');
    }

    function renderAnimalInfo(iso) {
        if (('ontouchstart' in window) || navigator.maxTouchPoints > 0) return;
        var animalInfo = panel.querySelector('.jk-animal-info');
        if (!animalInfo) return;

        var structured = ANIMAL_DATA[iso];
        var items;
        if (structured && !structured.length) {
            // Land ohne Galerie-Tiere (z. B. Australien): Galerie ausblenden
            animalInfo.classList.remove('jk-show');
            return;
        }
        if (structured && structured.length) {
            // Strukturierte Daten vorhanden (z. B. Polen): echtes Bild + Filter-Link
            items = structured.map(function(a) {
                return { name: a.name, img: a.img || PLACEHOLDER_IMG, href: buildAnimalUrl(iso, a.name) };
            });
        } else {
            // Fallback: desc-String + Platzhalterbild + Filter-Link (best effort)
            var data = isoDataMap[iso];
            if (!data) return;
            var animalNames = (data.desc || 'Premium Jagd').split(',').map(function(s){ return s.trim(); });
            items = animalNames.map(function(name) {
                return { name: name, img: PLACEHOLDER_IMG, href: buildAnimalUrl(iso, name) };
            });
        }

        var count = items.length;
        var galleryHtml = '';
        items.forEach(function(it) {
            galleryHtml += '<a class="jk-animal-item" href="' + it.href + '" data-iso="' + iso + '" data-animal="' + it.name + '">' +
                             '<img class="jk-animal-img" src="' + it.img + '" alt="' + it.name + '" />' +
                             '<div class="jk-animal-name">' + it.name + '</div>' +
                           '</a>';
        });

        var galleryEl = animalInfo.querySelector('.jk-animal-gallery');
        // >5 Arten: zweite Reihe, Kachelgroesse bleibt wie bei 5 pro Reihe
        var rowCls = count > 5 ? ' jk-two-rows' : '';
        galleryEl.className = 'jk-animal-gallery jk-count-' + count + rowCls;
        galleryEl.innerHTML = galleryHtml;
        animalInfo.classList.add('jk-show');
    }

    function applyZoomTransform(cont, clickedSvg) {
      var cam = CAMERAS[cont] || { cx: 550, cy: 250, scale: 1.5, dx: 0, dy: 0, pTop: '15%', pHeight: '70%' };
      var cx_pct = ((cam.cx + cam.dx) / 1000) * 100;
      var cy_pct = ((cam.cy + cam.dy) / 500) * 100;

      var isPortraitLayout = stageEl.offsetHeight > stageEl.offsetWidth;
      var isCoarseLandscape = !isPortraitLayout &&
                              window.matchMedia && window.matchMedia('(pointer: coarse)').matches &&
                              stageEl.offsetWidth > 1024;
      var focusX, focusY, finalScale;
      if (isPortraitLayout) {
        var pcam = CAMERAS_PORTRAIT[cont] || { focusX: 50, focusY: 25, scale: cam.scale * 1.1 };
        focusX = pcam.focusX;
        focusY = pcam.focusY;
        finalScale = pcam.scale;
      } else if (isCoarseLandscape) {
        var tcam = CAMERAS_TABLET[cont] || { focusX: 30, focusY: 40, scale: cam.scale * 1.2 };
        focusX = tcam.focusX;
        focusY = tcam.focusY;
        finalScale = tcam.scale;
      } else {
        focusX = 30;
        focusY = 50;
        finalScale = cam.scale;
      }

      clickedSvg.style.transformOrigin = '0 0';
      clickedSvg.style.transform = 'translate(' + focusX + '%, ' + focusY + '%) scale(' + finalScale + ') translate(-' + cx_pct + '%, -' + cy_pct + '%)';
      if (isPortraitLayout) {
        panel.style.top = '';
        panel.style.height = '';
      } else {
        panel.style.top = '0';
        panel.style.height = '100%';
      }
    }

    function zoomTo(cont, clickEvent) {
      clearTimeout(hoverTimeout);
      isHoveringCont = false;

      zoomed = true; dragging = false; moved = false; currentHoverIso = null; hideMapTooltip(); hideContLabel();
      viewport.classList.remove('jk-grabbing');
      stageEl.classList.add('jk-darken', 'jk-zoomed');

      var isAm = (cont === 'NA' || cont === 'SA');
      var serviceSet = getServiceIsoSet(cont);
      var clickedSvg = (noAutoSpin || !clickEvent) ? mount.querySelector('.jk-svg1') : clickEvent.target.closest('svg');
      activeSvg = clickedSvg;

      allPaths().forEach(function (p) {
          p.classList.remove('jk-hover', 'jk-dim', 'jk-service', 'jk-nonservice', 'jk-active-hover');
          var c = p.dataset.cont;
          var keepVisible = isAm ? (c === 'NA' || c === 'SA') : (c === cont);

          if (!keepVisible) {
              p.style.opacity = 0; p.style.pointerEvents = 'none';
          } else {
              p.style.opacity = 1; p.style.pointerEvents = 'auto';
              if (p.closest('svg') === clickedSvg) {
                  if (serviceSet[p.dataset.iso]) { p.classList.add('jk-service'); }
                  else { p.classList.add('jk-nonservice'); }
              }
          }
      });

      mount.querySelectorAll('.jk-spark').forEach(function(s) {
          var c = s.dataset.cont;
          var keepVisible = isAm ? (c === 'NA' || c === 'SA') : (c === cont);
          s.style.display = keepVisible ? '' : 'none';
      });

      currentZoomCont = cont;
      clickedSvg.style.transition = 'transform 1.2s cubic-bezier(0.22, 1, 0.36, 1)';
      applyZoomTransform(cont, clickedSvg);

      var isSvg2 = clickedSvg.classList.contains('jk-svg2');
      var targetOffset = isSvg2 ? -halfWidth : 0;
      rotor.style.transition = 'transform 1.2s cubic-bezier(0.22, 1, 0.36, 1)';
      rotor.style.transform = 'translateX(' + targetOffset + 'px)';
      offset = targetOffset;

      eyebrow.style.opacity = 0; headline.style.opacity = 0; sub.style.opacity = 0;
      setTimeout(function () { back.classList.add('jk-show'); }, 700);

      var list = getBusinessList(cont);
      var listHtml = '<h3 class="jk-panel-title">' + (CONT_TITLE[cont] || names[cont]) + '</h3><div class="jk-list-area"><ul class="jk-country-list' + (list.length <= 8 ? ' jk-single-col' : '') + '">';
      list.forEach(function(c) {
        var cls = c.iso ? '' : ' class="jk-more"';
        listHtml += '<li data-iso="' + (c.iso || '') + '"' + cls + '>' + c.name + '</li>';
      });
      listHtml += '</ul></div>';
      listHtml += '<div class="jk-animal-info"><div class="jk-animal-gallery"></div></div>';
      panel.innerHTML = listHtml;
      panel.dataset.cont = (cont === 'NA' || cont === 'SA') ? 'AMERIKA' : cont;

      panel.querySelectorAll('li').forEach(function(li) {
        var iso = li.dataset.iso;
        if (!iso) {
          li.addEventListener('click', function() {
            console.log('Weitere Länder geklickt:', cont);
          });
          return;
        }
        function activateCountry() {
          if (!zoomClickReady) return;
          currentHoverIso = iso;
          activeSvg.querySelectorAll('path.jk-active-hover').forEach(function(p){ p.classList.remove('jk-active-hover'); });
          panel.querySelectorAll('li.jk-active-hover').forEach(function(l){ l.classList.remove('jk-active-hover'); });
          li.classList.add('jk-active-hover');
          activeSvg.querySelectorAll('path[data-iso="'+iso+'"]').forEach(function(path){
              path.classList.add('jk-active-hover');
              if (path.nextElementSibling) path.parentNode.appendChild(path);
              var rect = path.getBoundingClientRect();
              var stageRect = stageEl.getBoundingClientRect();
              var centerX = rect.left + rect.width / 2 - stageRect.left;
              var topY = rect.top - stageRect.top - 15;
              if (topY < 35) topY = 35;
              showMapTooltip(iso, centerX, topY);
          });
          renderAnimalInfo(iso);
        }
        function deactivateCountry() {
          currentHoverIso = null; hideMapTooltip();
          li.classList.remove('jk-active-hover');
          activeSvg.querySelectorAll('path[data-iso="'+iso+'"]').forEach(function(path){
              path.classList.remove('jk-active-hover');
          });
          var animalInfo = panel.querySelector('.jk-animal-info');
          if (animalInfo) animalInfo.classList.remove('jk-show');
        }
        if (noAutoSpin) {
          // Touch: 1. Tap = direkt öffnen
          li.addEventListener('click', function(ev) {
            ev.stopPropagation();
            gotoCountry(iso);
          });
        } else {
          // Desktop: hover = Vorschau, Klick = öffnen
          li.addEventListener('mouseenter', activateCountry);
          li.addEventListener('click', function(ev) {
            ev.stopPropagation();
            gotoCountry(iso);
          });
        }
      });

      // Service-Land-Klicks laufen zentral über einen delegierten Listener auf stageEl
      // (siehe Init-Bereich). Hier nur den Ready-Timer neu starten.
      // Fix: vorher wurden bei jedem zoomTo neue Listener auf die Pfade gebunden,
      // die nach reset() weiterlebten und beim zweiten Besuch desselben Kontinents
      // sofort zur Länderseite sprangen.
      zoomClickReady = false;
      clearTimeout(zoomReadyTimer);
      zoomReadyTimer = setTimeout(function(){ zoomClickReady = true; }, 1300);
      [50, 200, 500, 900, 1250].forEach(function(delay) {
        setTimeout(function() {
          allPaths().forEach(function(p) { p.classList.remove('jk-active-hover'); });
          panel.querySelectorAll('li.jk-active-hover').forEach(function(li){ li.classList.remove('jk-active-hover'); });
          hideMapTooltip();
          currentHoverIso = null;
          var animalInfo = panel.querySelector('.jk-animal-info');
          if (animalInfo) animalInfo.classList.remove('jk-show');
        }, delay);
      });
      setTimeout(function() { panel.classList.add('jk-show'); }, 500);
    }

    function reset() {
      zoomed = false; activeSvg = null; currentHoverIso = null; currentZoomCont = null; hideMapTooltip(); hideContLabel();
      zoomClickReady = false;
      clearTimeout(zoomReadyTimer);
      dragging = false;
      userInertia = 0;
      velocity = autoVel;
      isHoveringCont = false;

      stageEl.classList.remove('jk-darken', 'jk-zoomed');

      panel.classList.remove('jk-show');

      allPaths().forEach(function (p) {
          p.style.opacity = ''; p.style.pointerEvents = '';
          p.classList.remove('jk-hover', 'jk-dim', 'jk-service', 'jk-nonservice', 'jk-active-hover');
      });
      mount.querySelectorAll('.jk-spark').forEach(function (s) { s.style.display = ''; });
      mount.querySelectorAll('svg').forEach(function(s) {
        s.style.transition = 'transform 0.8s cubic-bezier(0.22, 1, 0.36, 1)';
        s.style.transform = '';
      });
      rotor.style.transition = '';
      back.classList.remove('jk-show');

      eyebrow.style.opacity = '1'; headline.style.opacity = '1'; sub.style.opacity = '1';
      if (noAutoSpin) { offset = 0; setTimeout(function(){ rotor.style.transition=''; rotor.style.transform='translateX(0px)'; }, 820); }
      setTimeout(function() { panel.innerHTML = ''; panel.removeAttribute('style'); }, 450);
    }

    stageEl.addEventListener('mouseover', function(e) {
        if (!zoomed || !activeSvg) return;
        if (!zoomClickReady) return;
        if (noAutoSpin) return;
        var isPath = e.target.tagName === 'path' && e.target.classList.contains('jk-service');

        if (isPath) {
            var iso = e.target.dataset.iso;
            var rect = e.target.getBoundingClientRect();
            var stageRect = stageEl.getBoundingClientRect();
            var centerX = rect.left + rect.width / 2 - stageRect.left;
            var topY = rect.top - stageRect.top - 15;
            if (topY < 35) topY = 35;
            showMapTooltip(iso, centerX, topY);

            if (currentHoverIso !== iso) {
                currentHoverIso = iso;
                panel.querySelectorAll('li.jk-active-hover').forEach(function(li) { li.classList.remove('jk-active-hover'); });
                activeSvg.querySelectorAll('path.jk-active-hover').forEach(function(p) { p.classList.remove('jk-active-hover'); });

                var li = panel.querySelector('li[data-iso="'+iso+'"]');
                if (li) li.classList.add('jk-active-hover');
                e.target.classList.add('jk-active-hover');
                if (e.target.nextElementSibling) e.target.parentNode.appendChild(e.target);

                renderAnimalInfo(iso);
            }
        }
    });

    allPaths().forEach(function (p) {
      var cont = p.dataset.cont;
      p.addEventListener('mouseenter', function (e) { if (!zoomed) hoverCont(cont, true, e); });
      p.addEventListener('mouseleave', function (e) { if (!zoomed) hoverCont(cont, false, e); });
      p.addEventListener('click', function (e) {
          if (!zoomed && !moved) { e.stopPropagation(); zoomTo(cont, e); }
      });
    });

    // Delegierter Klick auf Service-Länder im gezoomten Zustand.
    // Einmal registriert -> keine Residual-Listener mehr.
    stageEl.addEventListener('click', function (ev) {
      if (!zoomed || !zoomClickReady) return;
      var t = ev.target;
      if (t.tagName === 'path' && t.classList.contains('jk-service')) {
        ev.stopPropagation();
        gotoCountry(t.dataset.iso);
      }
    });

    back.addEventListener('click', reset);
    stageEl.addEventListener('click', function (e) {
      if (!zoomed || moved) return;
      if (e.target.closest('.jk-country-list li')) return;
      var gal = e.target.closest('.jk-animal-info');
      if (gal && gal.classList.contains('jk-show')) return;
      if (e.target.closest('.jk-back')) return;
      if (e.target.tagName === 'path' && e.target.classList.contains('jk-service')) return;
      reset();
    });

    // Deep-Link: /jagdlaender?kontinent=afrika -> direkt in den Kontinent fliegen
    var DEEP_CONT = { europa: 'EU', asien: 'AS', afrika: 'AF', nordamerika: 'NA', suedamerika: 'SA', ozeanien: 'OC' };
    try {
      var deepParam = new URLSearchParams(window.location.search).get('kontinent');
      if (deepParam) {
        var deepCode = DEEP_CONT[deepParam.toLowerCase()];
        if (deepCode) {
          setTimeout(function () { zoomTo(deepCode); }, 350);
        }
      }
    } catch (err) {}
  }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); } else { init(); }
})();
