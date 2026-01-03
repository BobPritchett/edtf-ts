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
          <span v-if="result.value.isBoundsClamped" class="row-label-sub warning">
            Extended year (beyond JavaScript Date range)
          </span>
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

      <!-- Second EDTF input for comparison -->
      <div class="comparison-section">
        <h3>Compare with Another EDTF</h3>
        <p class="comparison-description">Enter a second EDTF value to compare temporal relationships using Allen's interval algebra.</p>

        <div class="playground-inputs">
          <div class="input-column">
            <label for="edtf-input-2">EDTF Input (Second Value)</label>
            <input
              id="edtf-input-2"
              v-model="input2"
              type="text"
              placeholder="1990, 2000-05, [1995,1998]..."
              @input="onEdtfInput2"
              class="edtf-input-field"
              :class="{ 'input-valid': result2?.success, 'input-invalid': result2 && !result2.success }"
            />
            <div class="input-status">
              <span v-if="result2?.success" class="status-valid">✓ Valid EDTF</span>
              <span v-else-if="result2 && !result2.success" class="status-invalid">✗ {{ result2.errors[0]?.code }}</span>
            </div>
          </div>

          <div class="input-column">
            <label for="natural-input-2">Natural Language (Second Value)</label>
            <input
              id="natural-input-2"
              v-model="naturalInput2"
              type="text"
              placeholder="December 1995..."
              @input="onNaturalInput2"
              class="edtf-input-field"
              :class="{ 'input-valid': naturalResult2 && naturalResult2.length > 0, 'input-invalid': naturalError2 }"
            />
            <div class="input-status">
              <span v-if="naturalResult2 && naturalResult2.length > 0" class="status-valid">
                ✓ {{ naturalResult2[0].edtf }} ({{ Math.round(naturalResult2[0].confidence * 100) }}%)
              </span>
              <span v-else-if="naturalError2" class="status-invalid">✗ No valid parse</span>
            </div>
          </div>
        </div>

        <!-- Comparison Results -->
        <div v-if="result2?.success && comparisonResult" class="comparison-results">
          <h4>Allen Relation Results</h4>
          <p class="comparison-note">
            Comparing <code class="inline-code">{{ result.value.edtf }}</code> to <code class="inline-code">{{ result2.value.edtf }}</code>
          </p>
          <div v-if="comparisonBounds" class="bounds-display">
            <div class="bounds-line">
              <span class="bounds-label">{{ result.value.edtf }}:</span>
              <span class="bounds-values">
                sMin={{ formatBound(comparisonBounds.a.display.sMin) }}
                sMax={{ formatBound(comparisonBounds.a.display.sMax) }}
                eMin={{ formatBound(comparisonBounds.a.display.eMin) }}
                eMax={{ formatBound(comparisonBounds.a.display.eMax) }}
                <span v-if="comparisonBounds.a.display.isConvexHull" class="convex-hull-note">
                  (convex hull of {{ comparisonBounds.a.display.memberCount }} members)
                </span>
              </span>
            </div>
            <div class="bounds-line">
              <span class="bounds-label">{{ result2.value.edtf }}:</span>
              <span class="bounds-values">
                sMin={{ formatBound(comparisonBounds.b.display.sMin) }}
                sMax={{ formatBound(comparisonBounds.b.display.sMax) }}
                eMin={{ formatBound(comparisonBounds.b.display.eMin) }}
                eMax={{ formatBound(comparisonBounds.b.display.eMax) }}
                <span v-if="comparisonBounds.b.display.isConvexHull" class="convex-hull-note">
                  (convex hull of {{ comparisonBounds.b.display.memberCount }} members)
                </span>
              </span>
            </div>
          </div>

          <div class="relations-grid">
            <!-- Base Allen Relations -->
            <div class="relation-group">
              <h5>Base Relations</h5>
              <div class="relation-item" :class="getRelationClass(comparisonResult.before)">
                <span class="relation-name">before</span>
                <span class="relation-value">{{ comparisonResult.before }}</span>
              </div>
              <div class="relation-item" :class="getRelationClass(comparisonResult.after)">
                <span class="relation-name">after</span>
                <span class="relation-value">{{ comparisonResult.after }}</span>
              </div>
              <div class="relation-item" :class="getRelationClass(comparisonResult.meets)">
                <span class="relation-name">meets</span>
                <span class="relation-value">{{ comparisonResult.meets }}</span>
              </div>
              <div class="relation-item" :class="getRelationClass(comparisonResult.metBy)">
                <span class="relation-name">metBy</span>
                <span class="relation-value">{{ comparisonResult.metBy }}</span>
              </div>
              <div class="relation-item" :class="getRelationClass(comparisonResult.overlaps)">
                <span class="relation-name">overlaps</span>
                <span class="relation-value">{{ comparisonResult.overlaps }}</span>
              </div>
              <div class="relation-item" :class="getRelationClass(comparisonResult.overlappedBy)">
                <span class="relation-name">overlappedBy</span>
                <span class="relation-value">{{ comparisonResult.overlappedBy }}</span>
              </div>
              <div class="relation-item" :class="getRelationClass(comparisonResult.starts)">
                <span class="relation-name">starts</span>
                <span class="relation-value">{{ comparisonResult.starts }}</span>
              </div>
              <div class="relation-item" :class="getRelationClass(comparisonResult.startedBy)">
                <span class="relation-name">startedBy</span>
                <span class="relation-value">{{ comparisonResult.startedBy }}</span>
              </div>
              <div class="relation-item" :class="getRelationClass(comparisonResult.during)">
                <span class="relation-name">during</span>
                <span class="relation-value">{{ comparisonResult.during }}</span>
              </div>
              <div class="relation-item" :class="getRelationClass(comparisonResult.contains)">
                <span class="relation-name">contains</span>
                <span class="relation-value">{{ comparisonResult.contains }}</span>
              </div>
              <div class="relation-item" :class="getRelationClass(comparisonResult.finishes)">
                <span class="relation-name">finishes</span>
                <span class="relation-value">{{ comparisonResult.finishes }}</span>
              </div>
              <div class="relation-item" :class="getRelationClass(comparisonResult.finishedBy)">
                <span class="relation-name">finishedBy</span>
                <span class="relation-value">{{ comparisonResult.finishedBy }}</span>
              </div>
              <div class="relation-item" :class="getRelationClass(comparisonResult.equals)">
                <span class="relation-name">equals</span>
                <span class="relation-value">{{ comparisonResult.equals }}</span>
              </div>
            </div>

            <!-- Derived Relations -->
            <div class="relation-group">
              <h5>Derived Relations</h5>
              <div class="relation-item" :class="getRelationClass(comparisonResult.intersects)">
                <span class="relation-name">intersects</span>
                <span class="relation-value">{{ comparisonResult.intersects }}</span>
              </div>
              <div class="relation-item" :class="getRelationClass(comparisonResult.disjoint)">
                <span class="relation-name">disjoint</span>
                <span class="relation-value">{{ comparisonResult.disjoint }}</span>
              </div>
              <div class="relation-item" :class="getRelationClass(comparisonResult.touches)">
                <span class="relation-name">touches</span>
                <span class="relation-value">{{ comparisonResult.touches }}</span>
              </div>
              <div class="relation-item" :class="getRelationClass(comparisonResult.duringOrEqual)">
                <span class="relation-name">duringOrEqual</span>
                <span class="relation-value">{{ comparisonResult.duringOrEqual }}</span>
              </div>
              <div class="relation-item" :class="getRelationClass(comparisonResult.containsOrEqual)">
                <span class="relation-name">containsOrEqual</span>
                <span class="relation-value">{{ comparisonResult.containsOrEqual }}</span>
              </div>
            </div>
          </div>

          <div class="legend">
            <h5>Legend</h5>
            <div class="legend-items">
              <span class="legend-item truth-yes"><span class="legend-badge">YES</span> Definitely true</span>
              <span class="legend-item truth-no"><span class="legend-badge">NO</span> Definitely false</span>
              <span class="legend-item truth-maybe"><span class="legend-badge">MAYBE</span> Could be true</span>
              <span class="legend-item truth-unknown"><span class="legend-badge">UNKNOWN</span> Cannot determine</span>
            </div>
          </div>
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

    <!-- Age and Birthdate Section -->
    <div class="age-birthday-section">
      <h2>Age and Birthdate</h2>
      <p>Parse age expressions and birthdates into EDTF intervals, then render them as human-readable strings.</p>
      <p class="current-date-note">All calculations use today's date: <strong>{{ formattedCurrentDate }}</strong></p>

      <div class="age-examples">
        <button
          v-for="example in ageExamples"
          :key="example.input"
          @click="selectAgeExample(example.input)"
          class="example-btn"
          :class="{ active: ageInput === example.input }"
        >
          {{ example.label }}
        </button>
      </div>

      <div class="playground-inputs">
        <div class="input-column">
          <label for="age-input">Age / Birthday Input</label>
          <input
            id="age-input"
            v-model="ageInput"
            type="text"
            placeholder="20 yo, early 30s, March 15th birthday..."
            @input="onAgeInput"
            class="edtf-input-field"
            :class="{ 'input-valid': ageParseResult, 'input-invalid': ageParseError }"
          />
          <div class="input-status">
            <span v-if="ageParseResult" class="status-valid">
              ✓ {{ ageParseResult.edtf }} ({{ Math.round(ageParseResult.confidence * 100) }}%)
            </span>
            <span v-else-if="ageParseError" class="status-invalid">✗ {{ ageParseError }}</span>
          </div>
        </div>

        <div class="input-column">
          <label for="age-edtf-input">EDTF (for rendering)</label>
          <input
            id="age-edtf-input"
            v-model="ageEdtfInput"
            type="text"
            placeholder="?2004-?06-?02/?2005-?06-?01"
            @input="onAgeEdtfInput"
            class="edtf-input-field"
            :class="{ 'input-valid': ageRenderResult, 'input-invalid': ageRenderError }"
          />
          <div class="input-status">
            <span v-if="ageRenderResult" class="status-valid">✓ Valid EDTF</span>
            <span v-else-if="ageRenderError" class="status-invalid">✗ {{ ageRenderError }}</span>
          </div>
        </div>
      </div>

      <!-- Age Format Options -->
      <div class="format-options-section">
        <button
          class="format-options-toggle"
          @click="ageOptionsExpanded = !ageOptionsExpanded"
        >
          <span class="toggle-icon">{{ ageOptionsExpanded ? '▼' : '▶' }}</span>
          Rendering Options
        </button>

        <div v-if="ageOptionsExpanded" class="format-options-content">
          <div class="options-grid">
            <div class="option-item option-item-inline">
              <label class="option-label-inline">
                <span class="option-name">Age Style</span>
                <select v-model="ageFormatOptions.ageStyle" class="option-select">
                  <option value="vocabulary">Vocabulary (early 20s, teenager)</option>
                  <option value="numeric">Numeric (20-23 years old)</option>
                </select>
              </label>
            </div>

            <div class="option-item option-item-inline">
              <label class="option-label-inline">
                <span class="option-name">Age Length</span>
                <select v-model="ageFormatOptions.ageLength" class="option-select">
                  <option value="long">Long (20 years old)</option>
                  <option value="medium">Medium (20 y/o)</option>
                  <option value="short">Short (20yo)</option>
                </select>
              </label>
            </div>

            <div class="option-item option-item-inline">
              <label class="option-label-inline">
                <span class="option-name">Format</span>
                <select v-model="ageFormatOptions.format" class="option-select">
                  <option value="full">Full (age + birthday)</option>
                  <option value="age-only">Age Only</option>
                  <option value="birthday-only">Birthday Only</option>
                </select>
              </label>
            </div>

            <div class="option-item option-item-inline">
              <label class="option-label-inline">
                <span class="option-name">Month Format</span>
                <select v-model="ageFormatOptions.month" class="option-select">
                  <option value="long">Long (March)</option>
                  <option value="short">Short (Mar)</option>
                  <option value="narrow">Narrow (M)</option>
                  <option value="numeric">Numeric (3)</option>
                </select>
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- Parse Result -->
      <div v-if="ageParseResult" class="age-result-section">
        <h4>Parse Result</h4>
        <div class="result-row">
          <span class="row-label">EDTF</span>
          <code class="row-value">{{ ageParseResult.edtf }}</code>
          <span class="row-label">Type</span>
          <code class="row-value">{{ ageParseResult.type }}</code>
          <span class="row-label">Confidence</span>
          <code class="row-value">{{ Math.round(ageParseResult.confidence * 100) }}%</code>
        </div>
        <div class="result-row">
          <span class="row-label">Interpretation</span>
          <span class="row-value interpretation">{{ ageParseResult.interpretation }}</span>
        </div>
        <div v-if="ageParseResult.ageRange" class="result-row">
          <span class="row-label">Age Range</span>
          <code class="row-value">{{ formatAgeRange(ageParseResult.ageRange) }}</code>
        </div>
        <div v-if="ageParseResult.birthdayKnown" class="result-row">
          <span class="row-label">Birthday Known</span>
          <code class="row-value" :class="{ 'badge-valid': ageParseResult.birthdayKnown.month }">
            Month: {{ ageParseResult.birthdayKnown.month ? 'Yes' : 'No' }}
          </code>
          <code class="row-value" :class="{ 'badge-valid': ageParseResult.birthdayKnown.day }">
            Day: {{ ageParseResult.birthdayKnown.day ? 'Yes' : 'No' }}
          </code>
        </div>
      </div>

      <!-- Render Result -->
      <div v-if="ageRenderResult" class="age-result-section">
        <h4>Render Result</h4>
        <div class="render-output">
          <div class="render-main">{{ ageRenderResult.formatted }}</div>
        </div>
        <div class="result-row">
          <span class="row-label">Age</span>
          <code class="row-value">{{ ageRenderResult.age }}</code>
          <span class="row-label">Birthday</span>
          <code class="row-value">{{ ageRenderResult.birthday || '(unknown)' }}</code>
        </div>
        <div class="result-row">
          <span class="row-label">Age Range</span>
          <code class="row-value">{{ formatAgeRange(ageRenderResult.ageRange) }}</code>
          <span class="row-label">Birthday Known</span>
          <code class="row-value">
            Month: {{ ageRenderResult.birthdayKnown.month ? 'Yes' : 'No' }},
            Day: {{ ageRenderResult.birthdayKnown.day ? 'Yes' : 'No' }}
          </code>
        </div>
        <div v-if="ageRenderResult.qualifier" class="result-row">
          <span class="row-label">Qualifier</span>
          <code class="row-value badge-uncertain">{{ ageRenderResult.qualifier }}</code>
        </div>

        <!-- All format variations -->
        <div class="format-variations">
          <h5>Format Variations</h5>
          <div class="variations-grid">
            <div class="variation-item">
              <span class="variation-label">Vocabulary + Long</span>
              <span class="variation-value">{{ ageVariations.vocabLong }}</span>
            </div>
            <div class="variation-item">
              <span class="variation-label">Vocabulary + Medium</span>
              <span class="variation-value">{{ ageVariations.vocabMedium }}</span>
            </div>
            <div class="variation-item">
              <span class="variation-label">Vocabulary + Short</span>
              <span class="variation-value">{{ ageVariations.vocabShort }}</span>
            </div>
            <div class="variation-item">
              <span class="variation-label">Numeric + Long</span>
              <span class="variation-value">{{ ageVariations.numericLong }}</span>
            </div>
            <div class="variation-item">
              <span class="variation-label">Numeric + Medium</span>
              <span class="variation-value">{{ ageVariations.numericMedium }}</span>
            </div>
            <div class="variation-item">
              <span class="variation-label">Numeric + Short</span>
              <span class="variation-value">{{ ageVariations.numericShort }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { parse, isEDTFDate, isEDTFInterval, isEDTFSeason, isEDTFSet, isEDTFList } from '@edtf-ts';
import { formatHuman } from '@edtf-ts';
import type { FormatOptions } from '@edtf-ts';

const input = ref('1985-04-12');
const result = ref<any>(null);
const naturalInput = ref('');
const naturalResult = ref<any>(null);
const naturalError = ref<string | null>(null);

// Second EDTF input for comparison
const input2 = ref('1990');
const result2 = ref<any>(null);
const naturalInput2 = ref('');
const naturalResult2 = ref<any>(null);
const naturalError2 = ref<string | null>(null);
const comparisonResult = ref<any>(null);
const comparisonBounds = ref<any>(null);

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

// Age and Birthday section state
const ageInput = ref('20 yo');
const ageEdtfInput = ref('');
const ageParseResult = ref<any>(null);
const ageParseError = ref<string | null>(null);
const ageRenderResult = ref<any>(null);
const ageRenderError = ref<string | null>(null);
const ageOptionsExpanded = ref(false);
const ageFormatOptions = ref({
  ageStyle: 'vocabulary' as 'vocabulary' | 'numeric',
  ageLength: 'long' as 'short' | 'medium' | 'long',
  format: 'full' as 'full' | 'age-only' | 'birthday-only',
  month: 'long' as 'numeric' | '2-digit' | 'long' | 'short' | 'narrow',
});

// Current date for age calculations (updated on mount)
const currentDate = ref(new Date());
const formattedCurrentDate = computed(() => {
  return currentDate.value.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
});

const ageExamples = [
  { label: '20 yo', input: '20 yo' },
  { label: 'Early 30s', input: 'early 30s' },
  { label: 'Teenager', input: 'teenager' },
  { label: 'Senior', input: 'senior' },
  { label: '20 + March bday', input: '20 yo, March birthday' },
  { label: '20 + Mar 15', input: '20 yo, birthday 3/15' },
  { label: 'Mar 15 bday only', input: 'March 15th birthday' },
  { label: 'Born 1990', input: 'born 1990' },
  { label: 'Born c. 1950', input: 'born circa 1950' },
  { label: '6 months', input: '6 months old' },
];

// Computed variations for all format combinations
const ageVariations = computed(() => {
  if (!ageEdtfInput.value) return {};
  try {
    return {
      vocabLong: renderAgeBirthdaySync(ageEdtfInput.value, { ageStyle: 'vocabulary', ageLength: 'long', currentDate: currentDate.value }),
      vocabMedium: renderAgeBirthdaySync(ageEdtfInput.value, { ageStyle: 'vocabulary', ageLength: 'medium', currentDate: currentDate.value }),
      vocabShort: renderAgeBirthdaySync(ageEdtfInput.value, { ageStyle: 'vocabulary', ageLength: 'short', currentDate: currentDate.value }),
      numericLong: renderAgeBirthdaySync(ageEdtfInput.value, { ageStyle: 'numeric', ageLength: 'long', currentDate: currentDate.value }),
      numericMedium: renderAgeBirthdaySync(ageEdtfInput.value, { ageStyle: 'numeric', ageLength: 'medium', currentDate: currentDate.value }),
      numericShort: renderAgeBirthdaySync(ageEdtfInput.value, { ageStyle: 'numeric', ageLength: 'short', currentDate: currentDate.value }),
    };
  } catch {
    return {};
  }
});

// Synchronous helper for computed
let renderAgeBirthdayFn: any = null;
function renderAgeBirthdaySync(edtf: string, options: any): string {
  if (!renderAgeBirthdayFn) return '';
  try {
    const result = renderAgeBirthdayFn(edtf, options);
    return result.formatted;
  } catch {
    return '(error)';
  }
}

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

// Watch for changes in first result and trigger comparison
watch(result, () => {
  if (result.value?.success && result2.value?.success) {
    performComparison();
  }
});

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
  // Check if the date is at the clamped boundaries (extended year range)
  const minMs = -8640000000000000;
  const maxMs = 8640000000000000;
  const time = date.getTime();

  if (time === minMs) {
    return '< ~-270,000 (clamped)';
  }
  if (time === maxMs) {
    return '> ~270,000 (clamped)';
  }

  // Check if the Date is valid
  if (isNaN(time)) {
    return 'Invalid date';
  }

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
    33: 'Quarter 1', 34: 'Quarter 2', 35: 'Quarter 3', 36: 'Quarter 4',
    37: 'Quadrimester 1', 38: 'Quadrimester 2', 39: 'Quadrimester 3',
    40: 'Semestral 1', 41: 'Semestral 2',
  };
  return seasons[code] || `Season ${code}`;
}

