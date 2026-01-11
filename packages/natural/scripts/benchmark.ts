/**
 * Benchmark script for parseNatural()
 * Runs all test cases 100 times and reports timing results.
 */

import { parseNatural } from '../src/index.js';

// All test case inputs extracted from the test files
const testCases: Array<{ input: string; options?: { locale?: string } }> = [
  // smoke.test.ts
  { input: '2020' },
  { input: 'January 2020' },
  { input: 'January 12, 1940' },
  { input: 'possibly 1984' },
  { input: 'circa 1950' },
  { input: 'from 1964 to 2008' },
  { input: 'Spring 2001' },
  { input: 'the 1960s' },

  // complete-dates.test.ts
  { input: '12 January 1940' },
  { input: 'Jan 12, 1940' },
  { input: '12 Jan 1940' },
  { input: '1940-01-12' },
  { input: '01/12/1940', options: { locale: 'en-US' } },
  { input: '01/12/1940', options: { locale: 'en-GB' } },
  { input: '1/12/1940', options: { locale: 'en-US' } },
  { input: '12/1/1940', options: { locale: 'en-US' } },
  { input: '01/12/25' },
  { input: '01/12/40' },
  { input: '01/12/50' },
  { input: '01/12/99' },

  // intervals.test.ts
  { input: '1964/2008' },
  { input: '1964 to 2008' },
  { input: '1964 - 2008' },
  { input: 'between 1964 and 2008' },
  { input: '1964 through 2008' },
  { input: '1964 until 2008' },
  { input: 'June 2004 to August 2006' },
  { input: 'June 2004 - August 2006' },
  { input: 'February 1, 2004 to 2005' },
  { input: '2005 to June 2006' },
  { input: 'circa 1984 to June 2004' },
  { input: 'from around 1984 to June 2004' },
  { input: '1984 to circa June 2004' },
  { input: 'circa 1984 to circa 2004' },
  { input: '1984? to 2004?' },
  { input: 'August 1979 (approximate) to unknown' },
  { input: 'June 2, 1984 (uncertain) to August 8, 2004 (approximate)' },
  { input: 'before 1930' },
  { input: 'earlier than 1930' },
  { input: 'prior to 1930' },
  { input: 'until 1930' },
  { input: 'after 1930' },
  { input: 'later than 1930' },
  { input: 'since 1930' },
  { input: 'from 1930 onwards' },
  { input: '1930 or later' },
  { input: '1930 and after' },
  { input: 'from June 1, 2004 to unknown' },
  { input: '1984 to unknown' },
  { input: 'unknown to 1984' },
  { input: '? to 1984' },

  // qualifications.test.ts
  { input: '1984?' },
  { input: 'maybe 1984' },
  { input: 'perhaps 1984' },
  { input: 'probably 1984' },
  { input: '1984 (uncertain)' },
  { input: 'June 2004?' },
  { input: 'possibly June 2004' },
  { input: 'c. 1950' },
  { input: 'c 1950' },
  { input: 'ca. 1950' },
  { input: 'about 1950' },
  { input: 'around 1950' },
  { input: 'approximately 1950' },
  { input: '~1950' },
  { input: 'circa June 1950' },
  { input: 'circa 1984?' },
  { input: 'about 1984?' },
  { input: 'possibly around 1984' },
  { input: 'maybe circa 1984' },
  { input: '~1984?' },

  // seasons-sets-lists.test.ts
  { input: 'spring 2001' },
  { input: 'Summer 2001' },
  { input: 'Autumn 2001' },
  { input: 'Fall 2001' },
  { input: 'Winter 2001' },
  { input: 'circa Spring 2001' },
  { input: 'possibly Spring 2001' },
  { input: 'about Fall 2020' },
  { input: 'Spring (Northern Hemisphere) 1985' },
  { input: 'Summer (Northern Hemisphere) 1985' },
  { input: 'Fall (Northern Hemisphere) 1985' },
  { input: 'Winter (Northern Hemisphere) 1985' },
  { input: 'Spring (Southern Hemisphere) 1985' },
  { input: 'Summer (Southern Hemisphere) 1985' },
  { input: 'Autumn (Southern Hemisphere) 1985' },
  { input: 'Winter (Southern Hemisphere) 1985' },
  { input: 'Q1 1985' },
  { input: 'Q2 1985' },
  { input: 'Quarter 1 1985' },
  { input: '1st Quarter 1985' },
  { input: 'First Quarter 1985' },
  { input: '4th Quarter 1985' },
  { input: 'Quadrimester 1 1985' },
  { input: '1st Quadrimester 1985' },
  { input: 'Second Quadrimester 1985' },
  { input: '3rd Quadrimester 1985' },
  { input: 'Semestral 1 1985' },
  { input: '1st Semestral 1985' },
  { input: 'Second Semestral 1985' },
  { input: '2nd Semestral 1985' },
  { input: 'Semester 1 1985' },
  { input: '1667 or 1668 or 1670' },
  { input: 'either 1667 or 1668' },
  { input: '1667 or 1668' },
  { input: '1984 or earlier' },
  { input: '1984 or before' },
  { input: 'December 1760 or later' },
  { input: 'December 1760 or after' },
  { input: '1667 and 1668 and 1670' },
  { input: 'both 1667 and 1668' },
  { input: '1667 and 1668' },

  // partial-dates.test.ts
  { input: 'Jan 2020' },
  { input: '01/2020' },
  { input: '2020-01' },
  { input: 'the year 2020' },
  { input: 'in 2020' },

  // unspecified.test.ts
  { input: '1960s' },
  { input: 'the sixties' },
  { input: '60s' },
  { input: "the '60s" },
  { input: "'60s" },
  { input: 'the 1800s' },
  { input: '1800s' },
  { input: 'the nineteenth century' },
  { input: '19th century' },
  { input: 'the 19th century' },
  { input: '19th c.' },
  { input: 'sometime in 1999' },
  { input: 'a month in 1999' },
  { input: 'some month in 1999' },
  { input: 'a day in January 1872' },
  { input: 'some day in January 1872' },
  { input: 'sometime in January 1872' },
  { input: 'circa 1960s' },
  { input: 'possibly 1960s' },

  // temporal-modifiers.test.ts
  { input: 'early March 2024' },
  { input: 'early-March 2024' },
  { input: 'Early January 1995' },
  { input: 'early Feb, 2020' },
  { input: 'mid March 2024' },
  { input: 'mid-July 1999' },
  { input: 'middle December 2000' },
  { input: 'late March 2024' },
  { input: 'late April 2024' },
  { input: 'late February 2024' },
  { input: 'late February 2023' },
  { input: 'early 1995' },
  { input: 'early-2020' },
  { input: 'mid 1995' },
  { input: 'mid 2024' },
  { input: 'late 1995' },
  { input: 'late 2024' },
  { input: 'early 1990s' },
  { input: 'early 1920s' },
  { input: 'the early 1990s' },
  { input: 'early 1880s' },
  { input: 'mid 1990s' },
  { input: 'mid-1920s' },
  { input: 'the mid 1990s' },
  { input: 'late 1990s' },
  { input: 'late 1920s' },
  { input: 'the late 1990s' },
  { input: 'early sixties' },
  { input: 'the mid seventies' },
  { input: 'late nineties' },
  { input: 'early 20th century' },
  { input: 'the early 20th century' },
  { input: 'early 19th century' },
  { input: 'early twentieth century' },
  { input: 'mid 20th century' },
  { input: 'mid-19th century' },
  { input: 'the mid 20th century' },
  { input: 'late 20th century' },
  { input: 'late 19th century' },
  { input: 'the late 20th century' },
  { input: 'early 20th century CE' },
  { input: 'late 19th century AD' },
  { input: 'early 5th century BCE' },
  { input: 'the late 5th century BCE' },
  { input: 'mid 1st century BC' },
  { input: 'early january 2024' },
  { input: 'EARLY JANUARY 2024' },
  { input: 'EaRLy JaNuArY 2024' },
  { input: 'early Jan 2024' },
  { input: 'late Sept 2024' },
  { input: 'early-to-mid 1950s' },
  { input: 'mid-to-late 1950s' },
  { input: 'mid to late 1950s' },
  { input: 'early to mid 1990s' },
  { input: 'the early-to-mid 1980s' },
  { input: 'the mid-to-late 1970s' },
  { input: 'early-to-mid 1995' },
  { input: 'mid-to-late 1995' },
  { input: 'mid to late 2020' },
  { input: 'early-to-mid March 2024' },
  { input: 'mid-to-late March 2024' },
  { input: 'mid to late February 2024' },
  { input: 'early-to-mid April, 2020' },
  { input: 'early-to-mid 20th century' },
  { input: 'mid-to-late 20th century' },
  { input: 'the early-to-mid 19th century' },
  { input: 'early-to-mid 21st century CE' },
  { input: 'mid-to-late 5th century BCE' },
  { input: 'early-to-mid sixties' },
  { input: 'mid-to-late seventies' },
  { input: 'the early-to-mid fifties' },
  { input: 'early-mid 1990s' },
  { input: 'mid-late 1990s' },
  { input: 'middle to late 1980s' },
  { input: 'early 1980s to late 1990s' },
  { input: 'early-to-mid 1980s to late 1990s' },
  { input: 'mid-1970s to early-1980s' },
  { input: 'late 1960s through mid 1970s' },
  { input: 'from early 1980s to late 1990s' },
  { input: 'from the early 1980s to the late 1990s' },
  { input: 'between early 1980s and late 1990s' },
  { input: 'early 1920s - late 1930s' },
  { input: 'early 1995 to late 2000' },
  { input: 'mid 1990 through mid 2000' },
  { input: 'from late 2019 to early 2020' },
  { input: 'early March 2024 to late May 2024' },
  { input: 'mid January 2020 through mid March 2020' },
  { input: 'late 19th century to early 20th century' },
  { input: 'mid 20th century through late 20th century' },
  { input: 'from early twentieth century to mid twentieth century' },
  { input: 'early sixties to late seventies' },
  { input: 'mid-fifties through late-sixties' },
  { input: 'the early sixties to the late seventies' },
  { input: 'early 1980s to 1995' },
  { input: 'late 1990s through 2005' },
  { input: 'from mid-1980s to June 2004' },
  { input: '1980 to late 1990s' },
  { input: 'June 2004 through early 2010s' },
  { input: 'from 1970 to mid-1980s' },
  { input: 'early-to-mid 1970s to mid-to-late 1980s' },
  { input: 'from mid-to-late sixties to early-to-mid seventies' },
  { input: 'circa early 1980s' },
  { input: 'circa mid-1990s' },
  { input: 'circa late 1970s' },
  { input: 'c. early 2000s' },
  { input: 'approximately early 1950s' },
  { input: 'approx late 1960s' },
  { input: 'about early 1920s' },
  { input: 'around mid 1880s' },
  { input: 'possibly early 1990s' },
  { input: 'maybe late 1970s' },
  { input: 'circa early 1995' },
  { input: 'approximately mid-2020' },
  { input: 'circa early March 2024' },
  { input: 'circa early 20th century' },
  { input: 'possibly late 19th century' },
  { input: 'circa early sixties' },
  { input: 'about mid-seventies' },
  { input: 'circa early-to-mid 1980s' },
  { input: 'circa early 1980s to late-1990s' },
  { input: 'circa early 1980s to late 1990s' },
  { input: 'approximately early 1980s to late 1990s' },
  { input: 'about early 1980s through late 1990s' },
  { input: 'from circa early 1980s to late 1990s' },
  { input: 'circa early 1980s to circa late 1990s' },
  { input: 'early 1980s to circa late 1990s' },
  { input: 'between circa early 1980s and late 1990s' },

  // short-year.test.ts
  { input: '623' },
  { input: '1066' },
  { input: '768' },
  { input: '79' },
  { input: '5' },
  { input: '623 AD' },
  { input: '79 BC' },
  { input: '5 BCE' },
  { input: 'December 768' },
  { input: 'June 623' },
  { input: 'January 79' },
  { input: 'March 5' },
  { input: 'December 1, 768' },
  { input: 'June 25, 623' },
  { input: '1st of January 79' },
  { input: '15th March 5' },
  { input: 'Spring 768' },
  { input: 'Winter 623' },
  { input: 'Summer 79' },
  { input: '768-ish' },
  { input: '623ish' },
  { input: '79-ish' },
  { input: 'June to July 768' },
  { input: 'January - March 623' },
  { input: 'sometime in 768' },
  { input: 'sometime in December 623' },
  { input: 'a month in 79' },

  // test-fixes.test.ts
  { input: 'April 12, 1985' },
  { input: 'One of: 1985, 1987' },
  { input: 'All of: 1985, 1987' },
  { input: '1950 (approximate)' },
  { input: '2004 (uncertain/approximate)' },
  { input: 'June 11, 2004 (year uncertain, day approximate)' },
  { input: '2004 (year approximate)' },
  { input: 'January 2004 (month uncertain)' },
  { input: 'June 2004 (year uncertain, month approximate)' },
  { input: '19X4' },
  { input: '2004-06~' },
  { input: '18XX' },
  { input: '[1985,1987]' },
  { input: 'January 12th, 1940' },
  { input: '12th January 1940' },
  { input: 'the 12th of January, 1940' },
  { input: 'April 1st, 1985' },
  { input: 'December 2nd, 2004' },
  { input: 'March 3rd, 1999' },
  { input: "the 1800's" },
  { input: "1800's" },
  { input: "the 1960's" },
  { input: "1960's" },
  { input: '44 BC' },
  { input: '44BC' },
  { input: '44 BCE' },
  { input: 'AD 79' },
  { input: '79 AD' },
  { input: 'AD79' },
  { input: '79AD' },
  { input: 'CE 79' },
  { input: '79 CE' },
  { input: '44 Before Christ' },
  { input: '44 Before Common Era' },
  { input: 'Anno Domini 79' },
  { input: '79 Anno Domini' },
  { input: 'Common Era 79' },
  { input: '79 Common Era' },
  { input: 'Anno Domini 33' },
  { input: '33 Anno Domini' },
  { input: '100 B' },
  { input: '44 B' },
  { input: 'A 79' },
  { input: '79 A' },
  { input: 'A 100' },
  { input: '100 A' },
  { input: '≈ 1950' },
  { input: '≈1950' },
  { input: '~ 1950' },
  { input: '1950-ish' },
  { input: '1950ish' },
  { input: 'circa. 1950' },
  { input: 'c.1950' },
  { input: 'a day in March 2004' },
  { input: 'sometime in April 1985' },
  { input: 'sometime in 2020' },
  { input: '2004-06-11%' },
  { input: '2004-06~-11' },
  { input: '2004?-06-11' },
  { input: '?2004-06-~11' },
  { input: '2004-%06-11' },
  { input: '2004-06?' },
  { input: '2004~' },

  // interval-improvements.test.ts
  { input: 'from June to July 1964' },
  { input: 'June to July 1964' },
  { input: 'June - July 1964' },
  { input: 'from January to March 2020' },
  { input: 'December - January 2024' },
  { input: '50 - 40 BC' },
  { input: '50 to 40 BC' },
  { input: '100 - 50 BCE' },
  { input: '50 to 40 BCE' },
  { input: '100 - 200 AD' },
  { input: '100 to 200 AD' },
  { input: '100 - 200 CE' },
  { input: '100 to 200 CE' },
  { input: 'from June 1964 to July 1964' },
  { input: '1964 to 1968' },
  { input: '1964 - 1968' },
];

