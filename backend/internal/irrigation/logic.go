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
func GetSchedule(cropName string, plantingDate time.Time, region string, lang string) CropSchedule {
	var reminders []Reminder

	// Region offset (days) - Simple regional variation simulation
	offset := 0
	if region == "Karakalpakstan" || region == "Khorezm" {
		offset = -2
	} else if region == "Mountainous" {
		offset = 3
	}

	isUz := lang == "uz"

	switch cropName {
	case "Wheat":
		reminders = append(reminders, Reminder{
			Date:   plantingDate.AddDate(0, 0, 7+offset).Format("2006-01-02"),
			Stage:  term(isUz, "Emergence", "Unib chiqish"),
			Action: term(isUz, "Initial irrigation to establish roots.", "Ildiz otishi uchun dastlabki sug'orish."),
			Notes:  term(isUz, "Light watering ensures seeds sprout evenly. Watch for winter pests.", "Yengil sug'orish urug'larning tekis unib chiqishini ta'minlaydi. Qishki zararkunandalarni kuzating."),
		})
		reminders = append(reminders, Reminder{
			Date:   plantingDate.AddDate(0, 0, 28+offset).Format("2006-01-02"),
			Stage:  term(isUz, "Tillering", "Tuplash"),
			Action: term(isUz, "Increased water needed for stem growth.", "Poya o'sishi uchun ko'proq suv kerak."),
			Notes:  term(isUz, "Stems are developing. Apply nitrogen fertilizer if needed before watering.", "Poyalar rivojlanmoqda. Sug'orishdan oldin azotli o'g'it bering."),
		})
		reminders = append(reminders, Reminder{
			Date:   plantingDate.AddDate(0, 0, 60+offset).Format("2006-01-02"),
			Stage:  term(isUz, "Flowering", "Gullash"),
			Action: term(isUz, "Critical: peak water demand.", "Muhim: suvga eng yuqori talab."),
			Notes:  term(isUz, "Water stress now reduces grain number. Check for powdery mildew signs.", "Suv yetishmasligi don sonini kamaytiradi. Un shudring kasalligini tekshiring."),
		})

	case "Cotton":
		reminders = append(reminders, Reminder{
			Date:   plantingDate.AddDate(0, 0, 8+offset).Format("2006-01-02"),
			Stage:  term(isUz, "Germination", "Urug'lanish"),
			Action: term(isUz, "Light frequent irrigation (3-4 days).", "Tez-tez yengil sug'orish (3-4 kun)."),
			Notes:  term(isUz, "Cotton seeds need warm, moist soil to emerge. Check for crusting.", "Paxta urug'lari unib chiqishi uchun iliq va nam tuproq kerak. Qatqaloq bo'lishini oldini oling."),
		})
		reminders = append(reminders, Reminder{
			Date:   plantingDate.AddDate(0, 0, 25+offset).Format("2006-01-02"),
			Stage:  term(isUz, "Seedling", "Ko'chat"),
			Action: term(isUz, "Moderate watering; establish roots.", "O'rtacha sug'orish; ildizni mustahkamlash."),
			Notes:  term(isUz, "Monitor for aphids and early-season pests. Avoid waterlogging.", "Shira va erta mavsumiy zararkunandalarni nazorat qiling. Suv bosishidan saqlaning."),
		})
		reminders = append(reminders, Reminder{
			Date:   plantingDate.AddDate(0, 0, 45+offset).Format("2006-01-02"),
			Stage:  term(isUz, "Squaring (Bloom)", "G'unchalash"),
			Action: term(isUz, "Increase frequency; maintain moisture.", "Davriylikni oshiring; namlikni saqlang."),
			Notes:  term(isUz, "First flower buds forming. Consistent water prevents 'square drop'.", "Birinchi g'unchalar shakllanmoqda. Doimiy suv g'uncha to'kilishini oldini oladi."),
		})
		reminders = append(reminders, Reminder{
			Date:   plantingDate.AddDate(0, 0, 75+offset).Format("2006-01-02"),
			Stage:  term(isUz, "Boll Development", "Ko'sak rivojlanishi"),
			Action: term(isUz, "Deep watering every 5-7 days.", "Har 5-7 kunda chuqur sug'orish."),
			Notes:  term(isUz, "Fiber quality is determined now. Peak water demand phase.", "Tolaning sifati hozir belgilanadi. Suvga eng yuqori talab davri."),
		})
		reminders = append(reminders, Reminder{
			Date:   plantingDate.AddDate(0, 0, 110+offset).Format("2006-01-02"),
			Stage:  term(isUz, "Boll Maturation", "Ko'sak pishishi"),
			Action: term(isUz, "Stop irrigation.", "Sug'orishni to'xtatish."),
			Notes:  term(isUz, "Stop watering once bolls begin to open to allow drying.", "Ko'saklar ochilishni boshlaganda quritish uchun sug'orishni to'xtating."),
		})

	case "Rice":
		reminders = append(reminders, Reminder{
			Date:   plantingDate.AddDate(0, 0, 1+offset).Format("2006-01-02"),
			Stage:  term(isUz, "Establishment", "O'rnashish"),
			Action: term(isUz, "Maintain shallow flood (2-3cm).", "Sayoz suv sathini saqlang (2-3sm)."),
			Notes:  term(isUz, "Keep soil saturated for seedling emergence. Check for waterweeds.", "Urug' unib chiqishi uchun tuproqni to'yingan holda saqlang. Suv o'tlarini tekshiring."),
		})
		reminders = append(reminders, Reminder{
			Date:   plantingDate.AddDate(0, 0, 30+offset).Format("2006-01-02"),
			Stage:  term(isUz, "Tillering", "Tuplash"),
			Action: term(isUz, "Increase flood depth (5-10cm).", "Suv sathini oshiring (5-10sm)."),
			Notes:  term(isUz, "Critical phase for stem development. Maintain consistent water level.", "Poya rivojlanishi uchun muhim bosqich. Doimiy suv sathini saqlang."),
		})
		reminders = append(reminders, Reminder{
			Date:   plantingDate.AddDate(0, 0, 80+offset).Format("2006-01-02"),
			Stage:  term(isUz, "Flowering", "Gullash"),
			Action: term(isUz, "Maintain maximum flood depth.", "Maksimal suv sathini saqlang."),
			Notes:  term(isUz, "Rice is most sensitive to water stress now. Avoid any drainage.", "Sholi hozir suv yetishmasligiga juda sezgir. Suvni quritib yubormang."),
		})
		reminders = append(reminders, Reminder{
			Date:   plantingDate.AddDate(0, 0, 115+offset).Format("2006-01-02"),
			Stage:  term(isUz, "Ripening", "Pishish"),
			Action: term(isUz, "Drain field 2 weeks before harvest.", "Yig'im-terimdan 2 hafta oldin maydonni quriting."),
			Notes:  term(isUz, "Gradual drainage allows soil to firm up for machinery/harvesting.", "Asta-sekin quritish texnika ishlashi uchun tuproqni qotiradi."),
		})

	case "Tomato":
		reminders = append(reminders, Reminder{
			Date:   plantingDate.AddDate(0, 0, 4+offset).Format("2006-01-02"),
			Stage:  term(isUz, "Establishment", "O'rnashish"),
			Action: term(isUz, "Light frequent irrigation.", "Tez-tez yengil sug'orish."),
			Notes:  term(isUz, "Prevent roots from drying out. Consider light mulch for moisture retention.", "Ildizlar qurib qolishini oldini oling. Namlikni saqlash uchun mulchalashni ko'rib chiqing."),
		})
		reminders = append(reminders, Reminder{
			Date:   plantingDate.AddDate(0, 0, 30+offset).Format("2006-01-02"),
			Stage:  term(isUz, "Flowering & Fruit Set", "Gullash va Meva tugish"),
			Action: term(isUz, "Consistent moisture; avoid fluctuations.", "Doimiy namlik; o'zgarishlardan saqlaning."),
			Notes:  term(isUz, "Watering twice a week. Prevents blossom end rot. Check for leaf curl.", "Haftada ikki marta sug'orish. Meva uchi chirishini oldini oladi. Barg burishishini tekshiring."),
		})
		reminders = append(reminders, Reminder{
			Date:   plantingDate.AddDate(0, 0, 60+offset).Format("2006-01-02"),
			Stage:  term(isUz, "Ripening", "Pishish"),
			Action: term(isUz, "Maintain deep watering.", "Chuqur sug'orishni davom eting."),
			Notes:  term(isUz, "Regular watering keeps fruits succulent and prevents cracking.", "Muntazam sug'orish mevalarni suvli qiladi va yorilishni oldini oladi."),
		})

	case "Maize":
		reminders = append(reminders, Reminder{
			Date:   plantingDate.AddDate(0, 0, 5+offset).Format("2006-01-02"),
			Stage:  term(isUz, "Germination", "Urug'lanish"),
			Action: term(isUz, "Uniform soil moisture.", "Bir xil tuproq namligi."),
			Notes:  term(isUz, "Critical for uniform emergence. Watch for wireworms in the soil.", "Bir xil unib chiqish uchun muhim. Tuproqdagi simqurtlarni kuzating."),
		})
		reminders = append(reminders, Reminder{
			Date:   plantingDate.AddDate(0, 0, 55+offset).Format("2006-01-02"),
			Stage:  term(isUz, "Pollination (Tasseling)", "Changlanish (Popuklash)"),
			Action: term(isUz, "High water demand; irrigation is vital.", "Suvga yuqori talab; sug'orish juda muhim."),
			Notes:  term(isUz, "Water stress during silking causes immediate yield loss.", "Changlanish davrida suv yetishmasligi hosilning keskin kamayishiga olib keladi."),
		})

	case "Potato":
		reminders = append(reminders, Reminder{
			Date:   plantingDate.AddDate(0, 0, 20+offset).Format("2006-01-02"),
			Stage:  term(isUz, "Sprouting", "Nish otish"),
			Action: term(isUz, "Deep moisture; no saturation.", "Chuqur namlik; botqoqlanishsiz."),
			Notes:  term(isUz, "Check for Colorado Beetle larvae. Keep ridges moist.", "Kolorado qo'ng'izi lichinkalarini tekshiring. Egatlarni nam saqlang."),
		})
		reminders = append(reminders, Reminder{
			Date:   plantingDate.AddDate(0, 0, 45+offset).Format("2006-01-02"),
			Stage:  term(isUz, "Tuber Bulking", "Tugunak kattalashishi"),
			Action: term(isUz, "Consistent moisture every 4-6 days.", "Har 4-6 kunda doimiy namlik."),
			Notes:  term(isUz, "Watering ensures tuber size uniformity. Check for late blight.", "Sug'orish tugunak hajmining bir xilligini ta'minlaydi. Fitoftorozni tekshiring."),
		})

	case "Carrot":
		reminders = append(reminders, Reminder{
			Date:   plantingDate.AddDate(0, 0, 5+offset).Format("2006-01-02"),
			Stage:  term(isUz, "Germination", "Urug'lanish"),
			Action: term(isUz, "Fine misting every 2 days.", "Har 2 kunda yupqa sepish."),
			Notes:  term(isUz, "Carrot seeds are small and surface-planted; they dry out quickly.", "Sabzi urug'lari kichik va yuzaki ekiladi; ular tez quriydi."),
		})
		reminders = append(reminders, Reminder{
			Date:   plantingDate.AddDate(0, 0, 40+offset).Format("2006-01-02"),
			Stage:  term(isUz, "Root Expansion", "Ildiz kengayishi"),
			Action: term(isUz, "Deep watering twice a week.", "Haftada ikki marta chuqur sug'orish."),
			Notes:  term(isUz, "Promotes long, straight growth of the taproot.", "O'q ildizining uzun va to'g'ri o'sishiga yordam beradi."),
		})

	case "Onion":
		reminders = append(reminders, Reminder{
			Date:   plantingDate.AddDate(0, 0, 14+offset).Format("2006-01-02"),
			Stage:  term(isUz, "Establishment", "O'rnashish"),
			Action: term(isUz, "Frequent light irrigation.", "Tez-tez yengil sug'orish."),
			Notes:  term(isUz, "Onions have shallow roots and need water near the surface.", "Piyoz ildizlari sayoz bo'ladi va sirt yaqinida suvga muhtoj."),
		})
		reminders = append(reminders, Reminder{
			Date:   plantingDate.AddDate(0, 0, 60+offset).Format("2006-01-02"),
			Stage:  term(isUz, "Bulb Formation", "Bosh bog'lash"),
			Action: term(isUz, "Keep moisture consistent.", "Namlikni bir xil saqlang."),
			Notes:  term(isUz, "Bulb size depends on adequate water during this fast-growth phase.", "Bosh hajmi ushbu tez o'sish bosqichida yetarli suvga bog'liq."),
		})
	}

	return CropSchedule{
		CropName:  cropName,
		Reminders: reminders,
	}
}

func term(isUz bool, en, uz string) string {
	if isUz {
		return uz
	}
	return en
}
