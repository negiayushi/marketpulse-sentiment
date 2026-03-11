# 📈 MarketPulse — Market News Sentiment Analyzer

> Built by **Ayushi Negi** · [LinkedIn](https://www.linkedin.com/in/ayushinegi1405) · [GitHub](https://github.com/negiayushi)

A Flask web app that analyzes the sentiment of financial news headlines for Indian stocks and indices in real time.
I built this as part of my journey into fintech — to understand how news affects market perception, and to get hands-on with NLP and financial data in Python.

---

## 💡 Why I Built This

While learning about Indian equity markets through Zerodha Varsity, I noticed that stock prices often react sharply to news — but there was no simple tool to quickly gauge whether the news around a stock was positive or negative. So I built one.

This project combines two things I wanted to get better at:
- **NLP / sentiment analysis** using Python
- **Financial data** — fetching real stock prices, understanding market hours, working with OHLCV data

---

## 🚀 Features

- Scrapes live headlines from **Moneycontrol** and **Economic Times**
- Runs **TextBlob NLP** on each headline → polarity score (−1 to +1) and subjectivity
- Aggregates into an overall **Bullish / Bearish / Neutral** signal
- Shows **30-day price chart** alongside sentiment (via yfinance)
- Tracks: `NIFTY 50`, `SENSEX`, `Reliance`, `TCS`, `Infosys`, `Paytm`, `Angel One`, `HDFC Bank`
- Live **market open/closed** status (IST-aware)
- Dark Bloomberg-style dashboard UI

---

## 🛠️ Tech Stack

| Layer | Tech |
|-------|------|
| Backend | Python, Flask |
| NLP | TextBlob |
| Market Data | yfinance |
| Scraping | BeautifulSoup4, requests |
| Frontend | HTML, CSS, JavaScript |
| Charts | Chart.js |

---

## ⚙️ Setup & Run

```bash
# 1. Clone the repo
git clone https://github.com/negiayushi/marketpulse-sentiment.git
cd marketpulse-sentiment

# 2. Install dependencies
pip install -r requirements.txt

# 3. Download TextBlob NLP data (one-time)
python -m textblob.download_corpora

# 4. Run
python app.py

# 5. Open in browser → http://localhost:5000
```

---

## 📁 Project Structure

```
marketpulse-sentiment/
├── app.py                  ← Flask backend: scraping, sentiment, price API
├── requirements.txt
├── templates/
│   └── index.html          ← Dashboard UI
└── static/
    ├── css/style.css       ← Dark finance theme
    └── js/main.js          ← Chart.js, API calls, interactivity
```

---

## 🔍 How It Works

```
User clicks a stock
       ↓
Flask calls /api/analyze/<symbol>
       ↓
BeautifulSoup scrapes Moneycontrol + Economic Times headlines
       ↓
TextBlob computes polarity + subjectivity per headline
       ↓
Scores aggregated → Bullish / Bearish / Neutral signal
       ↓
yfinance fetches 30-day price history
       ↓
JSON sent to frontend → Chart.js renders everything
```

---

## 📌 What I Learned

- How to scrape financial news sites and handle when HTML structure changes
- TextBlob sentiment scoring and why general-purpose NLP isn't perfect for financial text
- Working with `yfinance` for Indian stock symbols (`.NS` suffix for NSE stocks)
- How to think about market hours and IST timezones in Python
- Building a clean REST API with Flask and consuming it from vanilla JS

---

## 🔮 Future Improvements

- [ ] Replace TextBlob with **FinBERT** for better financial sentiment accuracy
- [ ] Store historical sentiment in **SQLite** to track trends over time
- [ ] Add **correlation analysis** — does yesterday's sentiment predict today's price movement?
- [ ] Auto-refresh every 15 minutes during market hours

---

## ⚠️ Disclaimer

This is a personal learning project. Nothing here is financial advice.

---

*Made with curiosity about Indian markets · Ayushi Negi · 2025*
