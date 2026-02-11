package estimation

type Estimate struct {
	CropName      string  `json:"crop_name"`
	MinYield      float64 `json:"min_yield_kg"`
	MaxYield      float64 `json:"max_yield_kg"`
	MinIncome     float64 `json:"min_income_usd"`
	MaxIncome     float64 `json:"max_income_usd"`
	AvgPricePerKG float64 `json:"avg_price_per_kg"`
}

// GetCropEstimate provides rough ranges based on Uzbekistan averages and FAO data.
func GetCropEstimate(cropName string, hectares float64, priceOverride float64) Estimate {
	var yieldMin, yieldMax, avgPrice float64

	switch cropName {
	case "Wheat":
		yieldMin, yieldMax = 4000, 6000 // kg per hectare (Uzbekistan avg: 4.5-5.5t)
		avgPrice = 0.35                 // ~$0.35 per kg
	case "Rice":
		yieldMin, yieldMax = 4500, 6500
		avgPrice = 1.10
	case "Tomato":
		yieldMin, yieldMax = 25000, 45000
		avgPrice = 0.45
	case "Onion":
		yieldMin, yieldMax = 20000, 35000
		avgPrice = 0.25
	case "Cotton":
		yieldMin, yieldMax = 2500, 3500 // Uzbekistan avg: ~2.8-3.2t
		avgPrice = 0.85
	case "Carrot":
		yieldMin, yieldMax = 20000, 40000
		avgPrice = 0.20
	case "Maize":
		yieldMin, yieldMax = 5000, 9000
		avgPrice = 0.22
	case "Potato":
		yieldMin, yieldMax = 18000, 28000
		avgPrice = 0.32
	default:
		// Fallback for unknown crops
		yieldMin, yieldMax = 1000, 3000
		avgPrice = 0.30
	}

	// Use price from database if available (dynamic crowdsourced price)
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
