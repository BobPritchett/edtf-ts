<template>
  <div class="edtf-playground">
    <div class="playground-header">
      <h2>Interactive EDTF Playground</h2>
      <p>Try parsing EDTF strings in real-time. Type or select an example below.</p>
    </div>

    <div class="playground-examples">
      <button
        v-for="example in examples"
        :key="example.edtf"
        @click="selectExample(example.edtf)"
        class="example-btn"
        :class="{ active: input === example.edtf }"
      >
        {{ example.label }}
      </button>
    </div>

    <div class="playground-inputs">
      <div class="input-column">
        <label for="edtf-input">EDTF Input</label>
        <input
          id="edtf-input"
          v-model="input"
          type="text"
          placeholder="1985-04-12, 1984?, 199X..."
          @input="onEdtfInput"
          class="edtf-input-field"
          :class="{ 'input-valid': result?.success, 'input-invalid': result && !result.success }"
        />
        <div class="input-status">
          <span v-if="result?.success" class="status-valid">✓ Valid EDTF</span>
          <span v-else-if="result && !result.success" class="status-invalid">✗ {{ result.errors[0]?.code }}</span>
        </div>
      </div>

      <div class="input-column">
        <label for="natural-input">Natural Language</label>
        <input
          id="natural-input"
          v-model="naturalInput"
          type="text"
          placeholder="January 12, 1940..."
          @input="onNaturalInput"
          class="edtf-input-field"
          :class="{ 'input-valid': naturalResult && naturalResult.length > 0, 'input-invalid': naturalError }"
        />
        <div class="input-status">
          <span v-if="naturalResult && naturalResult.length > 0" class="status-valid">
            ✓ {{ naturalResult[0].edtf }} ({{ Math.round(naturalResult[0].confidence * 100) }}%)
          </span>
          <span v-else-if="naturalError" class="status-invalid">✗ No valid parse</span>
        </div>
      </div>
    </div>

    <div class="format-options-section">
      <button
        class="format-options-toggle"
        @click="formatOptionsExpanded = !formatOptionsExpanded"
      >
        <span class="toggle-icon">{{ formatOptionsExpanded ? '▼' : '▶' }}</span>
        FormatOptions
      </button>

      <div v-if="formatOptionsExpanded" class="format-options-content">
        <div class="options-grid">
          <!-- includeQualifications -->
          <div class="option-item">
            <label class="option-label">
              <input
                type="checkbox"
                v-model="formatOptions.includeQualifications"
              />
              <span class="option-name">Include Qualifications</span>
            </label>
            <div class="option-description">Show uncertainty/approximation indicators (?, ~, %)</div>
          </div>

          <!-- showUnspecified -->
          <div class="option-item">
            <label class="option-label">
              <input
                type="checkbox"
                v-model="formatOptions.showUnspecified"
              />
              <span class="option-name">Show Unspecified</span>
            </label>
            <div class="option-description">Display unspecified digits as 'X' or replace with ranges</div>
          </div>

          <!-- dateStyle -->
          <div class="option-item option-item-inline">
            <label class="option-label-inline">
              <span class="option-name">Date Style</span>
              <select v-model="formatOptions.dateStyle" class="option-select">
                <option value="full">Full</option>
                <option value="long">Long</option>
                <option value="medium">Medium</option>
                <option value="short">Short</option>
              </select>
            </label>
          </div>

          <!-- locale -->
          <div class="option-item option-item-inline">
            <label class="option-label-inline">
              <span class="option-name">Locale</span>
              <input
                type="text"
                v-model="formatOptions.locale"
                class="option-input"
                placeholder="e.g., en-US, fr-FR"
              />
            </label>
          </div>

          <!-- era -->
          <div class="option-item option-item-inline">
            <label class="option-label-inline">
              <span class="option-name">Era Length</span>
              <select v-model="formatOptions.era" class="option-select">
                <option value="long">Long</option>
                <option value="short">Short</option>
                <option value="narrow">Narrow</option>
              </select>
            </label>
          </div>

          <!-- eraDisplay -->
          <div class="option-item option-item-inline">
            <label class="option-label-inline">
              <span class="option-name">Era Display</span>
              <select v-model="formatOptions.eraDisplay" class="option-select">
                <option value="auto">Auto</option>
                <option value="always">Always</option>
                <option value="never">Never</option>
              </select>
            </label>
          </div>

          <!-- eraNotation -->
          <div class="option-item option-item-inline">
            <label class="option-label-inline">
              <span class="option-name">Era Notation</span>
              <select v-model="formatOptions.eraNotation" class="option-select">
                <option value="bc-ad">BC/AD</option>
                <option value="bce-ce">BCE/CE</option>
              </select>
            </label>
          </div>
        </div>
      </div>
    </div>

    <div v-if="result?.success" class="playground-result">
      <div class="result-compact">
        <div class="result-row">
          <span class="row-label">Type</span>
          <code class="row-value">{{ result.value.type }}</code>
          <span class="row-label">Level</span>
          <code class="row-value">{{ result.level }}</code>
          <span class="row-label">Precision</span>
          <code class="row-value">{{ result.value.precision }}</code>
          <span class="row-label">EDTF</span>
          <code class="row-value">{{ result.value.edtf }}</code>
        </div>

        <div v-if="isDate && (result.value.year !== undefined || result.value.month !== undefined || result.value.day !== undefined)" class="result-row">
          <span class="row-label">Components</span>
          <code v-if="result.value.year !== undefined" class="row-value">Year: {{ result.value.year }}</code>
          <code v-if="result.value.month !== undefined" class="row-value">Month: {{ result.value.month }}</code>
          <code v-if="result.value.day !== undefined" class="row-value">Day: {{ result.value.day }}</code>
        </div>

        <div v-if="hasQualification" class="result-row">
          <span class="row-label">Qualifications</span>
          <code v-if="result.value.qualification?.uncertain" class="row-value badge-uncertain">Uncertain</code>
          <code v-if="result.value.qualification?.approximate" class="row-value badge-approx">Approximate</code>
          <code v-if="result.value.qualification?.uncertainApproximate" class="row-value badge-both">Both</code>
          <code v-if="result.value.yearQualification" class="row-value">Year: {{ formatQualification(result.value.yearQualification) }}</code>
          <code v-if="result.value.monthQualification" class="row-value">Month: {{ formatQualification(result.value.monthQualification) }}</code>
          <code v-if="result.value.dayQualification" class="row-value">Day: {{ formatQualification(result.value.dayQualification) }}</code>
        </div>

        <div class="result-row">
          <span class="row-label">Date Range</span>
          <span class="row-label-sub">Earliest</span>
          <code class="row-value">{{ formatDate(result.value.min) }}</code>
          <span class="row-label-sub">Latest</span>
          <code class="row-value">{{ formatDate(result.value.max) }}</code>
        </div>

        <div v-if="isInterval" class="result-section">
          <h4>Interval</h4>
          <div class="result-grid">
            <div class="result-item">
              <span class="label">Start:</span>
              <span class="value">{{ result.value.start?.edtf || 'Unknown' }}</span>
            </div>
            <div class="result-item">
              <span class="label">End:</span>
              <span class="value">{{ result.value.end?.edtf || 'Unknown' }}</span>
            </div>
          </div>
        </div>

        <div v-if="isSeason" class="result-section">
          <h4>Season</h4>
          <div class="result-grid">
            <div class="result-item">
              <span class="label">Year:</span>
              <span class="value">{{ result.value.year }}</span>
            </div>
            <div class="result-item">
              <span class="label">Season Code:</span>
              <span class="value">{{ result.value.season }} ({{ getSeasonName(result.value.season) }})</span>
            </div>
          </div>
        </div>

        <div v-if="isSetOrList" class="result-section">
          <h4>{{ result.value.type === 'Set' ? 'Set Members (one of)' : 'List Members (all of)' }}</h4>
          <ul class="value-list">
            <li v-for="(val, idx) in result.value.values" :key="idx">
              {{ val.edtf }}
            </li>
          </ul>
        </div>

        <div class="result-section">
          <h4>JSON Output</h4>
          <pre class="json-output"><code>{{ JSON.stringify(result.value.toJSON(), null, 2) }}</code></pre>
        </div>
      </div>
    </div>

    <div v-else-if="result && !result.success" class="playground-result">
      <div class="result-error">
        <h3>✗ Invalid EDTF</h3>
        <div v-for="(error, idx) in result.errors" :key="idx" class="error-item">
          <div class="error-code">{{ error.code }}</div>
          <div class="error-message">{{ error.message }}</div>
          <div v-if="error.position" class="error-position">
            Position: {{ error.position.start }} - {{ error.position.end }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { parse, isEDTFDate, isEDTFInterval, isEDTFSeason, isEDTFSet, isEDTFList } from '@edtf-ts/core';
import { formatHuman } from '@edtf-ts/utils';
import type { FormatOptions } from '@edtf-ts/utils';

const input = ref('1985-04-12');
const result = ref<any>(null);
const naturalInput = ref('');
const naturalResult = ref<any>(null);
const naturalError = ref<string | null>(null);

// FormatOptions state - always reset to defaults on component mount
const formatOptionsExpanded = ref(false);
const formatOptions = ref<FormatOptions>({
  includeQualifications: true,
  showUnspecified: false,
  dateStyle: 'full',
  locale: 'en-US',
  era: 'short',
  eraDisplay: 'auto',
  eraNotation: 'bc-ad',
});

const examples = [
  { label: 'Simple Date', edtf: '1985-04-12' },
  { label: 'Year & Month', edtf: '1985-04' },
  { label: 'Year Only', edtf: '1985' },
  { label: 'Uncertain', edtf: '1984?' },
  { label: 'Approximate', edtf: '1950~' },
  { label: 'Both', edtf: '2004-06%' },
  { label: 'Decade', edtf: '199X' },
  { label: 'Century', edtf: '19XX' },
  { label: 'Interval', edtf: '1964/2008' },
  { label: 'Season', edtf: '2001-21' },
  { label: 'Set', edtf: '[1667,1668,1670]' },
  { label: 'Partial Qual', edtf: '?2004-06-~11' },
];

const isDate = computed(() => result.value?.success && isEDTFDate(result.value.value));
const isInterval = computed(() => result.value?.success && isEDTFInterval(result.value.value));
const isSeason = computed(() => result.value?.success && isEDTFSeason(result.value.value));
const isSetOrList = computed(() => result.value?.success && (isEDTFSet(result.value.value) || isEDTFList(result.value.value)));

const hasQualification = computed(() => {
  if (!isDate.value) return false;
  const val = result.value.value;
  return val.qualification || val.yearQualification || val.monthQualification || val.dayQualification;
});

const hasPartialQualification = computed(() => {
  if (!isDate.value) return false;
  const val = result.value.value;
  return val.yearQualification || val.monthQualification || val.dayQualification;
});

const formattedEDTF = computed(() => {
  if (!result.value?.success) return '';
  try {
    return formatHuman(result.value.value, formatOptions.value);
  } catch {
    return result.value.value.edtf;
  }
});

let isUpdatingFromEdtf = false;
let isUpdatingFromNatural = false;

// Watch for format options changes and update natural language output
watch(formatOptions, () => {
  if (result.value?.success && !isUpdatingFromNatural) {
    isUpdatingFromEdtf = true;
    naturalInput.value = formattedEDTF.value;
    parseNaturalInput();
    isUpdatingFromEdtf = false;
  }
}, { deep: true });

function onEdtfInput() {
  if (isUpdatingFromNatural) return;

  if (!input.value.trim()) {
    result.value = null;
    naturalInput.value = '';
    return;
  }

  result.value = parse(input.value);

  // Update natural input with formatted version when EDTF is valid
  if (result.value.success) {
    isUpdatingFromEdtf = true;
    naturalInput.value = formattedEDTF.value;
    parseNaturalInput();
    isUpdatingFromEdtf = false;
  }
}

async function onNaturalInput() {
  if (isUpdatingFromEdtf) return;

  if (!naturalInput.value.trim()) {
    naturalResult.value = null;
    naturalError.value = null;
    return;
  }

  try {
    // Dynamic import for natural language parsing
    const { parseNatural } = await import('@edtf-ts/natural');
    naturalError.value = null;
    naturalResult.value = parseNatural(naturalInput.value);

    // Update EDTF input with best parse result
    if (naturalResult.value && naturalResult.value.length > 0) {
      isUpdatingFromNatural = true;
      input.value = naturalResult.value[0].edtf;
      result.value = parse(input.value);
      isUpdatingFromNatural = false;
    }
  } catch (error: any) {
    naturalError.value = error.message || 'Failed to parse natural language input';
    naturalResult.value = null;
  }
}

async function parseNaturalInput() {
  if (!naturalInput.value.trim()) {
    naturalResult.value = null;
    naturalError.value = null;
    return;
  }

  try {
    // Dynamic import for natural language parsing
    const { parseNatural } = await import('@edtf-ts/natural');
    naturalError.value = null;
    naturalResult.value = parseNatural(naturalInput.value);
  } catch (error: any) {
    naturalError.value = error.message || 'Failed to parse natural language input';
    naturalResult.value = null;
  }
}

function formatDate(date: Date): string {
  return date.toISOString();
}

function formatQualification(qual: any): string {
  const parts = [];
  if (qual.uncertain) parts.push('uncertain');
  if (qual.approximate) parts.push('approximate');
  if (qual.uncertainApproximate) parts.push('uncertain & approximate');
  return parts.join(', ');
}

function getSeasonName(code: number): string {
  const seasons: Record<number, string> = {
    21: 'Spring', 22: 'Summer', 23: 'Autumn', 24: 'Winter',
    25: 'Spring (Southern)', 26: 'Summer (Southern)',
    27: 'Autumn (Southern)', 28: 'Winter (Southern)',
    29: 'Q1', 30: 'Q2', 31: 'Q3', 32: 'Q4',
    33: 'Quadrimester 1', 34: 'Quadrimester 2', 35: 'Quadrimester 3',
    37: 'Semester 1', 38: 'Semester 2',
  };
  return seasons[code] || `Season ${code}`;
}

function selectExample(edtf: string) {
  input.value = edtf;
  onEdtfInput();
}

onMounted(() => {
  onEdtfInput();
});
</script>

<style scoped>
.edtf-playground {
  margin: 1rem 0;
  padding: 1rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg-soft);
}

