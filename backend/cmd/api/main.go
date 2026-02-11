package main

import (
	"context"
	"log"
	"net/http"
	"os"

	"farmlite/internal/handlers"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

func main() {
	// Initialize Gin
	r := gin.Default()

	// CORS Middleware
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// 1. Database Connection (Using pgxpool for efficiency)
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://postgres:12345@localhost:5432/farmmind_lite?sslmode=disable"
	}

	pool, err := pgxpool.New(context.Background(), dbURL)
	if err != nil {
		log.Fatalf("Unable to connect to database: %v\n", err)
	}
	defer pool.Close()

	// 2. Automated Recovery (Self-Healing)
	if sqlContent, err := os.ReadFile("recovery.sql"); err == nil {
		log.Println("Found recovery.sql, performing automated schema sync...")
		_, err = pool.Exec(context.Background(), string(sqlContent))
		if err != nil {
			log.Printf("Recovery error: %v (If this is about tables already existing, it is fine)\n", err)
		} else {
			log.Println("Recovery script executed successfully.")
		}
	}

	// 3. Initialize Handlers
	h := handlers.NewHandler(pool)

	// 4. Routes
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "up"})
	})

	r.GET("/api/irrigation", h.GetIrrigationSchedule)
	r.POST("/api/irrigation/save", h.SaveIrrigationSchedule)
	r.GET("/api/irrigation/saved", h.GetSavedSchedules)
	r.POST("/api/irrigation/steps/:id/toggle", h.ToggleIrrigationStep)
	r.DELETE("/api/irrigation/saved/:id", h.DeleteSavedSchedule)
	// Market Prices
	r.GET("/api/prices", h.GetLatestPrices)
	r.POST("/api/prices", h.SubmitPrice)
	r.DELETE("/api/prices/:id", h.DeletePrice)
	r.GET("/api/estimate", h.GetEstimation)
	r.GET("/api/crops", h.GetCropTypes)
	// Auth
	r.POST("/api/register", h.Register)
	r.POST("/api/login", h.Login)

	// Marketplace
	r.Static("/uploads", "./uploads")
	r.GET("/api/marketplace", h.GetMarketplaceListings)
	r.POST("/api/marketplace", h.CreateListing)
	r.DELETE("/api/marketplace/:id", h.DeleteListing)

	// Reviews
	r.POST("/api/reviews", h.CreateReview)
	r.GET("/api/farmers/:id/reviews", h.GetFarmerReviews)

	// Saved Listings
	r.POST("/api/saved", h.SaveListing)
	r.DELETE("/api/saved/:id", h.UnsaveListing)
	r.GET("/api/watchlist", h.GetWatchlist)

	// Demand Requests
	r.POST("/api/demands", h.CreateDemandRequest)
	r.GET("/api/demands", h.GetDemandRequests)
	r.DELETE("/api/demands/:id", h.DeleteDemandRequest)

	// Analytics
	r.POST("/api/marketplace/:id/view", h.IncrementViewCount)
	r.POST("/api/marketplace/:id/contact", h.IncrementContactCount)
	r.GET("/api/farmers/:id/analytics", h.GetFarmerAnalytics)
	r.GET("/api/analytics", h.GetPlatformAnalytics)

	// Weather
	r.GET("/api/weather/current", h.GetCurrentWeather)
	r.GET("/api/weather/forecast", h.GetWeatherForecast)

	// Calendar
	r.GET("/api/calendar/events", h.GetCalendarEvents)
	r.POST("/api/calendar/events", h.CreateCalendarEvent)

	// AI Doctor
	r.POST("/api/doctor/analyze", h.AnalyzeCrop)

	log.Printf("Server starting on :8080...")
	r.Run(":8080")
}
