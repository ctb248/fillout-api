import {
  FilterComparators,
  ResponseFiltersType,
  SubmissionComponent,
  SubmissionsResponse,
} from './types';

// Validator for requested filters
export const filtersValid = (
  filtersParam: unknown
): filtersParam is ResponseFiltersType => {
  try {
    // In the event of duplicate parameters, Next will consolidate to an array, so arbitrarily pick the first occurrence
    const filters = Array.isArray(filtersParam)
      ? filtersParam[0]
      : filtersParam;

    const filterArr = JSON.parse(filters);

    for (const filter of filterArr) {
      const { id, condition, value } = filter;
      if (!Object.values(FilterComparators).includes(condition)) return false;
      if (
        !id ||
        !value ||
        typeof id !== 'string' ||
        !['string', 'number'].includes(typeof value)
      )
        return false;
    }

    return true;
  } catch (e) {
    throw e;
  }
};

type ComparatorFunction = (record: SubmissionComponent) => boolean;
type ComparatorMapFunction = (
  targetValue: string | number
) => ComparatorFunction;

const COMPARATOR_STRATEGY_MAP: Record<
  FilterComparators,
  ComparatorMapFunction
> = {
  // Note: Direct string comparison can fail for ISO date strings unless timezone and degree of precision are consistent
  [FilterComparators.EQUALS]:
    (targetValue) =>
    ({ value }) =>
      value === targetValue,
  [FilterComparators.NOT_EQUAL]:
    (targetValue) =>
    ({ value }) =>
      value !== targetValue,
  [FilterComparators.GREATER_THAN]:
    (targetValue) =>
    ({ value }) =>
      value !== null && value > targetValue,
  [FilterComparators.LESS_THAN]:
    (targetValue) =>
    ({ value }) =>
      value !== null && value < targetValue,
};

export const applyFilters = (
  data: SubmissionsResponse,
  filters: ResponseFiltersType,
  limit: number
) => {
  const { responses } = data;
  const filterApplicationMap: Record<string, ComparatorFunction[]> = {};

  // Construct a map of target ID's to their target values & validator functions
  for (const filter of filters) {
    const { id, value, condition } = filter;
    const validator = COMPARATOR_STRATEGY_MAP[condition](value);
    if (!filterApplicationMap[id]) {
      filterApplicationMap[id] = [];
    }
    filterApplicationMap[id].push(validator);
  }

  // Only interested in questions
  const filteredResponses = responses.filter(({ questions }) => {
    const targetQuestions = questions.filter((question) =>
      Object.keys(filterApplicationMap).includes(question.id)
    );
    // If any queried ID's are missing, we can exit
    if (targetQuestions.length !== Object.keys(filterApplicationMap).length)
      return false;

    for (const question of targetQuestions) {
      for (const validator of filterApplicationMap[question.id]) {
        // If any validations fail, exit
        if (!validator(question)) return false;
      }
    }
    return true;
  });

  /* The updated total/pageCount cannot be reliably calculated from the available data. If the "limit" parameter is the page size, but also the number of 
     responses returned, "totalResponses" necessarily counts records which were not returned, and therefore not filtered by this route whenever there is more than one page.
    We can determine the updated count for the returned page and assume no change in the others, but cannot make any assertions about how many records would be found matching the same filters with a different offset without querying the entire collection
  */
  const newTotal =
    data.totalResponses - (responses.length - filteredResponses.length);
  const newPageCount = Math.ceil(newTotal / limit);

  const newResponse: SubmissionsResponse = {
    responses: filteredResponses,
    totalResponses: filteredResponses.length,
    pageCount: newPageCount,
  };

  return newResponse;
};