.playground-header h2 {
  margin-top: 0;
  margin-bottom: 0.25rem;
  font-size: 1.3rem;
}

.playground-header p {
  color: var(--vp-c-text-2);
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.playground-examples {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 1rem;
}

.example-btn {
  padding: 0.4rem 0.8rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s;
}

.example-btn:hover {
  border-color: var(--vp-c-brand);
  color: var(--vp-c-brand);
}

.example-btn.active {
  background: var(--vp-c-brand);
  border-color: var(--vp-c-brand);
  color: white;
}

.playground-inputs {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.input-column {
  flex: 1;
  min-width: 0;
}

.input-column label {
  display: block;
  margin-bottom: 0.35rem;
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--vp-c-text-1);
}

.input-status {
  margin-top: 0.35rem;
  min-height: 1.2rem;
  font-size: 0.8rem;
}

.status-valid {
  color: var(--vp-c-green);
  font-weight: 500;
}

.status-invalid {
  color: var(--vp-c-red);
  font-weight: 500;
}

.input-valid {
  border-color: var(--vp-c-green) !important;
}

.input-invalid {
  border-color: var(--vp-c-red) !important;
}

.playground-input {
  margin-bottom: 1.5rem;
}

.playground-input label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.edtf-input-field {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 0.9rem;
  font-family: var(--vp-font-family-mono);
}

.edtf-input-field:focus {
  outline: none;
  border-color: var(--vp-c-brand);
}

.formatted-output {
  margin-top: 0.75rem;
  padding: 0.75rem;
  background: var(--vp-c-bg);
  border-radius: 4px;
  border-left: 3px solid var(--vp-c-brand);
}

.formatted-label {
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
  font-weight: 600;
  margin-right: 0.5rem;
}

.formatted-value {
  color: var(--vp-c-text-1);
  font-size: 1rem;
}

.natural-results {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.natural-result-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.75rem;
  background: var(--vp-c-bg-soft);
  border-radius: 4px;
  border: 1px solid var(--vp-c-divider);
}

.natural-edtf {
  font-family: var(--vp-font-family-mono);
  font-weight: 600;
  color: var(--vp-c-brand);
  font-size: 1rem;
}

.natural-confidence {
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
}

.natural-interpretation {
  font-size: 0.875rem;
  color: var(--vp-c-text-1);
  font-style: italic;
}

.more-results {
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
  text-align: center;
  padding: 0.5rem;
}

.natural-error {
  color: var(--vp-c-red);
  font-size: 0.875rem;
}

.result-compact {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.result-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: var(--vp-c-bg);
  border-radius: 4px;
}

.row-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--vp-c-text-2);
}

