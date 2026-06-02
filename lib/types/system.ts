// Systems — global input contracts; models nest under them.

import type { Visual } from './visual';
import type { Primitive } from './primitive';
import type { Modifier } from './modifier';
import type { VariantTable } from './variant';
import type { CriterionRef, PropertyInstance, SpanDeclaration } from './property';
import type { Attachment } from './attachment';
import type { Model } from './model';

export type System = {
  id: string;
  visual?: Visual;
  name: string;
  description?: string;
  primitive: Primitive;
  modifiers: Modifier[];
  variants: VariantTable;
  criteria: CriterionRef[];
  properties: PropertyInstance[];
  spans?: SpanDeclaration[];
  attachments?: Attachment[];
  models: Model[];
};
