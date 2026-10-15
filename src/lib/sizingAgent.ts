export interface BiometricSheet {
  height: number; // in cm
  weight: number; // in kg
  chest: number;  // in inches
  waist: number;  // in inches
  gender: 'masculine' | 'feminine' | 'unisex';
}

export interface SizeChartEntry {
  size: string;
  chestMin: number;
  chestMax: number;
  waistMin: number;
  waistMax: number;
}

export interface SizePrediction {
  recommendedSize: string;
  confidence: 'high' | 'medium' | 'low';
  explanation: string;
  chestFit: string;
  waistFit: string;
}

/**
 * Sizing Agent prediction logic:
 * Maps biometric sheets against product size charts.
 */
export function predictSize(biometrics: BiometricSheet, sizeChart: SizeChartEntry[]): SizePrediction {
  if (!sizeChart || sizeChart.length === 0) {
    return {
      recommendedSize: 'One Size',
      confidence: 'low',
      explanation: 'No product size chart available for matching.',
      chestFit: 'Unknown',
      waistFit: 'Unknown'
    };
  }

  let bestSize = sizeChart[0].size;
  let highestScore = -1;
  let explanation = '';
  let bestChestFit = 'Unknown';
  let bestWaistFit = 'Unknown';
  let bestConfidence: 'high' | 'medium' | 'low' = 'low';

  for (const entry of sizeChart) {
    let score = 0;
    let chestFitText = '';
    let waistFitText = '';

    // 1. Chest Match
    if (biometrics.chest >= entry.chestMin && biometrics.chest <= entry.chestMax) {
      score += 5;
      chestFitText = 'Perfect Fit';
    } else if (biometrics.chest >= entry.chestMin - 1.5 && biometrics.chest <= entry.chestMax + 1.5) {
      score += 3;
      chestFitText = biometrics.chest < entry.chestMin ? 'Slightly Snug' : 'Slightly Loose';
    } else {
      score -= 2;
      chestFitText = biometrics.chest < entry.chestMin ? 'Too Tight' : 'Too Baggy';
    }

    // 2. Waist Match
    if (biometrics.waist >= entry.waistMin && biometrics.waist <= entry.waistMax) {
      score += 5;
      waistFitText = 'Perfect Fit';
    } else if (biometrics.waist >= entry.waistMin - 1.5 && biometrics.waist <= entry.waistMax + 1.5) {
      score += 3;
      waistFitText = biometrics.waist < entry.waistMin ? 'Slightly Snug' : 'Slightly Loose';
    } else {
      score -= 2;
      waistFitText = biometrics.waist < entry.waistMin ? 'Too Tight' : 'Too Baggy';
    }

    // Adjust for height/weight index (BMI indicators)
    const heightInMeters = biometrics.height / 100;
    const bmi = biometrics.weight / (heightInMeters * heightInMeters);
    
    // Sizing Up heuristic for taller users or higher BMIs
    if (biometrics.height > 185 && (entry.size === 'S' || entry.size === 'M')) {
      score -= 1; // might be too short in sleeve/body length
    }
    
    if (score > highestScore) {
      highestScore = score;
      bestSize = entry.size;
      bestChestFit = chestFitText;
      bestWaistFit = waistFitText;
      
      // Determine confidence
      if (score >= 9) {
        bestConfidence = 'high';
      } else if (score >= 5) {
        bestConfidence = 'medium';
      } else {
        bestConfidence = 'low';
      }
    }
  }

  // Generate explanation description
  if (bestConfidence === 'high') {
    explanation = `The ${bestSize} matches your biometrics perfectly. The chest and waist measurements lie right in the target zone.`;
  } else if (bestConfidence === 'medium') {
    explanation = `The ${bestSize} is recommended, but may fit slightly ${bestChestFit.toLowerCase()} around the chest and ${bestWaistFit.toLowerCase()} at the waist.`;
  } else {
    explanation = `We found a weak fit configuration. ${bestSize} is the closest match, but chest feels "${bestChestFit.toLowerCase()}" and waist feels "${bestWaistFit.toLowerCase()}". Consider sizing up/down depending on your style preference.`;
  }

  return {
    recommendedSize: bestSize,
    confidence: bestConfidence,
    explanation,
    chestFit: bestChestFit,
    waistFit: bestWaistFit
  };
}