function onEdtfInput2() {
  if (isUpdatingFromNatural) return;

  if (!input2.value.trim()) {
    result2.value = null;
    naturalInput2.value = '';
    comparisonResult.value = null;
    return;
  }

  result2.value = parse(input2.value);

  // Update natural input with formatted version when EDTF is valid
  if (result2.value.success) {
    isUpdatingFromEdtf = true;
    try {
      naturalInput2.value = formatHuman(result2.value.value, formatOptions.value);
    } catch {
      naturalInput2.value = result2.value.value.edtf;
    }
    parseNaturalInput2();
    isUpdatingFromEdtf = false;

    // Perform comparison if first value is also valid
    if (result.value?.success) {
      performComparison();
    }
  } else {
    comparisonResult.value = null;
  }
}

async function onNaturalInput2() {
  if (isUpdatingFromEdtf) return;

  if (!naturalInput2.value.trim()) {
    naturalResult2.value = null;
    naturalError2.value = null;
    return;
  }

  try {
    const { parseNatural } = await import('@edtf-ts/natural');
    naturalError2.value = null;
    naturalResult2.value = parseNatural(naturalInput2.value);

    if (naturalResult2.value && naturalResult2.value.length > 0) {
      isUpdatingFromNatural = true;
      input2.value = naturalResult2.value[0].edtf;
      result2.value = parse(input2.value);
      isUpdatingFromNatural = false;

      // Perform comparison
      if (result.value?.success && result2.value?.success) {
        performComparison();
      }
    }
  } catch (error: any) {
    naturalError2.value = error.message || 'Failed to parse natural language input';
    naturalResult2.value = null;
  }
}

