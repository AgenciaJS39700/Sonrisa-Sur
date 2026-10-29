/* /extra.js — Sonrisa Sur: parallax, simulador de blanqueamiento antes/después y calculadora de financiación (demo, sin servidor) */
(function () {
  "use strict";
  var S = window.SITE || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var esc = function (t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  // En es-ES los números de 4 cifras no llevan punto de millar por defecto: se añade a mano (2.900 €)
  var eur = function (n) {
    var p = n.toFixed(n % 1 ? 2 : 0).split(".");
    return p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".") + (p[1] ? "," + p[1] : "") + " €";
  };
  var wa = function (t) { return "https://wa.me/" + (S.wa || "") + "?text=" + encodeURIComponent(t); };

  /* ---------- Simulador de blanqueamiento ---------- */
  var wh = $("#wh");
  if (wh) {
    var TONES = [["A3", "#e6d3ad", 0], ["A2", "#ecdcbc", .3], ["A1", "#f1e5cb", .55], ["B2", "#f3e9d4", .72], ["B1", "#f7f1e3", 1], ["BL", "#fdfbf6", 1]];
    wh.innerHTML = '<div class="ba" id="ba" style="--x:50%"><img src="img/sonrisa-antes-m.webp" srcset="img/sonrisa-antes-m.webp 720w, img/sonrisa-antes.webp 1400w" sizes="(min-width:960px) 640px, 100vw" alt="Sonrisa antes del blanqueamiento" loading="lazy" decoding="async"><img class="af" id="baf" src="img/sonrisa-despues-m.webp" srcset="img/sonrisa-despues-m.webp 720w, img/sonrisa-despues.webp 1400w" sizes="(min-width:960px) 640px, 100vw" alt="La misma sonrisa después del blanqueamiento" loading="lazy" decoding="async"><span class="hd" aria-hidden="true"></span><span class="lb l">Antes</span><span class="lb r">Después</span><input type="range" min="0" max="100" value="50" id="bar" aria-label="Desliza para comparar antes y después"></div>' +
      '<div class="shd"><h3>Elige hasta qué tono quieres llegar</h3><p>Arrastra la barra para comparar y toca un tono de la guía dental. Partimos de un A3, el tono más habitual.</p><div class="tones" role="group" aria-label="Guía de tonos">' + TONES.map(function (t, i) { return '<button type="button" class="tn" data-i="' + i + '" aria-pressed="' + (i === 4) + '"><i style="background:' + t[1] + '"></i>' + t[0] + "</button>"; }).join("") + '</div><div class="gain"><b id="gn">4</b><span>tonos más blanco<br><small id="gs">Blanqueamiento en clínica · 1 sesión de 60 min</small></span></div><a class="btn btn-main" id="whgo" target="_blank" rel="noopener" href="#">Pedir valoración de blanqueamiento</a><p class="note" style="margin:0">Simulación orientativa. El resultado depende de cada caso y siempre se valora antes en consulta.</p></div>';
    var ba = $("#ba"), af = $("#baf");
    $("#bar").addEventListener("input", function () { ba.style.setProperty("--x", this.value + "%"); });
    var setTone = function (i) {
      var t = TONES[i];
      af.style.opacity = String(Math.max(.08, t[2]));
      af.style.filter = i === 5 ? "brightness(1.07) saturate(.85)" : "none";
      [].forEach.call(wh.querySelectorAll(".tn"), function (b) { b.setAttribute("aria-pressed", String(+b.dataset.i === i)); });
      $("#gn").textContent = i === 0 ? "0" : String(i === 5 ? 6 : i);
      $("#gs").textContent = i <= 2 ? "Blanqueamiento domiciliario con férulas · 2 semanas" : i < 5 ? "Blanqueamiento en clínica · 1 sesión de 60 min" : "Combinado clínica + domicilio · máximo blanco";
      $("#whgo").href = wa("Hola, me gustaría una valoración de blanqueamiento. Me gustaría llegar al tono " + t[0] + ".");
    };
    wh.addEventListener("click", function (e) { var b = e.target.closest(".tn"); if (b) setTone(+b.dataset.i); });
    setTone(4);
    // pequeña demostración automática al entrar en pantalla
    if (!reduce && "IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (es) {
        if (!es[0].isIntersecting) return; io.disconnect();
        var t0 = null, inp = $("#bar");
        var anim = function (ts) { if (t0 === null) t0 = ts; var k = Math.min(1, (ts - t0) / 1600), v = 50 + Math.sin(k * Math.PI * 2) * 30; inp.value = v; ba.style.setProperty("--x", v + "%"); if (k < 1) requestAnimationFrame(anim); };
        requestAnimationFrame(anim);
      }, { threshold: .5 });
      io.observe(ba);
    }
  }

  /* ---------- Calculadora de financiación ---------- */
  var fin = $("#fin");
  if (fin) {
    var TR = [["Blanqueamiento", 290], ["Ortodoncia invisible", 2900], ["Implante completo", 1100], ["Carillas (4 piezas)", 1600], ["Endodoncia + corona", 590]];
    var tr = 1, m = 12;
    fin.innerHTML = '<div style="display:grid;gap:1.3rem"><div><h4>Tratamiento</h4><div class="opts" role="group" aria-label="Tratamiento">' + TR.map(function (t, i) { return '<button type="button" class="op" data-t="' + i + '" aria-pressed="' + (i === tr) + '">' + esc(t[0]) + "<small>desde " + eur(t[1]) + "</small></button>"; }).join("") + '</div></div><div><h4>Plazo: <span id="fm"></span></h4><input type="range" id="frng" min="3" max="24" step="3" value="12" aria-label="Meses de financiación"><div class="rng"><span>3 meses</span><span>24 meses</span></div></div></div>' +
      '<div class="quota" aria-live="polite"><small>Tu cuota</small><b id="fq"></b><small id="fd"></small><a class="btn" id="fgo" target="_blank" rel="noopener" href="#">Lo quiero valorar</a></div>';
    var draw = function () {
      var t = TR[tr], q = Math.ceil(t[1] / m * 100) / 100;
      $("#fm").textContent = m + " meses";
      $("#fq").textContent = eur(q);
      $("#fd").textContent = "al mes · " + eur(t[1]) + " en " + m + " cuotas sin intereses (ejemplo)";
      $("#fgo").href = wa("Hola, me interesa " + t[0].toLowerCase() + " financiado en " + m + " meses. ¿Me dais cita de valoración?");
      [].forEach.call(fin.querySelectorAll(".op"), function (b) { b.setAttribute("aria-pressed", String(+b.dataset.t === tr)); });
    };
    fin.addEventListener("click", function (e) { var b = e.target.closest(".op"); if (b) { tr = +b.dataset.t; draw(); } });
    $("#frng").addEventListener("input", function () { m = +this.value; draw(); });
    draw();
  }

  /* ---------- Botones de especialidad: cita por WhatsApp ---------- */
  [].forEach.call(document.querySelectorAll("[data-espe]"), function (a) { a.href = wa("Hola, me gustaría pedir cita para " + a.dataset.espe + "."); });
})();
