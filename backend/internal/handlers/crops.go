package handlers

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

func (h *Handler) GetCropTypes(c *gin.Context) {
	rows, err := h.DB.Query(c.Request.Context(), "SELECT id, name FROM crop_types ORDER BY name ASC")
	if err != nil {
		log.Printf("GetCropTypes error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch crop types: " + err.Error()})
		return
	}
	defer rows.Close()

	var crops []gin.H
	for rows.Next() {
		var id int
		var name string
		if err := rows.Scan(&id, &name); err != nil {
			continue
		}
		crops = append(crops, gin.H{"id": id, "name": name})
	}

	c.JSON(http.StatusOK, crops)
}
