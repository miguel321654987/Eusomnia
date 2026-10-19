**Resumen completo de todos los endpoints definidos bajo `src/api/blueprints/`**

_(Agrupados por el Blueprint al que pertenecen)_

---

### **1️⃣ user_bp** _(gestión de usuarios y preferencias)_

| **Método** | **Ruta**            | **Descripción**                                                                                                                                                                                                                     |
| ---------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **POST**   | `/signup`           | Crea una cuenta de usuario. Valida que el cuerpo JSON incluya `email`, `password`, `name` y `last_name`. Genera la contraseña encriptada, persiste el usuario y crea sus `UserPreferences` por defecto.                             |
| **POST**   | `/login`            | Autentica al usuario. Requiere `email` y `password` en el cuerpo JSON, verifica credenciales y devuelve un _access token_ JWT junto con los datos del usuario.                                                                      |
| **GET**    | `/profile`          | Devuelve la información del usuario autenticado (según el token JWT) y sus preferencias asociadas (`UserPreferences`).                                                                                                              |
| **PUT**    | `/profile`          | Actualiza parcialmente las preferencias del usuario autenticado (`ai_provider`, `custom_api_key`, `selected_model`, `timezone`). Si el registro de preferencias no existía, lo crea con valores por defecto.                        |
| **GET**    | `/` _(sin prefijo)_ | Lista todos los usuarios registrados (paginado). Parámetros opcionales `page` y `per_page`. Solo requiere que el solicitante esté autenticado con JWT.                                                                              |
| **GET**    | `/<int:user_id>`    | Obtiene la información de un usuario concreto a partir de su **ID**. Requiere autenticación JWT.                                                                                                                                    |
| **DELETE** | `/<int:user_id>`    | Elimina la cuenta del usuario especificado. El cuerpo JSON debe contener `current_password` para confirmar la acción. Solo el propio usuario (el ID del JWT) puede eliminarse; de lo contrario se devuelve `403 Permission denied`. |
|  |

---

### **2️⃣ daily_entries_bp** _(registro y consulta de entradas diarias)_

| Método   | Ruta                | Descripción                                                                                         |
| -------- | ------------------- | --------------------------------------------------------------------------------------------------- |
| **GET**  | `/` _(sin prefijo)_ | Lista todas las `DailyEntry` del usuario actual, ordenadas por fecha descendente.                   |
| **GET**  | `/<int:entry_id>`   | Obtiene una entrada diaria concreta (solo del propietario).                                         |
| **POST** | `/` _(sin prefijo)_ | Crea una nueva `DailyEntry` con su `SleepReport` y `HabitLog`. Valida cuerpo JSON y datos de sueño. |

---

### **3️⃣ analysis_bp** _(análisis de textos de sueño mediante IA)_

| Método   | Ruta              | Descripción                                                                                                                                                  |
| -------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **POST** | `/<int:entry_id>` | Ejecuta el análisis de IA para la entrada diaria indicada. Usa `UserPreferences` para seleccionar modelo / API key y guarda el resultado en `SleepAnalysis`. |
| **GET**  | `/<int:entry_id>` | Recupera el análisis previamente generado para la entrada diaria.                                                                                            |

---

### **4️⃣ nutrition_bp** _(análisis y registro nutricional)_