async function parseNaturalInput2() {
  if (!naturalInput2.value.trim()) {
    naturalResult2.value = null;
    naturalError2.value = null;
    return;
  }

  try {
    const { parseNatural } = await import('@edtf-ts/natural');
    naturalError2.value = null;
    naturalResult2.value = parseNatural(naturalInput2.value);
  } catch (error: any) {
    naturalError2.value = error.message || 'Failed to parse natural language input';
    naturalResult2.value = null;
  }
}

async function performComparison() {
  if (!result.value?.success || !result2.value?.success) {
    comparisonResult.value = null;
    comparisonBounds.value = null;
    return;
  }

  try {
    // Dynamic import for comparison functions
    const compareModule = await import('@edtf-ts');

    // Get normalized bounds for display
    const normA = compareModule.normalize(result.value.value);
    const normB = compareModule.normalize(result2.value.value);

    // Store all members and computed bounds for display
    comparisonBounds.value = {
      a: {
        members: normA.members,
        listMode: normA.listMode,
        // For display: show first member if single, or convex hull bounds if multiple
        display: normA.members.length === 1 ? normA.members[0] : computeConvexHull(normA.members)
      },
      b: {
        members: normB.members,
        listMode: normB.listMode,
        display: normB.members.length === 1 ? normB.members[0] : computeConvexHull(normB.members)
      }
    };

    // Evaluate all Allen relations
    comparisonResult.value = {
      // Base relations
      before: compareModule.isBefore(result.value.value, result2.value.value),
      after: compareModule.isAfter(result.value.value, result2.value.value),
      meets: compareModule.meets(result.value.value, result2.value.value),
      metBy: compareModule.meets(result2.value.value, result.value.value), // Symmetric
      overlaps: compareModule.overlaps(result.value.value, result2.value.value),
      overlappedBy: compareModule.overlaps(result2.value.value, result.value.value), // Symmetric
      starts: compareModule.starts(result.value.value, result2.value.value),
      startedBy: compareModule.starts(result2.value.value, result.value.value), // Symmetric
      during: compareModule.during(result.value.value, result2.value.value),
      contains: compareModule.contains(result.value.value, result2.value.value),
      finishes: compareModule.finishes(result.value.value, result2.value.value),
      finishedBy: compareModule.finishes(result2.value.value, result.value.value), // Symmetric
      equals: compareModule.equals(result.value.value, result2.value.value),

      // Derived relations
      intersects: compareModule.intersects(result.value.value, result2.value.value),
      disjoint: compareModule.disjoint(result.value.value, result2.value.value),
      touches: compareModule.touches(result.value.value, result2.value.value),
      duringOrEqual: compareModule.duringOrEqual ? compareModule.duringOrEqual(result.value.value, result2.value.value) : 'UNKNOWN',
      containsOrEqual: compareModule.containsOrEqual ? compareModule.containsOrEqual(result.value.value, result2.value.value) : 'UNKNOWN',
    };
  } catch (error: any) {
    console.error('Comparison error:', error);
    comparisonResult.value = null;
  }
}

