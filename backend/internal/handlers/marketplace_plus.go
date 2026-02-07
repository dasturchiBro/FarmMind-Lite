package handlers

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
)

type RatingSchema struct {
	ID        int       `json:"id"`
	FarmerID  int       `json:"farmer_id"`
	BuyerID   int       `json:"buyer_id"`
	Rating    int       `json:"rating"`
	Comment   string    `json:"comment"`
	CreatedAt time.Time `json:"created_at"`
	BuyerName string    `json:"buyer_name,omitempty"`
}

type CreateReviewRequest struct {
	FarmerID int    `json:"farmer_id" binding:"required"`
	BuyerID  int    `json:"buyer_id" binding:"required"`
	Rating   int    `json:"rating" binding:"required,min=1,max=5"`
	Comment  string `json:"comment"`
}

func (h *Handler) CreateReview(c *gin.Context) {
	var req CreateReviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	_, err := h.DB.Exec(c.Request.Context(), `
		INSERT INTO seller_reviews (farmer_id, buyer_id, rating, comment)
		VALUES ($1, $2, $3, $4)
	`, req.FarmerID, req.BuyerID, req.Rating, req.Comment)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to submit review: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Review submitted successfully"})
}

func (h *Handler) GetFarmerReviews(c *gin.Context) {
	farmerID := c.Param("id")

	rows, err := h.DB.Query(c.Request.Context(), `
		SELECT r.id, r.farmer_id, r.buyer_id, r.rating, r.comment, r.created_at, u.full_name
		FROM seller_reviews r
		JOIN users u ON r.buyer_id = u.id
		WHERE r.farmer_id = $1
		ORDER BY r.created_at DESC
	`, farmerID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch reviews"})
		return
	}
	defer rows.Close()

	var reviews []RatingSchema
	for rows.Next() {
		var r RatingSchema
		if err := rows.Scan(&r.ID, &r.FarmerID, &r.BuyerID, &r.Rating, &r.Comment, &r.CreatedAt, &r.BuyerName); err != nil {
			continue
		}
		reviews = append(reviews, r)
	}

	c.JSON(http.StatusOK, reviews)
}

// Saved Listings

type SavedListingRequest struct {
	UserID    int `json:"user_id" binding:"required"`
	ListingID int `json:"listing_id" binding:"required"`
}

func (h *Handler) SaveListing(c *gin.Context) {
	var req SavedListingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	_, err := h.DB.Exec(c.Request.Context(), `
		INSERT INTO saved_listings (user_id, listing_id)
		VALUES ($1, $2)
		ON CONFLICT (user_id, listing_id) DO NOTHING
	`, req.UserID, req.ListingID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save listing"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Listing saved"})
}

func (h *Handler) UnsaveListing(c *gin.Context) {
	userID := c.Query("user_id")
	listingID := c.Param("id")

	_, err := h.DB.Exec(c.Request.Context(), `
		DELETE FROM saved_listings WHERE user_id = $1 AND listing_id = $2
	`, userID, listingID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to unsave listing"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Listing removed from watchlist"})
}

func (h *Handler) GetWatchlist(c *gin.Context) {
	userID := c.Query("user_id")

	query := `
		SELECT m.id, m.farmer_id, u.full_name, u.phone_number, u.region, c.name, 
		       m.quantity_kg, m.price_per_kg, m.harvest_ready_date, m.description, 
		       COALESCE(m.image_url, ''), COALESCE(m.latitude, 0), COALESCE(m.longitude, 0), m.created_at
		FROM saved_listings s
		JOIN marketplace_listings m ON s.listing_id = m.id
		JOIN users u ON m.farmer_id = u.id
		JOIN crop_types c ON m.crop_type_id = c.id
		WHERE s.user_id = $1 AND m.is_active = TRUE
		ORDER BY s.created_at DESC
	`

	rows, err := h.DB.Query(c.Request.Context(), query, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch watchlist"})
		return
	}
	defer rows.Close()

	var listings []MarketplaceListing
	for rows.Next() {
		var l MarketplaceListing
		var date *time.Time
		var created time.Time
		var desc *string
		err := rows.Scan(&l.ID, &l.FarmerID, &l.FarmerName, &l.FarmerPhone, &l.Region, &l.CropName,
			&l.QuantityKG, &l.PricePerKG, &date, &desc, &l.ImageURL, &l.Latitude, &l.Longitude, &created)
		if err != nil {
			continue
		}
		if date != nil {
			l.HarvestReadyDate = date.Format("2006-01-02")
		}
		if desc != nil {
			l.Description = *desc
		}
		l.CreatedAt = created.Format("2006-01-02 15:04")
		listings = append(listings, l)
	}

	c.JSON(http.StatusOK, listings)
}

