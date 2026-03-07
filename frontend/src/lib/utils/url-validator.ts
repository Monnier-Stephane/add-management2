/**
 * Utilitaire pour valider et construire des URLs de manière sécurisée
 */

export interface UrlValidationResult {
  isValid: boolean;
  url?: string;
  error?: string;
}

/**
 * Valide qu'une URL est correctement formatée
 */
export function validateUrl(url: string, baseUrl?: string): UrlValidationResult {
  try {
    const fullUrl = baseUrl ? new URL(url, baseUrl) : new URL(url);
    return {
      isValid: true,
      url: fullUrl.toString()
    };
  } catch (error) {
    return {
      isValid: false,
      error: `URL invalide: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
    };
  }
}

/**
 * Construit une URL avec des paramètres de manière sécurisée
 */
export function buildUrlWithParams(
  baseUrl: string, 
  params: Record<string, string | number | undefined>
): UrlValidationResult {
  try {
    const url = new URL(baseUrl);
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
    
    return {
      isValid: true,
      url: url.toString()
    };
  } catch (error) {
    return {
      isValid: false,
      error: `Erreur lors de la construction de l'URL: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
    };
  }
}

/**
 * Encode de manière sécurisée un paramètre d'URL
 */
export function safeEncodeParam(value: string): string {
  try {
    return encodeURIComponent(value);
  } catch (error) {
    console.error('Erreur lors de l\'encodage du paramètre:', error);
    return '';
  }
}

