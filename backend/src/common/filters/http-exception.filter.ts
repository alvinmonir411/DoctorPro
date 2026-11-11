import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resp = exceptionResponse as Record<string, any>;
        message = resp.message || exception.message;
      }
    } else if (exception && typeof exception === 'object' && 'code' in exception) {
      // Handle Prisma known errors with exact user-friendly descriptions
      const prismaErr = exception as any;
      if (prismaErr.code === 'P2002') {
        status = HttpStatus.CONFLICT;
        const fields = Array.isArray(prismaErr.meta?.target)
          ? prismaErr.meta.target.join(', ')
          : prismaErr.meta?.target || 'field';
        message = `Duplicate value: A record with this ${fields} already exists.`;
      } else if (prismaErr.code === 'P2003') {
        status = HttpStatus.BAD_REQUEST;
        message = `Cannot complete action because of a missing or linked reference (${prismaErr.meta?.field_name || 'relation'}).`;
      } else if (prismaErr.code === 'P2025') {
        status = HttpStatus.NOT_FOUND;
        message = `Record not found or already deleted.`;
      } else {
        message = prismaErr.message || 'Database error occurred';
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      message: Array.isArray(message) ? message.join(' • ') : message,
      error: HttpStatus[status] || 'ERROR',
      timestamp: new Date().toISOString(),
    });
  }
}
