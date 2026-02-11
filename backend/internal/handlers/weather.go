package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
)

type WeatherCurrent struct {
	Temp      float64 `json:"temp"`
	FeelsLike float64 `json:"feels_like"`
	Humidity  int     `json:"humidity"`
	Pressure  int     `json:"pressure"`
	WindSpeed float64 `json:"wind_speed"`
	UVIndex   float64 `json:"uv_index"`
	Condition string  `json:"condition"`
	Sunrise   string  `json:"sunrise"`
	Sunset    string  `json:"sunset"`
}

type WeatherDaily struct {
	Date       string  `json:"date"`
	TempMax    float64 `json:"temp_max"`
	TempMin    float64 `json:"temp_min"`
	Condition  string  `json:"condition"`
	RainChance int     `json:"rain_chance"`
}

type ForecastResponse struct {
	Daily []WeatherDaily `json:"daily"`
}

func (h *Handler) GetCurrentWeather(c *gin.Context) {
	location := c.Query("location")
	if location == "" {
		location = "Tashkent"
	}

	apiKey := os.Getenv("OPENWEATHER_API_KEY")
	if apiKey == "" {
		apiKey = "021cc4d180793e2374ab5de3dd5ee818" // Fallback
	}

	// Call OpenWeatherMap API
	url := fmt.Sprintf("https://api.openweathermap.org/data/2.5/weather?q=%s,UZ&units=metric&appid=%s", location, apiKey)

	resp, err := http.Get(url)
	if err != nil {
		log.Printf("Error fetching weather: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch weather"})
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		log.Printf("Weather API returned status: %d", resp.StatusCode)
		c.JSON(resp.StatusCode, gin.H{"error": "Weather service unavailable"})
		return
	}

	var data map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		log.Printf("Error decoding weather: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode weather"})
		return
	}

	// Extract relevant data
	main, ok := data["main"].(map[string]interface{})
	if !ok {
		log.Printf("Error: main not found in weather data. Body: %+v", data)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid weather data received"})
		return
	}

	wind, ok := data["wind"].(map[string]interface{})
	if !ok {
		wind = map[string]interface{}{"speed": 0.0} // Fallback
	}

	sys, ok := data["sys"].(map[string]interface{})
	if !ok {
		sys = map[string]interface{}{}
	}

	weatherArr, ok := data["weather"].([]interface{})
	if !ok || len(weatherArr) == 0 {
		log.Printf("Error: weather array not found or empty. Body: %+v", data)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid weather condition data"})
		return
	}

	weather, ok := weatherArr[0].(map[string]interface{})
	if !ok {
		log.Printf("Error: weather element is not a map. Body: %+v", data)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid weather condition format"})
		return
	}

	sunrise := "06:00"
	sunset := "19:00"
	if s, ok := sys["sunrise"].(float64); ok {
		sunrise = time.Unix(int64(s), 0).Format("15:04")
	}
	if s, ok := sys["sunset"].(float64); ok {
		sunset = time.Unix(int64(s), 0).Format("15:04")
	}

	current := WeatherCurrent{
		Temp:      main["temp"].(float64),
		FeelsLike: main["feels_like"].(float64),
		Humidity:  int(main["humidity"].(float64)),
		Pressure:  int(main["pressure"].(float64)),
		WindSpeed: wind["speed"].(float64),
		Condition: weather["main"].(string),
		UVIndex:   0, // Would need separate API call for UVI
		Sunrise:   sunrise,
		Sunset:    sunset,
	}

	c.JSON(http.StatusOK, current)
}

func (h *Handler) GetWeatherForecast(c *gin.Context) {
	location := c.Query("location")
	if location == "" {
		location = "Tashkent"
	}

	apiKey := os.Getenv("OPENWEATHER_API_KEY")
	if apiKey == "" {
		apiKey = "021cc4d180793e2374ab5de3dd5ee818"
	}

	// Use standard 5-day/3-hour forecast API (free tier compatible)
	forecastURL := fmt.Sprintf("https://api.openweathermap.org/data/2.5/forecast?q=%s&units=metric&appid=%s", location, apiKey)

	resp, err := http.Get(forecastURL)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch forecast"})
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		var errData map[string]interface{}
		json.NewDecoder(resp.Body).Decode(&errData)
		log.Printf("Weather Forecast API Error: Status %d, Message: %v", resp.StatusCode, errData)
		c.JSON(resp.StatusCode, gin.H{"error": "Weather service returned an error", "details": errData})
		return
	}

	var data struct {
		List []struct {
			Dt   int64 `json:"dt"`
			Main struct {
				TempMin float64 `json:"temp_min"`
				TempMax float64 `json:"temp_max"`
			} `json:"main"`
			Weather []struct {
				Main string `json:"main"`
			} `json:"weather"`
			Pop float64 `json:"pop"`
		} `json:"list"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode weather data"})
		return
	}

	// Aggregate 3-hour forecast into daily summaries
	dailyMap := make(map[string]*WeatherDaily)
	var dates []string

	for _, item := range data.List {
		date := time.Unix(item.Dt, 0).Format("2006-01-02")

		if _, exists := dailyMap[date]; !exists {
			dailyMap[date] = &WeatherDaily{
				Date:       date,
				TempMin:    item.Main.TempMin,
				TempMax:    item.Main.TempMax,
				Condition:  "Clear",
				RainChance: 0,
			}
			dates = append(dates, date)
		}

		d := dailyMap[date]
		if item.Main.TempMin < d.TempMin {
			d.TempMin = item.Main.TempMin
		}
		if item.Main.TempMax > d.TempMax {
			d.TempMax = item.Main.TempMax
		}

		// Heuristic: If it rains/snows at any point, show that.
		if len(item.Weather) > 0 {
			main := item.Weather[0].Main
			if main == "Rain" || main == "Snow" || main == "Thunderstorm" {
				d.Condition = main
			} else if d.Condition != "Rain" && d.Condition != "Snow" && d.Condition != "Thunderstorm" {
				if main == "Clouds" {
					d.Condition = "Clouds"
				} else if d.Condition == "Clear" {
					d.Condition = main
				}
			}
		}

		pop := int(item.Pop * 100)
		if pop > d.RainChance {
			d.RainChance = pop
		}
	}

	var forecast []WeatherDaily
	for _, date := range dates {
		forecast = append(forecast, *dailyMap[date])
	}

	c.JSON(http.StatusOK, ForecastResponse{Daily: forecast})
}
