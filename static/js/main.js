// ── CLOCK ────────────────────────────────────────────────────
function updateClock() {
  const now = new Date();
  document.getElementById("live-clock").textContent =
    now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
setInterval(updateClock, 1000);
updateClock();

// ── MARKET STATUS ────────────────────────────────────────────
function updateMarketStatus() {
  const now = new Date();
  const ist = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const h = ist.getHours(), m = ist.getMinutes(), day = ist.getDay();
  const badge = document.getElementById("market-status");
  const isWeekday = day >= 1 && day <= 5;
  const isOpen = isWeekday && (h > 9 || (h === 9 && m >= 15)) && (h < 15 || (h === 15 && m <= 30));
  badge.textContent = isOpen ? "MARKET LIVE" : "MARKET CLOSED";
  badge.style.background = isOpen ? "rgba(0,230,118,0.12)" : "rgba(255,61,90,0.08)";
  badge.style.color = isOpen ? "var(--pos)" : "var(--neg)";
  badge.style.borderColor = isOpen ? "rgba(0,230,118,0.3)" : "rgba(255,61,90,0.2)";
}
updateMarketStatus();

// ── CHART INSTANCES ──────────────────────────────────────────
let priceChart = null, polarityChart = null, donutChart = null;

function destroyCharts() {
  [priceChart, polarityChart, donutChart].forEach(c => c && c.destroy());
}

// ── STOCK BUTTONS ────────────────────────────────────────────
document.querySelectorAll(".stock-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".stock-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    loadAnalysis(btn.dataset.symbol);
  });
});

// ── LOAD ANALYSIS ────────────────────────────────────────────
async function loadAnalysis(symbol) {
  document.getElementById("loader").style.display = "flex";
  document.getElementById("analysis-section").style.display = "none";

  try {
    const res = await fetch(`/api/analyze/${symbol}`);
    const data = await res.json();
    if (data.error) { alert(data.error); return; }
    renderAnalysis(data);
  } catch (e) {
    alert("Failed to fetch data. Make sure Flask server is running.");
    console.error(e);
  } finally {
    document.getElementById("loader").style.display = "none";
  }
}