// Demand Requests

type DemandRequest struct {
	ID            int     `json:"id"`
	BuyerID       int     `json:"buyer_id"`
	BuyerName     string  `json:"buyer_name"`
	BuyerPhone    string  `json:"buyer_phone"`
	CropTypeID    int     `json:"crop_type_id"`
	CropName      string  `json:"crop_name"`
	QuantityKG    float64 `json:"quantity_kg"`
	MaxPricePerKG float64 `json:"max_price_per_kg"`
	NeededBy      string  `json:"needed_by"`
	Region        string  `json:"region"`
	Description   string  `json:"description"`
	CreatedAt     string  `json:"created_at"`
}

type CreateDemandRequest struct {
	BuyerID       int     `json:"buyer_id" binding:"required"`
	CropTypeID    int     `json:"crop_type_id" binding:"required"`
	QuantityKG    float64 `json:"quantity_kg" binding:"required"`
	MaxPricePerKG float64 `json:"max_price_per_kg"`
	NeededBy      string  `json:"needed_by"`
	Region        string  `json:"region"`
	Description   string  `json:"description"`
}

func (h *Handler) CreateDemandRequest(c *gin.Context) {
	var req CreateDemandRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	_, err := h.DB.Exec(c.Request.Context(), `
		INSERT INTO demand_requests (buyer_id, crop_type_id, quantity_kg, max_price_per_kg, needed_by, region, description)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`, req.BuyerID, req.CropTypeID, req.QuantityKG, req.MaxPricePerKG, req.NeededBy, req.Region, req.Description)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create demand request: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Demand request posted successfully"})
}

func (h *Handler) GetDemandRequests(c *gin.Context) {
	region := c.Query("region")
	cropID := c.Query("crop_type_id")

	query := `
		SELECT d.id, d.buyer_id, u.full_name, u.phone_number, d.crop_type_id, c.name, 
		       d.quantity_kg, d.max_price_per_kg, d.needed_by, d.region, d.description, d.created_at
		FROM demand_requests d
		JOIN users u ON d.buyer_id = u.id
		JOIN crop_types c ON d.crop_type_id = c.id
		WHERE d.is_active = TRUE
	`
	var args []interface{}
	idx := 1

	if region != "" && region != "All" {
		query += fmt.Sprintf(" AND d.region = $%d", idx)
		args = append(args, region)
		idx++
	}
	if cropID != "" && cropID != "All" {
		query += fmt.Sprintf(" AND d.crop_type_id = $%d", idx)
		args = append(args, cropID)
		idx++
	}

	query += " ORDER BY d.created_at DESC"

	rows, err := h.DB.Query(c.Request.Context(), query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch demand requests"})
		return
	}
	defer rows.Close()

	var requests []DemandRequest
	for rows.Next() {
		var d DemandRequest
		var neededBy *time.Time
		var created time.Time
		err := rows.Scan(&d.ID, &d.BuyerID, &d.BuyerName, &d.BuyerPhone, &d.CropTypeID, &d.CropName,
			&d.QuantityKG, &d.MaxPricePerKG, &neededBy, &d.Region, &d.Description, &created)
		if err != nil {
			continue
		}
		if neededBy != nil {
			d.NeededBy = neededBy.Format("2006-01-02")
		}
		d.CreatedAt = created.Format("2006-01-02 15:04")
		requests = append(requests, d)
	}

	c.JSON(http.StatusOK, requests)
}

