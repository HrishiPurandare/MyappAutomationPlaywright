# Simple Fullstack Test App - Test Plan

---

## 1. Overview

This project is a demo fullstack application with:
- **Frontend:** React app for user login and CRUD operations on items.
- **Backend:** Node.js/Express API for authentication and item management.
- **Testing:** Playwright for UI and API automation, with Allure reporting.

---

## 2. Architecture Diagram

```
+-------------------+         HTTP/API         +-------------------+
|   React Frontend  | <--------------------->  |  Node.js Backend  |
|  (localhost:3000) |                         |  (localhost:4000) |
+-------------------+                         +-------------------+
         |                                              |
         |<---------- Playwright Tests ----------------->|
         |                                              |
         +---------------- Allure Reports ---------------+
```

---

## 3. Features to be Tested

### 3.1 Authentication
- User can log in with valid credentials.
- User cannot log in with invalid credentials.

### 3.2 Item Management (CRUD)
- User can view a list of items after login.
- User can add a new item.
- User can edit an existing item.
- User can delete an item.
- Edge cases: Cannot add or edit to empty item text.

---

## 4. Test Types & Coverage

### 4.1 UI Automation (Playwright)
- Login form: positive and negative scenarios.
- Item list: add, edit, delete, and data assertions.
- UI feedback: error messages, item count, and logout.

### 4.2 API Automation (Playwright)
- `/login`: positive and negative login.
- `/items`: CRUD operations, including edge cases (empty text, non-existent item).

---

## 5. Test Cases

| ID   | Area         | Description                                 | Expected Result                  |
|------|--------------|---------------------------------------------|----------------------------------|
| TC1  | Auth         | Login with valid credentials                | User is logged in, item list     |
| TC2  | Auth         | Login with invalid credentials              | Error message, login fails       |
| TC3  | Item CRUD    | Add new item                                | Item appears in list             |
| TC4  | Item CRUD    | Edit item                                   | Item text is updated             |
| TC5  | Item CRUD    | Delete item                                 | Item is removed from list        |
| TC6  | Item CRUD    | Add empty item                              | Error, item not added            |
| TC7  | Item CRUD    | Edit item to empty text                     | Error, item not updated          |
| TC8  | Item CRUD    | Delete non-existent item                    | 404 error from API               |
| TC9  | UI Snapshot  | Login fail snapshot                         | UI matches expected error state  |
| TC10 | UI Snapshot  | Add empty item snapshot                     | UI matches expected error state  |

---

## 6. Test Data

- **Valid user:** username: `user`, password: `pass` (or as configured)
- **Invalid user:** any incorrect username/password
- **Item text:** e.g., "MyItem", "MyItemEdited", ""

---

## 7. Test Execution

- **Local:**
  1. Start backend: `cd backend && npm install && npm start`
  2. Start frontend: `cd ../frontend && npm install && npm start`
  3. In project root: `npm install && npx playwright test`
  4. For Allure: `npx playwright test --reporter=line,allure-playwright && npx allure generate ./allure-results --clean -o ./allure-report && npx allure open ./allure-report`

- **CI:**
  - Workflow installs dependencies, starts servers, waits for readiness, runs Playwright tests, and generates Allure reports.

---

## 8. Limitations

- In-memory DB: Data resets on server restart.
- Demo only, not production-ready.
- Snapshots must be generated for each OS (Windows/Linux) for visual tests to pass on all platforms.

---

## 9. Reporting

- Allure reports are generated for each test run.
- Artifacts (logs, coverage, snapshots) are uploaded in CI for review.

---

## 10. CI Workflow (Pictorial)

```
+-------------------+
|  Checkout code    |
+-------------------+
          |
+-------------------+
|  Install deps     |
+-------------------+
          |
+-------------------+
|  Start servers    |
+-------------------+
          |
+-------------------+
|  Wait for ready   |
+-------------------+
          |
+-------------------+
|  Playwright tests |
+-------------------+
          |
+-------------------+
|  Allure report    |
+-------------------+
```

---