function computeConvexHull(members: any[]): any {
  // Compute the convex hull (min of all sMin, max of all sMax, etc.)
  const validMembers = members.filter(m => m);
  if (validMembers.length === 0) return null;

  const sMinValues = validMembers.map(m => m.sMin).filter(v => v !== null);
  const sMaxValues = validMembers.map(m => m.sMax).filter(v => v !== null);
  const eMinValues = validMembers.map(m => m.eMin).filter(v => v !== null);
  const eMaxValues = validMembers.map(m => m.eMax).filter(v => v !== null);

  return {
    sMin: sMinValues.length > 0 ? sMinValues.reduce((a, b) => a < b ? a : b) : null,
    sMax: sMaxValues.length > 0 ? sMaxValues.reduce((a, b) => a > b ? a : b) : null,
    eMin: eMinValues.length > 0 ? eMinValues.reduce((a, b) => a < b ? a : b) : null,
    eMax: eMaxValues.length > 0 ? eMaxValues.reduce((a, b) => a > b ? a : b) : null,
    startKind: validMembers[0].startKind,
    endKind: validMembers[0].endKind,
    precision: 'mixed',
    isConvexHull: true,
    memberCount: validMembers.length
  };
}

function formatBound(value: bigint | null): string {
  if (value === null) return 'null';
  // Format as a readable date string
  try {
    const ms = Number(value);
    const date = new Date(ms);
    return date.toISOString();
  } catch {
    return value.toString();
  }
}

