<template>
  <div id="all-locales-results" class="all-locales" aria-live="polite">
    <p v-if="!value" class="roundtrip-note">Enter a valid EDTF value to compare locales.</p>
    <p v-else-if="loading" role="status" class="roundtrip-note">Rendering other locales…</p>
    <template v-else>
      <div
        v-for="row in rows"
        :key="row.locale"
        class="locale-roundtrip-row"
        role="group"
        :aria-label="row.label"
      >
        <div class="roundtrip-edtf">
          <span
            v-if="row.candidates.length"
            :class="row.candidates[0].matches ? 'match' : 'mismatch'"
            :title="candidateSummary(row)"
          >
            <span aria-hidden="true">{{ row.candidates[0].matches ? '✓' : '✗' }}</span>
            <span class="sr-only">{{
              row.candidates[0].matches
                ? 'Match after compacting adjacent years:'
                : 'Does not match:'
            }}</span>
            <code>{{ row.candidates[0].edtf }}</code>
            <span
              v-if="row.candidates.length > 1"
              class="alternative-count"
              :aria-label="row.candidates.length - 1 + ' alternative interpretations'"
              >(+{{ row.candidates.length - 1 }})</span
            >
          </span>
          <span v-else class="mismatch" :title="row.parseError"
            ><span aria-hidden="true">✗</span> {{ row.parseError }}</span
          >
        </div>
        <div class="roundtrip-natural">
          <span class="roundtrip-arrow" aria-hidden="true">⇐</span>
          <span class="locale-tag" :title="row.label">({{ row.locale }})</span>
          <span v-if="row.renderError" class="mismatch">{{ row.renderError }}</span>
          <span v-else class="localized-rendering">{{ row.rendered }}</span>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { compactYearRanges, formatHuman, type EDTFBase, type FormatOptions } from '@edtf-ts/core';

const props = defineProps<{
  value: EDTFBase | null;
  locale: string;
  locales: { value: string; label: string }[];
  formatOptions: FormatOptions;
}>();

interface LocaleRoundTrip {
  locale: string;
  label: string;
  rendered: string;
  candidates: { edtf: string; matches: boolean }[];
  renderError?: string;
  parseError?: string;
}

const loading = ref(false);
const rows = ref<LocaleRoundTrip[]>([]);

function candidateSummary(row: LocaleRoundTrip): string {
  return row.candidates
    .map(
      (candidate, index) =>
        (index === 0 ? 'Preferred: ' : 'Alternative: ') +
        candidate.edtf +
        (candidate.matches ? ' — match after compacting adjacent years' : ' — does not match')
    )
    .join('\n');
}

watch(
  [() => props.value, () => props.locale, () => props.locales, () => props.formatOptions],
  async (_, __, onCleanup) => {
    let cancelled = false;
    onCleanup(() => {
      cancelled = true;
    });
    rows.value = [];
    loading.value = false;
    if (!props.value) return;

    const source = props.value;
    const compactSource = compactYearRanges(source);
    const options = { ...props.formatOptions };
    let activeLocale = props.locale;
    try {
      activeLocale = new Intl.Locale(activeLocale).toString();
    } catch {
      /* Invalid active locale does not prevent testing the presets. */
    }
    const otherLocales = props.locales.filter((locale) => locale.value !== activeLocale);
    loading.value = true;

    // Load the natural parser only when locale comparison is enabled, and discard stale work
    // if the source, options, or selected locale changes while the import loads.
    let parseNatural: typeof import('@edtf-ts/natural').parseNatural;
    try {
      ({ parseNatural } = await import('@edtf-ts/natural'));
    } catch {
      if (cancelled) return;
      rows.value = otherLocales.map((locale) => ({
        locale: locale.value,
        label: locale.label,
        rendered: '',
        candidates: [],
        renderError: 'Unable to load the locale comparison.',
        parseError: 'Unable to load the natural-language parser.',
      }));
      loading.value = false;
      return;
    }
    if (cancelled) return;

    rows.value = otherLocales.map((locale) => {
      const row: LocaleRoundTrip = {
        locale: locale.value,
        label: locale.label,
        rendered: '',
        candidates: [],
      };
      try {
        row.rendered = formatHuman(source, { ...options, locale: locale.value });
      } catch {
        row.renderError = 'Could not render this value.';
        row.parseError = 'No rendering to parse.';
        return row;
      }
      try {
        row.candidates = parseNatural(row.rendered, {
          locale: locale.value,
          returnAllResults: true,
        }).map((candidate) => ({
          edtf: candidate.edtf,
          matches: compactYearRanges(candidate.parsed) === compactSource,
        }));
        if (!row.candidates.length) row.parseError = 'No valid parse.';
      } catch {
        row.parseError = 'Could not parse';
      }
      return row;
    });
    loading.value = false;
  },
  { deep: true, immediate: true }
);
</script>

<style scoped>
.all-locales {
  margin: -0.5rem 0 1rem;
}
.roundtrip-note {
  margin: 0;
  color: var(--vp-c-text-2);
  font-size: 0.8rem;
}
.locale-roundtrip-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 0.75rem;
  padding: 0.12rem 0;
  line-height: 1.5;
}
.roundtrip-edtf {
  padding-right: 0.6rem;
  overflow-wrap: anywhere;
}
.roundtrip-edtf code {
  color: inherit;
  background: transparent;
  padding: 0 0.2rem;
}
.roundtrip-natural {
  position: relative;
  display: flex;
  align-items: baseline;
  gap: 0.55rem;
  min-width: 0;
}
.roundtrip-arrow {
  position: absolute;
  left: -1.15rem;
  color: var(--vp-c-text-2);
  font-size: 0.8rem;
}
.locale-tag {
  color: var(--vp-c-text-2);
  font-size: 0.8rem;
  flex-shrink: 0;
}
.localized-rendering {
  overflow-wrap: anywhere;
  min-width: 0;
}
.alternative-count {
  color: var(--vp-c-text-2);
  font-size: 0.75rem;
  cursor: help;
}
.match {
  color: var(--vp-c-green);
}
.mismatch {
  color: var(--vp-c-red);
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}
@media (max-width: 640px) {
  .locale-roundtrip-row {
    grid-template-columns: minmax(0, 1fr);
    gap: 0.15rem;
    padding: 0.35rem 0;
  }
  .roundtrip-natural {
    grid-row: 1;
  }
  .roundtrip-arrow {
    display: none;
  }
}
</style>
