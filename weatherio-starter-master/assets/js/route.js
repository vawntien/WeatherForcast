"use strict";

import { updateWeather, error404 } from "./app.js";

const defaultLocation = "#/weather?lat=51.5073219&lon=-0.1276474";

const currentLocation = () => {
  navigator.geolocation.getCurrentPosition(
    (res) => {
      updateWeather({
        lat: res.coords.latitude,
        lon: res.coords.longitude
      });
    },
    () => {
      window.location.hash = defaultLocation;
    }
  );
};

const searchLocation = (query) => {
  const params = new URLSearchParams(query);

  updateWeather({
    lat: params.get("lat"),
    lon: params.get("lon")
  });
};

const routes = new Map([
  ["/current-location", currentLocation],
  ["/weather", searchLocation]
]);

const checkHash = () => {
  const requestURL = window.location.hash.slice(1);

  const [route, query] = requestURL.includes("?")
    ? requestURL.split("?")
    : [requestURL];

  routes.get(route) ? routes.get(route)(query) : error404();
};

window.addEventListener("hashchange", checkHash);

window.addEventListener("load", () => {
  if (!window.location.hash) {
    window.location.hash = defaultLocation;
  } else {
    checkHash();
  }
});
