import assert from 'node:assert/strict';
import test from 'node:test';
import {
  analysisMeasurementSchema,
  buildAnalysisPrompt,
  deriveHarmonicPeakComparisons,
} from './index';

const baseMeasurement = {
  captureSource: 'microphone' as const,
  sampleRate: 48_000,
  fftSize: 4096 as const,
  frequencyResolutionHz: 48_000 / 4096,
  dominantFrequencyHz: 440.625,
  topPeaksHz: [440.625, 880.5],
  rmsLevel: 0.12,
  durationSeconds: 8.4,
};

test('accepts a valid base measurement when optional derived analysis is unavailable', () => {
  assert.deepEqual(
    analysisMeasurementSchema.parse(baseMeasurement),
    baseMeasurement,
  );

  const prompt = buildAnalysisPrompt(baseMeasurement, false, '');
  assert.match(prompt, /No derived signalFeatures were supplied/);
  assert.match(prompt, /No spectralMatrixAnalysis was supplied/);
  assert.doesNotMatch(prompt, /Deterministic ZionCore resonance profile/);
});

test('analysis prompt carries the strict boundaries required by the live quality gate', () => {
  const prompt = buildAnalysisPrompt(
    baseMeasurement,
    false,
    'Synthetic QA test data; not a field recording.',
    false,
  );

  assert.match(prompt, /Mandatory final report audit/i);
  assert.match(prompt, /review every field, not only the summary/i);
  assert.match(prompt, /Do not infer source distance or microphone proximity/i);
  assert.match(prompt, /A non-zero frequency difference is not exact/i);
  assert.match(prompt, /omit source candidates for synthetic or QA data/i);
  assert.match(prompt, /confidenceScope must explicitly limit confidence/i);
  assert.match(prompt, /qualitative, uncalibrated/i);
  assert.match(prompt, /Deterministic peak comparison/i);
});

test('calculates harmonic candidates from supplied peaks and FFT resolution', () => {
  assert.deepEqual(
    deriveHarmonicPeakComparisons(440.625, [440.625, 880.5, 900], 48_000 / 4096),
    [
      {
        measuredPeakHz: 880.5,
        nearestHarmonicNumber: 2,
        expectedFrequencyHz: 881.25,
        absoluteDifferenceHz: 0.75,
        withinFftResolution: true,
        exactWithinNumericalTolerance: false,
      },
      {
        measuredPeakHz: 900,
        nearestHarmonicNumber: 2,
        expectedFrequencyHz: 881.25,
        absoluteDifferenceHz: 18.75,
        withinFftResolution: false,
        exactWithinNumericalTolerance: false,
      },
    ],
  );
  assert.equal(
    deriveHarmonicPeakComparisons(440, [880], 11.7)[0]?.exactWithinNumericalTolerance,
    true,
  );
});

test('still validates the range of optional derived features when they are supplied', () => {
  const result = analysisMeasurementSchema.safeParse({
    ...baseMeasurement,
    signalFeatures: {
      spectralCentroidHz: 620,
      spectralFlatness: 0.12,
      spectralEntropy: 0.34,
      peakToMedianContrastDb: 28.4,
      rolloff85Hz: 1_800,
      harmonicity: 0.81,
      zeroCrossingRate: 0.018,
      dominantFrequencyStabilityHz: 1.4,
      dominantFrequencyDriftHz: 2.1,
      amplitudeVariationCoefficient: 0.08,
      temporalWindowSeconds: 5,
    },
  });
  assert.equal(result.success, true);

  const invalid = analysisMeasurementSchema.safeParse({
    ...baseMeasurement,
    signalFeatures: {
      spectralCentroidHz: 25_000,
      spectralFlatness: 0.12,
      spectralEntropy: 0.34,
      peakToMedianContrastDb: 28.4,
      rolloff85Hz: 1_800,
      harmonicity: 0.81,
      zeroCrossingRate: 0.018,
      dominantFrequencyStabilityHz: 1.4,
      dominantFrequencyDriftHz: 2.1,
      amplitudeVariationCoefficient: 0.08,
      temporalWindowSeconds: 5,
    },
  });
  assert.equal(invalid.success, false);
});
