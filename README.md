# Laravel & React Order Management System

This project contains a Laravel backend and a React (Vite) frontend for an Order Management System.

## Project Structure
- `backend/`: Laravel API (PHP 8+, Laravel 11, XAMPP/MySQL)
- `frontend/`: React Vite app (React 18, TailwindCSS, React Router)

## Setup Instructions

### Backend
1. Make sure your XAMPP MySQL server is running.
2. Open terminal and navigate to backend: `cd backend`
3. Install dependencies: `composer install`
4. Create the MySQL Database named `laravel_react_exam`
5. Run migrations and seeders: `php artisan migrate:fresh --seed`
6. Start the API server: `php artisan serve` (defaults to http://127.0.0.1:8000)

### Frontend
1. Open a new terminal and navigate to frontend: `cd frontend`
2. Install dependencies: `npm install`
3. Run the development server: `npm run dev` (defaults to http://localhost:5173)

## Manual Testing Instructions
The database seeder creates two test users:
- **Customer**: `customer@example.com` / `password`
- **Approver**: `approver@example.com` / `password`

1. **Happy Path**: 
   - Login as Customer.
   - Click "+ New Draft", add items, and Save.
   - Click "View" on the created draft, and click "Submit Order".
   - Logout, and login as Approver.
   - Click "View" on the submitted order.
   - Click "Approve", then "Fulfill", then "Close".
   - You can view the Activity Logs timeline at the bottom of the Order view.

2. **Rejection & Revise Path**:
   - As an Approver, view a submitted order and click "Reject". Enter a reason.
   - Login as Customer, view the rejected order, read the reason, and click "Revise" to return it to Draft state.

3. **Stock Enforcement**:
   - The seeder provides items with fixed stock. If a customer drafts an order exceeding the stock limits and submits it, the Approver will get an error when attempting to Approve or Fulfill the order.

## Assumptions Made
As per the requirement to document decisions on unspecified details:
1. **Duplicate Item Lines**: The `OrderStatusService` sums the quantities of any duplicate item lines before processing the order, or treats them as distinct lines. In this implementation, the backend allows duplicate item rows but tracks them as separate line items. The frontend UI merges them in the "Cart" logic so they are always submitted as a clean, deduplicated list.
2. **Authentication Flow**: I opted to use Laravel Sanctum (Token-based Auth) over stateful session cookies to ensure the JSON REST API remains fully decoupled from the React Vite SPA. The frontend stores this token and passes it via `Authorization: Bearer <token>`.
3. **Database Selection**: The brief allowed SQLite, but per your latest instruction, we used a full XAMPP / MySQL installation for the final run.
4. **Pagination**: Did not enforce pagination on the dashboard lists to keep the UI simple and focus strictly on the status filtering / CSV export mechanics, as this is a small internal tool.
5. **Modern Design**: Opted for a "Product Catalog" UX rather than a dry input form for creating draft orders. This brings the e-commerce feeling to the application while satisfying the requirement to pick items and set quantities.

