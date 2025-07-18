import React, { useState, useRef } from 'react';

interface FileUploaderProps {
  bucketName: string;
  folderPath: string;
  fileType: string;
  userId: string;
  onFileUploaded: (url: string) => void;
  existingFileUrl?: string | null;
  maxSizeMB?: number;
  allowedFileTypes?: string[];
}

export function FileUploader({
  bucketName,
  folderPath,
  fileType,
  userId,
  onFileUploaded,
  existingFileUrl,
  maxSizeMB = 10, // Default máximo 10MB
  allowedFileTypes = ['.pdf', '.jpg', '.jpeg', '.png'],
}: FileUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(existingFileUrl || null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setError(null);
      
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }
      
      const file = event.target.files[0];
      setFileName(file.name);
      
      // Validar tamaño del archivo
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > maxSizeMB) {
        setError(`El archivo excede el tamaño máximo permitido de ${maxSizeMB}MB.`);
        return;
      }
      
      // Validar tipo de archivo
      const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;
      if (!allowedFileTypes.includes(fileExtension)) {
        setError(`Tipo de archivo no permitido. Use: ${allowedFileTypes.join(', ')}`);
        return;
      }
      
      // Crear URL de vista previa para imágenes
      if (file.type.startsWith('image/')) {
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);
      } else if (fileExtension === '.pdf') {
        // Para PDFs, mostramos un icono genérico
        setPreviewUrl('/pdf-icon.png');
      }
      
      await uploadFile(file);
    } catch (error) {
      console.error('Error al cambiar el archivo:', error);
      setError('Ocurrió un error al procesar el archivo.');
    }
  };
  
  const uploadFile = async (file: File) => {
    try {
      setUploading(true);
      
      console.log(`Intentando subir archivo al bucket "${bucketName}"`);
      
      // Crear FormData para enviar a la API
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucketName', bucketName);
      formData.append('folderPath', folderPath);
      formData.append('fileType', fileType);
      formData.append('userId', userId);
      
      // Subir el archivo usando la API route
      const response = await fetch('/api/upload-file', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        console.error('Error al subir archivo:', result.error);
        setError(`Error al subir el archivo: ${result.error}`);
        throw new Error(result.error);
      }
      
      console.log('Archivo subido exitosamente:', result);
      
      // Notificar al componente padre que el archivo se subió exitosamente
      onFileUploaded(result.url);
      console.log('URL pública generada:', result.url);
    } catch (err) {
      console.error('Error al subir el archivo:', err);
      const error = err as Error;
      if (!error.message) {
        setError('Error al subir el archivo. Intente nuevamente o contacte a soporte.');
      }
    } finally {
      setUploading(false);
    }
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      if (fileInputRef.current) {
        fileInputRef.current.files = e.dataTransfer.files;
        handleFileChange({ target: { files: e.dataTransfer.files } } as any);
      }
    }
  };
  
  const handleRemoveFile = () => {
    setPreviewUrl(null);
    setFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onFileUploaded('');
  };
  
  return (
    <div className="mt-2">
      <div
        className={`border-2 border-dashed rounded-md p-6 
          ${error ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50'} 
          hover:bg-gray-100 cursor-pointer transition-colors duration-200 text-center`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept={allowedFileTypes.join(',')}
        />
        
        {uploading ? (
          <div className="text-center">
            <svg
              className="animate-spin h-8 w-8 text-blue-500 mx-auto"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <p className="mt-2 text-sm text-gray-600">Subiendo archivo...</p>
          </div>
        ) : previewUrl ? (
          <div>
            {previewUrl.match(/\.(jpg|jpeg|png|gif)$/i) ? (
              <img
                src={previewUrl}
                alt="Vista previa"
                className="h-32 mx-auto object-contain"
              />
            ) : (
              <svg
                className="h-16 w-16 text-gray-400 mx-auto"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            <p className="text-sm text-gray-500 mt-2 truncate max-w-full">
              {fileName || 'Archivo cargado'}
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveFile();
              }}
              className="mt-2 text-xs text-red-600 hover:text-red-800"
            >
              Eliminar archivo
            </button>
          </div>
        ) : (
          <div>
            <svg
              className="h-12 w-12 text-gray-400 mx-auto"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="mt-2 text-sm text-gray-600">
              <span className="font-medium text-blue-600 hover:text-blue-500">
                Haz clic para subir
              </span>{' '}
              o arrastra y suelta
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {allowedFileTypes.join(', ')} (Máx. {maxSizeMB}MB)
            </p>
          </div>
        )}
      </div>
      
      {error && (
        <p className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
} 