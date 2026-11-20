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

const enrichedMeasurement = {
  ...baseMeasurement,
  signalFeatures: {
    spectralCentroidHz: 620,
    spectralFlatness: 0.12,
    spectralEntropy: 0.34,
    peakToMedianContrastDb: 28.4,
    rolloff85Hz: 1800,
    harmonicity: 0.81,
    zeroCrossingRate: 0.018,
    dominantFrequencyStabilityHz: 1.4,
    dominantFrequencyDriftHz: 2.1,
    amplitudeVariationCoefficient: 0.08,
    temporalWindowSeconds: 5,
  },
  spectralMatrixAnalysis: {
    status: 'sufficient' as const,
    frameCount: 8,
    bandLabels: ['0–4.8 kHz', '4.8–9.6 kHz', '9.6–14.4 kHz', '14.4–19.2 kHz', '19.2–24 kHz'],
    correlationMatrix: [
      [1, 0.72, -0.31, 0.08, -0.1],
      [0.72, 1, -0.12, 0.1, 0.04],
      [-0.31, -0.12, 1, -0.22, 0.13],
      [0.08, 0.1, -0.22, 1, 0.5],
      [-0.1, 0.04, 0.13, 0.5, 1],
    ],
    principalDirection: [0.62, 0.58, -0.36, 0.27, 0.28],
    principalVarianceShare: 0.48,
  },
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

  assert.match(prompt, /Evidence:/i);
  assert.match(prompt, /Do not infer loudness, gain, distance, or microphone proximity/i);
  assert.match(prompt, /Any non-zero harmonic difference is not exact/i);
  assert.match(prompt, /omit source candidates for synthetic\/QA data/i);
  assert.match(prompt, /Confidence and candidate confidence are qualitative/i);
  assert.match(prompt, /Deterministic peak comparison/i);
});

test('typical enriched prompts stay compact and add specialist context only when relevant', () => {
  const ordinary = buildAnalysisPrompt(enrichedMeasurement, false, '', false);
  assert.ok(ordinary.length <= 19_000, `Expected compact prompt; received ${ordinary.length} characters.`);
  assert.match(ordinary, /Confidence and candidate confidence are qualitative/i);
  assert.match(ordinary, /Any non-zero harmonic difference is not exact/i);
  assert.doesNotMatch(ordinary, /Astronomical and Cosmic Intelligence/);

  const astronomy = buildAnalysisPrompt(
    enrichedMeasurement,
    false,
    'Compare these observations with pulsar timing and radio astronomy methods.',
    false,
  );
  assert.match(astronomy, /Astronomical and Cosmic Intelligence/);

  const crossDomain = buildAnalysisPrompt(
    enrichedMeasurement,
    true,
    'Compare this animal recording with pulsar timing and radio astronomy, use the registered sensors, and provide a Shona devotional reflection.',
    false,
  );
  assert.ok(crossDomain.length <= 19_000, `Expected bounded cross-domain prompt; received ${crossDomain.length} characters.`);
  assert.match(crossDomain, /Biological and Animal Intelligence/);
  assert.match(crossDomain, /Astronomical and Cosmic Intelligence/);
  assert.match(crossDomain, /Spiritual, Devotional and Philosophical Intelligence/);
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
