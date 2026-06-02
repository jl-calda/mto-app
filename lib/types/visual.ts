// Visual identifier carried by every browsable entity.

export type Visual =
  | { kind: 'image'; url: string; alt?: string }
  | { kind: 'emoji'; char: string }
  | { kind: 'icon'; name: string }
  | { kind: 'none' };
