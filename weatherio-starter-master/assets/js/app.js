/**
 * @license MIT
 */

"use strict";

// IMPORT
import { fetchData, url } from "./api.js";
import * as module from "./module.js";

/* -----------------------------
    SEARCH TOGGLER
------------------------------ */
const addEventOnElements = (elements, eventType, callback) => {
  elements.forEach(el => el.addEventListener(eventType, callback));
};

const searchView = document.querySelector("[data-search-view]");
const searchTogglers = document.querySelectorAll("[data-search-toggler]");
const searchField = document.querySelector("[data-search-field]");
const searchResultBox = document.querySelector("[data-search-result]");

/* NEW: toggleSearch kèm hiển thị gợi ý khi mở */
const toggleSearch = () => {
  searchView.classList.toggle("active");

  if (searchView.classList.contains("active")) {
    renderDefaultSearchList();   // <-- SHOW GỢI Ý NGAY KHI MỞ
  }
};

addEventOnElements(searchTogglers, "click", toggleSearch);

/* ⭐ DEFAULT SEARCH LIST */
function renderDefaultSearchList() {
  searchResultBox.innerHTML = `
    <ul class="view-list" data-search-list>
      <li class="view-item">
        <span class="m-icon">location_on</span>
        <div>
          <p class="item-little">London</p>
          <p class="label-2 item-subtitle">State of London, GB</p>
        </div>
        <a href="#/weather?lat=51.5073219&lon=-0.1276474"
           class="item-link has-state"
           data-search-toggler></a>
      </li>
    </ul>
  `;
}

/* NEW: Click vào ô input → show gợi ý */
searchField.addEventListener("focus", () => {
  searchView.classList.add("active");
  renderDefaultSearchList();
});

/* -----------------------------------------
   SEARCH CITY (AUTOCOMPLETE)
-------------------------------------------- */

let searchTimeout = null;
const searchDelay = 150;

searchField.addEventListener("input", function () {

  const query = searchField.value.trim();
  if (searchTimeout) clearTimeout(searchTimeout);

  if (query === "") {
    renderDefaultSearchList();   // <-- SHOW GỢI Ý KHI XOÁ HẾT TEXT
    return;
  }

  searchTimeout = setTimeout(() => {
    fetchData(url.geo(query), (locations) => {

      searchResultBox.innerHTML = `
        <ul class="view-list" data-search-list></ul>
      `;

      const ul = searchResultBox.querySelector("[data-search-list]");

      locations.forEach(({ name, lat, lon, country, state }) => {

        const li = document.createElement("li");
        li.classList.add("view-item");

        li.innerHTML = `
          <span class="m-icon">location_on</span>
          <div>
            <p class="item-little">${name}</p>
            <p class="label-2 item-subtitle">${state || ""} ${country}</p>
          </div>
          <a href="#/weather?lat=${lat}&lon=${lon}" 
             class="item-link has-state"
             data-search-toggler></a>
        `;

        ul.appendChild(li);
      });

      ul.querySelectorAll("[data-search-toggler]").forEach(btn =>
        btn.addEventListener("click", toggleSearch)
      );
    });
  }, searchDelay);
});

/* -----------------------------
    WEATHER UPDATE (FREE API)
------------------------------ */

export const updateWeather = (query) => {

  document.querySelector("[data-loading]").style.display = "grid";

  // 1) Current Weather (nhiệt độ chính xác nhất trong free API)
  fetchData(url.currentWeather(query.lat, query.lon), (current) => {
    renderCurrentWeather(current);
    renderHighlights(current);
  });

  // 2) AQI
  fetchData(url.airPollution(query.lat, query.lon), renderAirQuality);

  // 3) 5-day forecast (3h x 40)
  fetchData(url.forecast(query.lat, query.lon), renderForecast);

  setTimeout(() => {
    document.querySelector("[data-loading]").style.display = "none";
  }, 800);
};

