package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
)

type RegisterRequest struct {
	FullName    string `json:"full_name" binding:"required"`
	Email       string `json:"email" binding:"required"`
	PhoneNumber string `json:"phone_number" binding:"required"`
	Region      string `json:"region" binding:"required"`
	Role        string `json:"role" binding:"required"`
	Password    string `json:"password" binding:"required"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// Register handles creating a new user
func (h *Handler) Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "All fields are required"})
		return
	}

	// 1. Check if Phone Number exists (to handle legacy users or duplicates)
	var existingID int
	var existingPass *string // Pointer to handle NULL
	err := h.DB.QueryRow(c.Request.Context(), "SELECT id, password FROM users WHERE phone_number = $1", req.PhoneNumber).Scan(&existingID, &existingPass)

	if err == nil {
		// User with this phone exists!
		if existingPass == nil || *existingPass == "" {
			// Case: Legacy user (created before password support). Upgrade them!
			_, err = h.DB.Exec(c.Request.Context(),
				"UPDATE users SET full_name=$1, email=$2, region=$3, role=$4, password=$5 WHERE id=$6",
				req.FullName, req.Email, req.Region, req.Role, req.Password, existingID)

			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upgrade account: " + err.Error()})
				return
			}

			// Return success as if new registration
			c.JSON(http.StatusOK, gin.H{
				"message": "Account upgraded successfully!",
				"user": gin.H{
					"id":           existingID,
					"full_name":    req.FullName,
					"email":        req.Email,
					"phone_number": req.PhoneNumber,
					"region":       req.Region,
					"role":         req.Role,
				},
			})
			return
		}

		// Case: Real duplicate
		c.JSON(http.StatusConflict, gin.H{"error": "Phone number already registered. Please Log In."})
		return
	}

	// 2. Check if Email exists (if different phone but same email)
	var emailExists int
	err = h.DB.QueryRow(c.Request.Context(), "SELECT 1 FROM users WHERE email = $1", req.Email).Scan(&emailExists)
	if err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Email already in use."})
		return
	}

	// 3. Create new user
	var userID int
	err = h.DB.QueryRow(c.Request.Context(),
		"INSERT INTO users (full_name, email, phone_number, region, role, password) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
		req.FullName, req.Email, req.PhoneNumber, req.Region, req.Role, req.Password).Scan(&userID)

	if err != nil {
		// Return the actual error to help debug (e.g., missing column)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to register: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Registration successful!",
		"user": gin.H{
			"id":           userID,
			"full_name":    req.FullName,
			"email":        req.Email,
			"phone_number": req.PhoneNumber,
			"region":       req.Region,
			"role":         req.Role,
		},
	})
}

// Login handles authenticating a user
func (h *Handler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email and Password are required"})
		return
	}

	var userID int
	var name, phone, region, role, storedPassword string

	err := h.DB.QueryRow(c.Request.Context(),
		"SELECT id, full_name, phone_number, region, role, password FROM users WHERE email = $1", req.Email).Scan(&userID, &name, &phone, &region, &role, &storedPassword)

	if err == pgx.ErrNoRows {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	if storedPassword != req.Password {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Login successful!",
		"user": gin.H{
			"id":           userID,
			"full_name":    name,
			"email":        req.Email,
			"phone_number": phone,
			"region":       region,
			"role":         role,
		},
	})
}
