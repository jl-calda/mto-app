// Shared scalar/value aliases used across the data model.
// We deliberately avoid `any`: dynamic value slots use these or `unknown`.

export type Scalar = string | number | boolean | null;

/** JSON-serializable value (everything persisted as a JSONB payload is Json). */
export type Json = Scalar | Json[] | { [key: string]: Json };

/** A value an attribute / modifier / criterion / variant-attr column can hold. */
export type AttrValue = string | number | boolean | string[] | number[] | null;