.row-label-sub {
  font-size: 0.8rem;
  color: var(--vp-c-text-2);
  margin-left: 0.35rem;
}

.row-value {
  font-family: var(--vp-font-family-mono);
  font-size: 0.8rem;
  background: var(--vp-c-bg-soft);
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  color: var(--vp-c-text-1);
}

.badge-uncertain {
  background: var(--vp-c-yellow-soft);
  color: var(--vp-c-yellow);
}

.badge-approx {
  background: var(--vp-c-blue-soft);
  color: var(--vp-c-blue);
}

.badge-both {
  background: var(--vp-c-purple-soft);
  color: var(--vp-c-purple);
}

.playground-result {
  margin-top: 1rem;
}

.result-success h3 {
  color: var(--vp-c-green);
  margin-top: 0;
}

.result-error h3 {
  color: var(--vp-c-red);
  margin-top: 0;
}

.result-section {
  margin: 0.75rem 0;
  padding: 0.75rem;
  background: var(--vp-c-bg);
  border-radius: 4px;
}

.result-section h4 {
  margin-top: 0;
  margin-bottom: 0.6rem;
  font-size: 1rem;
  color: var(--vp-c-text-1);
}

.result-subsection {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--vp-c-divider);
}

.result-subsection h5 {
  margin-top: 0;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
}

