package handlers

import (
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

type CalendarEvent struct {
	ID    int     `json:"id"`
	Date  string  `json:"date"`
	Title string  `json:"title"`
	Type  string  `json:"type"`
	Value float64 `json:"value,omitempty"`
}

func (h *Handler) GetCalendarEvents(c *gin.Context) {
	userIDStr := c.Query("user_id")
	var userID int
	if userIDStr != "" {
		userID, _ = strconv.Atoi(userIDStr)
	}

	year, _ := strconv.Atoi(c.Query("year"))
	month, _ := strconv.Atoi(c.Query("month"))

	if year == 0 {
		year = time.Now().Year()
	}
	if month == 0 {
		month = int(time.Now().Month())
	}

	startDate := time.Date(year, time.Month(month), 1, 0, 0, 0, 0, time.UTC)
	endDate := startDate.AddDate(0, 1, 0)

	var events []CalendarEvent

	// 1. Irrigation schedules (steps)
	irrQuery := `
		SELECT st.id, st.date::date as event_date, s.crop_name || ': ' || st.action as title, 'irrigation' as type
		FROM irrigation_schedules s
		JOIN irrigation_steps st ON s.id = st.schedule_id
		WHERE s.user_id = $1 AND st.date >= $2 AND st.date < $3
	`
	rows, _ := h.DB.Query(c.Request.Context(), irrQuery, userID, startDate, endDate)
	if rows != nil {
		defer rows.Close()
		for rows.Next() {
			var e CalendarEvent
			var tDate time.Time
			if err := rows.Scan(&e.ID, &tDate, &e.Title, &e.Type); err == nil {
				e.Date = tDate.Format("2006-01-02")
				events = append(events, e)
			}
		}
	}

	// 2. Custom User Events
	userQuery := `
		SELECT id, date::date as event_date, title, type
		FROM user_events
		WHERE user_id = $1 AND date >= $2 AND date < $3
	`
	rows, _ = h.DB.Query(c.Request.Context(), userQuery, userID, startDate, endDate)
	if rows != nil {
		defer rows.Close()
		for rows.Next() {
			var e CalendarEvent
			var tDate time.Time
			if err := rows.Scan(&e.ID, &tDate, &e.Title, &e.Type); err == nil {
				e.Date = tDate.Format("2006-01-02")
				events = append(events, e)
			}
		}
	}

	// 3. Marketplace Harvest Dates
	mktQuery := `
		SELECT id, harvest_ready_date::date as event_date, crop_name || ' Harvest' as title, 'harvest' as type, quantity_kg * price_per_kg as value
		FROM marketplace_listings
		WHERE farmer_id = $1 AND harvest_ready_date >= $2 AND harvest_ready_date < $3 AND is_active = TRUE
	`
	rows, _ = h.DB.Query(c.Request.Context(), mktQuery, userID, startDate, endDate)
	if rows != nil {
		defer rows.Close()
		for rows.Next() {
			var e CalendarEvent
			var tDate time.Time
			if err := rows.Scan(&e.ID, &tDate, &e.Title, &e.Type, &e.Value); err == nil {
				e.Date = tDate.Format("2006-01-02")
				events = append(events, e)
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{"events": events})
}

func (h *Handler) CreateCalendarEvent(c *gin.Context) {
	var req struct {
		UserID int    `json:"user_id"`
		Title  string `json:"title"`
		Type   string `json:"type"`
		Date   string `json:"date"`
		Notes  string `json:"notes"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	parsedDate, err := time.Parse("2006-01-02", req.Date)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format"})
		return
	}

	_, err = h.DB.Exec(c.Request.Context(),
		"INSERT INTO user_events (user_id, title, type, date, notes) VALUES ($1, $2, $3, $4, $5)",
		req.UserID, req.Title, req.Type, parsedDate, req.Notes,
	)

	if err != nil {
		log.Printf("CreateCalendarEvent error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create event"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Event created"})
}
