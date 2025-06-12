// src/components/ui/FragranceAdvisor.tsx

'use client';

import { useState } from 'react';
import { X, Sparkles, MessageCircle, RotateCcw } from 'lucide-react';
import { Product } from '@/lib/types';
import { formatPrice } from '@/lib/products';

interface FragranceAdvisorProps {
  products: Product[];
  onProductSelect: (product: Product) => void;
  onClose: () => void;
}

// Configuración para la API de Gemini
const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';

export default function FragranceAdvisor({ products, onProductSelect, onClose }: FragranceAdvisorProps) {
  const [userPrompt, setUserPrompt] = useState('');
  const [selectedGender, setSelectedGender] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<{
    product: Product;
    explanation: string;
  } | null>(null);
  const [error, setError] = useState<string>('');

  const callGeminiAPI = async (prompt: string): Promise<string> => {
    if (!GEMINI_API_KEY) {
      // Fallback sin API - usar lógica simple basada en palabras clave
      return generateSimpleRecommendation(prompt);
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const payload = {
      contents: [{ 
        role: "user", 
        parts: [{ text: prompt }] 
      }]
    };

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Error en la API: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.candidates && result.candidates.length > 0) {
        return result.candidates[0].content.parts[0].text;
      }
      
      return "No se pudo obtener una respuesta de la IA.";
    } catch (error) {
      console.error("Error llamando a la API de Gemini:", error);
      throw error;
    }
  };

  const generateSimpleRecommendation = (prompt: string): string => {
    const lowerPrompt = prompt.toLowerCase();
    
    // Lógica simple basada en palabras clave
    if (lowerPrompt.includes('fresco') || lowerPrompt.includes('día') || lowerPrompt.includes('trabajo')) {
      const freshProducts = products.filter(p => 
        p.tags.some(tag => ['fresco', 'ligero', 'cítrico'].includes(tag.toLowerCase()))
      );
      if (freshProducts.length > 0) {
        return `ID: ${freshProducts[0].id}\nPerfecto para uso diario. Una fragancia fresca que te acompañará durante todo el día con elegancia y frescura.`;
      }
    }
    
    if (lowerPrompt.includes('noche') || lowerPrompt.includes('elegante') || lowerPrompt.includes('especial')) {
      const eveningProducts = products.filter(p => 
        p.tags.some(tag => ['elegante', 'intenso', 'sofisticado'].includes(tag.toLowerCase()))
      );
      if (eveningProducts.length > 0) {
        return `ID: ${eveningProducts[0].id}\nIdeal para ocasiones especiales. Una fragancia sofisticada que dejará una impresión duradera.`;
      }
    }

    // Si no hay coincidencias específicas, recomendar el primer producto
    return `ID: ${products[0]?.id || 1}\nUna excelente opción versátil que se adapta a diferentes ocasiones y gustos.`;
  };

  const getRecommendation = async () => {
    if (!userPrompt.trim()) {
      setError('Por favor, describe qué estás buscando.');
      return;
    }

    if (!selectedGender) {
      setError('Por favor, selecciona para quién es el perfume.');
      return;
    }

    setIsLoading(true);
    setError('');
    setRecommendation(null);

    try {
      // Filtrar productos por género seleccionado
      const filteredProducts = products.filter(p => {
        if (p.category !== 'perfumes') return false;
        if (selectedGender === 'indiferente') return true;
        if (!p.gender) return true; // Productos sin género definido
        return p.gender === selectedGender || p.gender === 'unisex';
      });

      if (filteredProducts.length === 0) {
        setError('No hay productos disponibles para el género seleccionado.');
        return;
      }

      const productListForPrompt = filteredProducts.map(p => 
        `ID: ${p.id}, Nombre: ${p.name}, Descripción: ${p.description}, Género: ${p.gender || 'unisex'}, Subcategoría: ${p.subcategory}, Tags: ${p.tags.join(', ')}`
      ).join('\n');

      const genderText = selectedGender === 'indiferente' ? 'cualquier género' : `género ${selectedGender}`;

      const prompt = `Eres un experto en fragancias. Un cliente busca algo específico: "${userPrompt}" para ${genderText}. 

Basado en la siguiente lista de perfumes disponibles, ¿cuál le recomendarías? 

${productListForPrompt}

Responde únicamente con el ID del perfume recomendado y luego, en una nueva línea, escribe una explicación creativa y persuasiva de por qué es la elección perfecta para el cliente (máximo 150 palabras). 

Formato:
ID: [número]
[Explicación]`;

      const response = await callGeminiAPI(prompt);
      
      const lines = response.split('\n').filter(line => line.trim());
      const idLine = lines.find(line => line.startsWith("ID:"));
      const recommendedId = idLine ? parseInt(idLine.replace('ID:', '').trim(), 10) : null;
      const explanation = lines.slice(1).join('\n').trim();

      const recommendedProduct = filteredProducts.find(p => p.id === recommendedId);

      if (recommendedProduct) {
        setRecommendation({
          product: recommendedProduct,
          explanation: explanation || 'Esta fragancia es perfecta para ti por su versatilidad y calidad excepcional.'
        });
      } else {
        setError('No pude encontrar una recomendación específica. Intenta con una descripción diferente.');
      }
    } catch (error) {
      console.error('Error getting recommendation:', error);
      setError('Hubo un problema al obtener la recomendación. Por favor intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetAdvisor = () => {
    setUserPrompt('');
    setSelectedGender('');
    setRecommendation(null);
    setError('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="relative p-6 sm:p-8">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Asesor de Fragancias IA</h2>
            <p className="text-gray-600">
              Describe la ocasión, el ambiente o las notas que buscas, y nuestra IA encontrará tu perfume ideal.
            </p>
          </div>

          {!recommendation ? (
            <div className="space-y-6">
              {/* Selector de Género */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  ¿Para quién es el perfume? *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { value: 'mujer', label: '👩 Mujer', icon: '♀️' },
                    { value: 'hombre', label: '👨 Hombre', icon: '♂️' },
                    { value: 'unisex', label: '👥 Unisex', icon: '⚤' },
                    { value: 'indiferente', label: '🤷 Indiferente', icon: '?' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setSelectedGender(option.value)}
                      className={`p-3 text-center rounded-lg border-2 transition-all ${
                        selectedGender === option.value
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      <div className="text-2xl mb-1">{option.icon}</div>
                      <div className="text-sm font-medium">{option.label.replace(/👩|👨|👥|🤷/, '').trim()}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Describe qué tipo de fragancia buscas *
                </label>
                <textarea
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  rows={4}
                  placeholder="Ej: 'Para una cena romántica, algo elegante y sensual...' o 'Necesito algo fresco para usar en el trabajo todos los días...'"
                />
              </div>

              {error && (
                <div className="p-4 bg-red-100 border border-red-200 rounded-lg text-red-700">
                  {error}
                </div>
              )}

              <button
                onClick={getRecommendation}
                disabled={isLoading || !userPrompt.trim() || !selectedGender}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 px-6 rounded-lg text-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Analizando...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Encontrar mi Perfume Ideal</span>
                  </>
                )}
              </button>

              <div className="text-xs text-gray-500 text-center">
                <p>💡 <strong>Ejemplos de búsqueda:</strong></p>
                <p>"Para una boda en la playa" • "Algo sofisticado para la oficina" • "Fragancia dulce y juvenil"</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  ✨ Tu perfume ideal es...
                </h3>
              </div>

              <div 
                className="border border-gray-200 rounded-lg p-4 hover:border-purple-400 transition-colors cursor-pointer"
                onClick={() => onProductSelect(recommendation.product)}
              >
                <div className="flex items-center space-x-4">
                  <img 
                    src={recommendation.product.image} 
                    alt={recommendation.product.name}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h4 className="text-xl font-semibold text-gray-900">
                      {recommendation.product.name}
                    </h4>
                    <p className="text-2xl font-bold text-purple-600">
                      {formatPrice(recommendation.product.price)}
                    </p>
                    <span className="inline-block mt-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      {recommendation.product.category}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 border-l-4 border-purple-400 p-4 rounded-r-lg">
                <p className="text-gray-700 italic leading-relaxed">
                  {recommendation.explanation}
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => onProductSelect(recommendation.product)}
                  className="flex-1 bg-green-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center space-x-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>Ver Detalles</span>
                </button>
                <button
                  onClick={resetAdvisor}
                  className="flex-1 bg-gray-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center space-x-2"
                >
                  <RotateCcw className="w-5 h-5" />
                  <span>Buscar Otro</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}