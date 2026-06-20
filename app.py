import pandas as pd
import yfinance as yf
from flask import Flask, render_template, request, jsonify, send_from_directory
import json

app = Flask(__name__)
df = pd.DataFrame()
stock_symbol = ''
stock_ticker = None
result_info = None
stock_information = None

def initialize_ticker(stock_symbol):
    global stock_ticker
    stock_ticker = yf.Ticker(stock_symbol)

def _statement_to_dict(frame):
    """Convert a yfinance financial DataFrame into a JSON-friendly structure.

    Returns {'columns': [periods...], 'rows': [{'label': ..., 'values': [...]}]}.
    Raw numbers (absolute INR) are kept so the frontend can format them
    (e.g. into ₹ Crore). NaNs become None.
    """
    if frame is None or getattr(frame, 'empty', True):
        return {'columns': [], 'rows': []}

    columns = []
    for col in frame.columns:
        try:
            columns.append(col.strftime('%b %Y'))
        except AttributeError:
            columns.append(str(col))

    rows = []
    for label, series in frame.iterrows():
        values = [None if pd.isna(v) else float(v) for v in series.tolist()]
        rows.append({'label': str(label), 'values': values})

    return {'columns': columns, 'rows': rows}

def stock_info():
    global stock_ticker
    try:
        data = {
            'Income Statement': _statement_to_dict(stock_ticker.income_stmt),
            'Quarterly Income': _statement_to_dict(stock_ticker.quarterly_income_stmt),
            'Balance Sheet': _statement_to_dict(stock_ticker.balance_sheet),
            'Quarterly Balance': _statement_to_dict(stock_ticker.quarterly_balance_sheet),
            'Cash Flow': _statement_to_dict(stock_ticker.cashflow),
        }
        return data
    except Exception as e:
        print(f"Error fetching stock info for {stock_symbol}: {e}")
        return None
        
def fetch_info():
    global stock_ticker
    try:
        company_info = stock_ticker.info
        general_info = {
            "Company Name": company_info.get("longName", ""),
            "Industry": company_info.get("industry", ""),
            "Sector": company_info.get("sector", ""),
            "Website": company_info.get("website", ""),
            "Full-Time Employees": company_info.get("fullTimeEmployees", ""),
            "Business Summary": company_info.get("longBusinessSummary", ""),

            # --- Price & size ---
            "Current Price": company_info.get("currentPrice", ""),
            "Market Cap": company_info.get("marketCap", ""),
            "Enterprise Value": company_info.get("enterpriseValue", ""),
            "Free Float Shares": company_info.get("floatShares", ""),
            "Shares Outstanding": company_info.get("sharesOutstanding", ""),
            "Average Volume": company_info.get("averageVolume", ""),
            "Beta": company_info.get("beta", ""),

            # --- 52-week / trend context ---
            "52W High": company_info.get("fiftyTwoWeekHigh", ""),
            "52W Low": company_info.get("fiftyTwoWeekLow", ""),
            "50 DMA": company_info.get("fiftyDayAverage", ""),
            "200 DMA": company_info.get("twoHundredDayAverage", ""),
            "52W Change %": company_info.get("fiftyTwoWeekChangePercent", ""),

            # --- Valuation ---
            "Trailing PE": company_info.get("trailingPE", ""),
            "Forward PE": company_info.get("forwardPE", ""),
            "Price to Book": company_info.get("priceToBook", ""),
            "Price to Sales": company_info.get("priceToSalesTrailing12Months", ""),
            "EV/EBITDA": company_info.get("enterpriseToEbitda", ""),
            "EV/Revenue": company_info.get("enterpriseToRevenue", ""),
            "PEG Ratio": company_info.get("trailingPegRatio", ""),
            "Trailing EPS": company_info.get("trailingEps", ""),
            "Forward EPS": company_info.get("forwardEps", ""),
            "Book Value": company_info.get("bookValue", ""),

            # --- Profitability & returns ---
            "Gross Margin": company_info.get("grossMargins", ""),
            "EBITDA Margin": company_info.get("ebitdaMargins", ""),
            "Operating Margin": company_info.get("operatingMargins", ""),
            "Net Profit Margin": company_info.get("profitMargins", ""),
            "Return on Equity": company_info.get("returnOnEquity", ""),
            "Return on Assets": company_info.get("returnOnAssets", ""),

            # --- Growth ---
            "Revenue Growth": company_info.get("revenueGrowth", ""),
            "Earnings Growth": company_info.get("earningsGrowth", ""),
            "Qtrly Earnings Growth": company_info.get("earningsQuarterlyGrowth", ""),

            # --- Financial health ---
            "Total Revenue": company_info.get("totalRevenue", ""),
            "EBITDA": company_info.get("ebitda", ""),
            "Total Debt": company_info.get("totalDebt", ""),
            "Total Cash": company_info.get("totalCash", ""),
            "Debt to Equity": company_info.get("debtToEquity", ""),
            "Current Ratio": company_info.get("currentRatio", ""),
            "Quick Ratio": company_info.get("quickRatio", ""),
            "Operating Cash Flow": company_info.get("operatingCashflow", ""),
            "Free Cash Flow": company_info.get("freeCashflow", ""),

            # --- Dividend ---
            "Dividend Rate": company_info.get("trailingAnnualDividendRate", ""),
            "Dividend Yield": company_info.get("trailingAnnualDividendYield", ""),
            "Last Dividend Value": company_info.get("lastDividendValue", ""),
            "Last Dividend Date": company_info.get("lastDividendDate", ""),

            # --- Shareholding (promoter/institution proxy) ---
            "Held % Insiders": company_info.get("heldPercentInsiders", ""),
            "Held % Institutions": company_info.get("heldPercentInstitutions", ""),

            # --- Governance risk (corporate governance check) ---
            "Audit Risk": company_info.get("auditRisk", ""),
            "Board Risk": company_info.get("boardRisk", ""),
            "Overall Risk": company_info.get("overallRisk", ""),

            # --- Analyst view ---
            "Recommendation": company_info.get("recommendationKey", ""),
            "Target Mean Price": company_info.get("targetMeanPrice", ""),
            "Target Median Price": company_info.get("targetMedianPrice", ""),
            "No. of Analysts": company_info.get("numberOfAnalystOpinions", ""),
        }
        company_officers = []
        for officer in company_info.get("companyOfficers", []):
            officer_info = {
                "Name": officer.get("name", ""),
                "Age": officer.get("age", ""),
                "Position": officer.get("title", "")
            }
            company_officers.append(officer_info)

        general_info["companyOfficers"] = company_officers
        return general_info
    except Exception as e:
        print(f"Error fetching stock information for {stock_symbol}: {e}")
        return None

