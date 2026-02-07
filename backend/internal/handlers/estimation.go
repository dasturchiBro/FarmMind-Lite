package handlers

import (
	"log"
	"net/http"
	"strconv"

	"farmlite/internal/estimation"

	"github.com/gin-gonic/gin"
)

func (h *Handler) GetEstimation(c *gin.Context) {
	crop := c.Query("crop")
	areaStr := c.Query("area")

	if crop == "" || areaStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "crop and area (hectares) are required"})
		return
	}

	area, err := strconv.ParseFloat(areaStr, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "area must be a valid number"})
		return
	}

	// Fetch dynamic price from DB if available
	var avgPrice float64
	err = h.DB.QueryRow(c.Request.Context(), `
		SELECT COALESCE(AVG(p.price_per_kg), 0)
		FROM market_prices p
		JOIN crop_types c ON p.crop_type_id = c.id
		WHERE c.name = $1 AND p.is_active = TRUE
	`, crop).Scan(&avgPrice)

	if err != nil {
		// Log but continue with fallback price
		log.Printf("Error fetching avg price for %s: %v", crop, err)
	}

	res := estimation.GetCropEstimate(crop, area, avgPrice)
	c.JSON(http.StatusOK, res)
}