func (h *Handler) DeleteDemandRequest(c *gin.Context) {
	demandID := c.Param("id")
	buyerIDStr := c.Query("buyer_id")

	fmt.Printf("Attempting to delete demand request: ID=%s, BuyerID=%s\n", demandID, buyerIDStr)

	if buyerIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "buyer_id is required"})
		return
	}

	// Verify ownership before deleting
	var ownerID int
	err := h.DB.QueryRow(c.Request.Context(),
		"SELECT buyer_id FROM demand_requests WHERE id = $1", demandID).Scan(&ownerID)

	if err != nil {
		fmt.Printf("Error finding demand request %s: %v\n", demandID, err)
		c.JSON(http.StatusNotFound, gin.H{"error": "Demand request not found or database error"})
		return
	}

	// Check if the user is the owner
	if fmt.Sprint(ownerID) != buyerIDStr {
		fmt.Printf("Ownership mismatch: OwnerID=%d, RequestBuyerID=%s\n", ownerID, buyerIDStr)
		c.JSON(http.StatusForbidden, gin.H{"error": "You can only delete your own requests"})
		return
	}

	// Soft delete by setting is_active to false
	tag, err := h.DB.Exec(c.Request.Context(),
		"UPDATE demand_requests SET is_active = FALSE WHERE id = $1", demandID)

	if err != nil {
		fmt.Printf("Error updating demand request %s: %v\n", demandID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete demand request: " + err.Error()})
		return
	}

	if tag.RowsAffected() == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "No demand request was updated"})
		return
	}

	fmt.Printf("Successfully deleted demand request %s\n", demandID)
	c.JSON(http.StatusOK, gin.H{"message": "Demand request deleted successfully"})
}

// Analytics & Interactions

func (h *Handler) IncrementViewCount(c *gin.Context) {
	id := c.Param("id")
	h.DB.Exec(c.Request.Context(), "UPDATE marketplace_listings SET view_count = view_count + 1 WHERE id = $1", id)
	c.Status(http.StatusNoContent)
}

func (h *Handler) IncrementContactCount(c *gin.Context) {
	id := c.Param("id")
	h.DB.Exec(c.Request.Context(), "UPDATE marketplace_listings SET contact_count = contact_count + 1 WHERE id = $1", id)
	c.Status(http.StatusNoContent)
}

func (h *Handler) GetFarmerAnalytics(c *gin.Context) {
	farmerID := c.Param("id")

	var stats struct {
		TotalViews    int `json:"total_views"`
		TotalContacts int `json:"total_contacts"`
		ListingCount  int `json:"listing_count"`
	}

	err := h.DB.QueryRow(c.Request.Context(), `
		SELECT COALESCE(SUM(view_count), 0), COALESCE(SUM(contact_count), 0), COUNT(*)
		FROM marketplace_listings
		WHERE farmer_id = $1 AND is_active = TRUE
	`, farmerID).Scan(&stats.TotalViews, &stats.TotalContacts, &stats.ListingCount)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch analytics"})
		return
	}

	c.JSON(http.StatusOK, stats)
}

// Multi-photo upload helper for CreateListing update
func (h *Handler) HandleMultipleUploads(c *gin.Context, listingID int) []string {
	form, err := c.MultipartForm()
	if err != nil {
		return nil
	}
	files := form.File["images"]
	var paths []string

	uploadDir := "./uploads/marketplace"
	if _, err := os.Stat(uploadDir); os.IsNotExist(err) {
		os.MkdirAll(uploadDir, 0755)
	}

	for _, file := range files {
		filename := fmt.Sprintf("%d_%d_%s", listingID, time.Now().UnixNano(), filepath.Base(file.Filename))
		dst := filepath.Join(uploadDir, filename)
		if err := c.SaveUploadedFile(file, dst); err == nil {
			path := "/uploads/marketplace/" + filename
			paths = append(paths, path)
			// Save to DB
			h.DB.Exec(c.Request.Context(), "INSERT INTO listing_images (listing_id, image_url) VALUES ($1, $2)", listingID, path)
		}
	}
	return paths
}

func (h *Handler) GetFarmerAverageRating(farmerID interface{}) (float64, int) {
	var avg float64
	var count int
	h.DB.QueryRow(context.Background(), `
		SELECT COALESCE(AVG(rating), 0), COUNT(*)
		FROM seller_reviews
		WHERE farmer_id = $1
	`, farmerID).Scan(&avg, &count)
	return avg, count
}

// Since I cannot import context easily here without modifying the top,
// I'll ensure context is passed or used correctly in the main file.
// For now, I'll add the updated struct and listing logic to marketplace.go