const ITERATIONS = 100;

async function runBenchmark() {
  console.log(`Benchmarking parseNatural() with ${testCases.length} test cases`);
  console.log(`Running ${ITERATIONS} iterations...\n`);

  // Warm up the parser (first parse is often slower due to JIT)
  for (const tc of testCases.slice(0, 10)) {
    parseNatural(tc.input, tc.options);
  }

  const startTime = performance.now();
  let totalParses = 0;

  for (let i = 0; i < ITERATIONS; i++) {
    for (const tc of testCases) {
      parseNatural(tc.input, tc.options);
      totalParses++;
    }
  }

  const endTime = performance.now();
  const totalTimeMs = endTime - startTime;
  const avgTimePerParse = totalTimeMs / totalParses;
  const parsesPerSecond = (totalParses / totalTimeMs) * 1000;

  console.log('='.repeat(60));
  console.log('BENCHMARK RESULTS');
  console.log('='.repeat(60));
  console.log(`Test cases:         ${testCases.length}`);
  console.log(`Iterations:         ${ITERATIONS}`);
  console.log(`Total parses:       ${totalParses.toLocaleString()}`);
  console.log(`Total time:         ${totalTimeMs.toFixed(2)} ms`);
  console.log(`Avg time per parse: ${avgTimePerParse.toFixed(4)} ms`);
  console.log(`Parses per second:  ${parsesPerSecond.toFixed(0)}`);
  console.log('='.repeat(60));

  // Also time individual categories
  console.log('\n\nPer-test-case breakdown (average of 100 iterations):\n');

  const timings: Array<{ input: string; avgMs: number }> = [];

  for (const tc of testCases) {
    const start = performance.now();
    for (let i = 0; i < ITERATIONS; i++) {
      parseNatural(tc.input, tc.options);
    }
    const end = performance.now();
    const avgMs = (end - start) / ITERATIONS;
    timings.push({ input: tc.input, avgMs });
  }

  // Sort by time (slowest first)
  timings.sort((a, b) => b.avgMs - a.avgMs);

  console.log('Top 20 slowest test cases:');
  console.log('-'.repeat(70));
  for (const t of timings.slice(0, 20)) {
    const inputDisplay = t.input.length > 50 ? t.input.slice(0, 47) + '...' : t.input;
    console.log(`${t.avgMs.toFixed(4)} ms  ${inputDisplay}`);
  }

  console.log('\n');
  console.log('Top 10 fastest test cases:');
  console.log('-'.repeat(70));
  for (const t of timings.slice(-10).reverse()) {
    const inputDisplay = t.input.length > 50 ? t.input.slice(0, 47) + '...' : t.input;
    console.log(`${t.avgMs.toFixed(4)} ms  ${inputDisplay}`);
  }
}

runBenchmark().catch(console.error);