package irrigation

import (
	"time"
)

type Reminder struct {
	Date   string `json:"date"`
	Stage  string `json:"stage"`
	Action string `json:"action"`
	Notes  string `json:"notes"`
}

type CropSchedule struct {
	CropName  string     `json:"crop_name"`
	Reminders []Reminder `json:"reminders"`
}

// GetSchedule returns a hardcoded rule-based irrigation schedule for common crops in Uzbekistan.
func GetSchedule(cropName string, plantingDate time.Time, region string) CropSchedule {
	var reminders []Reminder

	// Region offset (days) - Simple regional variation simulation
	// Hotter regions like Karakalpakstan might need earlier watering
	offset := 0
	if region == "Karakalpakstan" || region == "Khorezm" {
		offset = -2 // Speed up cycle due to heat
	} else if region == "Mountainous" {
		offset = 3 // Slow down due to cooler temps
	}

	switch cropName {
	case "Wheat":
		reminders = append(reminders, Reminder{
			Date:   plantingDate.AddDate(0, 0, 7+offset).Format("2006-01-02"),
			Stage:  "Emergence",
			Action: "Initial irrigation to establish roots.",
			Notes:  "Light watering ensures seeds sprout evenly. Watch for winter pests.",
		})
		reminders = append(reminders, Reminder{
			Date:   plantingDate.AddDate(0, 0, 28+offset).Format("2006-01-02"),
			Stage:  "Tillering",
			Action: "Increased water needed for stem growth.",
			Notes:  "Stems are developing. Apply nitrogen fertilizer if needed before watering.",
		})
		reminders = append(reminders, Reminder{
			Date:   plantingDate.AddDate(0, 0, 60+offset).Format("2006-01-02"),
			Stage:  "Flowering",
			Action: "Critical: peak water demand.",
			Notes:  "Water stress now reduces grain number. Check for powdery mildew signs.",
		})

	case "Cotton":
		reminders = append(reminders, Reminder{
			Date:   plantingDate.AddDate(0, 0, 8+offset).Format("2006-01-02"),
			Stage:  "Germination",
			Action: "Light frequent irrigation (3-4 days).",
			Notes:  "Cotton seeds need warm, moist soil to emerge. Check for crusting.",
		})
		reminders = append(reminders, Reminder{
			Date:   plantingDate.AddDate(0, 0, 25+offset).Format("2006-01-02"),
			Stage:  "Seedling",
			Action: "Moderate watering; establish roots.",
			Notes:  "Monitor for aphids and early-season pests. Avoid waterlogging.",
		})
		reminders = append(reminders, Reminder{
			Date:   plantingDate.AddDate(0, 0, 45+offset).Format("2006-01-02"),
			Stage:  "Squaring (Bloom)",
			Action: "Increase frequency; maintain moisture.",
			Notes:  "First flower buds forming. Consistent water prevents 'square drop'.",
		})
		reminders = append(reminders, Reminder{
			Date:   plantingDate.AddDate(0, 0, 75+offset).Format("2006-01-02"),
			Stage:  "Boll Development",
			Action: "Deep watering every 5-7 days.",
			Notes:  "Fiber quality is determined now. Peak water demand phase.",
		})
		reminders = append(reminders, Reminder{
			Date:   plantingDate.AddDate(0, 0, 110+offset).Format("2006-01-02"),
			Stage:  "Boll Maturation",
			Action: "Stop irrigation.",
			Notes:  "Stop watering once bolls begin to open to allow drying.",
		})

	case "Rice":
		reminders = append(reminders, Reminder{
			Date:   plantingDate.AddDate(0, 0, 1+offset).Format("2006-01-02"),
			Stage:  "Establishment",
			Action: "Maintain shallow flood (2-3cm).",
			Notes:  "Keep soil saturated for seedling emergence. Check for waterweeds.",
		})
		reminders = append(reminders, Reminder{
			Date:   plantingDate.AddDate(0, 0, 30+offset).Format("2006-01-02"),
			Stage:  "Tillering",
			Action: "Increase flood depth (5-10cm).",
			Notes:  "Critical phase for stem development. Maintain consistent water level.",
		})
		reminders = append(reminders, Reminder{
			Date:   plantingDate.AddDate(0, 0, 80+offset).Format("2006-01-02"),
			Stage:  "Flowering",
			Action: "Maintain maximum flood depth.",
			Notes:  "Rice is most sensitive to water stress now. Avoid any drainage.",
		})
		reminders = append(reminders, Reminder{
			Date:   plantingDate.AddDate(0, 0, 115+offset).Format("2006-01-02"),
			Stage:  "Ripening",
			Action: "Drain field 2 weeks before harvest.",
			Notes:  "Gradual drainage allows soil to firm up for machinery/harvesting.",
		})

	case "Tomato":
		reminders = append(reminders, Reminder{
			Date:   plantingDate.AddDate(0, 0, 4+offset).Format("2006-01-02"),
			Stage:  "Establishment",
			Action: "Light frequent irrigation.",
			Notes:  "Prevent roots from drying out. Consider light mulch for moisture retention.",
		})
		reminders = append(reminders, Reminder{
			Date:   plantingDate.AddDate(0, 0, 30+offset).Format("2006-01-02"),
			Stage:  "Flowering & Fruit Set",
			Action: "Consistent moisture; avoid fluctuations.",
			Notes:  "Watering twice a week. Prevents blossom end rot. Check for leaf curl.",
		})
		reminders = append(reminders, Reminder{
			Date:   plantingDate.AddDate(0, 0, 60+offset).Format("2006-01-02"),
			Stage:  "Ripening",
			Action: "Maintain deep watering.",
			Notes:  "Regular watering keeps fruits succulent and prevents cracking.",
		})

	case "Maize":
		reminders = append(reminders, Reminder{
			Date:   plantingDate.AddDate(0, 0, 5+offset).Format("2006-01-02"),
			Stage:  "Germination",
			Action: "Uniform soil moisture.",
			Notes:  "Critical for uniform emergence. Watch for wireworms in the soil.",
		})
		reminders = append(reminders, Reminder{
			Date:   plantingDate.AddDate(0, 0, 55+offset).Format("2006-01-02"),
			Stage:  "Pollination (Tasseling)",
			Action: "High water demand; irrigation is vital.",
			Notes:  "Water stress during silking causes immediate yield loss.",
		})

	case "Potato":
		reminders = append(reminders, Reminder{
			Date:   plantingDate.AddDate(0, 0, 20+offset).Format("2006-01-02"),
			Stage:  "Sprouting",
			Action: "Deep moisture; no saturation.",
			Notes:  "Check for Colorado Beetle larvae. Keep ridges moist.",
		})
		reminders = append(reminders, Reminder{
			Date:   plantingDate.AddDate(0, 0, 45+offset).Format("2006-01-02"),
			Stage:  "Tuber Bulking",
			Action: "Consistent moisture every 4-6 days.",
			Notes:  "Watering ensures tuber size uniformity. Check for late blight.",
		})

	case "Carrot":
		reminders = append(reminders, Reminder{
			Date:   plantingDate.AddDate(0, 0, 5+offset).Format("2006-01-02"),
			Stage:  "Germination",
			Action: "Fine misting every 2 days.",
			Notes:  "Carrot seeds are small and surface-planted; they dry out quickly.",
		})
		reminders = append(reminders, Reminder{
			Date:   plantingDate.AddDate(0, 0, 40+offset).Format("2006-01-02"),
			Stage:  "Root Expansion",
			Action: "Deep watering twice a week.",
			Notes:  "Promotes long, straight growth of the taproot.",
		})

	case "Onion":
		reminders = append(reminders, Reminder{
			Date:   plantingDate.AddDate(0, 0, 14+offset).Format("2006-01-02"),
			Stage:  "Establishment",
			Action: "Frequent light irrigation.",
			Notes:  "Onions have shallow roots and need water near the surface.",
		})
		reminders = append(reminders, Reminder{
			Date:   plantingDate.AddDate(0, 0, 60+offset).Format("2006-01-02"),
			Stage:  "Bulb Formation",
			Action: "Keep moisture consistent.",
			Notes:  "Bulb size depends on adequate water during this fast-growth phase.",
		})
	}

	return CropSchedule{
		CropName:  cropName,
		Reminders: reminders,
	}
}
