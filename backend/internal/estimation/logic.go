package estimation

type Estimate struct {
	CropName      string  `json:"crop_name"`
	MinYield      float64 `json:"min_yield_kg"`
	MaxYield      float64 `json:"max_yield_kg"`
	MinIncome     float64 `json:"min_income_usd"`
	MaxIncome     float64 `json:"max_income_usd"`
	AvgPricePerKG float64 `json:"avg_price_per_kg"`
}

// GetCropEstimate provides rough ranges based on FAO/USDA global and regional averages.
func GetCropEstimate(cropName string, hectares float64, priceOverride float64) Estimate {
	var yieldMin, yieldMax, avgPrice float64

	switch cropName {
	case "Wheat":
		yieldMin, yieldMax = 2500, 4500 // kg per hectare
		avgPrice = 0.42                 // Default fallback
	case "Rice":
		yieldMin, yieldMax = 3500, 5500
		avgPrice = 0.85
	case "Tomato":
		yieldMin, yieldMax = 15000, 30000
		avgPrice = 0.50
	case "Onion":
		yieldMin, yieldMax = 10000, 20000
		avgPrice = 0.33 // Default fallback
	case "Cotton":
		yieldMin, yieldMax = 1000, 2500
		avgPrice = 0.50 // Default fallback
	case "Carrot":
		yieldMin, yieldMax = 15000, 30000
		avgPrice = 0.35
	case "Maize":
		yieldMin, yieldMax = 4000, 7000
		avgPrice = 0.18
	case "Potato":
		yieldMin, yieldMax = 12000, 22000
		avgPrice = 0.30
	default:
		// Fallback for unknown crops
		yieldMin, yieldMax = 500, 1500
		avgPrice = 0.10 // Small fallback instead of $0
	}

	// Use price from database if available
	if priceOverride > 0 {
		avgPrice = priceOverride
	}

	return Estimate{
		CropName:      cropName,
		MinYield:      yieldMin * hectares,
		MaxYield:      yieldMax * hectares,
		MinIncome:     yieldMin * hectares * avgPrice,
		MaxIncome:     yieldMax * hectares * avgPrice,
		AvgPricePerKG: avgPrice,
	}
}
