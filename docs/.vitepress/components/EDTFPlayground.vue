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
        @click="input = example.edtf"
        class="example-btn"
        :class="{ active: input === example.edtf }"
      >
        {{ example.label }}
      </button>
    </div>

    <div class="playground-input">
      <label for="edtf-input">EDTF Input:</label>
      <input
        id="edtf-input"
        v-model="input"
        type="text"
        placeholder="Enter an EDTF string (e.g., 1985-04-12, 1984?, 199X)"
        @input="parseInput"
        class="edtf-input-field"
      />
    </div>

    <div v-if="result" class="playground-result">
      <div v-if="result.success" class="result-success">
        <h3>✓ Valid EDTF (Level {{ result.level }})</h3>

        <div class="result-section">
          <h4>Parsed Value</h4>
          <div class="result-grid">
            <div class="result-item">
              <span class="label">Type:</span>
              <span class="value">{{ result.value.type }}</span>
            </div>
            <div class="result-item">
              <span class="label">Level:</span>
              <span class="value">{{ result.level }}</span>
            </div>
            <div class="result-item">
              <span class="label">Precision:</span>
              <span class="value">{{ result.value.precision }}</span>
            </div>
            <div class="result-item">
              <span class="label">EDTF:</span>
              <span class="value code">{{ result.value.edtf }}</span>
            </div>
          </div>
        </div>

        <div v-if="isDate" class="result-section">
          <h4>Date Components</h4>
          <div class="result-grid">
            <div v-if="result.value.year !== undefined" class="result-item">
              <span class="label">Year:</span>
              <span class="value">{{ result.value.year }}</span>
            </div>
            <div v-if="result.value.month !== undefined" class="result-item">
              <span class="label">Month:</span>
              <span class="value">{{ result.value.month }}</span>
            </div>
            <div v-if="result.value.day !== undefined" class="result-item">
              <span class="label">Day:</span>
              <span class="value">{{ result.value.day }}</span>
            </div>
          </div>
        </div>

        <div v-if="hasQualification" class="result-section">
          <h4>Qualifications</h4>
          <div class="result-grid">
            <div v-if="result.value.qualification?.uncertain" class="result-item">
              <span class="label">Uncertain:</span>
              <span class="value badge">Yes</span>
            </div>
            <div v-if="result.value.qualification?.approximate" class="result-item">
              <span class="label">Approximate:</span>
              <span class="value badge">Yes</span>
            </div>
            <div v-if="result.value.qualification?.uncertainApproximate" class="result-item">
              <span class="label">Uncertain & Approximate:</span>
              <span class="value badge">Yes</span>
            </div>
          </div>

          <div v-if="hasPartialQualification" class="result-subsection">
            <h5>Partial Qualifications</h5>
            <div class="result-grid">
              <div v-if="result.value.yearQualification" class="result-item">
                <span class="label">Year:</span>
                <span class="value">{{ formatQualification(result.value.yearQualification) }}</span>
              </div>
              <div v-if="result.value.monthQualification" class="result-item">
                <span class="label">Month:</span>
                <span class="value">{{ formatQualification(result.value.monthQualification) }}</span>
              </div>
              <div v-if="result.value.dayQualification" class="result-item">
                <span class="label">Day:</span>
                <span class="value">{{ formatQualification(result.value.dayQualification) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="result-section">
          <h4>Date Range</h4>
          <div class="result-grid">
            <div class="result-item">
              <span class="label">Earliest (min):</span>
              <span class="value">{{ formatDate(result.value.min) }}</span>
            </div>
            <div class="result-item">
              <span class="label">Latest (max):</span>
              <span class="value">{{ formatDate(result.value.max) }}</span>
            </div>
          </div>
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

      <div v-else class="result-error">
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
import { ref, computed, onMounted } from 'vue';
import { parse, isEDTFDate, isEDTFInterval, isEDTFSeason, isEDTFSet, isEDTFList } from '@edtf-ts/core';

const input = ref('1985-04-12');
const result = ref<any>(null);

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

function parseInput() {
  if (!input.value.trim()) {
    result.value = null;
    return;
  }
  result.value = parse(input.value);
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

onMounted(() => {
  parseInput();
});
</script>

<style scoped>
.edtf-playground {
  margin: 2rem 0;
  padding: 2rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
}

.playground-header h2 {
  margin-top: 0;
  font-size: 1.5rem;
}

.playground-header p {
  color: var(--vp-c-text-2);
  margin-bottom: 1.5rem;
}

.playground-examples {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.example-btn {
  padding: 0.5rem 1rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  cursor: pointer;
  font-size: 0.875rem;
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
  padding: 0.75rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 1rem;
  font-family: var(--vp-font-family-mono);
}

.edtf-input-field:focus {
  outline: none;
  border-color: var(--vp-c-brand);
}

.playground-result {
  margin-top: 1.5rem;
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
  margin: 1.5rem 0;
  padding: 1rem;
  background: var(--vp-c-bg);
  border-radius: 4px;
}

.result-section h4 {
  margin-top: 0;
  margin-bottom: 1rem;
  font-size: 1.1rem;
  color: var(--vp-c-text-1);
}

.result-subsection {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--vp-c-divider);
}

.result-subsection h5 {
  margin-top: 0;
  margin-bottom: 0.75rem;
  font-size: 0.95rem;
  color: var(--vp-c-text-2);
}

.result-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.result-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.result-item .label {
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
  font-weight: 500;
}

.result-item .value {
  color: var(--vp-c-text-1);
  font-size: 1rem;
}

.result-item .value.code {
  font-family: var(--vp-font-family-mono);
  background: var(--vp-c-bg-soft);
  padding: 0.25rem 0.5rem;
  border-radius: 3px;
}

.result-item .value.badge {
  display: inline-block;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand);
  padding: 0.25rem 0.5rem;
  border-radius: 3px;
  font-size: 0.875rem;
}

.value-list {
  margin: 0;
  padding-left: 1.5rem;
}

.value-list li {
  font-family: var(--vp-font-family-mono);
  margin: 0.5rem 0;
}

.json-output {
  margin: 0;
  padding: 1rem;
  background: var(--vp-code-block-bg);
  border-radius: 4px;
  overflow-x: auto;
  font-size: 0.875rem;
}

.json-output code {
  color: var(--vp-code-block-color);
}

.error-item {
  padding: 1rem;
  background: var(--vp-c-bg);
  border-left: 3px solid var(--vp-c-red);
  margin: 1rem 0;
}

.error-code {
  font-family: var(--vp-font-family-mono);
  font-weight: 600;
  color: var(--vp-c-red);
  margin-bottom: 0.5rem;
}

.error-message {
  color: var(--vp-c-text-1);
  margin-bottom: 0.5rem;
}

.error-position {
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
}

@media (max-width: 640px) {
  .edtf-playground {
    padding: 1rem;
  }

  .result-grid {
    grid-template-columns: 1fr;
  }
}
</style>
