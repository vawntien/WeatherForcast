from flask import Flask, render_template, request
import requests, os
from dotenv import load_dotenv

load_dotenv()
app = Flask(__name__)
API_KEY = os.getenv("WEATHER_API_KEY")

@app.route('/', methods=['GET', 'POST'])
def index():
    weather_data = None
    if request.method == 'POST':
        city = request.form['city']
        url = f"https://api.openweathermap.org/data/2.5/weather?q={city}&appid={API_KEY}&units=metric&lang=vi"
        res = requests.get(url)
        if res.status_code == 200:
            data = res.json()
            weather_data = {
                "city": data['name'],
                "temp": data['main']['temp'],
                "humidity": data['main']['humidity'],
                "desc": data['weather'][0]['description'],
                "icon": data['weather'][0]['icon']
            }
        else:
            weather_data = {"error": "Không tìm thấy thành phố!"}
    return render_template('index.html', weather=weather_data)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