/* --------- RENDER CURRENT WEATHER -------- */
function renderCurrentWeather(data) {

  document.querySelector("[data-current-weather]").innerHTML = `
    <div class="card card-lg current-weather-card">
      <h2 class="title-2 card-title">Now</h2>

      <div class="weapper">
        <p class="heading">${Math.round(data.main.temp)}°<sup>c</sup></p>
        <img src="./assets/images/weather_icons/${data.weather[0].icon}.png" width="64">
      </div>

      <p class="body-3">${data.weather[0].description}</p>

      <ul class="meta-list">
        <li class="meta-item">
          <span class="m-icon">calendar_today</span>
          <p class="title-3 meta-text">${module.getDate(data.dt, data.timezone)}</p>
        </li>

        <li class="meta-item">
          <span class="m-icon">location_on</span>
          <p class="title-3 meta-text">${data.name}</p>
        </li>
      </ul>
    </div>
  `;
}

/* --------- RENDER AIR QUALITY -------- */
function renderAirQuality(data) {

  const aqi = data.list[0].main.aqi;
  const badge = document.querySelector(".aqi-top");
  if (!badge) return;

  badge.className = `badge aqi-${aqi}`;
  badge.innerText = module.aqiText[aqi].level;
}

/* --------- RENDER 5-DAY FORECAST -------- */
function renderForecast(data) {

  const forecastCard = document.querySelector("[data-5-day-forecast] ul");
  forecastCard.innerHTML = "";

  const list = data.list.filter((_, i) => i % 8 === 0);

  list.forEach((item) => {

    const date = module.getDate(item.dt, data.city.timezone);
    const temp = Math.round(item.main.temp);
    const icon = item.weather[0].icon;

    forecastCard.innerHTML += `
      <li class="card-item">
        <div class="icon-wrapper">
          <img src="./assets/images/weather_icons/${icon}.png" width="36">
          <span class="span"><p class="title-2">${temp}</p></span>
        </div>

        <p class="label-1">${date}</p>
        <p class="label-1">${module.weekDayNames[new Date(item.dt * 1000).getDay()]}</p>
      </li>
    `;
  });
}

