/**
 * @license MIT
 * @fileoverview All api related stuff like api_key, api request etc.
 * @copyright codewithsadee 2023 All rights reserved
 * @author codewithsadee <mohammadsadee24@gmail.com>
 */

'use strict';

const api_key = "ebdfefb12fbdaa620af8ab4adcb02433"
/**
 * 
 * @param {string} URL API url
 * @param {Function} callback callback
 */
export const fetchData =  function(URL, callback){
    fetch(`${URL}&appid=${api_key}`)
    .then(res => res.json())
    .then(data => callback(data));
}

export const url = {
    currentWeather(lat, lon) {
        return `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric`;
    },

    forecast(lat, lon) {
        return `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric`;
    },

    airPollution(lat, lon) {
        return `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}`;
    },

    onecall(lat, lon) {
        return `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&units=metric`;
    },
    // Reverse Geocoding (tọa độ → tên thành phố)
    reverseGeo(lat, lon) {
        return `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=5`;
    },
    /**
     * 
     * @param {string} query 
     * @returns 
     */
    // Forward Geocoding (tên thành phố → tọa độ)
    geo(query) {
        return `https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=5`;
    }
};
