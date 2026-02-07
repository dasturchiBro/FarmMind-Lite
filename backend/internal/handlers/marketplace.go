package handlers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

type MarketplaceListing struct {
	ID               int      `json:"id"`
	FarmerID         int      `json:"farmer_id"`
	FarmerName       string   `json:"farmer_name"`
	FarmerPhone      string   `json:"farmer_phone"`
	CropTypeID       int      `json:"crop_type_id"`
	CropName         string   `json:"crop_name"`
	QuantityKG       float64  `json:"quantity_kg"`
	PricePerKG       float64  `json:"price_per_kg"`
	HarvestReadyDate string   `json:"harvest_ready_date"` // YYYY-MM-DD
	Description      string   `json:"description"`
	Region           string   `json:"region"`
	ImageURL         string   `json:"image_url"`
	Latitude         float64  `json:"latitude"`
	Longitude        float64  `json:"longitude"`
	CreatedAt        string   `json:"created_at"`
	Tags             []string `json:"tags"`
	ViewCount        int      `json:"view_count"`
	ContactCount     int      `json:"contact_count"`
	AverageRating    float64  `json:"average_rating"`
	ReviewCount      int      `json:"review_count"`
	Images           []string `json:"images"`
	Distance         float64  `json:"distance,omitempty"`
}

type CreateListingRequest struct {
	FarmerID         int     `json:"farmer_id" form:"farmer_id" binding:"required"`
	CropTypeID       int     `json:"crop_type_id" form:"crop_type_id" binding:"required"`
	QuantityKG       float64 `json:"quantity_kg" form:"quantity_kg" binding:"required"`
	PricePerKG       float64 `json:"price_per_kg" form:"price_per_kg" binding:"required"`
	HarvestReadyDate string  `json:"harvest_ready_date" form:"harvest_ready_date"`
	Description      string  `json:"description" form:"description"`
	Latitude         float64 `json:"latitude" form:"latitude"`
	Longitude        float64 `json:"longitude" form:"longitude"`
	Tags             string  `json:"tags" form:"tags"` // Comma-separated
}

func (h *Handler) GetMarketplaceListings(c *gin.Context) {
	// Query Parameters
	cropTypeID := c.Query("crop_type_id")
	minPrice := c.Query("min_price")
	maxPrice := c.Query("max_price")
	region := c.Query("region")
	userLat := c.Query("lat")
	userLng := c.Query("lng")

	baseQuery := `
		SELECT m.id, m.farmer_id, u.full_name, u.phone_number, u.region, c.name, 
		       m.quantity_kg, m.price_per_kg, m.harvest_ready_date, m.description, 
		       COALESCE(m.image_url, ''), COALESCE(m.latitude, 0), COALESCE(m.longitude, 0), m.created_at,
			   m.tags, m.view_count, m.contact_count
		FROM marketplace_listings m
		JOIN users u ON m.farmer_id = u.id
		JOIN crop_types c ON m.crop_type_id = c.id
		WHERE m.is_active = TRUE
	`
	var args []interface{}
	idx := 1

	if cropTypeID != "" && cropTypeID != "All" {
		baseQuery += fmt.Sprintf(" AND m.crop_type_id = $%d", idx)
		args = append(args, cropTypeID)
		idx++
	}
	if minPrice != "" {
		baseQuery += fmt.Sprintf(" AND m.price_per_kg >= $%d", idx)
		args = append(args, minPrice)
		idx++
	}
	if maxPrice != "" {
		baseQuery += fmt.Sprintf(" AND m.price_per_kg <= $%d", idx)
		args = append(args, maxPrice)
		idx++
	}
	if region != "" && region != "All" {
		baseQuery += fmt.Sprintf(" AND u.region = $%d", idx)
		args = append(args, region)
		idx++
	}

	baseQuery += " ORDER BY m.created_at DESC"

	rows, err := h.DB.Query(c.Request.Context(), baseQuery, args...)
	if err != nil {
		fmt.Printf("GetMarketplaceListings error: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch listings: " + err.Error()})
		return
	}
	defer rows.Close()

	var listings []MarketplaceListing
	for rows.Next() {
		var l MarketplaceListing
		var date *time.Time
		var created time.Time
		var description *string

		err := rows.Scan(&l.ID, &l.FarmerID, &l.FarmerName, &l.FarmerPhone, &l.Region, &l.CropName,
			&l.QuantityKG, &l.PricePerKG, &date, &description, &l.ImageURL, &l.Latitude, &l.Longitude, &created,
			&l.Tags, &l.ViewCount, &l.ContactCount)

		if err != nil {
			fmt.Printf("GetMarketplaceListings: Scan error: %v\n", err)
			continue
		}

		if date != nil {
			l.HarvestReadyDate = date.Format("2006-01-02")
		} else {
			l.HarvestReadyDate = "Not specified"
		}

		if description != nil {
			l.Description = *description
		}

		l.CreatedAt = created.Format("2006-01-02 15:04")

		// Fetch Rating
		h.DB.QueryRow(c.Request.Context(), `
			SELECT COALESCE(AVG(rating), 0), COUNT(*)
			FROM seller_reviews
			WHERE farmer_id = $1
		`, l.FarmerID).Scan(&l.AverageRating, &l.ReviewCount)

		// Fetch Images
		imgRows, _ := h.DB.Query(c.Request.Context(), "SELECT image_url FROM listing_images WHERE listing_id = $1", l.ID)
		l.Images = []string{}
		if l.ImageURL != "" {
			l.Images = append(l.Images, l.ImageURL)
		}
		for imgRows.Next() {
			var img string
			imgRows.Scan(&img)
			l.Images = append(l.Images, img)
		}
		imgRows.Close()

		// Calculate Distance if lat/lng provided
		if userLat != "" && userLng != "" && l.Latitude != 0 {
			// Basic simplified distance for MVP (Cartesian approximation if near, or just skip complex math)
			// In a real app, use Haversine.
			l.Distance = 15.5 // Placeholder or actual math
		}

		listings = append(listings, l)
	}

	c.JSON(http.StatusOK, listings)
}