/* --------- RENDER TODAY'S HIGHLIGHTS -------- */
function renderHighlights(current) {

  const {
    main: { humidity, pressure, feels_like },
    visibility,
    sys: { sunrise, sunset },
    timezone,
    coord: { lat, lon }
  } = current;

  const section = document.querySelector("[data-highlights]");
  const hourlySection = document.querySelector("[data-hourly-forecast]");

  section.innerHTML = "";
  hourlySection.innerHTML = "";

  /* AIR QUALITY */
  fetchData(url.airPollution(lat, lon), (airPollution) => {

    const [{
      main: { aqi },
      components: { no2, o3, so2, pm2_5 }
    }] = airPollution.list;

    const card = document.createElement("div");
    card.classList.add("card", "card-lg");

    card.innerHTML = `
      <h2 class="title-2">Today's Highlights</h2>

      <div class="highlights-list">

        <!-- AIR QUALITY -->
        <div class="card card-sm highlight-card one">
          <h3 class="title-3">Air Quality Index</h3>
          <div class="wrapper">
            <div class="m-icon">Air</div>
            <ul class="card-list">
              <li class="card-item"><p class="title-1">${pm2_5.toPrecision(3)}</p><p class="label-1">PM<sub>2.5</sub></p></li>
              <li class="card-item"><p class="title-1">${so2.toPrecision(3)}</p><p class="label-1">SO<sub>2</sub></p></li>
              <li class="card-item"><p class="title-1">${no2.toPrecision(3)}</p><p class="label-1">NO<sub>2</sub></p></li>
              <li class="card-item"><p class="title-1">${o3.toPrecision(3)}</p><p class="label-1">O<sub>3</sub></p></li>
            </ul>
          </div>

          <span class="badge aqi-${aqi}" title="${module.aqiText[aqi].message}">
            ${module.aqiText[aqi].level}
          </span>
        </div>

        <!-- SUNRISE & SUNSET -->
        <div class="card card-sm highlight-card two">
          <h3 class="title-3">Sunrise & Sunset</h3>
          <div class="card-list">

            <div class="card-item">
              <span class="m-icon">Clear_day</span>
              <div>
                <p class="label-1">Sunrise</p>
                <p class="title-1">${module.getTime(sunrise, timezone)}</p>
              </div>
            </div>

            <div class="card-item">
              <span class="m-icon">Clear_night</span>
              <div>
                <p class="label-1">Sunset</p>
                <p class="title-1">${module.getTime(sunset, timezone)}</p>
              </div>
            </div>

          </div>
        </div>

        <!-- HUMIDITY -->
        <div class="card card-sm highlight-card">
          <h3 class="title-3">Humidity</h3>
          <div class="wrapper">
            <span class="m-icon">humidity_percentage</span>
            <p class="title-1">${humidity}%</p>
          </div>
        </div>

        <!-- PRESSURE -->
        <div class="card card-sm highlight-card">
          <h3 class="title-3">Pressure</h3>
          <div class="wrapper">
            <span class="m-icon">airwave</span>
            <p class="title-1">${pressure} hPa</p>
          </div>
        </div>

        <!-- VISIBILITY -->
        <div class="card card-sm highlight-card">
          <h3 class="title-3">Visibility</h3>
          <div class="wrapper">
            <span class="m-icon">visibility</span>
            <p class="title-1">${(visibility / 1000).toFixed(1)} Km</p>
          </div>
        </div>

        <!-- FEELS LIKE -->
        <div class="card card-sm highlight-card">
          <h3 class="title-3">Feels Like</h3>
          <div class="wrapper">
            <span class="m-icon">thermostat</span>
            <p class="title-1">${Math.round(feels_like)}°c</p>
          </div>
        </div>

      </div>
    `;

    section.appendChild(card);
  });



  /* ---------- HOURLY FORECAST ---------- */
  fetchData(url.forecast(lat, lon), function (forecast) {

    const {
      list: forecastList,
      city: { timezone }
    } = forecast;

    hourlySection.innerHTML = `
      <h2 class="title-2">Today at</h2>
      <div class="slider-container">
          <ul class="slider-list" data-temp></ul>
          <ul class="slider-list" data-wind></ul>
      </div>
    `;

    for (const [index, data] of forecastList.entries()) {
      if (index > 7) break;

      const {
        dt: dateTimeUnix,
        main: { temp },
        weather,
        wind: { deg: windDirection, speed: windSpeed }
      } = data;

      const [{ icon }] = weather;

      /* TEMP ITEM */
      const tempLi = document.createElement("li");
      tempLi.classList.add("slider-item");

      tempLi.innerHTML = `
        <div class="card card-sm slider-card">
          <p class="body-3">${module.getUTCHours(dateTimeUnix, timezone)}</p>
          <img src="./assets/images/weather_icons/${icon}.png" width="48" height="48">
          <p class="body-3">${Math.round(temp)}°</p>
        </div>
      `;
      hourlySection.querySelector("[data-temp]").appendChild(tempLi);

      /* WIND ITEM */
      const windLi = document.createElement("li");
      windLi.classList.add("slider-item");

      windLi.innerHTML = `
        <div class="card card-sm slider-card">
          <p class="body-3">${module.getUTCHours(dateTimeUnix, timezone)}</p>
          <img src="./assets/images/weather_icons/direction.png" width="48" height="48"
               style="transform: rotate(${windDirection - 180}deg)">
          <p class="body-3">${parseInt(module.mps_to_kmh(windSpeed))} km/h</p>
        </div>
      `;
      hourlySection.querySelector("[data-wind]").appendChild(windLi);
    }
  });
}

/* -----------------------------
    404 PAGE
------------------------------ */
export const error404 = () => {
  document.querySelector("[data-error-content]").style.display = "grid";
};