// ── RENDER ───────────────────────────────────────────────────
function renderAnalysis(data) {
  // Header
  document.getElementById("stock-name").textContent = data.name;
  document.getElementById("stock-symbol-tag").textContent = data.symbol;
  document.getElementById("stock-category-tag").textContent = data.category;
  document.getElementById("updated-time").textContent = "Updated: " + data.last_updated;

  // Overall sentiment
  const sentVal = document.getElementById("overall-sentiment-value");
  sentVal.textContent = data.overall_sentiment;
  sentVal.style.color = data.overall_sentiment.includes("Bullish") ? "var(--pos)"
    : data.overall_sentiment.includes("Bearish") ? "var(--neg)" : "var(--neu)";

  const pol = data.avg_polarity;
  const polEl = document.getElementById("avg-polarity-value");
  polEl.textContent = (pol >= 0 ? "+" : "") + pol.toFixed(3);
  polEl.style.color = pol > 0 ? "var(--pos)" : pol < 0 ? "var(--neg)" : "var(--neu)";

  // Stats
  const total = data.total_headlines || 1;
  document.getElementById("pos-count").textContent = data.positive_count;
  document.getElementById("neg-count").textContent = data.negative_count;
  document.getElementById("neu-count").textContent = data.neutral_count;
  document.getElementById("pos-bar").style.width = (data.positive_count / total * 100) + "%";
  document.getElementById("neg-bar").style.width = (data.negative_count / total * 100) + "%";
  document.getElementById("neu-bar").style.width = (data.neutral_count / total * 100) + "%";

  destroyCharts();

  // Donut chart
  const dCtx = document.getElementById("donut-chart").getContext("2d");
  donutChart = new Chart(dCtx, {
    type: "doughnut",
    data: {
      labels: ["Positive", "Neutral", "Negative"],
      datasets: [{
        data: [data.positive_count, data.neutral_count, data.negative_count],
        backgroundColor: ["rgba(0,230,118,0.8)", "rgba(255,179,0,0.8)", "rgba(255,61,90,0.8)"],
        borderColor: "#0e1525", borderWidth: 3
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      cutout: "70%"
    }
  });

  // Price chart
  const pCtx = document.getElementById("price-chart").getContext("2d");
  if (data.price_dates && data.price_dates.length > 0) {
    priceChart = new Chart(pCtx, {
      type: "line",
      data: {
        labels: data.price_dates,
        datasets: [{
          label: data.name,
          data: data.price_closes,
          borderColor: "var(--accent)",
          backgroundColor: "rgba(0,212,255,0.06)",
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          borderWidth: 2,
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: "#5a7099", font: { size: 10 }, maxTicksLimit: 6 }, grid: { color: "#1e2d4a" } },
          y: { ticks: { color: "#5a7099", font: { size: 10 } }, grid: { color: "#1e2d4a" } }
        }
      }
    });
    document.getElementById("price-note").textContent = "";
  } else {
    document.getElementById("price-note").textContent = "⚠  Price data unavailable (index symbols may not load on free API)";
  }

  // Polarity chart
  const labels = data.headlines.map((_, i) => `H${i + 1}`);
  const values = data.headlines.map(h => h.polarity);
  const colors = values.map(v => v > 0.1 ? "rgba(0,230,118,0.7)" : v < -0.1 ? "rgba(255,61,90,0.7)" : "rgba(255,179,0,0.7)");

  const rCtx = document.getElementById("polarity-chart").getContext("2d");
  polarityChart = new Chart(rCtx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Polarity",
        data: values,
        backgroundColor: colors,
        borderRadius: 4,
        borderWidth: 0,
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: "#5a7099", font: { size: 10 } }, grid: { color: "#1e2d4a" } },
        y: {
          min: -1, max: 1,
          ticks: { color: "#5a7099", font: { size: 10 } },
          grid: { color: "#1e2d4a" }
        }
      }
    }
  });

  // Headlines
  document.getElementById("headline-count").textContent = `(${data.headlines.length})`;
  const list = document.getElementById("headlines-list");
  list.innerHTML = "";
  data.headlines.forEach((h, i) => {
    const row = document.createElement("div");
    row.className = `headline-row ${h.color}`;
    row.style.animationDelay = `${i * 40}ms`;
    row.innerHTML = `
      <span class="hl-badge">${h.label.toUpperCase()}</span>
      <span class="hl-text">${h.headline}</span>
      <div class="hl-meta">
        <div class="hl-polarity">${h.polarity >= 0 ? "+" : ""}${h.polarity.toFixed(3)}</div>
        <div class="hl-subj">Subj: ${h.subjectivity.toFixed(2)}</div>
      </div>`;
    list.appendChild(row);
  });

  // Update stock button dot
  document.querySelectorAll(".stock-btn.active .btn-sentiment-dot").forEach(dot => {
    dot.className = "btn-sentiment-dot " + (
      data.overall_sentiment.includes("Bullish") ? "pos" :
      data.overall_sentiment.includes("Bearish") ? "neg" : "neu"
    );
  });

  document.getElementById("analysis-section").style.display = "block";
  document.getElementById("analysis-section").scrollIntoView({ behavior: "smooth", block: "start" });
}

// ── TICKER CLICK ─────────────────────────────────────────────
document.querySelectorAll(".ticker-item").forEach(item => {
  item.addEventListener("click", () => {
    const sym = item.dataset.symbol;
    const btn = document.querySelector(`.stock-btn[data-symbol="${sym}"]`);
    if (btn) { btn.click(); btn.scrollIntoView({ behavior: "smooth", block: "center" }); }
  });
});
