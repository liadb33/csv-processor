import { Request } from "express";

/**
 * Express request with file upload
 */
export interface UploadRequest extends Request {
  file?: Express.Multer.File;
}