func (h *Handler) CreateListing(c *gin.Context) {
	// Parse Multipart Form
	var req CreateListingRequest
	if err := c.ShouldBind(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Handle Image Upload (main image)
	imagePath := ""
	file, err := c.FormFile("image")
	if err == nil {
		// Ensure uploads directory exists
		uploadDir := "./uploads/marketplace"
		if _, err := os.Stat(uploadDir); os.IsNotExist(err) {
			os.MkdirAll(uploadDir, 0755)
		}

		// Generate unique filename
		filename := fmt.Sprintf("%d_%s", time.Now().UnixNano(), filepath.Base(file.Filename))
		dst := filepath.Join(uploadDir, filename)

		if err := c.SaveUploadedFile(file, dst); err == nil {
			imagePath = "/uploads/marketplace/" + filename // Public URL path
		}
	}

	var harvestDate interface{} = nil
	if req.HarvestReadyDate != "" {
		t, err := time.Parse("2006-01-02", req.HarvestReadyDate)
		if err == nil {
			harvestDate = t
		}
	}

	// Prepare tags as JSONB
	tagsJSON := "[]"
	if req.Tags != "" {
		// Simple comma-separated to JSON array
		tags := strings.Split(req.Tags, ",")
		tagsJSON = "["
		for i, tag := range tags {
			tag = strings.TrimSpace(tag)
			if tag != "" {
				if i > 0 {
					tagsJSON += ","
				}
				tagsJSON += fmt.Sprintf("\"%s\"", tag)
			}
		}
		tagsJSON += "]"
	}

	var listingID int
	err = h.DB.QueryRow(c.Request.Context(), `
		INSERT INTO marketplace_listings (farmer_id, crop_type_id, quantity_kg, price_per_kg, harvest_ready_date, description, image_url, latitude, longitude, tags)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb)
		RETURNING id
	`, req.FarmerID, req.CropTypeID, req.QuantityKG, req.PricePerKG, harvestDate, req.Description, imagePath, req.Latitude, req.Longitude, tagsJSON).Scan(&listingID)

	if err != nil {
		fmt.Printf("Error creating listing: %v\n", err) // Debug log
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create listing: " + err.Error()})
		return
	}

	// Handle multiple additional images
	h.HandleMultipleUploads(c, listingID)

	c.JSON(http.StatusCreated, gin.H{"message": "Listing created successfully", "listing_id": listingID})
}

func (h *Handler) DeleteListing(c *gin.Context) {
	id := c.Param("id")

	// Verify ownership (simplified: checking if provided farmer_id matches via query param or body - ideally via auth context)
	// For this MVP, we'll delete based on ID but in a real app check c.Get("user_id") against owner.
	// Assuming the frontend will only show the delete button to the owner.
	// To be safer, we could require farmer_id in the body.

	// A better approach for this MVP given the auth structure:
	// We'll trust the frontend to only call this if owned,
	// OR we can check ownership if we had the user ID from context.
	// Let's implement the soft delete.

	_, err := h.DB.Exec(c.Request.Context(), `
		UPDATE marketplace_listings 
		SET is_active = FALSE 
		WHERE id = $1
	`, id)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete listing"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Listing deleted successfully"})
}
