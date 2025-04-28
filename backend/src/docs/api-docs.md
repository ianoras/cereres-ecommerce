# Documentazione API Backend

Questo documento descrive tutte le API disponibili per il frontend.

## Autenticazione

### Registrazione
- **POST** `/api/auth/register`
  - **Descrizione**: Registra un nuovo utente
  - **Body**:
    ```json
    {
      "name": "Nome Utente",
      "email": "email@esempio.com",
      "password": "password123"
    }
    ```
  - **Risposta**:
    ```json
    {
      "token": "jwt_token",
      "user": {
        "id": "user_id",
        "name": "Nome Utente",
        "email": "email@esempio.com",
        "role": "user"
      }
    }
    ```

### Login
- **POST** `/api/auth/login`
  - **Descrizione**: Autentica un utente esistente
  - **Body**:
    ```json
    {
      "email": "email@esempio.com",
      "password": "password123"
    }
    ```
  - **Risposta**:
    ```json
    {
      "token": "jwt_token",
      "user": {
        "id": "user_id",
        "name": "Nome Utente",
        "email": "email@esempio.com",
        "role": "user"
      }
    }
    ```

### Google OAuth
- **GET** `/api/auth/google`
  - **Descrizione**: Reindirizza l'utente alla pagina di login di Google
- **GET** `/api/auth/google/callback`
  - **Descrizione**: Callback per l'autenticazione Google

## Utenti

### Profilo Utente
- **GET** `/api/users/profile`
  - **Descrizione**: Ottiene il profilo dell'utente autenticato
  - **Headers**: `Authorization: Bearer jwt_token`
  - **Risposta**:
    ```json
    {
      "id": "user_id",
      "name": "Nome Utente",
      "email": "email@esempio.com",
      "role": "user",
      "createdAt": "2023-01-01T00:00:00.000Z"
    }
    ```

### Aggiorna Profilo
- **PUT** `/api/users/profile`
  - **Descrizione**: Aggiorna il profilo dell'utente
  - **Headers**: `Authorization: Bearer jwt_token`
  - **Body**:
    ```json
    {
      "name": "Nuovo Nome",
      "email": "nuovo@esempio.com"
    }
    ```
  - **Risposta**:
    ```json
    {
      "id": "user_id",
      "name": "Nuovo Nome",
      "email": "nuovo@esempio.com",
      "role": "user",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    }
    ```

### Cambia Password
- **PUT** `/api/users/change-password`
  - **Descrizione**: Cambia la password dell'utente
  - **Headers**: `Authorization: Bearer jwt_token`
  - **Body**:
    ```json
    {
      "currentPassword": "password123",
      "newPassword": "nuova_password123"
    }
    ```
  - **Risposta**:
    ```json
    {
      "message": "Password aggiornata con successo"
    }
    ```

## Prodotti

### Lista Prodotti
- **GET** `/api/products`
  - **Descrizione**: Ottiene tutti i prodotti
  - **Query Parameters**:
    - `category`: Filtra per categoria
    - `search`: Cerca per nome o descrizione
    - `page`: Numero di pagina (default: 1)
    - `limit`: Prodotti per pagina (default: 10)
  - **Risposta**:
    ```json
    {
      "products": [
        {
          "id": "product_id",
          "name": "Nome Prodotto",
          "description": "Descrizione prodotto",
          "price": 99.99,
          "category": "categoria",
          "images": ["url1", "url2"]
        }
      ],
      "total": 100,
      "pages": 10,
      "currentPage": 1
    }
    ```

### Dettaglio Prodotto
- **GET** `/api/products/:id`
  - **Descrizione**: Ottiene i dettagli di un prodotto specifico
  - **Risposta**:
    ```json
    {
      "id": "product_id",
      "name": "Nome Prodotto",
      "description": "Descrizione prodotto",
      "price": 99.99,
      "category": "categoria",
      "images": ["url1", "url2"],
      "details": {
        "material": "Materiale",
        "dimensions": "Dimensioni",
        "weight": "Peso"
      }
    }
    ```

## Richieste Personalizzate

