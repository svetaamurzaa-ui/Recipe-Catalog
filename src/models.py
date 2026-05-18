from dataclasses import dataclass, field
from typing import List, Optional
from datetime import datetime

@dataclass
class Ingredient:
    name: str
    quantity: float
    unit: str
    notes: Optional[str] = None

    def scale(self, factor: float) -> 'Ingredient':
        return Ingredient(
            name=self.name,
            quantity=round(self.quantity * factor, 2),
            unit=self.unit,
            notes=self.notes
        )

    def __eq__(self, other) -> bool:
        if not isinstance(other, Ingredient):
            return False
        return self.name.lower() == other.name.lower()

    def __hash__(self) -> int:
        return hash(self.name.lower())

    def __str__(self) -> str:
        return f"{self.quantity} {self.unit} {self.name}" + (f" ({self.notes})" if self.notes else "")

@dataclass
class Recipe:
    title: str
    url: str
    servings: int = 1
    prep_time: int = 0
    cook_time: int = 0
    ingredients: List[Ingredient] = field(default_factory=list)
    instructions: List[str] = field(default_factory=list)
    tags: List[str] = field(default_factory=list)
    parsed_at: datetime = field(default_factory=datetime.now)

    @property
    def total_time(self) -> int:
        return self.prep_time + self.cook_time

    def to_dict(self) -> dict:
        return {
            "title": self.title,
            "url": self.url,
            "servings": self.servings,
            "prep_time": self.prep_time,
            "cook_time": self.cook_time,
            "total_time": self.total_time,
            "ingredients": [
                {"name": ing.name, "quantity": ing.quantity, "unit": ing.unit, "notes": ing.notes}
                for ing in self.ingredients
            ],
            "instructions": self.instructions,
            "tags": self.tags,
            "parsed_at": self.parsed_at.isoformat()
        }

    def __str__(self) -> str:
        result = f"{self.title}\n{'=' * 45}\n"
        result += f"Джерело: {self.url}\nПорцій: {self.servings}\n"
        result += f"Час: {self.prep_time}м + {self.cook_time}м = {self.total_time}м\n"
        result += f"Інгредієнти ({len(self.ingredients)}):\n"
        for i, ing in enumerate(self.ingredients, 1):
            result += f"{i}. {ing}\n"
        if self.instructions:
            result += f"\nІнструкції:\n"
            for i, instr in enumerate(self.instructions, 1):
                result += f"{i}. {instr}\n"
        return result

    def __len__(self) -> int:
        return len(self.ingredients)

    def __getitem__(self, index: int) -> Ingredient:
        return self.ingredients[index]

    def __contains__(self, ingredient_name: str) -> bool:
        return any(ing.name.lower() == ingredient_name.lower() for ing in self.ingredients)

    def __lt__(self, other) -> bool:
        if not isinstance(other, Recipe):
            return NotImplemented
        return self.total_time < other.total_time

    def __mul__(self, factor: float) -> 'Recipe':
        scaled_recipe = Recipe(
            title=self.title, url=self.url, servings=int(self.servings * factor),
            prep_time=self.prep_time, cook_time=self.cook_time,
            tags=self.tags.copy(), instructions=self.instructions.copy()
        )
        scaled_recipe.ingredients = [ing.scale(factor) for ing in self.ingredients]
        return scaled_recipe