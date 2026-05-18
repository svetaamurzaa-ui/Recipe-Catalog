// Підключаємо калькулятор Вельгана
import { convertVolumeToMass } from './logic.js';

// Знаходимо кнопку на сторінці і вішаємо на неї клік
document.getElementById('calc-button').addEventListener('click', () => {
    let volume = document.getElementById('volume-input').value;
    let ingredient = document.getElementById('ingredient-select').value;
    
    // Викликаємо функцію хлопців
    let result = convertVolumeToMass(volume, ingredient);
    
    // Виводимо на екран
    document.getElementById('result-text').innerText = result + " грамів";
});