.result-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.75rem;
}

.result-item {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.result-item .label {
  font-size: 0.8rem;
  color: var(--vp-c-text-2);
  font-weight: 500;
}

.result-item .value {
  color: var(--vp-c-text-1);
  font-size: 0.9rem;
}

.result-item .value.code {
  font-family: var(--vp-font-family-mono);
  background: var(--vp-c-bg-soft);
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
}

.result-item .value.badge {
  display: inline-block;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand);
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  font-size: 0.8rem;
}

.value-list {
  margin: 0;
  padding-left: 1.25rem;
}

.value-list li {
  font-family: var(--vp-font-family-mono);
  margin: 0.35rem 0;
  font-size: 0.85rem;
}

.json-output {
  margin: 0;
  padding: 0.75rem;
  background: var(--vp-code-block-bg);
  border-radius: 4px;
  overflow-x: auto;
  font-size: 0.8rem;
}

.json-output code {
  color: var(--vp-code-block-color);
}

.error-item {
  padding: 0.75rem;
  background: var(--vp-c-bg);
  border-left: 3px solid var(--vp-c-red);
  margin: 0.75rem 0;
}

.error-code {
  font-family: var(--vp-font-family-mono);
  font-weight: 600;
  font-size: 0.85rem;
  color: var(--vp-c-red);
  margin-bottom: 0.35rem;
}

