import { NextRequest, NextResponse } from 'next/server';
import { applyFilters, filtersValid } from './utils';
import { headers } from 'next/headers';
import { SubmissionsResponse } from './types';
import * as https from 'https';
import axios, { isAxiosError } from 'axios';

interface RouteParams {
  params: {
    formId?: string;
  };
}

export async function GET(
  req: NextRequest,
  { params: { formId } }: RouteParams
) {
  const queryParams = req.nextUrl.searchParams;
  const filters = queryParams.get('filters');
  const limit = Number(queryParams.get('limit') ?? 150);
  // Delete once consumed to forward remaining params to API
  queryParams.delete('filters');

  // Validate our inputs
  try {
    if (!formId || !filters) throw new Error('Missing required inputs');
    if (!filtersValid(filters)) throw new Error('Invalid filters');
  } catch (e) {
    return NextResponse.json(
      {
        message:
          e instanceof Error ? `Bad Request: ${e.message}` : 'Bad Request',
      },
      { status: 400 }
    );
  }

  try {
    const apiUrl = `${process.env.SECRET_BASE_URL}/v1/api/forms/${formId}/submissions`;

    const agent = new https.Agent({
      rejectUnauthorized: false, // This is for local dev and insecure, a proper certificate chain should be used
    });

    // We can just forward the token/other params and let it authenticate or otherwise fail on our behalf
    const response = await axios.get<SubmissionsResponse>(apiUrl, {
      httpsAgent: agent,
      headers: {
        Authorization: headers().get('Authorization'),
      },
      params: queryParams,
    });

    const filteredData = applyFilters(
      response.data,
      JSON.parse(filters),
      limit
    );

    return NextResponse.json(filteredData, { status: 200 });
  } catch (e) {
    // If the API returned an error, proxy the error response, otherwise 500
    const status =
      isAxiosError(e) && e.response?.status ? e.response?.status : 500;
    console.error(
      `Error with external API call: ${
        e instanceof Error ? e.message : JSON.stringify(e)
      }`
    );
    return NextResponse.json(
      isAxiosError(e) ? e : { message: `Error fetching data` },
      { status }
    );
  }
}