### Lista Richieste (Cliente)
- **GET** `/api/custom-requests/client`
  - **Descrizione**: Ottiene tutte le richieste dell'utente autenticato
  - **Headers**: `Authorization: Bearer jwt_token`
  - **Risposta**:
    ```json
    [
      {
        "id": "request_id",
        "title": "Titolo Richiesta",
        "description": "Descrizione richiesta",
        "status": "pending",
        "budget": 100,
        "createdAt": "2023-01-01T00:00:00.000Z"
      }
    ]
    ```

### Dettaglio Richiesta (Cliente)
- **GET** `/api/custom-requests/client/:id`
  - **Descrizione**: Ottiene i dettagli di una richiesta specifica
  - **Headers**: `Authorization: Bearer jwt_token`
  - **Risposta**:
    ```json
    {
      "id": "request_id",
      "title": "Titolo Richiesta",
      "description": "Descrizione richiesta",
      "preferredMaterials": ["materiale1", "materiale2"],
      "budget": 100,
      "deadline": "2023-12-31T00:00:00.000Z",
      "status": "pending",
      "materialsStatus": "pending",
      "quote": {
        "amount": 150,
        "description": "Descrizione preventivo",
        "validUntil": "2023-12-31T00:00:00.000Z",
        "sentAt": "2023-01-01T00:00:00.000Z"
      },
      "conversation": [
        {
          "sender": "user",
          "message": "Messaggio utente",
          "timestamp": "2023-01-01T00:00:00.000Z"
        }
      ],
      "createdAt": "2023-01-01T00:00:00.000Z"
    }
    ```

### Crea Richiesta
- **POST** `/api/custom-requests/client`
  - **Descrizione**: Crea una nuova richiesta personalizzata
  - **Headers**: `Authorization: Bearer jwt_token`
  - **Body**:
    ```json
    {
      "title": "Titolo Richiesta",
      "description": "Descrizione richiesta",
      "preferredMaterials": ["materiale1", "materiale2"],
      "budget": 100,
      "deadline": "2023-12-31T00:00:00.000Z"
    }
    ```
  - **Risposta**:
    ```json
    {
      "id": "request_id",
      "title": "Titolo Richiesta",
      "description": "Descrizione richiesta",
      "preferredMaterials": ["materiale1", "materiale2"],
      "budget": 100,
      "deadline": "2023-12-31T00:00:00.000Z",
      "status": "pending",
      "createdAt": "2023-01-01T00:00:00.000Z"
    }
    ```

### Aggiorna Richiesta
- **PUT** `/api/custom-requests/client/:id`
  - **Descrizione**: Aggiorna una richiesta esistente
  - **Headers**: `Authorization: Bearer jwt_token`
  - **Body**:
    ```json
    {
      "description": "Nuova descrizione",
      "preferredMaterials": ["nuovo materiale"],
      "budget": 150,
      "deadline": "2023-12-31T00:00:00.000Z"
    }
    ```
  - **Risposta**:
    ```json
    {
      "id": "request_id",
      "title": "Titolo Richiesta",
      "description": "Nuova descrizione",
      "preferredMaterials": ["nuovo materiale"],
      "budget": 150,
      "deadline": "2023-12-31T00:00:00.000Z",
      "status": "pending",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    }
    ```

### Aggiungi Messaggio
- **POST** `/api/custom-requests/client/:id/messages`
  - **Descrizione**: Aggiunge un messaggio alla conversazione
  - **Headers**: `Authorization: Bearer jwt_token`
  - **Body**:
    ```json
    {
      "message": "Testo del messaggio"
    }
    ```
  - **Risposta**:
    ```json
    {
      "id": "request_id",
      "conversation": [
        {
          "sender": "user",
          "message": "Testo del messaggio",
          "timestamp": "2023-01-01T00:00:00.000Z"
        }
      ]
    }
    ```

### Accetta Preventivo
- **POST** `/api/custom-requests/client/:id/accept-quote`
  - **Descrizione**: Accetta un preventivo
  - **Headers**: `Authorization: Bearer jwt_token`
  - **Risposta**:
    ```json
    {
      "id": "request_id",
      "status": "accepted",
      "acceptedQuote": {
        "amount": 150,
        "description": "Descrizione preventivo",
        "validUntil": "2023-12-31T00:00:00.000Z",
        "sentAt": "2023-01-01T00:00:00.000Z"
      }
    }
    ```

