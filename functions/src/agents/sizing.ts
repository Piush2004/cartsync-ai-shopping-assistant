import { BodyProfile, SizeChart, SizingResult } from '../utils/types';

const MOCK_SIZE_CHARTS: Record<string, SizeChart> = {
  'dress': {
    'S': { chest: [82, 86], waist: [64, 68], hips: [90, 94] },
    'M': { chest: [88, 92], waist: [70, 74], hips: [96, 100] },
    'L': { chest: [94, 100], waist: [76, 82], hips: [102, 108] },
    'XL': { chest: [102, 108], waist: [84, 90], hips: [110, 116] }
  },
  'jacket': {
    'M': { chest: [96, 101], waist: [81, 86], hips: [96, 101] },
    'L': { chest: [102, 107], waist: [87, 92], hips: [102, 107] },
    'XL': { chest: [108, 113], waist: [93, 98], hips: [108, 113] }
  },
  'jeans': {
    '30': { chest: [0, 0], waist: [76, 78], hips: [92, 94] },
    '32': { chest: [0, 0], waist: [81, 83], hips: [97, 99] },
    '34': { chest: [0, 0], waist: [86, 88], hips: [102, 104] }
  },
  'kurta': {
    'M': { chest: [98, 102], waist: [90, 94], hips: [104, 108] },
    'L': { chest: [104, 108], waist: [96, 100], hips: [110, 114] },
    'XL': { chest: [110, 114], waist: [102, 106], hips: [116, 120] }
  }
};

export class SizingAgent {
  /**
   * Recommends a size based on user biometrics and the product category.
   */
  async recommend(userBody: BodyProfile, productId: string, category: string): Promise<SizingResult> {
    const chart = MOCK_SIZE_CHARTS[category.toLowerCase()] || MOCK_SIZE_CHARTS['dress'];
    
    let bestSize = '';
    let maxScore = -1;
    let alternativeSize = '';
    let bestMeasurements: SizingResult['measurements'] = {};

    for (const [size, ranges] of Object.entries(chart)) {
      let score = 0;
      let sizeMeasurements: SizingResult['measurements'] = {};
      
      const compare = (bodyVal: number, range: [number, number], name: string) => {
        if (range[0] === 0) return; // Skip N/A measurements
        const mid = (range[0] + range[1]) / 2;
        let fit = 'Perfect';
        if (bodyVal < range[0] - 2) fit = 'Loose';
        if (bodyVal > range[1] + 2) fit = 'Snug';
        
        if (fit === 'Perfect') score += 10;
        else if (bodyVal >= range[0] - 5 && bodyVal <= range[1] + 5) score += 5; // Acceptable

        sizeMeasurements[name] = { garment: mid, user: bodyVal, fit };
      };

      compare(userBody.chest, ranges.chest, 'Chest');
      compare(userBody.waist, ranges.waist, 'Waist');
      compare(userBody.hips, ranges.hips, 'Hips');

      if (score > maxScore) {
        maxScore = score;
        alternativeSize = bestSize; // Previous best is now alternative
        bestSize = size;
        bestMeasurements = sizeMeasurements;
      } else if (score === maxScore - 5) {
        alternativeSize = size;
      }
    }

    const maxPossibleScore = Object.keys(bestMeasurements).length * 10;
    const confidence = maxPossibleScore > 0 ? Math.round((maxScore / maxPossibleScore) * 100) : 0;

    return {
      recommendedSize: bestSize || 'Unknown',
      confidence,
      alternativeSize,
      measurements: bestMeasurements
    };
  }
}
