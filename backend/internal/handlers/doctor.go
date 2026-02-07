package handlers

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"io"
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
)

type GeminiRequest struct {
	Contents []Content `json:"contents"`
}

type Content struct {
	Parts []Part `json:"parts"`
}

type Part struct {
	Text       string      `json:"text,omitempty"`
	InlineData *InlineData `json:"inline_data,omitempty"`
}

type InlineData struct {
	MimeType string `json:"mime_type"`
	Data     string `json:"data"`
}

type DoctorResponse struct {
	Disease    string   `json:"disease"`
	Confidence string   `json:"confidence"`
	Severity   string   `json:"severity"`
	Treatment  []string `json:"treatment"`
}

func (h *Handler) AnalyzeCrop(c *gin.Context) {
	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "GEMINI_API_KEY not configured"})
		return
	}

	// 1. Get uploaded file
	file, _, err := c.Request.FormFile("image")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No image uploaded"})
		return
	}
	defer file.Close()

	// 2. Read file bytes
	fileBytes, err := io.ReadAll(file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read image"})
		return
	}

	// 3. Encode to Base64 and detect MIME type
	base64Data := base64.StdEncoding.EncodeToString(fileBytes)
	mimeType := http.DetectContentType(fileBytes)
	if !strings.HasPrefix(mimeType, "image/") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Unsupported file type: " + mimeType})
		return
	}

	// 4. Prepare request to Gemini
	prompt := `Analyze this crop image. Identify if there is any disease, pest, or deficiency. 
	Return a strictly valid JSON (no markdown formatting) with this structure:
	{
		"disease": "Name of the issue or 'Healthy'",
		"confidence": "e.g. 95%",
		"severity": "Low/Moderate/High or 'None'",
		"treatment": ["Step 1", "Step 2", "Step 3"]
	}
	If healthy, treatment should be general care tips.`

	reqBody := GeminiRequest{
		Contents: []Content{
			{
				Parts: []Part{
					{Text: prompt},
					{InlineData: &InlineData{
						MimeType: mimeType,
						Data:     base64Data,
					}},
				},
			},
		},
	}

	jsonData, _ := json.Marshal(reqBody)

	// 5. Send to Gemini API
	// gemini-2.5-flash-lite is optimized for efficiency and often has better quota availability in 2026
	modelName := "gemini-2.5-flash-lite"
	url := "https://generativelanguage.googleapis.com/v1beta/models/" + modelName + ":generateContent?key=" + apiKey
	resp, err := http.Post(url, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "Failed to contact AI service"})
		return
	}
	defer resp.Body.Close()

	// 6. Parse Response
	bodyBytes, _ := io.ReadAll(resp.Body)

	// Handle Quota and Not Found errors distinctly
	if resp.StatusCode == http.StatusTooManyRequests {
		c.JSON(http.StatusTooManyRequests, gin.H{"error": "AI Quota Exceeded. Please try again later or check your Google AI Studio billing."})
		return
	}

	if resp.StatusCode == http.StatusNotFound {
		listUrl := "https://generativelanguage.googleapis.com/v1beta/models?key=" + apiKey
		listResp, _ := http.Get(listUrl)
		if listResp != nil {
			listBody, _ := io.ReadAll(listResp.Body)
			os.Stdout.WriteString("Diagnostic - Available Models: " + string(listBody) + "\n")
			listResp.Body.Close()
		}
		c.JSON(http.StatusNotFound, gin.H{"error": "Model " + modelName + " not found. Check console for available models."})
		return
	}
	// Restore body for decoder or just use bodyBytes
	var geminiResp struct {
		Candidates []struct {
			Content struct {
				Parts []struct {
					Text string `json:"text"`
				} `json:"parts"`
			} `json:"content"`
			FinishReason string `json:"finishReason"`
		} `json:"candidates"`
		Error *struct {
			Code    int    `json:"code"`
			Message string `json:"message"`
		} `json:"error"`
	}

	if err := json.Unmarshal(bodyBytes, &geminiResp); err != nil {
		os.Stdout.WriteString("Failed to parse Gemini response: " + string(bodyBytes) + "\n")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse AI response"})
		return
	}

	if geminiResp.Error != nil {
		os.Stdout.WriteString("Gemini API Error: " + geminiResp.Error.Message + "\n")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "AI API Error: " + geminiResp.Error.Message})
		return
	}

	if len(geminiResp.Candidates) == 0 || len(geminiResp.Candidates[0].Content.Parts) == 0 {
		finishReason := "unknown"
		if len(geminiResp.Candidates) > 0 {
			finishReason = geminiResp.Candidates[0].FinishReason
		}

		errMsg := "AI returned no content."
		if finishReason == "SAFETY" {
			errMsg = "AI blocked the response due to safety filters. Try another photo."
		}

		os.Stdout.WriteString("AI returned no content. FinishReason: " + finishReason + ". Raw: " + string(bodyBytes) + "\n")
		c.JSON(http.StatusInternalServerError, gin.H{"error": errMsg + " Reason: " + finishReason})
		return
	}

	responseText := geminiResp.Candidates[0].Content.Parts[0].Text

	// Clean up markdown code blocks if present
	responseText = strings.TrimPrefix(responseText, "```json")
	responseText = strings.TrimPrefix(responseText, "```")
	responseText = strings.TrimSuffix(responseText, "```")
	responseText = strings.TrimSpace(responseText)

	var analysis DoctorResponse
	if err := json.Unmarshal([]byte(responseText), &analysis); err != nil {
		// Fallback if JSON parsing fails
		c.JSON(http.StatusOK, DoctorResponse{
			Disease:    "Analysis Complete (Raw)",
			Confidence: "Unknown",
			Severity:   "Unknown",
			Treatment:  []string{responseText},
		})
		return
	}

	c.JSON(http.StatusOK, analysis)
}
