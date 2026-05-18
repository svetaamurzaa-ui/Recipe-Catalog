import json
import requests
from lxml import html
from typing import Optional, List, Any
import re
from models import Recipe, Ingredient

class RecipeParser:
    def __init__(self, timeout: int = 10):
        self.timeout = timeout
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'uk-UA,uk;q=0.9,en-US;q=0.8,en;q=0.7'
        })

    def extract_urls_from_sitemap(self, sitemap_url: str) -> List[str]:
        try:
            response = self.session.get(sitemap_url, timeout=self.timeout)
            if response.status_code == 200:
                urls = re.findall(r'<loc>(.*?)</loc>', response.text)
                return [u.strip() for u in urls if u.strip()]
            print(f"[ERROR] Sitemap HTTP {response.status_code} for {sitemap_url}")
            return []
        except Exception as e:
            print(f"[ERROR] Target sitemap processing aborted {sitemap_url}: {e}")
            return []

    def fetch_page(self, url: str) -> Optional[str]:
        try:
            response = self.session.get(url, timeout=self.timeout)
            if response.status_code == 200:
                response.encoding = 'utf-8'
                return response.text
            return None
        except Exception:
            return None

    def parse(self, url: str) -> Optional[Recipe]:
        html_content = self.fetch_page(url)
        if not html_content:
            return None
        
        try:
            tree = html.fromstring(html_content)
            tree.make_links_absolute(url)
            
            recipe = self._parse_json_ld(tree, url)
            if recipe:
                return recipe
            
            title = self._extract_title_fallback(tree)
            ingredients = self._extract_ingredients_fallback(tree)
            instructions = self._extract_instructions_fallback(tree)
            
            if title and ingredients:
                return Recipe(title=title, url=url, ingredients=ingredients, instructions=instructions)
            return None
        except Exception:
            return None

    def _find_recipe_node(self, data: Any) -> Optional[dict]:
        if isinstance(data, dict):
            type_field = data.get("@type")
            if type_field == "Recipe" or (isinstance(type_field, list) and "Recipe" in type_field):
                return data
            for value in data.values():
                node = self._find_recipe_node(value)
                if node: return node
        elif isinstance(data, list):
            for item in data:
                node = self._find_recipe_node(item)
                if node: return node
        return None

    def _parse_json_ld(self, tree, url: str) -> Optional[Recipe]:
        scripts = tree.xpath("//script[@type='application/ld+json']/text()")
        for script_text in scripts:
            try:
                data = json.loads(script_text)
                node = self._find_recipe_node(data)
                if not node:
                    continue
                
                title = node.get("name")
                raw_ings = node.get("recipeIngredient", []) or node.get("ingredients", []) or []
                
                ingredients = [self._parse_ingredient_text(i) for i in raw_ings if self._parse_ingredient_text(i)]
                
                raw_steps = node.get("recipeInstructions", []) or []
                instructions = []
                for step in raw_steps:
                    if isinstance(step, dict):
                        instructions.append(step.get("text", "").strip())
                    elif isinstance(step, str):
                        instructions.append(step.strip())
                
                prep_time = self._parse_iso_duration(node.get("prepTime", ""))
                cook_time = self._parse_iso_duration(node.get("cookTime", ""))
                
                yield_data = node.get("recipeYield", "1")
                servings = 1
                match = re.search(r'\d+', str(yield_data))
                if match:
                    servings = int(match.group())

                if title and ingredients:
                    return Recipe(
                        title=title, url=url, servings=servings,
                        prep_time=prep_time, cook_time=cook_time,
                        ingredients=ingredients, instructions=instructions
                    )
            except Exception:
                continue
        return None

    def _parse_iso_duration(self, duration_str: str) -> int:
        if not duration_str or not isinstance(duration_str, str):
            return 0
        match = re.search(r'PT(?:(\d+)H)?(?:(\d+)M)?', duration_str)
        if match:
            hours = int(match.group(1) or 0)
            minutes = int(match.group(2) or 0)
            return hours * 60 + minutes
        return 0

    def _parse_ingredient_text(self, text: str) -> Optional[Ingredient]:
        if not text or len(text.strip()) < 2:
            return None
        
        text = text.strip()
        quantity = 1.0
        qty_match = re.match(r'^([\d\s./]+)\s*', text)
        rest = text
        
        if qty_match:
            qty_str = qty_match.group(1).strip()
            try:
                if ' ' in qty_str: 
                    parts = qty_str.split()
                    whole = float(parts[0])
                    frac = parts[1]
                    if '/' in frac:
                        f_parts = frac.split('/')
                        quantity = whole + (float(f_parts[0]) / float(f_parts[1]))
                elif '/' in qty_str: 
                    parts = qty_str.split('/')
                    quantity = float(parts[0]) / float(parts[1])
                else:
                    quantity = float(qty_str)
                rest = text[qty_match.end():].strip()
            except Exception:
                quantity = 1.0

        notes = None
        notes_match = re.search(r'\((.*?)\)', rest)
        if notes_match:
            notes = notes_match.group(1).strip()
            rest = re.sub(r'\(.*?\)', '', rest).strip()

        words = rest.split(maxsplit=1)
        unit = "шт"
        name = rest
        
        if words:
            possible_unit = words[0].lower().rstrip('.')
            known_units = {
                "мл", "ml", "л", "l", "liter", "litre", "чашка", "cup", "cups", 
                "ст", "ч", "tbsp", "tsp", "teaspoon", "tablespoon", "g", "г", "pound", "clove", "cloves"
            }
            if possible_unit in known_units or possible_unit + "s" in known_units:
                unit = words[0]
                name = words[1] if len(words) > 1 else ""
            elif rest.lower().startswith("столова ложка"):
                unit = "столова ложка"
                name = rest[13:].strip()
            elif rest.lower().startswith("чайна ложка"):
                unit = "чайна ложка"
                name = rest[11:].strip()

        if not name:
            name = rest if rest else "інгредієнт"

        return Ingredient(name=name.strip(), quantity=round(quantity, 2), unit=unit, notes=notes)

    def _extract_title_fallback(self, tree) -> Optional[str]:
        selectors = ["//meta[@property='og:title']/@content", "//h1/text()"]
        for s in selectors:
            res = tree.xpath(s)
            if res: return res[0].strip()
        return None

    def _extract_ingredients_fallback(self, tree) -> List[Ingredient]:
        texts = tree.xpath("//li[contains(@class, 'ingredient')]//text()")
        return [self._parse_ingredient_text(t) for t in texts if t.strip() and self._parse_ingredient_text(t)]

    def _extract_instructions_fallback(self, tree) -> List[str]:
        texts = tree.xpath("//li[contains(@class, 'instruction')]//text()")
        return [t.strip() for t in texts if len(t.strip()) > 5]