import { resolveEDTF, type EDTFInput } from '../operations.js';
import { normalize } from '../normalization/index.js';
import type { AllenRelationName, Quantifier, Truth } from '../compare-types/index.js';
import { allen } from './allen.js';
import { evaluateRelation } from './evaluator.js';

export interface RelationOptions {
  quantifierA?: Quantifier;
  quantifierB?: Quantifier;
}

export interface RelationSummary {
  relations: Record<AllenRelationName, Truth>;
  /** YES results; collections can make more than one relation definite. */
  definite: AllenRelationName[];
  /** YES or MAYBE results. UNKNOWN remains separate. */
  possible: AllenRelationName[];
  unknown: AllenRelationName[];
}

/** Evaluate all 13 Allen relations with the existing time-aware, four-valued semantics. */
export function relate(a: EDTFInput, b: EDTFInput, options: RelationOptions = {}): RelationSummary {
  const left = normalize(resolveEDTF(a)),
    right = normalize(resolveEDTF(b));
  const quantifierA = options.quantifierA ?? 'ANY',
    quantifierB = options.quantifierB ?? 'ANY';
  if (![quantifierA, quantifierB].every((q) => q === 'ANY' || q === 'ALL'))
    throw new RangeError('Relation quantifiers must be ANY or ALL');
  const relations = Object.fromEntries(
    Object.entries(allen).map(([name, fn]) => [
      name,
      evaluateRelation(left, right, fn, quantifierA, quantifierB),
    ])
  ) as Record<AllenRelationName, Truth>;
  const names = Object.keys(relations) as AllenRelationName[];
  return {
    relations,
    definite: names.filter((name) => relations[name] === 'YES'),
    possible: names.filter((name) => relations[name] === 'YES' || relations[name] === 'MAYBE'),
    unknown: names.filter((name) => relations[name] === 'UNKNOWN'),
  };
}