### Rifiuta Preventivo
- **POST** `/api/custom-requests/client/:id/reject-quote`
  - **Descrizione**: Rifiuta un preventivo
  - **Headers**: `Authorization: Bearer jwt_token`
  - **Risposta**:
    ```json
    {
      "id": "request_id",
      "status": "rejected",
      "quote": null
    }
    ```

## Richieste Personalizzate (Admin)

### Lista Richieste (Admin)
- **GET** `/api/custom-requests/admin/all`
  - **Descrizione**: Ottiene tutte le richieste con filtri e paginazione
  - **Headers**: `Authorization: Bearer jwt_token`
  - **Query Parameters**:
    - `status`: Filtra per stato
    - `page`: Numero di pagina (default: 1)
    - `limit`: Richieste per pagina (default: 10)
  - **Risposta**:
    ```json
    {
      "requests": [
        {
          "id": "request_id",
          "title": "Titolo Richiesta",
          "description": "Descrizione richiesta",
          "status": "pending",
          "user": {
            "id": "user_id",
            "name": "Nome Utente",
            "email": "email@esempio.com"
          },
          "createdAt": "2023-01-01T00:00:00.000Z"
        }
      ],
      "total": 100,
      "pages": 10,
      "currentPage": 1
    }
    ```

### Dettaglio Richiesta (Admin)
- **GET** `/api/custom-requests/admin/:id`
  - **Descrizione**: Ottiene i dettagli di una richiesta specifica
  - **Headers**: `Authorization: Bearer jwt_token`
  - **Risposta**:
    ```json
    {
      "id": "request_id",
      "title": "Titolo Richiesta",
      "description": "Descrizione richiesta",
      "preferredMaterials": ["materiale1", "materiale2"],
      "budget": 100,
      "deadline": "2023-12-31T00:00:00.000Z",
      "status": "pending",
      "materialsStatus": "pending",
      "quote": {
        "amount": 150,
        "description": "Descrizione preventivo",
        "validUntil": "2023-12-31T00:00:00.000Z",
        "sentAt": "2023-01-01T00:00:00.000Z"
      },
      "conversation": [
        {
          "sender": "user",
          "message": "Messaggio utente",
          "timestamp": "2023-01-01T00:00:00.000Z"
        }
      ],
      "adminNotes": "Note admin",
      "user": {
        "id": "user_id",
        "name": "Nome Utente",
        "email": "email@esempio.com"
      },
      "createdAt": "2023-01-01T00:00:00.000Z"
    }
    ```

### Aggiorna Stato Richiesta
- **PUT** `/api/custom-requests/admin/:id/status`
  - **Descrizione**: Aggiorna lo stato di una richiesta
  - **Headers**: `Authorization: Bearer jwt_token`
  - **Body**:
    ```json
    {
      "status": "in_progress"
    }
    ```
  - **Risposta**:
    ```json
    {
      "id": "request_id",
      "status": "in_progress"
    }
    ```

### Aggiorna Stato Materiali
- **PUT** `/api/custom-requests/admin/:id/materials-status`
  - **Descrizione**: Aggiorna lo stato dei materiali
  - **Headers**: `Authorization: Bearer jwt_token`
  - **Body**:
    ```json
    {
      "materialsStatus": "received"
    }
    ```
  - **Risposta**:
    ```json
    {
      "id": "request_id",
      "materialsStatus": "received"
    }
    ```

### Invia Preventivo
- **PUT** `/api/custom-requests/admin/:id/quote`
  - **Descrizione**: Invia un preventivo
  - **Headers**: `Authorization: Bearer jwt_token`
  - **Body**:
    ```json
    {
      "amount": 150,
      "description": "Descrizione preventivo",
      "validUntil": "2023-12-31T00:00:00.000Z"
    }
    ```
  - **Risposta**:
    ```json
    {
      "id": "request_id",
      "status": "quoted",
      "quote": {
        "amount": 150,
        "description": "Descrizione preventivo",
        "validUntil": "2023-12-31T00:00:00.000Z",
        "sentAt": "2023-01-01T00:00:00.000Z"
      }
    }
    ```

