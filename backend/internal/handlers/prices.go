package handlers

import (
	"fmt"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

type PriceSubmission struct {
	CropTypeID int     `json:"crop_type_id" binding:"required"`
	Region     string  `json:"region" binding:"required"`
	PricePerKG float64 `json:"price_per_kg" binding:"required"`
	VolumeTier string  `json:"volume_tier"` // "retail" or "wholesale"
	UserID     *int    `json:"user_id"`     // Use pointer to allow NULL
}

func (h *Handler) SubmitPrice(c *gin.Context) {
	var input PriceSubmission
	if err := c.ShouldBindJSON(&input); err != nil {
		log.Printf("SubmitPrice: Binding error: %v\n", err) // Added logging
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input: " + err.Error()})
		return
	}

	// Default to retail if not specified
	if input.VolumeTier == "" {
		input.VolumeTier = "retail"
	}

	// Validate tier
	if input.VolumeTier != "retail" && input.VolumeTier != "wholesale" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "volume_tier must be 'retail' or 'wholesale'"})
		return
	}

	// Ensure UserID is nil if 0 is passed (common frontend mistake)
	var userID *int = input.UserID
	if userID != nil && *userID == 0 {
		userID = nil
	}

	_, err := h.DB.Exec(c.Request.Context(),
		"INSERT INTO market_prices (crop_type_id, region, price_per_kg, volume_tier, submitted_by) VALUES ($1, $2, $3, $4, $5)",
		input.CropTypeID, input.Region, input.PricePerKG, input.VolumeTier, userID)

	if err != nil {
		log.Printf("SubmitPrice: Insert error: %v\n", err) // Added logging
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to submit price: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Price submitted successfully"})
}

func (h *Handler) GetLatestPrices(c *gin.Context) {
	// Robust SQL with accurate verification metrics
	query := `
		SELECT 
			c.name as crop_name,
			m1.region,
			COALESCE(MAX(CASE WHEN m1.volume_tier = 'retail' THEN m1.price_per_kg END), 0) as retail_price,
			COALESCE(MAX(CASE WHEN m1.volume_tier = 'wholesale' THEN m1.price_per_kg END), 0) as wholesale_price,
			MAX(m1.submitted_at) as last_update,
			(
				SELECT json_agg(json_build_object(
					'id', id, 
					'price', price_per_kg, 
					'date', submitted_at, 
					'tier', volume_tier,
					'user_id', submitted_by
				))
				FROM (
					SELECT id, price_per_kg, submitted_at, volume_tier, submitted_by
					FROM market_prices history
					WHERE history.crop_type_id = m1.crop_type_id AND history.region = m1.region AND history.is_active = TRUE
					AND history.submitted_at >= NOW() - INTERVAL '30 days'
					ORDER BY submitted_at ASC
				) h
			) as history,
			(SELECT COUNT(DISTINCT submitted_by) FROM market_prices v WHERE v.crop_type_id = m1.crop_type_id AND v.region = m1.region AND v.submitted_at >= NOW() - INTERVAL '4 hours' AND v.is_active = TRUE AND v.submitted_by IS NOT NULL) as dist_farmers,
			(SELECT COUNT(*) FROM market_prices v WHERE v.crop_type_id = m1.crop_type_id AND v.region = m1.region AND v.submitted_at >= NOW() - INTERVAL '4 hours' AND v.is_active = TRUE AND v.submitted_by IS NULL) as anon_reports,
			(SELECT submitted_by FROM market_prices s WHERE s.crop_type_id = m1.crop_type_id AND s.region = m1.region AND s.is_active = TRUE ORDER BY submitted_at DESC LIMIT 1) as owner,
			(SELECT id FROM market_prices i WHERE i.crop_type_id = m1.crop_type_id AND i.region = m1.region AND i.is_active = TRUE ORDER BY submitted_at DESC LIMIT 1) as latest_id
		FROM market_prices m1
		JOIN crop_types c ON m1.crop_type_id = c.id
		WHERE m1.is_active = TRUE AND m1.submitted_at >= NOW() - INTERVAL '30 days'
		GROUP BY c.name, m1.region, m1.crop_type_id
		ORDER BY last_update DESC
	`

	rows, err := h.DB.Query(c.Request.Context(), query)
	if err != nil {
		log.Printf("GetLatestPrices: Query error: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database query failed: " + err.Error()})
		return
	}
	defer rows.Close()

	var results []gin.H
	for rows.Next() {
		var name, region string
		var retailPrice, wholesalePrice float64
		var lastUpdate interface{}
		var historyJSON []byte
		var distFarmers, anonReports int
		var submittedBy *int
		var latestID *int

		if err := rows.Scan(&name, &region, &retailPrice, &wholesalePrice, &lastUpdate, &historyJSON, &distFarmers, &anonReports, &submittedBy, &latestID); err != nil {
			log.Printf("GetLatestPrices: Row scan error: %v\n", err)
			continue
		}

		// Ensure historyJSON is a valid JSON string
		historyStr := "[]"
		if historyJSON != nil {
			historyStr = string(historyJSON)
		}

		results = append(results, gin.H{
			"id":              latestID,
			"crop":            name,
			"region":          region,
			"retail_price":    retailPrice,
			"wholesale_price": wholesalePrice,
			"updated_at":      lastUpdate,
			"history":         historyStr,
			"dist_farmers":    distFarmers,
			"anon_reports":    anonReports,
			"submitted_by":    submittedBy,
		})
	}

	c.JSON(http.StatusOK, results)
}

// DeletePrice handles soft deletion of price entries
func (h *Handler) DeletePrice(c *gin.Context) {
	priceID := c.Param("id")
	userID := c.Query("user_id")

	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id is required"})
		return
	}

	// Verify ownership
	var ownerID int
	err := h.DB.QueryRow(c.Request.Context(),
		"SELECT submitted_by FROM market_prices WHERE id = $1 AND is_active = TRUE", priceID).Scan(&ownerID)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Price entry not found"})
		return
	}

	// Check if user is the owner
	if fmt.Sprint(ownerID) != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "You can only delete your own price entries"})
		return
	}

	// Soft delete
	_, err = h.DB.Exec(c.Request.Context(),
		"UPDATE market_prices SET is_active = FALSE WHERE id = $1", priceID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete price entry"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Price entry deleted successfully"})
}