function getRelationClass(truthValue: string): string {
  return `truth-${truthValue?.toLowerCase() || 'unknown'}`;
}

function selectExample(edtf: string) {
  input.value = edtf;
  onEdtfInput();
}

// Age and Birthday functions
function selectAgeExample(inputVal: string) {
  ageInput.value = inputVal;
  onAgeInput();
}

async function onAgeInput() {
  if (!ageInput.value.trim()) {
    ageParseResult.value = null;
    ageParseError.value = null;
    ageEdtfInput.value = '';
    return;
  }

  try {
    const { parseAgeBirthday } = await import('@edtf-ts/natural');
    ageParseError.value = null;
    ageParseResult.value = parseAgeBirthday(ageInput.value, { currentDate: currentDate.value });

    // Auto-populate EDTF input and trigger render
    if (ageParseResult.value) {
      ageEdtfInput.value = ageParseResult.value.edtf;
      await onAgeEdtfInput();
    }
  } catch (error: any) {
    ageParseError.value = error.message || 'Failed to parse age input';
    ageParseResult.value = null;
  }
}

async function onAgeEdtfInput() {
  if (!ageEdtfInput.value.trim()) {
    ageRenderResult.value = null;
    ageRenderError.value = null;
    return;
  }

  try {
    const { renderAgeBirthday } = await import('@edtf-ts');
    // Cache the function for sync use in computed
    renderAgeBirthdayFn = renderAgeBirthday;

    ageRenderError.value = null;
    ageRenderResult.value = renderAgeBirthday(ageEdtfInput.value, {
      ...ageFormatOptions.value,
      currentDate: currentDate.value,
    });
  } catch (error: any) {
    ageRenderError.value = error.message || 'Failed to render EDTF';
    ageRenderResult.value = null;
  }
}

