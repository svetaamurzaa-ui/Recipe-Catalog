import json
import re
from typing import Optional, Tuple, Dict
from pathlib import Path

class DensityDatabase:
    VOLUME_CONVERSIONS = {
        "мл": 1.0, "ml": 1.0, "л": 1000.0, "l": 1000.0, "liter": 1000.0,
        "чашка": 236.59, "cup": 236.59, "cups": 236.59,
        "столова ложка": 14.79, "tbsp": 14.79, "tablespoon": 14.79,
        "чайна ложка": 4.93, "tsp": 4.93, "teaspoon": 4.93
    }

    ENG_TO_UKR = {
        "water": "вода", "sugar": "цукор", "salt": "сіль (кухонна)",
        "milk": "молоко цільне", "flour": "борошно пшеничне", "cream": "вершки (рідкі)",
        "butter": "вершкове масло (розтоплене)", "sauce": "томатна паста",
        "tomato": "томатна паста", "garlic": "сіль (кухонна)",
        "sour cream": "сметана", "honey": "мед (рідкий)"
    }

    def __init__(self, file_path: Optional[str] = None):
        self.density_table: Dict[str, float] = {}
        self._load_density_from_js_file(file_path)

    def _load_density_from_js_file(self, file_path: Optional[str] = None) -> None:
        possible_paths = [
            Path(file_path) if file_path else None,
            Path("density.js"), Path("js/density.js"), Path("./density.js")
        ]
        
        js_file_path = None
        for path in possible_paths:
            if path and path.exists():
                js_file_path = path
                break

        if js_file_path is None:
            print("[WARN] File density.js not found. Running with empty database.")
            return

        try:
            with open(js_file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            match = re.search(r'\{.*\}', content, re.DOTALL)
            if not match:
                return

            json_str = match.group(0).replace("'", '"')
            json_str = re.sub(r',\s*([\]}])', r'\1', json_str) # Очищення trailing commas

            data = json.loads(json_str)
            self.density_table = {key.strip().lower(): float(value) for key, value in data.items()}
            print(f"[INFO] Connected density database: {len(self.density_table)} entries mapped.")
        except Exception as e:
            print(f"[ERROR] Parsing density database failed: {e}")
            self.density_table = {}

    def get_density(self, ingredient_name: str) -> Optional[float]:
        normalized_name = ingredient_name.strip().lower()
        if normalized_name in self.density_table:
            return self.density_table[normalized_name]
        
        for key in self.density_table:
            if key in normalized_name or normalized_name in key:
                return self.density_table[key]
        
        for eng_key, ukr_key in self.ENG_TO_UKR.items():
            if eng_key in normalized_name:
                return self.density_table.get(ukr_key)
        return None

    def convert_liters_to_grams(self, ingredient_name: str, liters: float) -> Tuple[Optional[float], str]:
        density = self.get_density(ingredient_name)
        if density is None:
            return None, "густину не знайдено"
        return liters * 1000 * density, "г"

    def convert_volume_to_mass(self, ingredient_name: str, quantity: float, unit: str) -> Tuple[Optional[float], str, str]:
        density = self.get_density(ingredient_name)
        if density is None:
            return None, unit, "(густину не знайдено)"

        normalized_unit = unit.strip().lower()
        ml_per_unit = self.VOLUME_CONVERSIONS.get(normalized_unit)

        if ml_per_unit is None and normalized_unit.endswith('s'):
            ml_per_unit = self.VOLUME_CONVERSIONS.get(normalized_unit[:-1])
            
        if ml_per_unit is None:
            return None, unit, "(невідома одиниця)"

        return (quantity * ml_per_unit * density), "г", ""