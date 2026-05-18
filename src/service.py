import os
import json
from typing import List, Optional
from concurrent.futures import ThreadPoolExecutor, as_completed
from models import Recipe
from parser import RecipeParser
from density import DensityDatabase

class RecipeService:
    def __init__(self, max_workers: int = 10, density_file: Optional[str] = None):
        self.parser = RecipeParser()
        self.density_db = DensityDatabase(density_file)
        self.recipes: List[Recipe] = []
        self.max_workers = max_workers

    def parse_recipe(self, url: str) -> Optional[Recipe]:
        recipe = self.parser.parse(url)
        if recipe:
            self._convert_units_in_recipe(recipe)
            self.recipes.append(recipe)
            return recipe
        return None

    def parse_multiple_recipes(self, urls: List[str]) -> List[Recipe]:
        parsed_list = []
        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            future_to_url = {executor.submit(self.parse_recipe, url): url for url in urls}
            for future in as_completed(future_to_url):
                try:
                    recipe = future.result()
                    if recipe:
                        parsed_list.append(recipe)
                        print(f"[INFO] Document compiled: '{recipe.title}'")
                except Exception:
                    pass
        return parsed_list

    def _convert_units_in_recipe(self, recipe: Recipe) -> None:
        for ing in recipe.ingredients:
            unit_lower = ing.unit.lower()
            
            if unit_lower in ["л", "літр", "l", "liter", "ltr"]:
                grams, _ = self.density_db.convert_liters_to_grams(ing.name, ing.quantity)
                if grams:
                    ing.quantity, ing.unit = round(grams, 2), "г"
            
            elif unit_lower in ["мл", "ml", "milliliter"]:
                grams, _, _ = self.density_db.convert_volume_to_mass(ing.name, ing.quantity, "мл")
                if grams:
                    ing.quantity, ing.unit = round(grams, 2), "г"
            
            elif unit_lower in ["чашка", "cup", "cups"]:
                grams, _, _ = self.density_db.convert_volume_to_mass(ing.name, ing.quantity, "чашка")
                if grams:
                    ing.quantity, ing.unit = round(grams, 2), "г"

            elif unit_lower in ["столова ложка", "tbsp", "tablespoon"]:
                grams, _, _ = self.density_db.convert_volume_to_mass(ing.name, ing.quantity, "столова ложка")
                if grams:
                    ing.quantity, ing.unit = round(grams, 2), "г"

            elif unit_lower in ["чайна ложка", "tsp", "teaspoon"]:
                grams, _, _ = self.density_db.convert_volume_to_mass(ing.name, ing.quantity, "чайна ложка")
                if grams:
                    ing.quantity, ing.unit = round(grams, 2), "г"

    def save_and_merge_to_json(self, filename: str) -> bool:
        existing_data = []
        
        if os.path.exists(filename):
            try:
                with open(filename, 'r', encoding='utf-8') as f:
                    existing_data = json.load(f)
                    if not isinstance(existing_data, list):
                        existing_data = []
            except Exception as e:
                print(f"[WARN] Failed to read existing database {filename}: {e}")
        
        new_records_count = 0
        for new_recipe in self.recipes:
            new_dict = new_recipe.to_dict()
            
            is_duplicate = False
            for existing in existing_data:
                if self._is_strict_duplicate(new_dict, existing):
                    is_duplicate = True
                    break
            
            if not is_duplicate:
                existing_data.append(new_dict)
                new_records_count += 1
        
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(existing_data, f, indent=2, ensure_ascii=False)
            print(f"[INFO] Sync complete. Added {new_records_count} unique items. Total database size: {len(existing_data)}")
            return True
        except Exception:
            return False

    def _is_strict_duplicate(self, r1: dict, r2: dict) -> bool:
        
        if r1.get("instructions") != r2.get("instructions"):
            return False
        
        ings1 = r1.get("ingredients", [])
        ings2 = r2.get("ingredients", [])
        if len(ings1) != len(ings2):
            return False
            
        # Поелементна перевірка параметрів кожного інгредієнта
        for i1, i2 in zip(ings1, ings2):
            if i1.get("name", "").lower() != i2.get("name", "").lower():
                return False
            if i1.get("quantity") != i2.get("quantity"):
                return False
            if i1.get("unit", "").lower() != i2.get("unit", "").lower():
                return False
        return True