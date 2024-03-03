export enum FilterComparators {
  EQUALS = "equals",
  NOT_EQUAL = "does_not_equal",
  GREATER_THAN = "greater_than",
  LESS_THAN = "less_than",
}

export type FilterClauseType = {
  id: string;
  condition: FilterComparators;
  value: number | string;
};

// each of these filters should be applied like an AND in a "where" clause
// in SQL
export type ResponseFiltersType = FilterClauseType[];

interface SubmissionComponent {
  id: string;
  name: string;
  type?: string;
  value: string | number;
}

export interface Submission {
  questions: SubmissionComponent[];
  calculations: SubmissionComponent[];
  urlParameters: SubmissionComponent[];
}

export interface SubmissionsResponse {
  responses: Submission[];
  totalResponses: number;
  pageCount: number;
}
