// Barrel for the MTO domain model (engineering brief §16).
// Import from '@/lib/types'.

export type { Scalar, Json, AttrValue } from './common';
export type { Visual } from './visual';
export type { Primitive, PrimitiveKind, LengthInput, SegmentInput, ChainRole } from './primitive';
export type { Modifier, ModifierType } from './modifier';
export type { Material, MaterialUnit } from './material';
export type {
  PropertyArchetype,
  PropertyScope,
  InputType,
  VariantOption,
  PropertyInput,
  CriterionRef,
  PackingPolicy,
  PlacementRules,
  PropertyInstance,
  SpanEndpoint,
  SpanDeclaration,
} from './property';
export type {
  Variant,
  VariantVersion,
  VariantTable,
  SystemVariantRef,
  VariantSnapshot,
  VersionDiff,
} from './variant';
export type {
  Rule,
  PerTarget,
  AlgorithmName,
  AlgorithmCall,
  Emission,
  SkuLookup,
  SkuKeyRef,
  SkuLookupRef,
  CriteriaDefault,
  ModelMaterial,
} from './rule';
export type {
  Attachment,
  ConnectionPoint,
  ConnectionConstraint,
  PresetTarget,
  AttachmentPreset,
  DerivedBinding,
  Suppression,
  ConnectionMaterialRule,
} from './attachment';
export type {
  ParameterDef,
  SubAssemblyMaterial,
  ParameterBinding,
  SubAssemblyUse,
  SubAssemblyVersion,
  SubAssembly,
} from './subassembly';
export type { AutoSegmentationConfig, ModelVersion, Model } from './model';
export type { System } from './system';
export type { InventoryItem, InventoryOrigin } from './inventory';
export type {
  DimensionChainStep,
  DimensionChain,
  Segment,
  Junction,
  Span,
  SupportGrid,
  MountSurface,
  SupportPosition,
  JointPosition,
  Gap,
  CanonicalGeometry,
} from './geometry';
export type { MtoLine, CuttingPlan, CutDetail } from './mto';
export type { Warning, WarningType } from './warning';
export type { Project } from './project';
export type { Takeoff, AttachmentInstance } from './takeoff';
