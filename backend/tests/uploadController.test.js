import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import { serveUploadedFile } from '../controllers/uploadController.js';
import ArchivoUpload from '../models/ArchivoUpload.js';

vi.mock('../models/ArchivoUpload.js', () => ({
  default: {
    create: vi.fn(),
    findOne: vi.fn()
  }
}));

describe('uploadController - serveUploadedFile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sirve el archivo localmente si existe en disco', async () => {
    const req = {
      params: { folder: 'comprobantes', filename: 'test.jpg' }
    };
    const res = {
      sendFile: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      setHeader: vi.fn(),
      send: vi.fn()
    };

    const spyExists = vi.spyOn(fs, 'existsSync').mockReturnValue(true);

    await serveUploadedFile(req, res);

    expect(res.sendFile).toHaveBeenCalled();
    spyExists.mockRestore();
  });

  it('recupera el archivo de MongoDB Atlas si no existe en disco local', async () => {
    const req = {
      params: { folder: 'comprobantes', filename: 'render-lost-file.pdf' }
    };
    const res = {
      sendFile: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      setHeader: vi.fn(),
      send: vi.fn()
    };

    const spyExists = vi.spyOn(fs, 'existsSync').mockReturnValue(false);
    const fakeBuffer = Buffer.from('fake-pdf-data');
    ArchivoUpload.findOne.mockResolvedValue({
      filename: 'render-lost-file.pdf',
      mimetype: 'application/pdf',
      data: fakeBuffer
    });

    await serveUploadedFile(req, res);

    expect(ArchivoUpload.findOne).toHaveBeenCalledWith({ filename: 'render-lost-file.pdf' });
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
    expect(res.send).toHaveBeenCalledWith(fakeBuffer);
    spyExists.mockRestore();
  });

  it('retorna 404 si el archivo no existe ni en disco ni en MongoDB Atlas', async () => {
    const req = {
      params: { folder: 'comprobantes', filename: 'non-existent.jpg' }
    };
    const res = {
      sendFile: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      setHeader: vi.fn(),
      send: vi.fn()
    };

    const spyExists = vi.spyOn(fs, 'existsSync').mockReturnValue(false);
    ArchivoUpload.findOne.mockResolvedValue(null);

    await serveUploadedFile(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Archivo de comprobante no encontrado.' });
    spyExists.mockRestore();
  });
});
