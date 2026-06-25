import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';
import type { ApiError } from '@crm/contracts';

/**
 * Centralized error handling (DECISIONS.md §5). Every failure leaves the API as one
 * consistent envelope — no leaked stack traces, coherent HTTP codes.
 *
 * @author Mohamed Marwen Maalawi
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const { status, error, message, details } = this.normalize(exception);

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(`${req.method} ${req.url} → ${status}`, exception as Error);
    }

    const body: ApiError = {
      statusCode: status,
      error,
      message,
      ...(details ? { details } : {}),
      path: req.url,
      timestamp: new Date().toISOString(),
    };
    res.status(status).json(body);
  }

  private normalize(exception: unknown): {
    status: number;
    error: string;
    message: string;
    details?: ApiError['details'];
  } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse();
      if (typeof payload === 'string') {
        return { status, error: HttpStatus[status] ?? 'Error', message: payload };
      }
      const obj = payload as Record<string, unknown>;
      return {
        status,
        error: (obj.error as string) ?? HttpStatus[status] ?? 'Error',
        message: Array.isArray(obj.message)
          ? (obj.message as string[]).join(', ')
          : ((obj.message as string) ?? exception.message),
        details: obj.details as ApiError['details'],
      };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.fromPrisma(exception);
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'InternalServerError',
      message: 'Une erreur interne est survenue',
    };
  }

  private fromPrisma(e: Prisma.PrismaClientKnownRequestError): {
    status: number;
    error: string;
    message: string;
  } {
    switch (e.code) {
      case 'P2025': // record not found
        return { status: HttpStatus.NOT_FOUND, error: 'NotFound', message: 'Ressource introuvable' };
      case 'P2002': // unique constraint
        return { status: HttpStatus.CONFLICT, error: 'Conflict', message: 'Contrainte d’unicité violée' };
      case 'P2003': // FK constraint
        return {
          status: HttpStatus.BAD_REQUEST,
          error: 'BadRequest',
          message: 'Référence invalide (clé étrangère)',
        };
      default:
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'DatabaseError',
          message: 'Erreur de base de données',
        };
    }
  }
}
