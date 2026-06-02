// Stable algorithm interface. Concrete solvers (place_supports, pack_stock,
// cut_from_stock, pack_stock_2d) are registered in Brief 08; greedy→ILP swaps
// (Brief 10) change only the implementation, never this contract.

export type AlgoInput = Record<string, unknown>;

export type AlgoOutput = {
  /** Numeric output fields an `algorithm_output` XRef can resolve (e.g. pieces, joints). */
  fields: Record<string, number>;
  /** Rich detail for fan-out (piece list, positions, cutting plan, gaps). */
  detail?: unknown;
};

export interface Algorithm<I extends AlgoInput = AlgoInput, O extends AlgoOutput = AlgoOutput> {
  name: string;
  /** Output field names — feeds the X-picker and validates `algorithm_output` refs. */
  outputFields: string[];
  run(input: I): O;
}

export type AlgorithmRegistry = Map<string, Algorithm>;
