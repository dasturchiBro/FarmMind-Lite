package handlers

import (
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

type PlatformAnalytics struct {
	TotalListings      int            `json:"total_listings"`
	TotalFarmers       int            `json:"total_farmers"`
	TotalBuyers        int            `json:"total_buyers"`
	ActiveListings     int            `json:"active_listings"`
	TotalPriceReports  int            `json:"total_price_reports"`
	AveragePriceChange float64        `json:"average_price_change"`
	LastUpdated        time.Time      `json:"last_updated"`
	RegionalBreakdown  []RegionalStat `json:"regional_breakdown"`
}

type RegionalStat struct {
	Region   string `json:"region"`
	Listings int    `json:"listings"`
	Farmers  int    `json:"farmers"`
}

func (h *Handler) GetPlatformAnalytics(c *gin.Context) {
	var stats PlatformAnalytics

	// Total listings
	err := h.DB.QueryRow(c.Request.Context(), `
		SELECT COUNT(*) FROM marketplace_listings WHERE is_active = TRUE
	`).Scan(&stats.TotalListings)
	if err != nil {
		log.Printf("Error fetching total listings: %v", err)
	}

	// Active listings (within last 30 days)
	err = h.DB.QueryRow(c.Request.Context(), `
		SELECT COUNT(*) FROM marketplace_listings 
		WHERE is_active = TRUE AND created_at >= NOW() - INTERVAL '30 days'
	`).Scan(&stats.ActiveListings)
	if err != nil {
		log.Printf("Error fetching active listings: %v", err)
	}

	// Total farmers and buyers
	err = h.DB.QueryRow(c.Request.Context(), `
		SELECT 
			COUNT(*) FILTER (WHERE role = 'farmer'),
			COUNT(*) FILTER (WHERE role = 'buyer')
		FROM users
	`).Scan(&stats.TotalFarmers, &stats.TotalBuyers)
	if err != nil {
		log.Printf("Error fetching user counts: %v", err)
	}

	// Total price reports
	err = h.DB.QueryRow(c.Request.Context(), `
		SELECT COUNT(*) FROM market_prices WHERE is_active = TRUE
	`).Scan(&stats.TotalPriceReports)
	if err != nil {
		log.Printf("Error fetching price reports: %v", err)
	}

	// Average price change (last 7 days vs previous 7 days)
	var avgChange *float64
	err = h.DB.QueryRow(c.Request.Context(), `
		WITH recent_avg AS (
			SELECT AVG(price_per_kg) as avg_price
			FROM market_prices
			WHERE submitted_at >= NOW() - INTERVAL '7 days' AND is_active = TRUE
		),
		previous_avg AS (
			SELECT AVG(price_per_kg) as avg_price
			FROM market_prices
			WHERE submitted_at >= NOW() - INTERVAL '14 days' 
			  AND submitted_at < NOW() - INTERVAL '7 days'
			  AND is_active = TRUE
		)
		SELECT ((recent_avg.avg_price - previous_avg.avg_price) / previous_avg.avg_price * 100)
		FROM recent_avg, previous_avg
		WHERE previous_avg.avg_price > 0
	`).Scan(&avgChange)
	if err == nil && avgChange != nil {
		stats.AveragePriceChange = *avgChange
	} else {
		stats.AveragePriceChange = 0
	}

	// Regional breakdown
	rows, err := h.DB.Query(c.Request.Context(), `
		SELECT u.region, 
		       COUNT(DISTINCT m.id) as listing_count,
		       COUNT(DISTINCT m.farmer_id) as farmer_count
		FROM marketplace_listings m
		JOIN users u ON m.farmer_id = u.id
		WHERE m.is_active = TRUE
		GROUP BY u.region
		ORDER BY listing_count DESC
		LIMIT 10
	`)
	if err != nil {
		log.Printf("Error fetching regional breakdown: %v", err)
	} else {
		defer rows.Close()
		for rows.Next() {
			var stat RegionalStat
			if err := rows.Scan(&stat.Region, &stat.Listings, &stat.Farmers); err != nil {
				continue
			}
			stats.RegionalBreakdown = append(stats.RegionalBreakdown, stat)
		}
	}

	stats.LastUpdated = time.Now()

	c.JSON(http.StatusOK, stats)
}