function formatAgeRange(range: [number, number | null]): string {
  if (!range) return '';
  const [min, max] = range;
  if (max === null) return `${min}+`;
  if (min === max) return `${min}`;
  return `${min}–${max}`;
}

// Watch age format options changes
watch(ageFormatOptions, () => {
  if (ageEdtfInput.value) {
    onAgeEdtfInput();
  }
}, { deep: true });

onMounted(() => {
  onEdtfInput();
  onEdtfInput2();
  onAgeInput();
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

.row-label-sub.warning {
  color: var(--vp-c-warning-1);
  font-style: italic;
  display: block;
  margin-top: 0.25rem;
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

/* Comparison section */
.comparison-section {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 2px solid var(--vp-c-divider);
}

.comparison-section h3 {
  margin-top: 0;
  margin-bottom: 0.5rem;
  font-size: 1.2rem;
  color: var(--vp-c-text-1);
}

.comparison-description {
  color: var(--vp-c-text-2);
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.comparison-results {
  margin-top: 1rem;
  padding: 1rem;
  background: var(--vp-c-bg);
  border-radius: 6px;
  border: 1px solid var(--vp-c-divider);
}

.comparison-results h4 {
  margin-top: 0;
  margin-bottom: 0.5rem;
  font-size: 1.1rem;
}

.comparison-note {
  color: var(--vp-c-text-2);
  margin-bottom: 1rem;
  font-size: 0.85rem;
}

.inline-code {
  font-family: var(--vp-font-family-mono);
  background: var(--vp-c-bg-soft);
  padding: 0.1rem 0.3rem;
  border-radius: 3px;
  color: var(--vp-c-brand);
  font-size: 0.9em;
}

.relations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.relation-group h5 {
  margin-top: 0;
  margin-bottom: 0.75rem;
  font-size: 0.95rem;
  color: var(--vp-c-text-1);
  border-bottom: 1px solid var(--vp-c-divider);
  padding-bottom: 0.35rem;
}

.relation-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background: var(--vp-c-bg-soft);
  border-radius: 4px;
  margin-bottom: 0.4rem;
  border-left: 3px solid transparent;
  transition: all 0.2s;
}

.relation-name {
  font-family: var(--vp-font-family-mono);
  font-size: 0.85rem;
  color: var(--vp-c-text-1);
  font-weight: 500;
}

.relation-value {
  font-family: var(--vp-font-family-mono);
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.2rem 0.5rem;
  border-radius: 3px;
}

/* Truth value colors */
.truth-yes {
  border-left-color: var(--vp-c-green);
}

.truth-yes .relation-value {
  background: var(--vp-c-green-soft);
  color: var(--vp-c-green);
}

.truth-no {
  border-left-color: var(--vp-c-red);
}

.truth-no .relation-value {
  background: var(--vp-c-red-soft);
  color: var(--vp-c-red);
}

.truth-maybe {
  border-left-color: var(--vp-c-yellow);
}

.truth-maybe .relation-value {
  background: var(--vp-c-yellow-soft);
  color: var(--vp-c-yellow-dark);
}

.truth-unknown {
  border-left-color: var(--vp-c-text-3);
}

.truth-unknown .relation-value {
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
}

/* Bounds display */
.bounds-display {
  margin-bottom: 0.75rem;
  padding: 0.5rem;
  background: var(--vp-c-bg);
  border-radius: 4px;
  font-size: 0.75rem;
  line-height: 1.4;
}

.bounds-line {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.bounds-line:last-child {
  margin-bottom: 0;
}

.bounds-label {
  font-family: var(--vp-font-family-mono);
  font-weight: 600;
  color: var(--vp-c-brand);
  min-width: 120px;
  flex-shrink: 0;
}

.bounds-values {
  font-family: var(--vp-font-family-mono);
  color: var(--vp-c-text-2);
  word-break: break-all;
}

.convex-hull-note {
  display: inline-block;
  margin-left: 0.5rem;
  padding: 0.125rem 0.375rem;
  background: var(--vp-c-yellow-soft);
  color: var(--vp-c-yellow-dark);
  border-radius: 3px;
  font-size: 0.7rem;
  font-weight: 500;
}

.legend {
  margin-top: 1.25rem;
  padding-top: 1rem;
  border-top: 1px solid var(--vp-c-divider);
}

.legend h5 {
  margin-top: 0;
  margin-bottom: 0.6rem;
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
}

.legend-items {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  color: var(--vp-c-text-2);
}

.legend-badge {
  font-family: var(--vp-font-family-mono);
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.15rem 0.4rem;
  border-radius: 3px;
}

.legend-item.truth-yes .legend-badge {
  background: var(--vp-c-green-soft);
  color: var(--vp-c-green);
}

.legend-item.truth-no .legend-badge {
  background: var(--vp-c-red-soft);
  color: var(--vp-c-red);
}

.legend-item.truth-maybe .legend-badge {
  background: var(--vp-c-yellow-soft);
  color: var(--vp-c-yellow-dark);
}

.legend-item.truth-unknown .legend-badge {
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
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

  .relations-grid {
    grid-template-columns: 1fr;
  }

  .legend-items {
    flex-direction: column;
    gap: 0.5rem;
  }

  .variations-grid {
    grid-template-columns: 1fr;
  }
}

/* Age and Birthday Section */
.age-birthday-section {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 2px solid var(--vp-c-divider);
}

.age-birthday-section h2 {
  margin-top: 0;
  margin-bottom: 0.5rem;
  font-size: 1.3rem;
  color: var(--vp-c-text-1);
}

.age-birthday-section > p {
  color: var(--vp-c-text-2);
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.age-examples {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 1rem;
}

.age-result-section {
  margin-top: 1rem;
  padding: 1rem;
  background: var(--vp-c-bg);
  border-radius: 6px;
  border: 1px solid var(--vp-c-divider);
}

.age-result-section h4 {
  margin-top: 0;
  margin-bottom: 0.75rem;
  font-size: 1rem;
  color: var(--vp-c-text-1);
}

.render-output {
  margin-bottom: 1rem;
  padding: 1rem;
  background: var(--vp-c-bg-soft);
  border-radius: 4px;
  border-left: 3px solid var(--vp-c-brand);
}

.render-main {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.interpretation {
  font-style: italic;
  color: var(--vp-c-text-1);
}

.badge-valid {
  background: var(--vp-c-green-soft) !important;
  color: var(--vp-c-green) !important;
}

.format-variations {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--vp-c-divider);
}

.format-variations h5 {
  margin-top: 0;
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
}

.variations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.75rem;
}

.variation-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.5rem;
  background: var(--vp-c-bg-soft);
  border-radius: 4px;
}

.variation-label {
  font-size: 0.75rem;
  color: var(--vp-c-text-2);
  font-weight: 500;
}

.variation-value {
  font-size: 0.9rem;
  color: var(--vp-c-text-1);
  font-family: var(--vp-font-family-mono);
}
</style>
