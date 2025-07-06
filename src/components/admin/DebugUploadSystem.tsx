// src/components/admin/DebugUploadSystem.tsx - Diagnóstico del sistema

'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle, RefreshCw, Eye, EyeOff } from 'lucide-react';

interface DiagnosticResult {
  name: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: string;
}

interface SystemInfo {
  uploadDir: string;
  contentDir: string;
  filesCount: number;
  environment: string;
  recentFiles: any[];
  timestamp: string;
}

export default function DebugUploadSystem() {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [testResults, setTestResults] = useState<string[]>([]);

  const runDiagnostics = async () => {
    setIsLoading(true);
    setDiagnostics([]);
    setTestResults([]);

    const results: DiagnosticResult[] = [];
    const logs: string[] = [];

    try {
      // 1. Test API Upload
      logs.push('🔍 Testando API de upload...');
      try {
        const uploadResponse = await fetch('/api/upload');
        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          setSystemInfo(uploadData);
          
          results.push({
            name: 'API Upload',
            status: 'success',
            message: 'API responde correctamente',
            details: `Directorio: ${uploadData.uploadDir}`
          });
          
          logs.push(`✅ API Upload OK - ${uploadData.filesCount} archivos`);
        } else {
          results.push({
            name: 'API Upload',
            status: 'error',
            message: `HTTP ${uploadResponse.status}`,
            details: 'La API no responde correctamente'
          });
          logs.push(`❌ API Upload ERROR - ${uploadResponse.status}`);
        }
      } catch (error) {
        results.push({
          name: 'API Upload',
          status: 'error',
          message: 'Error de conexión',
          details: error instanceof Error ? error.message : 'Error desconocido'
        });
        logs.push(`❌ API Upload ERROR - ${error}`);
      }

      // 2. Test imagen existente
      if (systemInfo?.recentFiles && systemInfo.recentFiles.length > 0) {
        const testFile = systemInfo.recentFiles[0];
        logs.push(`🖼️ Testando imagen: ${testFile.name}`);
        
        try {
          const imageResponse = await fetch(testFile.url, { method: 'HEAD' });
          if (imageResponse.ok) {
            results.push({
              name: 'Servir Imágenes',
              status: 'success',
              message: 'Las imágenes se sirven correctamente',
              details: `Tested: ${testFile.name}`
            });
            logs.push(`✅ Imagen servida OK - ${testFile.name}`);
          } else {
            results.push({
              name: 'Servir Imágenes', 
              status: 'error',
              message: `HTTP ${imageResponse.status}`,
              details: `No se puede acceder a: ${testFile.name}`
            });
            logs.push(`❌ Imagen ERROR ${imageResponse.status} - ${testFile.name}`);
          }
        } catch (error) {
          results.push({
            name: 'Servir Imágenes',
            status: 'error',
            message: 'Error accediendo imagen',
            details: error instanceof Error ? error.message : 'Error desconocido'
          });
          logs.push(`❌ Imagen ERROR - ${error}`);
        }
      } else {
        results.push({
          name: 'Servir Imágenes',
          status: 'warning', 
          message: 'No hay archivos para probar',
          details: 'Sube una imagen primero'
        });
        logs.push(`⚠️ Sin archivos para probar`);
      }

      // 3. Test upload de archivo pequeño
      logs.push('📤 Testando upload de archivo...');
      try {
        // Crear un archivo de prueba pequeño (pixel transparente PNG)
        const testImageData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
        const testBlob = new Blob([Uint8Array.from(atob(testImageData), c => c.charCodeAt(0))], { type: 'image/png' });
        const testFile = new File([testBlob], 'test-upload.png', { type: 'image/png' });
        
        const formData = new FormData();
        formData.append('file', testFile);
        
        const uploadTestResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        
        if (uploadTestResponse.ok) {
          const uploadResult = await uploadTestResponse.json();
          results.push({
            name: 'Upload Test',
            status: 'success',
            message: 'Upload funciona correctamente',
            details: `Archivo creado: ${uploadResult.fileName}`
          });
          logs.push(`✅ Upload test OK - ${uploadResult.fileName}`);
          
          // Limpiar archivo de test
          try {
            await fetch(`/api/upload?filename=${uploadResult.fileName}`, { method: 'DELETE' });
            logs.push(`🗑️ Archivo test eliminado`);
          } catch {
            logs.push(`⚠️ No se pudo eliminar archivo test`);
          }
        } else {
          const errorData = await uploadTestResponse.json();
          results.push({
            name: 'Upload Test',
            status: 'error',
            message: `Upload falló: HTTP ${uploadTestResponse.status}`,
            details: errorData.error || 'Error desconocido'
          });
          logs.push(`❌ Upload test ERROR - ${errorData.error}`);
        }
      } catch (error) {
        results.push({
          name: 'Upload Test',
          status: 'error',
          message: 'Error en test de upload',
          details: error instanceof Error ? error.message : 'Error desconocido'
        });
        logs.push(`❌ Upload test ERROR - ${error}`);
      }

      // 4. Verificar configuración del navegador
      logs.push('🌐 Verificando configuración del navegador...');
      try {
        const hasFileAPI = 'File' in window && 'FileReader' in window;
        const hasFormData = 'FormData' in window;
        const hasFetch = 'fetch' in window;
        
        if (hasFileAPI && hasFormData && hasFetch) {
          results.push({
            name: 'Navegador',
            status: 'success',
            message: 'APIs requeridas disponibles',
            details: 'File API, FormData y Fetch OK'
          });
          logs.push(`✅ Navegador compatible`);
        } else {
          results.push({
            name: 'Navegador',
            status: 'error',
            message: 'APIs no disponibles',
            details: `File: ${hasFileAPI}, FormData: ${hasFormData}, Fetch: ${hasFetch}`
          });
          logs.push(`❌ Navegador incompatible`);
        }
      } catch (error) {
        results.push({
          name: 'Navegador',
          status: 'error',
          message: 'Error verificando navegador',
          details: error instanceof Error ? error.message : 'Error desconocido'
        });
        logs.push(`❌ Error verificando navegador`);
      }

    } catch (error) {
      logs.push(`❌ Error general en diagnóstico: ${error}`);
    }

    setDiagnostics(results);
    setTestResults(logs);
    setIsLoading(false);
  };

  useEffect(() => {
    if (isVisible) {
      runDiagnostics();
    }
  }, [isVisible]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default: return <AlertTriangle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'border-green-200 bg-green-50';
      case 'error': return 'border-red-200 bg-red-50';
      case 'warning': return 'border-yellow-200 bg-yellow-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  if (!isVisible) {
    return (
      <div className="bg-gray-100 border border-gray-300 rounded-lg p-4">
        <button
          onClick={() => setIsVisible(true)}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
        >
          <Eye className="w-4 h-4" />
          <span className="text-sm">🔧 Mostrar Diagnóstico del Sistema</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-300 rounded-lg shadow">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-gray-900">Diagnóstico del Sistema</h3>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={runDiagnostics}
            disabled={isLoading}
            className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 disabled:opacity-50 flex items-center space-x-1"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <EyeOff className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Diagnostics Results */}
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-3">Resultados del Diagnóstico</h4>
          {isLoading ? (
            <div className="flex items-center space-x-2 text-gray-600">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Ejecutando tests...</span>
            </div>
          ) : (
            <div className="space-y-2">
              {diagnostics.map((result, index) => (
                <div key={index} className={`border rounded-lg p-3 ${getStatusColor(result.status)}`}>
                  <div className="flex items-start space-x-3">
                    {getStatusIcon(result.status)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">{result.name}</span>
                        <span className={`text-sm ${
                          result.status === 'success' ? 'text-green-700' :
                          result.status === 'error' ? 'text-red-700' : 'text-yellow-700'
                        }`}>
                          {result.message}
                        </span>
                      </div>
                      {result.details && (
                        <p className="text-sm text-gray-600 mt-1">{result.details}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* System Info */}
        {systemInfo && (
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">Información del Sistema</h4>
            <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
              <div><strong>Directorio uploads:</strong> <code className="bg-white px-1 rounded">{systemInfo.uploadDir}</code></div>
              <div><strong>Total archivos:</strong> {systemInfo.filesCount}</div>
              <div><strong>Entorno:</strong> {systemInfo.environment}</div>
              <div><strong>Última verificación:</strong> {new Date(systemInfo.timestamp).toLocaleString()}</div>
            </div>
          </div>
        )}

        {/* Test Logs */}
        {testResults.length > 0 && (
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">Log de Tests</h4>
            <div className="bg-black text-green-400 rounded-lg p-3 max-h-48 overflow-y-auto text-sm font-mono">
              {testResults.map((log, index) => (
                <div key={index}>{log}</div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="pt-4 border-t border-gray-200">
          <h4 className="text-md font-medium text-gray-900 mb-2">Acciones Recomendadas</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <div>• Si hay errores de upload, verificar permisos del directorio</div>
            <div>• Si las imágenes no se ven, revisar la configuración de Next.js</div>
            <div>• Para errores persistentes, reiniciar el contenedor Docker</div>
            <div>• Usar el script debug-uploads.js para diagnóstico del servidor</div>
          </div>
        </div>
      </div>
    </div>
  );
}