def fetch_historical_data():
    global stock_ticker
    try:
        data = stock_ticker.history(period='max')
        return data
    except Exception as e:
        print(f"Error fetching historical data for {stock_symbol}: {e}")
        return None

def preprocess_data(data):
    if "Adj Close" in data.columns:
        data = data.drop(columns=["Adj Close"])
    data = data.round(2)
    return data

def handle_selected_stock(selected_stock):
    global df
    global stock_symbol
    global result_info
    global stock_information

    try:
        with open('stock_names.json', 'r') as f:
            stock_symbols = json.load(f)
        stock_symbol = stock_symbols.get(selected_stock)

        if stock_symbol is None:
            print(f"No symbol found for stock: {selected_stock}")
            return None, None

        initialize_ticker(stock_symbol)
        stock_information = stock_info()
        result_info = fetch_info()
        df = fetch_historical_data()
        if df is not None:
            df = preprocess_data(df)
        else:
            print("Failed to fetch or preprocess data.")
        return result_info, stock_information
    except Exception as e:
        print(f"Error fetching stock symbol for {selected_stock}: {e}")
        return None, None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/stock_names.json')
def get_stock_names():
    return send_from_directory(app.root_path, 'stock_names.json')

@app.route('/submit_selected_stock', methods=['POST'])
def submit_selected_stock():
    global result_info
    global stock_information
    
    data = request.get_json()
    selected_stock = data.get('selectedStock', '')
    result_info, stock_information = handle_selected_stock(selected_stock)
    if result_info and stock_information:
        return jsonify({'message': 'Selected stock received successfully'})
    else:
        return jsonify({'message': 'Failed to process selected stock'}), 500

@app.route('/visualize_data')
def visualize_data():
    global df
    global result_info
    global stock_information

    # First visualization
    if df is None or df.empty:
        error_message = "No data available for visualization"
        print(error_message)
        return jsonify({'error': error_message}), 400

    df.index = pd.to_datetime(df.index)
    labels = df.index.strftime('%Y-%m-%d').tolist()

    try:
        data = df['Close'].tolist()
    except KeyError:
        error_message = "Error: 'Close' column not found in DataFrame."
        print(error_message)
        return jsonify({'error': error_message}), 400

    # Second visualization
    result_data = []
    for year in df.index.year.unique():
        for month in range(1, 13):
            target_data = df[(df.index.year == year) & (df.index.month == month)]
            if not target_data.empty:
                first_day_high = target_data.iloc[0]['Open']
                last_day_low = target_data.iloc[-1]['Close']
                month_range = last_day_low - first_day_high
                direction = 'Positive' if month_range > 0 else 'Negative'
                percent_change = round((last_day_low - first_day_high) / first_day_high * 100, 1)
                result_data.append({
                    'Year': year,
                    'Month': month,
                    'High': first_day_high,
                    'Low': last_day_low,
                    'Month_range': month_range,
                    'Direction': direction,
                    'Returns': percent_change
                })
    result_df = pd.DataFrame(result_data,
                             columns=['Year', 'Month', 'High', 'Low', 'Month_range', 'Direction', 'Returns'])
    result_df = result_df.round(2)

    # Third visualization
    result_data_yearly = []
    for year in df.index.year.unique():
        year_data = df[df.index.year == year]
        if not year_data.empty:
            first_day_high = year_data.iloc[0]['Open']
            last_day_low = year_data.iloc[-1]['Close']
            year_range = last_day_low - first_day_high
            direction = 'Positive' if year_range > 0 else 'Negative'
            percent_change = round((last_day_low - first_day_high) / first_day_high * 100, 1)
            result_data_yearly.append({
                'Year': year,
                'High': first_day_high,
                'Low': last_day_low,
                'Year_range': year_range,
                'Direction': direction,
                'Returns': percent_change
            })
    result_df_yearly = pd.DataFrame(result_data_yearly,
                                    columns=['Year', 'High', 'Low', 'Year_range', 'Direction', 'Returns'])
    result_df_yearly = result_df_yearly.round(2)

    return render_template('result.html', labels=json.dumps(labels), data=json.dumps(data),
                           data_monthly=result_df.to_dict('records'), data_yearly=result_df_yearly.to_dict('records'),
                           result_info=result_info, stock_information=stock_information)

if __name__ == '__main__':
    app.run(debug=True)