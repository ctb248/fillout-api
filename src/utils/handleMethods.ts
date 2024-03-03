import { NextApiRequest, NextApiResponse } from "next";
import { ParsedUrlQuery } from "querystring";

export enum HttpMethod {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  DELETE = "DELETE",
  PATCH = "PATCH",
}

type Handler = (
  req: NextApiRequest,
  res: NextApiResponse
) => void | Promise<void>;

const handleMethods =
  <
    T extends NextApiRequest = NextApiRequest,
    P extends NextApiResponse = NextApiResponse
  >(
    handler: Partial<Record<HttpMethod, Handler>>
  ) =>
  async (req: T, res: P) => {
    const method = req.method as HttpMethod | undefined;
    if (method && method in handler) {
      return handler[method]!(req, res);
    } else {
      res.setHeader("Allow", Object.keys(handler));
      return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  };

export default handleMethods;
