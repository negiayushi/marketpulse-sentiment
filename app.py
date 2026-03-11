# ──────────────────────────────────────────────────────────────
# MarketPulse — Market News Sentiment Analyzer
# Author : Ayushi Negi
# GitHub : https://github.com/negiayushi
# Email  : ayushinegi1405@gmail.com
#
# Built with: Flask, TextBlob, yfinance, BeautifulSoup
# Description: Scrapes financial news from Moneycontrol &
#   Economic Times, runs NLP sentiment analysis, and
#   visualizes results alongside 30-day price history.
# ──────────────────────────────────────────────────────────────

from flask import Flask, render_template, jsonify
import yfinance as yf
from textblob import TextBlob
import requests
from bs4 import BeautifulSoup
import datetime
import random  # used only for demo fallback

app = Flask(__name__)

# ── Stock universe ──────────────────────────────────────────────
STOCKS = {
    "^NSEI":    {"name": "NIFTY 50",    "category": "Index"},
    "^BSESN":   {"name": "SENSEX",      "category": "Index"},
    "RELIANCE.NS": {"name": "Reliance", "category": "Large Cap"},
    "TCS.NS":      {"name": "TCS",      "category": "Large Cap"},
    "INFY.NS":     {"name": "Infosys",  "category": "Large Cap"},
    "PAYTM.NS":    {"name": "Paytm",    "category": "Fintech"},
    "ANGELONE.NS": {"name": "Angel One","category": "Fintech"},
    "HDFCBANK.NS": {"name": "HDFC Bank","category": "Fintech"},
}

# ── News scraper ────────────────────────────────────────────────
def scrape_moneycontrol(query):
    """Scrape headlines from Moneycontrol for a given query."""
    headlines = []
    try:
        url = f"https://www.moneycontrol.com/news/tags/{query.lower().replace(' ','-')}.html"
        headers = {"User-Agent": "Mozilla/5.0"}
        r = requests.get(url, headers=headers, timeout=6)
        soup = BeautifulSoup(r.text, "html.parser")
        for tag in soup.select("h2 a, .news_title a, li.clearfix a")[:15]:
            text = tag.get_text(strip=True)
            if len(text) > 20:
                headlines.append(text)
    except Exception:
        pass
    return headlines

def scrape_economic_times(query):
    """Scrape headlines from Economic Times."""
    headlines = []
    try:
        url = f"https://economictimes.indiatimes.com/topic/{query.lower().replace(' ','-')}"
        headers = {"User-Agent": "Mozilla/5.0"}
        r = requests.get(url, headers=headers, timeout=6)
        soup = BeautifulSoup(r.text, "html.parser")
        for tag in soup.select(".eachStory h3 a, .story-title a, h3.clamp a")[:15]:
            text = tag.get_text(strip=True)
            if len(text) > 20:
                headlines.append(text)
    except Exception:
        pass
    return headlines

def get_headlines(symbol, name):
    """Aggregate headlines from multiple sources."""
    query = name if name != "NIFTY 50" else "nifty"
    headlines = scrape_moneycontrol(query) + scrape_economic_times(query)

    # Deduplicate
    seen = set()
    unique = []
    for h in headlines:
        if h not in seen:
            seen.add(h)
            unique.append(h)

    # Fallback demo headlines if scraping fails (e.g. no internet in dev)
    if not unique:
        unique = _demo_headlines(name)

    return unique[:12]

def _demo_headlines(name):
    """Fallback demo headlines for offline development/testing."""
    templates = [
        f"{name} shares surge as quarterly earnings beat estimates",
        f"Analysts upgrade {name} citing strong fundamentals",
        f"{name} faces headwinds amid global market uncertainty",
        f"Investors bullish on {name} amid sector tailwinds",
        f"{name} announces strategic expansion plans",
        f"Market experts divided on {name} outlook for FY25",
        f"{name} stock under pressure after management guidance cut",
        f"Foreign institutional investors increase stake in {name}",
    ]
    random.shuffle(templates)
    return templates[:6]

# ── Sentiment engine ────────────────────────────────────────────
def analyze_sentiment(headlines):
    """Run TextBlob sentiment on each headline, return scored list + aggregate."""
    results = []
    for h in headlines:
        blob = TextBlob(h)
        polarity = blob.sentiment.polarity      # -1 to +1
        subjectivity = blob.sentiment.subjectivity  # 0 to 1

        if polarity > 0.1:
            label = "Positive"
            color = "positive"
        elif polarity < -0.1:
            label = "Negative"
            color = "negative"
        else:
            label = "Neutral"
            color = "neutral"

        results.append({
            "headline": h,
            "polarity": round(polarity, 3),
            "subjectivity": round(subjectivity, 3),
            "label": label,
            "color": color,
        })

    if not results:
        return results, 0, "Neutral"

    avg_polarity = round(sum(r["polarity"] for r in results) / len(results), 3)
    pos = sum(1 for r in results if r["label"] == "Positive")
    neg = sum(1 for r in results if r["label"] == "Negative")

    if avg_polarity > 0.05:
        overall = "Bullish 🟢"
    elif avg_polarity < -0.05:
        overall = "Bearish 🔴"
    else:
        overall = "Neutral 🟡"

    return results, avg_polarity, overall

# ── Price fetcher ───────────────────────────────────────────────
def get_price_data(symbol):
    """Fetch 30-day OHLCV using yfinance."""
    try:
        ticker = yf.Ticker(symbol)
        hist = ticker.history(period="30d")
        if hist.empty:
            return [], []
        dates = [str(d.date()) for d in hist.index]
        closes = [round(float(c), 2) for c in hist["Close"]]
        return dates, closes
    except Exception:
        return [], []

# ── Routes ──────────────────────────────────────────────────────
@app.route("/")
def index():
    return render_template("index.html", stocks=STOCKS)

@app.route("/api/analyze/<symbol>")
def analyze(symbol):
    if symbol not in STOCKS:
        return jsonify({"error": "Unknown symbol"}), 404

    info = STOCKS[symbol]
    headlines = get_headlines(symbol, info["name"])
    scored, avg_polarity, overall = analyze_sentiment(headlines)
    dates, closes = get_price_data(symbol)

    pos = sum(1 for r in scored if r["label"] == "Positive")
    neg = sum(1 for r in scored if r["label"] == "Negative")
    neu = sum(1 for r in scored if r["label"] == "Neutral")

    return jsonify({
        "symbol": symbol,
        "name": info["name"],
        "category": info["category"],
        "overall_sentiment": overall,
        "avg_polarity": avg_polarity,
        "positive_count": pos,
        "negative_count": neg,
        "neutral_count": neu,
        "total_headlines": len(scored),
        "headlines": scored,
        "price_dates": dates,
        "price_closes": closes,
        "last_updated": datetime.datetime.now().strftime("%d %b %Y, %I:%M %p"),
    })

@app.route("/api/overview")
def overview():
    """Quick sentiment overview for all stocks (for dashboard cards)."""
    results = []
    for symbol, info in STOCKS.items():
        headlines = get_headlines(symbol, info["name"])
        _, avg_polarity, overall = analyze_sentiment(headlines)
        pos = sum(1 for h in [analyze_sentiment([hl]) for hl in headlines])
        results.append({
            "symbol": symbol,
            "name": info["name"],
            "category": info["category"],
            "overall_sentiment": overall,
            "avg_polarity": avg_polarity,
        })
    return jsonify(results)

if __name__ == "__main__":
    app.run(debug=True, port=5000)
