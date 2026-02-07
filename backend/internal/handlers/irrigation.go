package handlers

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
	"strconv" // Added for robust parsing
	"time"

	"farmlite/internal/irrigation"

	"github.com/gin-gonic/gin"
)

func (h *Handler) GetIrrigationSchedule(c *gin.Context) {
	crop := c.Query("crop")
	dateStr := c.Query("planting_date")
	region := c.Query("region") // New parameter

	if crop == "" || dateStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "crop and planting_date are required"})
		return
	}

	plantingDate, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid date format, use YYYY-MM-DD"})
		return
	}

	schedule := irrigation.GetSchedule(crop, plantingDate, region)
	c.JSON(http.StatusOK, schedule)
}

func (h *Handler) SaveIrrigationSchedule(c *gin.Context) {
	fmt.Println("SaveIrrigationSchedule: Request received")

	// Read body once for optional logging on error
	bodyBytes, _ := io.ReadAll(c.Request.Body)
	c.Request.Body = io.NopCloser(bytes.NewBuffer(bodyBytes)) // Reset body for ShouldBindJSON

	var req struct {
		UserID       interface{}           `json:"user_id"` // Flexible type to handle potential string/int conversion
		CropName     string                `json:"crop_name"`
		Region       string                `json:"region"`
		PlantingDate string                `json:"planting_date"`
		Reminders    []irrigation.Reminder `json:"reminders"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		fmt.Printf("SaveIrrigationSchedule: Bind error: %v. Raw body: %s\n", err, string(bodyBytes))
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data. Please refresh and try again."})
		return
	}

	// Safely convert UserID to int
	var userID int
	switch v := req.UserID.(type) {
	case float64:
		userID = int(v)
	case int:
		userID = v
	case string:
		parsedID, err := strconv.Atoi(v)
		if err == nil {
			userID = parsedID
		}
	}

	if userID <= 0 {
		fmt.Printf("SaveIrrigationSchedule: Invalid UserID: %v\n", req.UserID)
		c.JSON(http.StatusBadRequest, gin.H{"error": "User identification lost. Please log out and back in."})
		return
	}

	if req.CropName == "" || len(req.Reminders) == 0 {
		fmt.Printf("SaveIrrigationSchedule: Missing data. Crop:%s, Reminders:%d\n", req.CropName, len(req.Reminders))
		c.JSON(http.StatusBadRequest, gin.H{"error": "No cycle data to save. Please generate a schedule first."})
		return
	}

	fmt.Printf("SaveIrrigationSchedule: Saving for user %d, crop %s, reminders %d\n", userID, req.CropName, len(req.Reminders))

	// 0. Parse Planting Date
	parsedPlantingDate, err := time.Parse("2006-01-02", req.PlantingDate)
	if err != nil {
		fmt.Printf("SaveIrrigationSchedule: Date parse error: %v\n", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid planting date format"})
		return
	}

	ctx := c.Request.Context()
	tx, err := h.DB.Begin(ctx)
	if err != nil {
		fmt.Printf("SaveIrrigationSchedule: Transaction error: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection error (failed to start transaction)"})
		return
	}
	defer tx.Rollback(ctx)

	// 1. Create Schedule
	var scheduleID int
	err = tx.QueryRow(ctx,
		"INSERT INTO irrigation_schedules (user_id, crop_name, region, planting_date) VALUES ($1, $2, $3, $4) RETURNING id",
		userID, req.CropName, req.Region, parsedPlantingDate,
	).Scan(&scheduleID)

	if err != nil {
		fmt.Printf("SaveIrrigationSchedule: Insert schedule error: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal database error while saving schedule base"})
		return
	}

	// 2. Create Steps
	for _, r := range req.Reminders {
		parsedStepDate, err := time.Parse("2006-01-02", r.Date)
		if err != nil {
			fmt.Printf("SaveIrrigationSchedule: Reminder date error: %v on stage %s\n", err, r.Stage)
			continue // Skip invalid dates but keep going? Or fail? Better fail to be consistent.
		}

		_, err = tx.Exec(ctx,
			"INSERT INTO irrigation_steps (schedule_id, date, stage, action, notes) VALUES ($1, $2, $3, $4, $5)",
			scheduleID, parsedStepDate, r.Stage, r.Action, r.Notes,
		)
		if err != nil {
			fmt.Printf("SaveIrrigationSchedule: Insert step error: %v\n", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal database error while saving reminders"})
			return
		}
	}

	if err := tx.Commit(ctx); err != nil {
		fmt.Printf("SaveIrrigationSchedule: Commit error: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to finalize save"})
		return
	}

	fmt.Printf("SaveIrrigationSchedule: Success, ID %d\n", scheduleID)
	c.JSON(http.StatusOK, gin.H{"message": "Schedule saved successfully", "id": scheduleID})
}

func (h *Handler) GetSavedSchedules(c *gin.Context) {
	userIDStr := c.Query("user_id")
	if userIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id is required"})
		return
	}

	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user_id format"})
		return
	}

	rows, err := h.DB.Query(c.Request.Context(), `
		SELECT s.id, s.crop_name, COALESCE(s.region, ''), s.planting_date, s.created_at,
			   st.id, st.date, st.stage, st.action, COALESCE(st.notes, ''), st.completed_at
		FROM irrigation_schedules s
		JOIN irrigation_steps st ON s.id = st.schedule_id
		WHERE s.user_id = $1
		ORDER BY s.created_at DESC, st.date ASC
	`, userID)

	if err != nil {
		fmt.Printf("GetSavedSchedules: Query error: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch schedules"})
		return
	}
	defer rows.Close()

	type SavedStep struct {
		ID          int        `json:"id"`
		Date        string     `json:"date"`
		Stage       string     `json:"stage"`
		Action      string     `json:"action"`
		Notes       string     `json:"notes"`
		CompletedAt *time.Time `json:"completed_at"`
	}
	type SavedSchedule struct {
		ID           int         `json:"id"`
		CropName     string      `json:"crop_name"`
		Region       string      `json:"region"`
		PlantingDate string      `json:"planting_date"`
		CreatedAt    time.Time   `json:"created_at"`
		Steps        []SavedStep `json:"steps"`
	}

	schedulesMap := make(map[int]*SavedSchedule)
	var scheduleIDs []int

	for rows.Next() {
		var sID int
		var cropName, region string
		var plantingDate, stDate, createdAt time.Time
		var stID int
		var stStage, stAction, stNotes string
		var stCompletedAt *time.Time

		err := rows.Scan(&sID, &cropName, &region, &plantingDate, &createdAt, &stID, &stDate, &stStage, &stAction, &stNotes, &stCompletedAt)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse schedules"})
			return
		}

		if _, exists := schedulesMap[sID]; !exists {
			schedulesMap[sID] = &SavedSchedule{
				ID:           sID,
				CropName:     cropName,
				Region:       region,
				PlantingDate: plantingDate.Format("2006-01-02"),
				CreatedAt:    createdAt,
				Steps:        []SavedStep{},
			}
			scheduleIDs = append(scheduleIDs, sID)
		}

		schedulesMap[sID].Steps = append(schedulesMap[sID].Steps, SavedStep{
			ID:          stID,
			Date:        stDate.Format("2006-01-02"),
			Stage:       stStage,
			Action:      stAction,
			Notes:       stNotes,
			CompletedAt: stCompletedAt,
		})
	}

	result := make([]*SavedSchedule, 0)
	for _, id := range scheduleIDs {
		result = append(result, schedulesMap[id])
	}

	c.JSON(http.StatusOK, result)
}

func (h *Handler) ToggleIrrigationStep(c *gin.Context) {
	stepIDStr := c.Param("id")
	stepID, err := strconv.Atoi(stepIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid step ID"})
		return
	}

	// Toggle completed_at between NULL and CURRENT_TIMESTAMP
	_, err = h.DB.Exec(c.Request.Context(), `
		UPDATE irrigation_steps 
		SET completed_at = CASE WHEN completed_at IS NULL THEN CURRENT_TIMESTAMP ELSE NULL END
		WHERE id = $1
	`, stepID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to toggle step"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Step updated"})
}

func (h *Handler) DeleteSavedSchedule(c *gin.Context) {
	scheduleIDStr := c.Param("id")
	scheduleID, err := strconv.Atoi(scheduleIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid schedule ID"})
		return
	}

	_, err = h.DB.Exec(c.Request.Context(), "DELETE FROM irrigation_schedules WHERE id = $1", scheduleID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete schedule"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Schedule deleted"})
}