### Aggiungi Messaggio (Admin)
- **POST** `/api/custom-requests/admin/:id/messages`
  - **Descrizione**: Aggiunge un messaggio alla conversazione
  - **Headers**: `Authorization: Bearer jwt_token`
  - **Body**:
    ```json
    {
      "message": "Testo del messaggio"
    }
    ```
  - **Risposta**:
    ```json
    {
      "id": "request_id",
      "conversation": [
        {
          "sender": "admin",
          "message": "Testo del messaggio",
          "timestamp": "2023-01-01T00:00:00.000Z"
        }
      ]
    }
    ```

### Aggiungi Note Admin
- **PUT** `/api/custom-requests/admin/:id/notes`
  - **Descrizione**: Aggiunge note admin
  - **Headers**: `Authorization: Bearer jwt_token`
  - **Body**:
    ```json
    {
      "notes": "Note admin"
    }
    ```
  - **Risposta**:
    ```json
    {
      "id": "request_id",
      "adminNotes": "Note admin"
    }
    ```

### Statistiche Richieste
- **GET** `/api/custom-requests/admin/stats/requests`
  - **Descrizione**: Ottiene statistiche sulle richieste
  - **Headers**: `Authorization: Bearer jwt_token`
  - **Risposta**:
    ```json
    {
      "total": 100,
      "byStatus": {
        "pending": 30,
        "inProgress": 20,
        "completed": 40,
        "cancelled": 10
      },
      "byMonth": [
        {
          "_id": {
            "year": 2023,
            "month": 1
          },
          "count": 10
        }
      ]
    }
    ```

## Notifiche

### Lista Notifiche
- **GET** `/api/notifications`
  - **Descrizione**: Ottiene tutte le notifiche dell'utente
  - **Headers**: `Authorization: Bearer jwt_token`
  - **Risposta**:
    ```json
    [
      {
        "id": "notification_id",
        "title": "Titolo notifica",
        "message": "Messaggio notifica",
        "type": "status_update",
        "relatedRequest": "request_id",
        "read": false,
        "createdAt": "2023-01-01T00:00:00.000Z"
      }
    ]
    ```

### Segna Notifica come Letta
- **PUT** `/api/notifications/:id/read`
  - **Descrizione**: Segna una notifica come letta
  - **Headers**: `Authorization: Bearer jwt_token`
  - **Risposta**:
    ```json
    {
      "id": "notification_id",
      "read": true,
      "readAt": "2023-01-01T00:00:00.000Z"
    }
    ```

### Segna Tutte le Notifiche come Lette
- **PUT** `/api/notifications/read-all`
  - **Descrizione**: Segna tutte le notifiche come lette
  - **Headers**: `Authorization: Bearer jwt_token`
  - **Risposta**:
    ```json
    {
      "message": "Tutte le notifiche sono state segnate come lette"
    }
    ```

## Ordini

### Lista Ordini
- **GET** `/api/orders`
  - **Descrizione**: Ottiene tutti gli ordini dell'utente
  - **Headers**: `Authorization: Bearer jwt_token`
  - **Risposta**:
    ```json
    {
      "message": "Funzionalità ordini in sviluppo"
    }
    ```

### Dettaglio Ordine
- **GET** `/api/orders/:id`
  - **Descrizione**: Ottiene i dettagli di un ordine specifico
  - **Headers**: `Authorization: Bearer jwt_token`
  - **Risposta**:
    ```json
    {
      "message": "Funzionalità ordini in sviluppo"
    }
    ```

### Crea Ordine
- **POST** `/api/orders`
  - **Descrizione**: Crea un nuovo ordine
  - **Headers**: `Authorization: Bearer jwt_token`
  - **Risposta**:
    ```json
    {
      "message": "Funzionalità ordini in sviluppo"
    }
    ```

### Aggiorna Stato Ordine
- **PUT** `/api/orders/:id/status`
  - **Descrizione**: Aggiorna lo stato di un ordine
  - **Headers**: `Authorization: Bearer jwt_token`
  - **Risposta**:
    ```json
    {
      "message": "Funzionalità ordini in sviluppo"
    }
    ``` 