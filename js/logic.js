import densityTable from './density.js';

export function convertVolumeToMass(volume, ingredient) {
    let rho = densityTable[ingredient] || 1; 
    
    return Math.round(volume * rho);
}