.error-message {
  color: var(--vp-c-text-1);
  font-size: 0.85rem;
  margin-bottom: 0.35rem;
}

.error-position {
  font-size: 0.8rem;
  color: var(--vp-c-text-2);
}

.format-options-section {
  margin-bottom: 1rem;
  padding: 0.75rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background: var(--vp-c-bg-soft);
}

.format-options-toggle {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  width: 100%;
  padding: 0;
  background: none;
  border: none;
  color: var(--vp-c-text-1);
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.2s;
}

.format-options-toggle:hover {
  color: var(--vp-c-brand);
}

.toggle-icon {
  font-size: 0.75rem;
  color: var(--vp-c-text-2);
}

.format-options-content {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--vp-c-divider);
}

.options-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 0.75rem;
  row-gap: 0.5rem;
}

.option-item {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.option-item-inline {
  flex-direction: row;
  align-items: center;
}

.option-label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  cursor: pointer;
  color: var(--vp-c-text-1);
}

.option-label-inline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  width: 100%;
  color: var(--vp-c-text-1);
}

.option-label input[type="checkbox"] {
  width: 1rem;
  height: 1rem;
  cursor: pointer;
}

.option-name {
  font-weight: 600;
  font-size: 0.85rem;
  white-space: nowrap;
}

.option-select,
.option-input {
  width: 100%;
  padding: 0.4rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 0.85rem;
  font-family: inherit;
}

.option-label-inline .option-select,
.option-label-inline .option-input {
  flex: 1;
  min-width: 0;
}

.option-select:focus,
.option-input:focus {
  outline: none;
  border-color: var(--vp-c-brand);
}

.option-description {
  font-size: 0.75rem;
  color: var(--vp-c-text-2);
  line-height: 1.3;
}

@media (max-width: 640px) {
  .edtf-playground {
    padding: 0.75rem;
  }

  .playground-inputs {
    flex-direction: column;
    gap: 0.5rem;
  }

  .result-grid {
    grid-template-columns: 1fr;
  }

  .result-row {
    gap: 0.4rem;
  }

  .options-grid {
    grid-template-columns: 1fr;
  }
}
</style>
