import handleMethods, { HttpMethod } from "@/utils/handleMethods";
import toFetchHeaders from "@/utils/toFetchHeaders";
import { FilterComparators, ResponseFiltersType } from "@/utils/types";
import { NextApiRequest, NextApiResponse } from "next";
import { ParsedUrlQuery } from "querystring";

interface FilteredResponsesParams extends ParsedUrlQuery {
  filters?: string | string[];
  formId?: string;
}

interface FilteredResponsesRequest extends NextApiRequest {
  query: FilteredResponsesParams;
}

const filtersValid = (
  filtersParam: unknown
): filtersParam is ResponseFiltersType => {
  try {
    // In the event of duplicate parameters, Next will consolidate to an array, so pick the first occurrence
    const filters = Array.isArray(filtersParam)
      ? filtersParam[0]
      : filtersParam;

    const array = JSON.parse(filters);

    for (const filter of array) {
      const { id, condition, value } = filter;
      if (!Object.values(FilterComparators).includes(condition)) return false;
      if (
        !id ||
        !value ||
        typeof id !== "string" ||
        !["string", "number"].includes(typeof value)
      )
        return false;
    }

    return true;
  } catch (e) {
    throw e;
  }
};

const applyFilters = (res: Response, filters: ResponseFiltersType) => {
  const filterApplicationMap: Record<string, Array<() => boolean>> = {};

  for (const filter of filters) {
    const { id, value, condition } = filter;
    filterApplicationMap[id];
  }
};

export default handleMethods({
  GET: async (req: FilteredResponsesRequest, res: NextApiResponse) => {
    const { formId, filters } = req.query;

    // Validate our inputs
    try {
      // Can act as a proxy if no filters are present, but why
      if (!formId || !filters) throw new Error("Missing required inputs");
      if (!filtersValid(filters)) throw new Error("Invalid filters");
    } catch (e) {
      return res.status(400).json({
        message:
          e instanceof Error ? `Bad Request: ${e.message}` : "Bad Request",
      });
    }

    try {
      // We can just forward this and let it authenticate or otherwise fail on our behalf
      const apiUrl = `${process.env.SECRET_BASE_URL}/v1/api/forms/${formId}/submissions`;
      const response = await fetch(apiUrl, {
        method: HttpMethod.GET,
        headers: toFetchHeaders(req.headers),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return res.status(response.status).send(errorText);
      }

      const data = await response.json();
      const filteredData = applyFilters(data, filters);

      res.json(data);
    } catch (e) {
      console.error(
        `Error with forwarded request: ${
          e instanceof Error ? e.message : JSON.stringify(e)
        }`
      );
      return res
        .status(500)
        .json({ message: `Error fetching data from external API` });
    }
  },
});
