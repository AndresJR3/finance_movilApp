#!/bin/bash

# Uso: ./scripts/run-testrigor.sh <URL_DEL_APK> <API_TOKEN> <SUITE_ID>

BUILD_URL=$1
AUTH_TOKEN=$2
SUITE_ID=$3

if [ -z "$BUILD_URL" ] || [ -z "$AUTH_TOKEN" ] || [ -z "$SUITE_ID" ]; then
  echo "Error: Faltan argumentos."
  echo "Uso: $0 <URL_DEL_APK> <API_TOKEN> <SUITE_ID>"
  exit 1
fi

echo "🚀 Iniciando retest en TestRigor con la app: $BUILD_URL"

# 1. Disparar el re-test
TRIGGER_RESPONSE=$(curl -s -X POST \
  -H 'Content-type: application/json' \
  -H "auth-token: $AUTH_TOKEN" \
  --data "{\"fileUrl\":\"$BUILD_URL\", \"forceCancelPreviousTesting\":true}" \
  "https://api.testrigor.com/api/v1/apps/$SUITE_ID/retest")

echo "Respuesta del trigger: $TRIGGER_RESPONSE"

# Esperar un momento para que el test se registre
sleep 10

# 2. Bucle para checar el estado
while true
do
  echo "Checking run status..."
  
  RESPONSE=$(curl -s -X GET "https://api.testrigor.com/api/v1/apps/$SUITE_ID/status" \
    -H "auth-token: $AUTH_TOKEN" \
    -H 'Accept: application/json')
  
  # Extraer status code del JSON usando grep/sed básico para no depender de jq complejo si falla
  # Nota: TestRigor devuelve un objeto JSON con el estado. 
  # Vamos a asumir que miramos el código HTTP de la respuesta o el campo status si estuviera disponible.
  # Pero la API de status devuelve códigos HTTP específicos según el estado del test:
  # 200 = Terminado OK, 227/228 = En progreso, 230 = Falló.
  
  # Para simplificar en bash sin depender de headers complejos, usaremos curl -w para obtener el http_code
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X GET "https://api.testrigor.com/api/v1/apps/$SUITE_ID/status" -H "auth-token: $AUTH_TOKEN")
  
  echo "Status Code actual: $HTTP_CODE"

  case $HTTP_CODE in
    200)
      echo "✅ Test finalizado exitosamente."
      exit 0
      ;;
    227|228)
      echo "⏳ Test en progreso... esperando 30 segundos."
      sleep 25
      ;;
    229)
      echo "⚠️ Test cancelado."
      exit 1
      ;;
    230)
      echo "mb Test finalizó pero FALLARON casos de prueba."
      exit 1
      ;;
    *)
      echo "❌ Error o estado desconocido: $HTTP_CODE"
      exit 1
      ;;
  esac
done