| Endpoint                                                                    | ¿Qué hace exactamente?                                                                                                                                                                                   | ¿Por qué es necesario?                                                                                                                                 |
| --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **`POST /nutrition/analyze`**                                               | Recibe **una sola cadena de texto** (p. ej. “2 rebanadas de pizza”) y devuelve el análisis **sin crear ninguna entidad en la base de datos**.                                                            | Permite a la UI ofrecer al usuario una **vista previa rápida** (por ejemplo, “¿Cuántas calorías tiene este alimento?”) antes de decidir guardarlo.     |
| **`POST /nutrition/analyze-recipe`**                                        | Recibe **una lista de ingredientes** (título opcional) y devuelve el análisis **sin persistir**.                                                                                                         | Útil cuando el usuario quiere **analizar una receta completa** (sopa, lasaña, etc.) sin asociarla todavía a una `DailyEntry`.                          |
| **`POST /nutrition/log`**                                                   | Recibe `entry_id` + datos de la comida, **analiza** (llamando a `analyze_foods`) **y guarda/actualiza** un registro `NutritionLog` vinculado a esa `DailyEntry`.                                         | Es el **punto de integración** entre la información nutricional y la entrada diaria del usuario; el análisis se vuelve parte del historial del día.    |
| **`GET /nutrition/log/<entry_id>`**                                         | Devuelve el `NutritionLog` ya **persistido** para la entrada indicada.                                                                                                                                   | Permite a la UI **mostrar** los datos guardados (por ejemplo, al abrir la pantalla de “Detalles del día”).                                             |
| **`GET /nutrition/logs`**                                                   | Lista **paginada** de todos los logs del usuario.                                                                                                                                                        | Necesario para vistas de historial, reportes o exportaciones donde se necesitan varios días.                                                           |
| **`PUT /nutrition/log/<entry_id>`** / **`PATCH /nutrition/log/<entry_id>`** | Actualiza **total o parcialmente** un log existente.                                                                                                                                                     | El usuario puede corregir o completar datos después de haber guardado (p.ej. añadir una bebida que olvidó).                                            |
| **`DELETE /nutrition/log/<entry_id>`**                                      | Elimina el log asociado a una `DailyEntry`.                                                                                                                                                              | Permite al usuario **borrar** datos erróneos o reiniciar el registro de un día.                                                                        |
| **`POST /nutrition/evaluate`**                                              | **Toma** un `NutritionLog` ya guardado y lo **compara** con los parámetros de referencia del usuario (requerimientos calóricos, macro‑nutrientes, etc.) y devuelve una **puntuación / recomendaciones**. | Provee la **capa de valor**: no solo muestra datos crudos, sino que interpreta si la ingesta está dentro de los rangos recomendados y sugiere ajustes. |
| **`GET /nutrition/parameters`**                                             | Devuelve los **parámetros de referencia** (rangos de macronutrientes, límites de cafeína, etc.) que se usan tanto en el análisis como en la evaluación.                                                  | Permite a la UI **mostrar** esos valores al usuario y también a los demás endpoints para validar `meal_type` y otros campos.                           |

---

#### Resumen de la arquitectura

1. **Servicio único** (`analyze_foods`) → **single source of truth** para la interacción con Edamam.
2. **Endpoints ligeros** → cada uno se ocupa sólo de:
   - Validar y transformar la petición del cliente.
   - Llamar al servicio central.
   - **Decidir** si persiste el resultado, lo devuelve tal cual, o lo procesa (p.ej., evaluación).
3. **Separación de responsabilidades**:
   - **Rápida inspección** → `/analyze` y `/analyze-recipe`.
   - **Persistencia del día** → `/log` (creación/actualización).
   - **Gestión CRUD** → `/log/<id>` (read, update, delete, list).
   - **Interpretación** → `/evaluate`.

---

#### Observaciones generales

- **Seguridad**: Todos los endpoints que manipulan datos de usuarios o logs están protegidos con `@jwt_required()`.
- **Manejo de errores**: Se utilizan `APIException` para devolver códigos HTTP adecuados (400, 401, 403, 404, 409, 422, 502, 500).
- **Validaciones**: Cada punto de entrada valida tipos, rangos y presencia de campos críticos (p. ej., `entry_id`, `meal_type`, números no negativos).
- **Serialización**: Los modelos (`User`, `DailyEntry`, `NutritionLog`, etc.) implementan un método `serialize()` que se usa para construir la respuesta JSON.
- **Paginación**: Implementada en `GET /nutrition/logs` con controles de valores positivos y límites seguros.
